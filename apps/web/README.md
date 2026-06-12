# apps/web — letstouchbase marketing site

Next.js static export. Landing page (waitlist + Employee Referral Bonus
framing), `/privacy`, and `/terms` (store-required for Play submission).
Later (Phase 4) this app grows the public reference form.

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
- **Environment variable:** `NEXT_PUBLIC_WAITLIST_URL` →
  `https://<project-ref>.supabase.co/functions/v1/join-waitlist`
  (inlined at build time; without it the form fails gracefully)

Site serves at `letstouchbase.pages.dev`; attach `letstouchbase.com` later
when the domain is purchased.

## TODOs before launch

- Waitlist backend exists (`supabase/functions/join-waitlist`, contract in
  doc 08 §8) but needs deploying:
  `supabase db push` then
  `supabase functions deploy join-waitlist --no-verify-jwt`,
  and set `NEXT_PUBLIC_WAITLIST_URL` in the Pages build env.
- Legal: `/privacy` and `/terms` are working drafts — run through Termly
  (free tier) / legal review and fill the `[BRACKETED]` placeholders
  (support email, jurisdiction).
