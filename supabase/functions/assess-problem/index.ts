// supabase/functions/assess-problem/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// This is the main function that will be called for each new problem.
async function processProblem(newProblem) {
  // Create a fresh, scoped client for this specific operation.
  const supabaseAdmin = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

  try {
    if (!newProblem || !newProblem.id || !newProblem.title) {
      console.warn("Received invalid problem data:", newProblem);
      return;
    }

    // Reverting to the prompt that asks for a JSON object in the text response.
    const systemPrompt = `You are an expert fact-checker and content analyst.
    Your FIRST and MOST IMPORTANT task is to use the provided real-time search tool to verify the current vital status (i.e., alive or deceased) of any public figures mentioned, using the provided current date as context.
    After establishing the facts, your SOLE task is to return a JSON object.
    The JSON object MUST contain exactly two keys:
    1. "fact_check_summary": A string containing a brief, neutral fact-check of the central claim.
    2. "parody_probability": A number between 0.00 and 1.00 representing the probability that the submission is a parody or troll post.
    DO NOT add any other text or markdown formatting. Your entire response must be ONLY the valid JSON.`;

    const currentDate = new Date().toISOString().split('T')[0];
    const userQuery = `Current Date: ${currentDate}\nProblem Title: ${newProblem.title}`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: [{ "google_search": {} }],
            // This is the key fix: Remove the generationConfig block that was causing the error.
        }),
    });

    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API request failed (${geminiResponse.status}): ${errorText}`);
    }

    const result = await geminiResponse.json();
    console.log("Raw Gemini API Response:", JSON.stringify(result, null, 2));

    const candidate = result.candidates?.[0];
    const assessmentText = candidate?.content?.parts?.[0]?.text;

    if (!assessmentText) {
      throw new Error("Invalid response structure from Gemini API.");
    }

    let sources = [];
    const groundingMetadata = candidate?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingAttributions) {
        sources = groundingMetadata.groundingAttributions
            .map(attribution => ({
                uri: attribution.web?.uri,
                title: attribution.web?.title,
            }))
            .filter(source => source.uri && source.title);
    }

    // Re-implementing the robust, multi-step parsing logic.
    let assessment;
    try {
        const jsonString = assessmentText.replace(/```json|```/g, '').trim();
        assessment = JSON.parse(jsonString);
    } catch (parseError) {
        console.warn("Initial JSON parsing failed, attempting fallback:", parseError.message);
        try {
            const jsonMatch = assessmentText.match(/\{[\s\S]*\}/);
            if (!jsonMatch || !jsonMatch[0]) throw new Error("No JSON object found with regex.");
            assessment = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
            throw new Error(`Fallback JSON parsing also failed: ${secondParseError.message}. Original text: ${assessmentText}`);
        }
    }


    if (typeof assessment.fact_check_summary !== 'string' || typeof assessment.parody_probability !== 'number') {
      throw new Error(`Gemini response is missing required keys. Received: ${assessmentText}`);
    }

    if (sources.length === 0) {
        assessment.fact_check_summary = assessment.fact_check_summary.replace(/\[\d+(,\s*\d+)*\]/g, '').trim();
    }

    const { error: updateError } = await supabaseAdmin
      .from("problems")
      .update({
        ai_assessment_status: 'completed',
        ai_fact_check: assessment.fact_check_summary,
        ai_parody_probability: assessment.parody_probability,
        ai_sources: sources,
      })
      .eq("id", newProblem.id);

    if (updateError) throw updateError;
    console.log(`Successfully assessed problem ${newProblem.id}`);

  } catch (err) {
    console.error(`Error processing problem ${newProblem?.id}:`, err.message);
    if (newProblem?.id) {
        await supabaseAdmin.from("problems").update({ ai_assessment_status: 'failed' }).eq("id", newProblem.id);
    }
  }
}

// This client is now ONLY for the Realtime listener.
const supabaseListenerClient = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

// Set up a Supabase Realtime channel to listen for new problems.
const channel = supabaseListenerClient.channel('problem-inserts');
channel
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'problems',
  }, (payload) => {
    console.log('New problem detected:', payload.new.id);
    processProblem(payload.new);
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Realtime channel subscribed for new problems!');
    } else {
      console.warn(`Realtime subscription status: ${status}`);
    }
  });

// The serve function is now just for health checks and keep-alive pings.
serve(async (req) => {
    try {
        const body = await req.json();
        if (body.type === "keep-alive") {
            return new Response(JSON.stringify({ message: "Function is awake." }), { headers: { "Content-Type": "application/json" } });
        }
    } catch (e) { /* Ignore non-JSON requests */ }

    return new Response(JSON.stringify({ message: "AI Assessment function is running and listening." }), { headers: { "Content-Type": "application/json" } });
});

