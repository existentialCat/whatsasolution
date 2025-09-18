// supabase/functions/delete-problem/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// These are the required CORS headers for preflight requests.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // This is the key fix: Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // This function must use the Service Role key to have the necessary permissions.
  const supabaseAdmin = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");
  
  try {
    const { problem_id } = await req.json();
    if (!problem_id) {
      throw new Error("Missing problem_id in the request body.");
    }
    console.log(`Starting deletion process for problem: ${problem_id}`);

    // Step 1: Get the image path from the problem record before we delete it.
    const { data: problem, error: selectError } = await supabaseAdmin
      .from("problems")
      .select("imgs")
      .eq("id", problem_id)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        console.warn(`Problem ${problem_id} not found, likely already deleted.`);
        return new Response(JSON.stringify({ success: true, message: "Problem not found, already deleted." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw selectError;
    }
    console.log("Successfully fetched problem record.");

    // Step 2: If an image path exists, delete the image file from storage FIRST.
    if (problem.imgs) {
      console.log(`Attempting to delete storage object: ${problem.imgs}`);
      const { error: storageError } = await supabaseAdmin
        .storage
        .from("problems")
        .remove([problem.imgs]);
      
      if (storageError) {
        console.error(`Failed to delete storage object ${problem.imgs}:`, storageError.message);
      } else {
        console.log("Successfully deleted storage object.");
      }
    }

    // Step 3: Delete the problem record from the database.
    console.log("Attempting to delete problem record from database...");
    const { error: deleteError } = await supabaseAdmin
      .from("problems")
      .delete()
      .eq("id", problem_id);

    if (deleteError) throw deleteError;
    console.log("Successfully deleted problem record from database.");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error in delete-problem function:", err.message);
    return new Response(String(err?.message ?? err), { status: 500, headers: corsHeaders });
  }
});

