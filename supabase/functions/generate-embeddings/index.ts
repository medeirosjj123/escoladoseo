import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("[v2-embeddings] Top-level: generate-embeddings/index.ts is being executed.");

// Helper function to parse VTT and extract clean text
function parseVTT(vttContent: string): string {
    return vttContent
        .split('\n')
        .filter(line => {
            const isTimestamp = line.includes('-->');
            const isCueId = /^[0-9]+$/.test(line.trim());
            const isHeader = line.trim().toUpperCase() === 'WEBVTT';
            const isEmpty = line.trim() === '';
            return !isTimestamp && !isCueId && !isHeader && !isEmpty;
        })
        .join(' ')
        .trim();
}

// Helper function to split text into smaller chunks
function splitTextIntoChunks(text: string, maxTokens = 500): string[] {
  const sentences = text.split(/(?<=[.?!])\s+/); // Split by sentences
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const newChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (newChunk.length / 4 > maxTokens) { // Rough token estimate
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk = newChunk;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lesson_id } = await req.json()
    if (!lesson_id) {
      throw new Error('Missing lesson_id')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('CUSTOM_SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Get OpenAI API key
    const { data: apiConfig, error: configError } = await supabaseClient
      .from('api_configs')
      .select('credentials')
      .eq('name', 'ChatGPT')
      .single()

    if (configError || !apiConfig?.credentials?.apiKey) {
      throw new Error('ChatGPT API key not configured.')
    }
    const openAIApiKey = apiConfig.credentials.apiKey;

    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select('transcript')
      .eq('id', lesson_id)
      .single()

    if (lessonError || !lesson?.transcript) {
      return new Response(JSON.stringify({ message: 'No transcript found for this lesson. Nothing to do.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const transcript = lesson.transcript;
    const isVTT = transcript.trim().toUpperCase().startsWith('WEBVTT');
    console.log(`Is VTT format: ${isVTT}`);
    const cleanTranscript = isVTT ? parseVTT(transcript) : transcript;
    console.log(`Cleaned transcript preview: ${cleanTranscript.substring(0, 100)}...`);

    // Clear old chunks for this lesson
    await supabaseClient.from('lesson_chunks').delete().eq('lesson_id', lesson_id)

    const chunks = splitTextIntoChunks(cleanTranscript)
    if (chunks.length === 0) {
        return new Response(JSON.stringify({ message: 'Transcript was empty or invalid. Nothing to do.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
    console.log(`Generated ${chunks.length} chunks.`);

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: chunks,
      })
    });

    if (!embeddingResponse.ok) {
      const errorBody = await embeddingResponse.json();
      throw new Error(`OpenAI Embedding API Error: ${errorBody.error.message}`);
    }

    const embeddingData = await embeddingResponse.json();

    const newChunks = embeddingData.data.map((embedding: any, i: number) => ({
      lesson_id,
      chunk_text: chunks[i],
      embedding: embedding.embedding,
    }))

    const { error: insertError } = await supabaseClient
      .from('lesson_chunks')
      .insert(newChunks)

    if (insertError) {
      throw new Error(`Failed to insert new chunks: ${insertError.message}`)
    }

    return new Response(JSON.stringify({ message: `Successfully generated and stored ${newChunks.length} chunks.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in generate-embeddings:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})