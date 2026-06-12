// delete-account — full wipe + Clerk delete (docs/plan/08-backend-contracts.md §5).
// Store-required (Play account-deletion policy); Phase 6 blocker.
//
// Auth is the user's Clerk JWT, verified here against Clerk's JWKS — the
// platform verifier only knows Supabase-signed JWTs, so deploy with:
//   supabase functions deploy delete-account --no-verify-jwt
//   supabase secrets set CLERK_ISSUER=https://<your-app>.clerk.accounts.dev
//   supabase secrets set CLERK_SECRET_KEY=sk_...
//
// Idempotent by design: if the Clerk delete fails after the DB wipe, the
// user's session is still valid and a retry re-runs the (now empty) wipe
// and reattempts the Clerk delete. Client confirms twice before calling
// ("Tender Your Resignation").
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ISSUER = Deno.env.get("CLERK_ISSUER")!;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

async function verifiedUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWKS, { issuer: ISSUER });
    return typeof payload.sub === "string" && payload.sub !== "" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Remove every object under {bucket}/{uid}/ in pages of 100. */
async function wipeFolder(bucket: string, uid: string) {
  for (;;) {
    const { data, error } = await db.storage.from(bucket).list(uid, { limit: 100 });
    if (error) throw new Error(`${bucket} list: ${error.message}`);
    if (!data || data.length === 0) return;
    const paths = data.map((o) => `${uid}/${o.name}`);
    const removed = await db.storage.from(bucket).remove(paths);
    if (removed.error) throw new Error(`${bucket} remove: ${removed.error.message}`);
    if (data.length < 100) return;
  }
}

Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json" };
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
  }

  const uid = await verifiedUserId(req);
  if (!uid) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
  }

  try {
    // 1. Storage first — the profiles cascade can't reach storage.objects.
    await wipeFolder("photos", uid);
    await wipeFolder("resumes", uid);

    // 2. profiles row; education/experience/photos/screens/matches/messages/
    //    blocks/reports/entitlements/devices/… all cascade from it.
    const del = await db.from("profiles").delete().eq("user_id", uid);
    if (del.error) throw new Error(`profiles delete: ${del.error.message}`);

    // 3. Clerk user last, so a failure here leaves a retryable session.
    const clerk = await fetch(`https://api.clerk.com/v1/users/${uid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Deno.env.get("CLERK_SECRET_KEY")}` },
    });
    if (!clerk.ok && clerk.status !== 404) {
      throw new Error(`clerk delete: ${clerk.status} ${await clerk.text()}`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error("delete-account failed for", uid, err);
    return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers });
  }
});
