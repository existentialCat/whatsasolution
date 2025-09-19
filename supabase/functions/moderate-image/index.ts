// supabase/functions/moderate-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function imageUrlToBase64(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const blob = await response.blob();
  const reader = new FileReader();
  return new Promise<string | undefined>((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function processImage(problem: any) {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const imagePath = problem.imgs;

  try {
    const { data: urlData } = supabaseAdmin.storage.from('problems').getPublicUrl(imagePath);
    const imageUrl = urlData.publicUrl;
    const imageBase64 = await imageUrlToBase64(imageUrl);

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Is this image appropriate for a general audience? Analyze for sexual, hate speech, harassment, and dangerous content. Respond with a single word: SAFE or UNSAFE. If UNSAFE, give a brief reason." },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    });
    
    if (!geminiResponse.ok) throw new Error(`Gemini API request failed: ${await geminiResponse.text()}`);
    
    const result = await geminiResponse.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text.trim() || 'UNSAFE';
    
    // This is the new, more detailed logging.
    console.log(`[${problem.id}] Raw Gemini response: "${responseText}"`);

    let status = 'rejected';
    let reason = 'AI analysis determined the content was inappropriate.';
    
    // This is the new, more robust check. It looks for "SAFE" case-insensitively.
    if (/SAFE/i.test(responseText)) {
        status = 'approved';
        reason = null;
    } else if (responseText.startsWith('UNSAFE')) {
        reason = responseText.replace('UNSAFE:', '').trim();
    }

    await supabaseAdmin
      .from('problems')
      .update({ image_moderation_status: status, image_moderation_reason: reason })
      .eq('id', problem.id);

    if (status === 'rejected') {
        await supabaseAdmin.storage.from('problems').remove([imagePath]);
    }
    console.log(`Successfully moderated image for problem ${problem.id}. Status: ${status}`);

  } catch (err) {
    console.error(`Error processing image for problem ${problem.id}:`, err.message);
  }
}

const listenerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
listenerClient
  .channel('problem-inserts-for-moderation')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'problems' }, (payload) => {
    console.log("New problem detected for image moderation:", payload.new.id);
    if (payload.new.imgs) {
      processImage(payload.new);
    }
  })
  .subscribe((status) => console.log(`Image moderation listener status: ${status}`));

serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({ ok: true, listening: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
});

