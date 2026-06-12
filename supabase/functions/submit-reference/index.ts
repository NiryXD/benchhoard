// submit-reference — public, token-gated (docs/plan/08-backend-contracts.md §6).
// The invite token IS the auth; deploy with
//   supabase functions deploy submit-reference --no-verify-jwt
//
// GET  ?token=<uuid>  → { valid, reason? }   (pre-validation so the page can
//                       say "link expired" before someone writes 600 chars)
// POST { token, authorName, relationship?, body }
//                     → { ok: true }         (letter lands is_approved=false;
//                       the owner approves in-app before it displays)
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://letstouchbase.pages.dev",
  "http://localhost:3000",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// mirrors the reference_letters check constraint + sane field caps
const MAX_BODY = 600;
const MAX_AUTHOR = 80;
const MAX_RELATIONSHIP = 60;

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://letstouchbase.pages.dev",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
  };
}

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(status: number, body: unknown, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!UUID_RE.test(token)) return json(200, { valid: false, reason: "not_found" }, headers);
    const invite = await db
      .from("reference_invites")
      .select("expires_at")
      .eq("token", token)
      .maybeSingle();
    if (!invite.data) return json(200, { valid: false, reason: "not_found" }, headers);
    if (new Date(invite.data.expires_at) < new Date()) {
      return json(200, { valid: false, reason: "expired" }, headers);
    }
    return json(200, { valid: true }, headers);
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, headers);

  let token = "";
  let authorName = "";
  let relationship: string | null = null;
  let body = "";
  try {
    const payload = await req.json();
    token = String(payload.token ?? "");
    authorName = String(payload.authorName ?? "").trim();
    body = String(payload.body ?? "").trim();
    if (typeof payload.relationship === "string" && payload.relationship.trim()) {
      relationship = payload.relationship.trim().slice(0, MAX_RELATIONSHIP);
    }
  } catch {
    return json(400, { error: "bad_json" }, headers);
  }

  if (!UUID_RE.test(token)) return json(400, { error: "bad_token" }, headers);
  if (!authorName || authorName.length > MAX_AUTHOR) {
    return json(400, { error: "bad_author" }, headers);
  }
  if (!body || body.length > MAX_BODY) return json(400, { error: "bad_body" }, headers);

  // atomic consume: delete-returning guarantees one submission per token even
  // under concurrent posts. Tradeoff: if the insert below fails the token is
  // spent — acceptable; the owner can mint a fresh invite in-app.
  const consumed = await db
    .from("reference_invites")
    .delete()
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .select("user_id")
    .maybeSingle();

  if (!consumed.data) {
    // never existed, already used, or expired — same answer either way
    return json(410, { error: "token_invalid_or_expired" }, headers);
  }

  const inserted = await db.from("reference_letters").insert({
    user_id: consumed.data.user_id,
    author_name: authorName,
    relationship,
    body,
  });
  if (inserted.error) {
    console.error("submit-reference insert failed", inserted.error);
    return json(500, { error: "internal" }, headers);
  }

  return json(200, { ok: true }, headers);
});
