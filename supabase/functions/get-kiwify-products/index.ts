import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('get-kiwify-products function invoked');
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service_role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching Kiwify API credentials...');
    const { data: apiConfig, error: apiConfigError } = await supabaseClient
      .from('api_configs')
      .select('credentials')
      .eq('name', 'Kiwify')
      .single()
    console.log('Kiwify API credentials fetched:', apiConfig);

    if (apiConfigError) {
      console.error(apiConfigError);
      throw apiConfigError
    }

    const { clientId, clientSecret, accountId } = apiConfig.credentials

    console.log('Fetching Kiwify OAuth token...');
    // Get OAuth token from Kiwify
    const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    console.log('Kiwify OAuth token response:', tokenResponse.status);

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) {
        console.error(tokenData);
        throw new Error(tokenData.error_description);
    }
    const accessToken = tokenData.access_token

    console.log('Fetching Kiwify products...');
    // Get products from Kiwify
    const productsResponse = await fetch('https://public-api.kiwify.com/v1/products', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-kiwify-account-id': accountId,
      },
    })
    console.log('Kiwify products response:', productsResponse.status);

    const productsData = await productsResponse.json()
    console.log('Kiwify products data:', productsData);

    return new Response(JSON.stringify({ products: productsData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in get-kiwify-products function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
