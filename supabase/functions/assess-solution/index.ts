// supabase/functions/assess-solution/index.ts
// Listens to INSERTs on public.solutions via Postgres Changes
// and writes AI assessment back to the same row.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

// Admin client (bypasses RLS) for reads/writes
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function processSolution(newSolution: any) {
  try {
    // Fetch parent problem title for better context
    let parentTitle: string | null = null;
    if (newSolution?.parent_problem) {
      const { data } = await admin
        .from("problems")
        .select("title")
        .eq("id", newSolution.parent_problem)
        .single();
      parentTitle = data?.title ?? null;
    }

    // This is the updated system prompt asking for a viability reason.
    const systemPrompt = `You are a political and economic analyst. Analyze the following proposed solution to a problem.
Your SOLE task is to return a JSON object with three keys:
1. "side_effects": An array of strings, listing potential negative side effects.
2. "viability_score": A number between 0.00 and 1.00 for the solution's viability.
3. "viability_reason": A brief, one-sentence explanation for the viability score you provided.
DO NOT add any other text or markdown. Your entire response must be ONLY the valid JSON.`;

    const userQuery = `Problem: ${parentTitle ?? "(unknown)"}\nSolution: ${newSolution.title}\nDescription: ${newSolution.description ?? ""}`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ "google_search": {} }],
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API request failed: ${await geminiResponse.text()}`);
    }

    const result = await geminiResponse.json();
    const assessmentText = result?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    if (!assessmentText) throw new Error("Invalid response from Gemini API.");

    // Strip optional Markdown fences and parse
    const cleaned = assessmentText.replace(/```json|```/g, "").trim();
    const assessment = JSON.parse(cleaned);

    // This is the updated database call with the new fields.
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

// Start a background Realtime subscription using the service role to bypass RLS
const listener = createClient(SUPABASE_URL, SERVICE_ROLE);
listener
  .channel("solutions-inserts")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "solutions" }, async (payload: any) => {
    console.log("New solution detected:", payload.new?.id);
    await processSolution(payload.new);
  })
  .subscribe((status) => console.log("solutions-inserts status:", status));

// Health endpoint
Deno.serve(() => new Response(JSON.stringify({ ok: true, listening: true }), { headers: { "Content-Type": "application/json" } }));

