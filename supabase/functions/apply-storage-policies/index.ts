// supabase/functions/apply-storage-policies/index.ts
// Admin-only maintenance function to apply storage RLS fixes.
// - Creates storage.prefixes policies for the 'problems' bucket
// - Optionally drops broad storage.objects policies (explicit request only)
// Uses SUPABASE_DB_URL to run DDL. Protect this route with an admin token.

import pgDefault from "npm:pg@8.11.3";
const { Client } = pgDefault as unknown as { Client: any };

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-admin-token, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const DB_URL = Deno.env.get("SUPABASE_DB_URL");
const ADMIN_TOKEN = Deno.env.get("ADMIN_TASKS_TOKEN");

const json = (body: Json, init: ResponseInit = {}) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...cors, ...(init.headers || {}) },
  });

function extractToken(req: Request): string | null {
  const h = (name: string) => req.headers.get(name) ?? req.headers.get(name.toLowerCase());
  const explicit = h("x-admin-token");
  if (explicit && explicit.trim()) return explicit.trim();
  const auth = h("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Health check / quick env validation
  if (req.method === "GET") {
    return json({
      ok: true,
      env: {
        hasDbUrl: Boolean(DB_URL),
        hasAdminToken: Boolean(ADMIN_TOKEN),
      },
      note: "POST with x-admin-token or Authorization: Bearer <token> to apply changes",
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  try {
    if (!DB_URL) return json({ error: "SUPABASE_DB_URL not set in environment" }, { status: 500 });
    if (!ADMIN_TOKEN) return json({ error: "ADMIN_TASKS_TOKEN not set in environment" }, { status: 500 });

    const token = extractToken(req);
    if (!token) {
      return json({ error: "Unauthorized: missing x-admin-token or Authorization: Bearer header" }, { status: 401 });
    }
    if (token !== ADMIN_TOKEN) {
      return json({ error: `Unauthorized: invalid admin token: ${ADMIN_TOKEN} --- ${token}` }, { status: 401 });
    }

    let body: any = {};
    try { body = await req.json(); } catch (_) { /* ignore empty body */ }
    const dropPolicies: string[] = Array.isArray(body?.dropPolicies) ? body.dropPolicies : [];

    const client = new Client({ connectionString: DB_URL, application_name: "apply-storage-policies" });
    await client.connect();

    const created: string[] = [];
    const dropped: string[] = [];

    const creates = [
      `create policy "Prefixes insert problems anon" on storage.prefixes for insert to anon with check (bucket_id = 'problems');`,
      `create policy "Prefixes insert problems auth" on storage.prefixes for insert to authenticated with check (bucket_id = 'problems');`,
      `create policy "Prefixes select problems" on storage.prefixes for select to anon, authenticated using (bucket_id = 'problems');`,
    ];

    for (const sql of creates) {
      try {
        await client.query(sql);
        created.push(sql);
      } catch (e) {
        const msg = String((e as Error)?.message ?? e);
        if (!/already exists/i.test(msg)) throw e;
      }
    }

    if (dropPolicies.length > 0) {
      for (const name of dropPolicies) {
        const safeName = String(name).replace(/"/g, '""');
        const dropSql = `drop policy if exists "${safeName}" on storage.objects;`;
        await client.query(dropSql);
        dropped.push(String(name));
      }
    }

    await client.end();

    return json({ ok: true, createdCount: created.length, dropped, message: "Creates are idempotent; existing policies are skipped." });
  } catch (e) {
    console.error("apply-storage-policies error", e);
    return json({ error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
});