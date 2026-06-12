# 09 · Setup Runbook: The Fiddly Bits, Written Down

The schema and app code assume specific console configuration. Do these in
order; each has a verification step so you know it worked before building on
top of it.

## 1. Supabase project

1. Create the project (free tier), note the URL + anon key →
   `apps/mobile/.env`.
2. Link and push migrations: `supabase link --project-ref <ref>` then
   `supabase db push`. Both migrations apply cleanly to an empty project;
   they create the storage buckets and the pg_cron job too.
3. **Verify:** `select cron.jobname from cron.job;` shows `ltb-nightly`;
   `photos` (public) and `resumes` (private) buckets exist.

## 2. Clerk ↔ Supabase third-party auth

The schema's whole identity model is `auth.jwt()->>'sub'` = Clerk user id
(`ltb_uid()`, migration 1). That only works with the **native third-party
auth integration** (not the deprecated JWT-template flow):

1. **Clerk dashboard:** Configure → Integrations → enable the **Supabase**
   integration. This adds the `role: "authenticated"` claim to session
   tokens — required or every `to authenticated` RLS policy denies. Note
   your Clerk **Frontend API URL** (the issuer domain,
   `https://<slug>.clerk.accounts.dev`).
2. **Supabase dashboard:** Authentication → Sign In / Up → Third Party
   Auth → add **Clerk** with that issuer domain.
3. **Expo client:** one Supabase client, Clerk token injected per-request:

   ```ts
   const supabase = createClient(url, anonKey, {
     accessToken: async () => (await getToken()) ?? null,
   });
   ```

   Wrap the app in `<ClerkProvider tokenCache={tokenCache}>` using
   `expo-secure-store` for the cache.
4. **Verify:** while signed in, `supabase.rpc("ltb_uid")` returns your Clerk
   `user_…` id; signed out, a `profiles` select returns zero rows.

## 3. Expo app restructure (first task of Phase 1)

Auth and onboarding need route groups, so the current root-level tabs move:

```
src/app/_layout.tsx          → root: providers + auth gate
src/app/(auth)/sign-in.tsx     (and sign-up)
src/app/(onboarding)/…        "Build Your Resume" wizard steps
src/app/(tabs)/_layout.tsx   ← today's tab layout moves here
src/app/(tabs)/{index,inbound,pipeline,you}.tsx
```

Gate logic at the root: signed out → `(auth)`; signed in without a
`profiles` row → `(onboarding)`; otherwise `(tabs)`. Onboarding cannot
complete without: first name, birthdate (**18+ enforced in UI; the DB check
constraint is the backstop**), gender, headline, the required Professional
Headshot photo, and 3 behavioral answers.

## 4. EAS development build (don't get ambushed in Phase 3)

Expo Go covers Phases 1–2 only: **push notifications don't work in Expo Go
on Android (SDK 53+), and RevenueCat is a native module.** From Phase 3 on,
all device testing happens in a development build.

- `npx eas init` then `eas build --profile development --platform android`
  (creates `eas.json` on first run; free tier queue is fine).
- Cut the first dev build **during Phase 2** so it's waiting when chat/push
  work starts.
- Reminder from Phase 0: start the Google Play closed-test clock early — new
  personal accounts need 20 testers for 14 days before production.

## 5. Service checklist (Phase 0, all free tiers)

| Service | Needed by | Key lands in |
|---|---|---|
| Supabase | Phase 1 | `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` |
| Clerk | Phase 1 | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Expo/EAS | Phase 2–3 | `eas init` (project id in app.json) |
| PostHog + Sentry | Phase 2 / 6 | env vars, add when wired |
| RevenueCat | Phase 5 | public SDK key + webhook secret (Edge Function env) |
| Cloudflare Pages | Phase 4 at latest | — (privacy/ToS URLs + reference form live here) |

Watch out: Supabase free-tier projects **pause after ~1 week idle** during
dev lulls — unpause from the dashboard; nothing is lost.
