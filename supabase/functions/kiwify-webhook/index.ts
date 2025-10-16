import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("Kiwify webhook payload received:", payload);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const customerEmail = payload.customer.email
    const kiwifyProductId = payload.product.id

    // 1. Find or create the user
    let userId: string;
    const { data: existingUser, error: getUserError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();

    if (getUserError && getUserError.code !== 'PGRST116') { // 'PGRST116' is "Row not found"
        console.error("Error fetching user:", getUserError);
        throw getUserError;
    }

    if (existingUser) {
        userId = existingUser.id;
        console.log(`Found existing user with ID: ${userId}`);
    } else {
        console.log(`User with email ${customerEmail} not found. Creating new user.`);
        const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true, // Email is verified by purchase
        });

        if (createUserError) {
            console.error("Error creating user:", createUserError);
            throw createUserError;
        }
        userId = newUser.user.id;
        console.log(`Created new user with ID: ${userId}`);
    }

    // 2. Find the course
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id')
      .eq('kiwify_product_id', kiwifyProductId)
      .single()

    if (courseError) {
      console.error(`Error finding course with kiwify_product_id ${kiwifyProductId}:`, courseError);
      throw courseError
    }
    console.log(`Found course with ID: ${course.id}`);

    // 3. Upsert the subscription
    const subscriptionData = {
        user_id: userId,
        course_id: course.id,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    };

    const { error: subscriptionError } = await supabaseClient
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id,course_id' });

    if (subscriptionError) {
        console.error("Error upserting subscription:", subscriptionError);
        throw subscriptionError
    }
    console.log("Subscription upserted successfully.");

    // 4. Grant user access to the course (upsert)
    const userCourseData = {
        user_id: userId,
        course_id: course.id,
    };
    const { error: userCourseError } = await supabaseClient
        .from('user_courses')
        .upsert(userCourseData, { onConflict: 'user_id,course_id' });

    if (userCourseError) {
        console.error("Error upserting user_course:", userCourseError);
        throw userCourseError
    }
    console.log("User course access granted successfully.");

    return new Response(JSON.stringify({ message: 'Webhook processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})