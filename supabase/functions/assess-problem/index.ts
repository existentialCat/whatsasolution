// supabase/functions/assess-problem/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
async function processProblem(problemData, supabaseAdmin) {
  try {
    if (!problemData || !problemData.id || !problemData.title) {
      throw new Error("Invalid problem data passed to processProblem.");
    }
    const systemPrompt = `You are an expert fact-checker and content analyst.
    Your SOLE task is to analyze the user-submitted "problem" and return your findings in the following exact format, with no other text or explanations:
    <summary>
    A brief, neutral fact-check of the central claim.
    </summary>
    <probability>
    A number between 0.00 and 1.00 representing the probability that the submission is a parody or troll post.
    </probability>`;
    const currentDate = new Date().toISOString().split('T')[0];
    const userQuery = `Current Date: ${currentDate}\nProblem Title: ${problemData.title}`;
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: userQuery
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        },
        tools: [
          {
            "google_search": {}
          }
        ]
      })
    });
    if (!geminiResponse.ok) throw new Error(`Gemini API request failed: ${await geminiResponse.text()}`);
    const result = await geminiResponse.json();
    const candidate = result.candidates?.[0];
    const assessmentText = candidate?.content?.parts?.[0]?.text;
    if (!assessmentText) throw new Error("Invalid response from Gemini API.");
    const summaryMatch = assessmentText.match(/<summary>([\s\S]*?)<\/summary>/);
    const probabilityMatch = assessmentText.match(/<probability>([\s\S]*?)<\/probability>/);
    if (!summaryMatch || !probabilityMatch) throw new Error(`Could not parse the AI response.`);
    const assessment = {
      fact_check_summary: summaryMatch[1].trim(),
      parody_probability: parseFloat(probabilityMatch[1].trim())
    };
    let sources = [];
    const groundingMetadata = candidate?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingAttributions) {
      sources = groundingMetadata.groundingAttributions.map((attribution)=>({
          uri: attribution.web?.uri,
          title: attribution.web?.title
        })).filter((source)=>source.uri && source.title);
    }
    if (sources.length === 0) {
      assessment.fact_check_summary = assessment.fact_check_summary.replace(/\[\d+(,\s*\d+)*\]/g, '').trim();
    }
    await supabaseAdmin.from("problems").update({
      ai_assessment_status: 'completed',
      ai_fact_check: assessment.fact_check_summary,
      ai_parody_probability: assessment.parody_probability,
      ai_sources: sources
    }).eq("id", problemData.id);
  } catch (err) {
    console.error(`Error processing problem ${problemData?.id}:`, err.message);
    if (problemData?.id) {
      await supabaseAdmin.from("problems").update({
        ai_assessment_status: "failed"
      }).eq("id", problemData.id);
    }
  }
}
serve(async (req)=>{
  const supabaseAdmin = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");
  try {
    const body = await req.json();
    // Handle keep-alive pings from the cron job
    if (body.type === "keep-alive") {
      return new Response(JSON.stringify({
        message: "Function is awake."
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Handle retry/processing requests from the cron job
    if (body.record) {
      console.log(`Received request to process problem: ${body.record.id}`);
      await processProblem(body.record, supabaseAdmin);
      return new Response(JSON.stringify({
        success: true,
        message: `Processed problem ${body.record.id}`
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    throw new Error("Invalid request body.");
  } catch (err) {
    console.error("Error in serve function:", err.message);
    return new Response(String(err?.message ?? err), {
      status: 400
    });
  }
});
