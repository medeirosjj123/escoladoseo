import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, courseIds: newCourseIds, expirationDates } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch existing subscriptions for the user
    const { data: existingSubs, error: fetchError } = await supabaseClient
        .from('subscriptions')
        .select('course_id, end_date')
        .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const existingCourseIds = existingSubs.map(sub => sub.course_id);
    const existingSubsMap = new Map(existingSubs.map(sub => [sub.course_id, sub]));

    // 2. Identify courses to add, remove, and update
    const coursesToAdd = newCourseIds.filter(id => !existingCourseIds.includes(id));
    const coursesToRemove = existingCourseIds.filter(id => !newCourseIds.includes(id));
    const coursesToKeep = newCourseIds.filter(id => existingCourseIds.includes(id));

    // 3. Process removals
    if (coursesToRemove.length > 0) {
        console.log('Removing courses:', coursesToRemove);
        await supabaseClient.from('subscriptions').delete().eq('user_id', userId).in('course_id', coursesToRemove);
        await supabaseClient.from('user_courses').delete().eq('user_id', userId).in('course_id', coursesToRemove);
    }

    // 4. Process additions
    if (coursesToAdd.length > 0) {
        console.log('Adding courses:', coursesToAdd);
        const newSubscriptions = coursesToAdd.map(courseId => ({
            user_id: userId,
            course_id: courseId,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: expirationDates[courseId] || null,
        }));
        await supabaseClient.from('subscriptions').insert(newSubscriptions);

        const newUserCourses = coursesToAdd.map(courseId => ({
            user_id: userId,
            course_id: courseId,
        }));
        await supabaseClient.from('user_courses').insert(newUserCourses);
    }

    // 5. Process updates (check for changed expiration dates)
    const coursesToUpdate = [];
    for (const courseId of coursesToKeep) {
        const existingSub = existingSubsMap.get(courseId);
        const newEndDate = expirationDates[courseId] ? new Date(expirationDates[courseId]).toISOString() : null;
        const existingEndDate = existingSub.end_date ? new Date(existingSub.end_date).toISOString() : null;

        if (newEndDate !== existingEndDate) {
            coursesToUpdate.push({
                user_id: userId,
                course_id: courseId,
                end_date: newEndDate,
            });
        }
    }

    if (coursesToUpdate.length > 0) {
        console.log('Updating subscriptions:', coursesToUpdate);
        await supabaseClient.from('subscriptions').upsert(coursesToUpdate, { onConflict: 'user_id,course_id' });
    }

    return new Response(JSON.stringify({ message: 'User courses updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})