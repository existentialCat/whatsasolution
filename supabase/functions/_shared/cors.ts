// supabase/functions/_shared/cors.ts

// These are the required CORS headers for preflight (OPTIONS) requests
// and for returning responses from your Edge Functions.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
