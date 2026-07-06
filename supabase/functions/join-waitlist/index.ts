// join-waitlist — public, pre-launch "get notified" signup.
// Unauthenticated public endpoint: deploy with
//   supabase functions deploy join-waitlist --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://benchhoard.pages.dev",
  "http://localhost:3000",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// no 0/O/1/I — these codes get read aloud and retyped
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://benchhoard.pages.dev",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
  };
}

function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

// Fixed-window per-IP limit: at most this many submissions per window.
const RATE_LIMIT = 10;
const RATE_WINDOW_SECS = 3600; // 1 hour

/** SHA-256 hex of a string — we store only the hash of the client IP. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Best-effort client IP from the edge proxy headers. */
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** 1-based queue position: referrals first, then seniority. */
async function positionOf(row: { referral_count: number; created_at: string }) {
  const ahead = await db
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .gt("referral_count", row.referral_count);
  const peers = await db
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("referral_count", row.referral_count)
    .lte("created_at", row.created_at);
  return (ahead.count ?? 0) + (peers.count ?? 1);
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
  }

  // Rate-limit before doing any work. Fail open on a limiter error — a signup
  // outage is worse than a missed throttle.
  try {
    const key = await sha256Hex(clientIp(req));
    const { data: ok } = await db.rpc("bh_waitlist_rate_ok", {
      p_key: key,
      p_limit: RATE_LIMIT,
      p_window_secs: RATE_WINDOW_SECS,
    });
    if (ok === false) {
      return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers });
    }
  } catch (err) {
    console.error("join-waitlist rate check failed", err);
  }

  let email = "";
  let ref: string | undefined;
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    if (typeof body.ref === "string") ref = body.ref.trim().toUpperCase().slice(0, 16);
  } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), { status: 400, headers });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return new Response(JSON.stringify({ error: "bad_email" }), { status: 400, headers });
  }

  // idempotent on email: returning users get their existing code back
  const existing = await db
    .from("waitlist")
    .select("referral_code, referral_count, created_at")
    .ilike("email", email)
    .maybeSingle();
  if (existing.data) {
    return new Response(
      JSON.stringify({
        referralCode: existing.data.referral_code,
        position: await positionOf(existing.data),
        alreadyOnList: true,
      }),
      { status: 200, headers },
    );
  }

  // resolve the referrer before inserting so self-referral can't exist yet
  let referrerId: string | null = null;
  if (ref) {
    const referrer = await db.from("waitlist").select("id").eq("referral_code", ref).maybeSingle();
    referrerId = referrer.data?.id ?? null;
  }

  // insert with retry on the (astronomically unlikely) code collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const inserted = await db
      .from("waitlist")
      .insert({ email, referral_code: makeCode(), referred_by: referrerId })
      .select("referral_code, referral_count, created_at")
      .single();

    if (!inserted.error) {
      if (referrerId) {
        // Employee Referral Bonus: the referrer moves up
        await db.rpc("bh_count_referral", { p_referrer: referrerId });
      }
      return new Response(
        JSON.stringify({
          referralCode: inserted.data.referral_code,
          position: await positionOf(inserted.data),
          alreadyOnList: false,
        }),
        { status: 200, headers },
      );
    }

    if (inserted.error.code === "23505") {
      // raced on email (another submit won) → return theirs; raced on code → retry
      const raced = await db
        .from("waitlist")
        .select("referral_code, referral_count, created_at")
        .ilike("email", email)
        .maybeSingle();
      if (raced.data) {
        return new Response(
          JSON.stringify({
            referralCode: raced.data.referral_code,
            position: await positionOf(raced.data),
            alreadyOnList: true,
          }),
          { status: 200, headers },
        );
      }
      continue;
    }

    console.error("join-waitlist insert failed", inserted.error);
    break;
  }

  return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers });
});
