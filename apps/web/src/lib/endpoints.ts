// Set in Cloudflare Pages build settings (inlined at build time):
//   NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1
// Contracts: docs/plan/08-backend-contracts.md §6 (submit-reference),
// §8 (join-waitlist). Without the env var, forms take their graceful-failure
// paths against unprovisioned /api/* paths — by design.
const base = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export const WAITLIST_ENDPOINT = base ? `${base}/join-waitlist` : "/api/join-waitlist";
export const REFERENCE_ENDPOINT = base ? `${base}/submit-reference` : "/api/submit-reference";
