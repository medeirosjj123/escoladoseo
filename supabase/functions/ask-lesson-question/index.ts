import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("[v3] Top-level: ask-lesson-question/index.ts is being executed.");

serve(async (req) => {

  console.log("[v4] Request received for ask-lesson-question.");



  // Handle preflight OPTIONS request

  if (req.method === 'OPTIONS') {

    return new Response('ok', { headers: corsHeaders })

  }



  try {

    const rawBody = await req.text();

    console.log("[v4] Raw request body:", rawBody);



    let lessonId, question;

    try {

      const body = JSON.parse(rawBody);

      lessonId = body.lessonId;

      question = body.question;

    } catch (e) {

      throw new Error(`JSON Parsing Error: ${e.message}. Body was: ${rawBody}`);

    }



        if (!lessonId || !question) {



          throw new Error('Missing lessonId or question')



        }



    



        console.log("[v5] About to create Supabase client.");



        const supabaseClient = createClient(



          Deno.env.get('SUPABASE_URL') ?? '',



          Deno.env.get('CUSTOM_SUPABASE_SERVICE_ROLE_KEY') ?? '',



          { global: { headers: { Authorization: req.headers.get('Authorization')! } } }



        )



        console.log("[v5] Supabase client created.");



    



        // 1. Get OpenAI API key



        let openAIApiKey;



        try {



          console.log("[v5] Attempting to get API key.");



          const { data: apiConfig, error: configError } = await supabaseClient



            .from('api_configs')



            .select('credentials')



            .eq('name', 'ChatGPT')



            .single()



                console.log("[v5] API key query finished.");



          



                if (configError) {



                  console.error("[v6] Config error:", configError.message);



                  return new Response(JSON.stringify({ error: `Database error fetching API config: ${configError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });



                }



                if (!apiConfig) {



                  console.error("[v6] API config not found for 'ChatGPT'");



                  return new Response(JSON.stringify({ error: "API config not found for 'ChatGPT'" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });



                }



                if (!apiConfig.credentials?.apiKey) {



                  console.error("[v6] apiKey property missing from credentials in DB");



                  return new Response(JSON.stringify({ error: "apiKey property missing from credentials in DB" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });



                }



          



                openAIApiKey = apiConfig.credentials.apiKey

    } catch (error) {

      throw new Error(`Failed at step 1 (Get API Key): ${error.message}`)

    }



    // 2. Create an embedding for the user's question using fetch

    let questionEmbedding;

    try {

      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {

        method: 'POST',

        headers: {

          'Authorization': `Bearer ${openAIApiKey}`,

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          model: 'text-embedding-ada-002',

          input: question,

        })

      });

      if (!embeddingResponse.ok) {

        const errorBody = await embeddingResponse.json();

        throw new Error(`OpenAI Embedding API Error: ${errorBody.error.message}`);

      }

      const embeddingData = await embeddingResponse.json();

      questionEmbedding = embeddingData.data[0].embedding;

    } catch (error) {

      throw new Error(`Failed at step 2 (Create Embedding): ${error.message}`)

    }



            // 3. Find the most relevant transcript chunks



            let chunks;



            try {



              // DEBUG: Check if chunks for this lesson_id exist at all



              const { data: debugChunks, error: debugError } = await supabaseClient.from('lesson_chunks').select('id, chunk_text').eq('lesson_id', lessonId);



              console.log(`[v7] Debug query found ${debugChunks?.length || 0} chunks for lessonId ${lessonId}.`);



              if(debugError) console.error(`[v7] Debug query error: ${debugError.message}`);



        



              console.log(`[v6] Searching for chunks for lessonId: ${lessonId}`);



              const { data, error: matchError } = await supabaseClient.rpc('match_lesson_chunks', {

        query_embedding: questionEmbedding,

        match_lesson_id: lessonId,

        match_count: 3,

      })



      if (matchError) {

        throw new Error(`RPC Error: ${matchError.message}`)

      }

      chunks = data;

    } catch (error) {

      throw new Error(`Failed at step 3 (Match Chunks): ${error.message}`)

    }



    if (!chunks || chunks.length === 0) {

      const answer = "Desculpe, só posso responder perguntas relacionadas ao conteúdo desta aula, e não encontrei informações sobre isso."

      return new Response(JSON.stringify({ answer }), {

        headers: { ...corsHeaders, 'Content-Type': 'application/json' },

        status: 200,

      })

    }



    const contextText = chunks.map((chunk: any) => chunk.chunk_text).join('\n\n---\n\n')



    // 4. Generate a response using the chat API with fetch

    try {

                  const systemPrompt = `You are a helpful and friendly assistant for an online course. Your name is CursosFlix AI.

                  Your goal is to help the student learn the content of the lesson.

            

                  First, handle basic greetings and simple conversational questions (like 'hello', 'how are you?', 'who are you?') in a friendly and natural way.

            

                  For any other question, answer it based primarily on the provided context from the lesson transcript.

                  If the question is about the lesson's content but the answer isn't explicitly in the context, you can provide a helpful summary or point the student in the right direction based on the context.

                  If the question is completely unrelated to the lesson's topic, you should gently guide the user back to the lesson content, for example by saying: "Meu propósito é ajudar com o conteúdo desta aula. Você tem alguma pergunta sobre o material apresentado?".

                  If the provided context is empty, you must say: "Desculpe, ainda não tenho informações sobre esta aula para responder sua pergunta."`

            

                  const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {

        method: 'POST',

        headers: {

          'Authorization': `Bearer ${openAIApiKey}`,

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          model: 'gpt-4o-mini',

          messages: [

            { role: 'system', content: systemPrompt },

            { role: 'user', content: `Contexto da Aula:\n"""\n${contextText}\n"""\n\nPergunta do Aluno: ${question}` },

          ],

          temperature: 0.3,

        })

      });



      if (!chatResponse.ok) {

        const errorBody = await chatResponse.json();

        throw new Error(`OpenAI Chat API Error: ${errorBody.error.message}`);

      }



      const chatData = await chatResponse.json();

      const answer = chatData.choices[0].message.content



      return new Response(JSON.stringify({ answer }), {

        headers: { ...corsHeaders, 'Content-Type': 'application/json' },

        status: 200,

      })

    } catch (error) {

      throw new Error(`Failed at step 4 (Generate Response): ${error.message}`)

    }



  } catch (error) {

    return new Response(JSON.stringify({ error: error.message }), {

      headers: { ...corsHeaders, 'Content-Type': 'application/json' },

      status: 500,

    })

  }

})