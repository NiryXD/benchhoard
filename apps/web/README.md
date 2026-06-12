# apps/web — letstouchbase marketing site

Next.js static export. Landing page (waitlist + Employee Referral Bonus
framing), `/reference` (the public reference form — invite links from the
app land here), `/privacy`, and `/terms` (store-required for Play
submission).

## Dev

```sh
npm run dev --workspace web        # http://localhost:3000
```

## Build (static export)

```sh
npm run build --workspace web      # output: apps/web/out
```

No server runtime — everything is prerendered. `@ltb/shared` is consumed as
TypeScript source via `transpilePackages`.

## Deploy — Cloudflare Pages (free tier)

Connect the GitHub repo in the Cloudflare dashboard:

- **Build command:** `npm run build --workspace web`
- **Build output directory:** `apps/web/out`
- **Root directory:** repo root (npm workspaces need the root lockfile)
- **Environment variable:** `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` →
  `https://<project-ref>.supabase.co/functions/v1`
  (inlined at build time; without it both forms fail gracefully)

Site serves at `letstouchbase.pages.dev`; attach `letstouchbase.com` later
when the domain is purchased.

## TODOs before launch

- Backend exists for both forms (doc 08 §6 + §8) but needs deploying:
  `supabase db push` then
  `supabase functions deploy join-waitlist --no-verify-jwt` and
  `supabase functions deploy submit-reference --no-verify-jwt`,
  and set `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` in the Pages build env.
- Reference invite links (`/reference/?token=…`) are minted in-app — the
  mobile "request a reference" UI is a Phase 4 item.
- Legal: `/privacy` and `/terms` are working drafts — run through Termly
  (free tier) / legal review and fill the `[BRACKETED]` placeholders
  (support email, jurisdiction).
