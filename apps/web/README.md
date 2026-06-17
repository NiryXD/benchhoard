# apps/web — benchhoard marketing site

Next.js static export. Landing page (the Hostility Index, hoarding, and a
"get notified" waitlist), `/privacy`, `/support`, and `/terms`
(store-required for app-store submission).

## Dev

```sh
npm run dev --workspace web        # http://localhost:3000
```

## Build (static export)

```sh
npm run build --workspace web      # output: apps/web/out
```

No server runtime — everything is prerendered. `@benchhoard/shared` is consumed as
TypeScript source via `transpilePackages`.

## Deploy — Cloudflare Pages (free tier)

Connect the GitHub repo in the Cloudflare dashboard:

- **Build command:** `npm run build --workspace web`
- **Build output directory:** `apps/web/out`
- **Root directory:** repo root (npm workspaces need the root lockfile)
- **Environment variable:** `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` →
  `https://<project-ref>.supabase.co/functions/v1`
  (inlined at build time; without it the waitlist form fails gracefully)

Site serves at `benchhoard.pages.dev`; attach `benchhoard.com` later
when the domain is purchased.

## TODOs before launch

- Backend for the waitlist form exists but needs deploying:
  `supabase db push` then
  `supabase functions deploy join-waitlist --no-verify-jwt`,
  and set `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` in the Pages build env.
- Legal: `/privacy` and `/terms` are working drafts — run through a
  generator (e.g. Termly) / legal review and fill the `[BRACKETED]`
  placeholders (support email, jurisdiction).
