# Benchhoard

> A field guide to public seating. Map the benches around you, see what each
> one is actually like — flat or boxed-in, sun or shade, quiet or loud — and let
> a compass point you to the nearest place to sit down.
>
> **Find a place to sit down.**

Browsing is free and needs no account. Signing in lets you *hoard* benches
(save them privately), add new ones to the map, leave comfort ratings, and earn
discovery points and badges.

## What lives where

```
apps/mobile        # Expo app (the product) — Android first, iOS-ready
apps/web           # Next.js marketing + waitlist site (Cloudflare Pages)
packages/shared    # Zod schemas, bench taxonomies, and the copy glossary
supabase/          # migrations, edge functions, OSM seed data
```

## The domain

- **Benches** come from two sources: an OpenStreetMap import (`npm run
  seed:benches`) and benches hoarders add themselves. Anonymous visitors see
  verified benches; your own unverified additions are visible only to you until
  another hoarder confirms them.
- **The Hostility Index** grades each seat from a flat *true bench* you can lie
  down on to a *leaning rail* engineered to move you along. It drives marker
  color and the map filter. See `packages/shared/src/taxonomies.ts`.
- **Gamification** replaces billing entirely: discovery points, badges, streaks,
  and a public leaderboard. There are no paywalls.

## Architecture

- **Identity:** Clerk, bridged into Supabase via third-party auth. Every request
  carries the Clerk session token; `bh_uid()` reads `auth.jwt()->>'sub'`.
- **Data:** Supabase Postgres with PostGIS. All writes go through
  `SECURITY DEFINER` `bh_*` RPCs that take the caller's identity from `bh_uid()`,
  never from an argument. RLS is deny-by-default; anonymous browsing is a narrow,
  explicit allowance (verified benches, photos, reviews, and the leaderboard).
- **Edge functions:** `join-waitlist` (public) and `delete-account` (Clerk-JWT
  verified). Both deploy with `--no-verify-jwt` and verify auth themselves.

## Running it

```bash
npm install
npm run web            # marketing site
npm run mobile         # Expo dev server (map/compass need a dev build + device)
npm run seed:benches   # import OSM benches for the default region (Knoxville, TN)
```

## Tests & CI

```bash
npm run test:shared            # node:test — taxonomies, schemas, glossary voice
deno test supabase/functions/  # Edge Function pure logic (OSM tag mapping)
supabase test db               # pgTAP — geo queries, RLS, points + badges
```

CI (`.github/workflows/ci.yml`) typechecks all three workspaces, runs the shared
and Deno tests, and builds the web static export on every push and PR.
