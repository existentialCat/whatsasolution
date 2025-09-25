// supabase/functions/assess-solution/index.ts
// Listens to INSERTs on public.solutions via Postgres Changes
// and writes AI assessment back to the same row, using a database lock and robust timeouts.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function processSolution(newSolution: any) {
  try {
    let parentTitle: string | null = null;
    if (newSolution?.parent_problem) {
      const { data } = await admin
        .from("problems")
        .select("title")
        .eq("id", newSolution.parent_problem)
        .single();
      parentTitle = data?.title ?? null;
    }

    const systemPrompt = `You are a political and economic analyst. Analyze the following proposed solution to a problem.
Your SOLE task is to return a JSON object with three keys:
1. "side_effects": An array of strings, listing potential negative side effects.
2. "viability_score": A number between 0.00 and 1.00 for the solution's viability.
3. "viability_reason": A brief, one-sentence explanation for the viability score you provided.
DO NOT add any other text or markdown. Your entire response must be ONLY the valid JSON.`;

    const userQuery = `Problem: ${parentTitle ?? "(unknown)"}\nSolution: ${newSolution.title}\nDescription: ${newSolution.description ?? ""}`;
    
    // This is the new, robust timeout and retry logic using Promise.race
    const maxRetries = 3;
    let geminiResponse;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 30 seconds")), 30000)
      );
      
      const fetchPromise = fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: [{ "google_search": {} }],
        }),
      });

      try {
        geminiResponse = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err) {
        if (attempt < maxRetries) {
          console.warn(`[${newSolution.id}] API call timed out. Retrying... (Attempt ${attempt}/${maxRetries})`);
          continue;
        } else {
          throw err;
        }
      }

      if (geminiResponse.status !== 503) break;
      if (attempt === maxRetries) break;
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }


    if (!geminiResponse.ok) {
      throw new Error(`Gemini API request failed: ${await geminiResponse.text()}`);
    }

    const result = await geminiResponse.json();
    const assessmentText = result?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    if (!assessmentText) throw new Error("Invalid response from Gemini API.");

    const cleaned = assessmentText.replace(/```json|```/g, "").trim();
    const assessment = JSON.parse(cleaned);

    const { error: updateError } = await admin
      .from("solutions")
      .update({
        ai_assessment_status: "completed",
        ai_side_effects: assessment.side_effects,
        ai_viability_score: assessment.viability_score,
        ai_viability_reason: assessment.viability_reason,
      })
      .eq("id", newSolution.id);

    if (updateError) throw updateError;
    console.log(`Successfully assessed solution ${newSolution.id}`);

  } catch (err: any) {
    console.error(`Error processing solution ${newSolution?.id}:`, err?.message ?? err);
    if (newSolution?.id) {
      await admin
        .from("solutions")
        .update({ ai_assessment_status: "failed" })
        .eq("id", newSolution.id);
    }
  }
}

const listener = createClient(SUPABASE_URL, SERVICE_ROLE);
listener
  .channel("solutions-inserts")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "solutions" }, async (payload: any) => {
    const solutionId = payload.new?.id;
    if (!solutionId) return;

    console.log("New solution detected:", solutionId);
    
    try {
      const { data, error } = await admin
        .from('solutions')
        .update({ ai_assessment_status: 'processing' })
        .eq('id', solutionId)
        .eq('ai_assessment_status', 'pending')
        .select();

      if (error) {
        throw new Error(`Failed to acquire lock for solution ${solutionId}: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.log(`Solution ${solutionId} is already being processed or not pending. Skipping.`);
        return;
      }

      console.log(`Acquired lock for solution: ${solutionId}. Starting assessment.`);
      await processSolution(payload.new);

    } catch (err) {
      console.error(`Error in listener for solution ${solutionId}:`, err.message);
    }
  })
  .subscribe((status) => console.log("solutions-inserts status:", status));

Deno.serve(async (req) => {
    try {
        const body = await req.json();
        if (body.type === "keep-alive") {
            return new Response(JSON.stringify({ message: "Function is awake." }), { headers: { "Content-Type": "application/json" } });
        }
        
        // This is the new logic to handle retry requests from the cron job.
        if (body.type === "retry" && body.record) {
            const solutionId = body.record.id;
            console.log(`Received retry request for solution: ${solutionId}`);
            
            // Re-acquire the lock before processing the retry
            const { data, error } = await admin
              .from('solutions')
              .update({ ai_assessment_status: 'processing' })
              .eq('id', solutionId)
              .in('ai_assessment_status', ['processing', 'failed']) // Only retry if it's still stuck
              .select();

            if (error) throw new Error(`Retry lock failed: ${error.message}`);

            if (data && data.length > 0) {
                 await processSolution(body.record);
            } else {
                console.log(`Skipping retry for solution ${solutionId} as its status has changed.`);
            }

            return new Response(JSON.stringify({ success: true, message: `Retry processed for ${solutionId}` }));
        }

    } catch (e) { 
      console.error("Error in serve handler:", e.message);
    }

    return new Response(JSON.stringify({ ok: true, listening: true }), { headers: { "Content-Type": "application/json" } });
});

