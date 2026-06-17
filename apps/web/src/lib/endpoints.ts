// Set in Cloudflare Pages build settings (inlined at build time):
//   NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1
// Without the env var, the waitlist form takes its graceful-failure path
// against the unprovisioned /api/* path — by design.
const base = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export const WAITLIST_ENDPOINT = base ? `${base}/join-waitlist` : "/api/join-waitlist";
