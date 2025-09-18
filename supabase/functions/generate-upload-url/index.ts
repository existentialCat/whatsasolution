// supabase/functions/generate-upload-url/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// This is the key change: We now use the service role key for the admin client.
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Create an admin client that can bypass RLS for this server-side operation.
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { fileName, userId } = await req.json();
    if (!fileName || !userId) {
      throw new Error("Missing fileName or userId in the request body.");
    }

    // The file path format is correct as per the support ticket.
    const filePath = `${userId}/${Date.now()}-${fileName}`;

    // Generate a signed URL that is valid for 60 seconds.
    const { data, error } = await supabaseAdmin
      .storage
      .from('problems')
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl, path: data.path }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error("Error generating signed upload URL:", err.message);
    return new Response(String(err?.message ?? err), { status: 500, headers: corsHeaders });
  }
});

