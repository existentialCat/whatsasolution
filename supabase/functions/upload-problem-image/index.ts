// Deploy as: supabase/functions/upload-problem-image/index.ts
// Purpose: Proxy uploads to Supabase Storage using service role and return Storage request IDs + headers for escalation.
// This version includes the necessary CORS headers and a default bucket.
import { createClient } from "npm:@supabase/supabase-js@2.45.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
// Helper to create consistent JSON responses with CORS headers
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'connection': 'keep-alive',
      ...corsHeaders
    }
  });
}
async function readMultipart(req) {
  const form = await req.formData();
  const bucket = form.get('bucket')?.toString();
  const key = form.get('key')?.toString();
  const submissionId = form.get('submission_id')?.toString();
  const filename = form.get('filename')?.toString();
  const f = form.get('file');
  const file = f instanceof File ? f : undefined;
  return {
    bucket,
    key,
    file,
    submissionId,
    filename
  };
}
async function getRequesterUserId(req) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return {
    error: 'Missing bearer token'
  };
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    return {
      error: 'Invalid or expired token'
    };
  }
  return {
    userId: user.id
  };
}
Deno.serve({
  onListen: ()=>console.info('upload-problem-image ready')
}, async (req)=>{
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response("ok", {
    headers: corsHeaders
  });
  if (req.method !== 'POST') return json({
    ok: false,
    error: 'Method not allowed'
  }, 405);
  const ct = req.headers.get('content-type') || '';
  if (!ct.startsWith('multipart/form-data')) {
    return json({
      ok: false,
      error: 'Expected multipart/form-data'
    }, 400);
  }
  const [authRes, formRes] = await Promise.all([
    getRequesterUserId(req),
    readMultipart(req)
  ]);
  if ('error' in authRes) return json({
    ok: false,
    error: authRes.error
  }, 401);
  if (!formRes.file) return json({
    ok: false,
    error: 'Missing file'
  }, 400);
  const { userId } = authRes;
  let { bucket, key, file, submissionId, filename } = formRes;
  bucket = bucket || 'problems';
  if (!key) {
    if (!submissionId || !file.name) {
      return json({
        ok: false,
        error: 'Missing key or fields to construct it (submissionId, filename)'
      }, 400);
    }
    const safeName = (filename || file.name).replace(/[^A-Za-z0-9._-]/g, "_");
    key = `${userId}/${submissionId}/${safeName}`;
  }
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const headers = {
    'authorization': `Bearer ${SERVICE_KEY}`,
    'content-type': file.type || 'application/octet-stream'
  };
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: file.stream()
  });
  const requestId = res.headers.get('x-request-id');
  if (!res.ok) {
    let errText;
    try {
      errText = await res.text();
    } catch  {
      errText = `HTTP ${res.status}`;
    }
    return json({
      ok: false,
      error: errText,
      requestId
    }, res.status);
  }
  const out = await res.json().catch(()=>({}));
  // This is the updated section for constructing the response.
  // The 'Key' from Storage includes the bucket, so we use it directly for the public URL.
  const fullStoragePath = out.Key || out.path || `${bucket}/${key}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullStoragePath}`;
  return json({
    ok: true,
    url: publicUrl,
    path: key,
    requestId,
    size: file.size,
    contentType: file.type || null
  }, 200);
});
