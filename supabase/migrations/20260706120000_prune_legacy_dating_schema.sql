-- ─── [Fable 5] Prune the legacy dating schema ───────────────────────────────
-- The repo was pivoted from a dating app to Benchhoard, but the original
-- dating schema (migrations 1–5 and the 20260612/14/15 phases) was left in
-- place beneath the new bench tables. That left three problems this migration
-- closes for good:
--
--   1. CORRECTNESS (blocker): profiles.first_name is NOT NULL with no default
--      (added by 00000000000002). bh_ensure_profile inserts only
--      (user_id, display_name), so the very first sign-in raised a not-null
--      violation — and with no profile row, every write RPC (add/hoard/review)
--      then failed its foreign key. Benchhoard could not create a single user.
--
--   2. PRIVACY / COMPLIANCE: the dating tables model sensitive personal data
--      (ethnicity, religion, politics, sexual/dating intent) that Benchhoard
--      never collects and the privacy policy explicitly disclaims. Keeping the
--      schema — even unused — is a liability.
--
--   3. ATTACK SURFACE: SECURITY DEFINER RPCs like bh_profile_card / bh_get_deck
--      / bh_request_screen were still granted to `authenticated`. Removing them
--      shrinks the callable surface to just the bench + gamification RPCs.
--
-- Forward-only and idempotent (IF EXISTS / CASCADE) so it is safe to re-run.
-- Kept: profiles (stripped to a bench identity), devices, notification_prefs
-- (re-themed below), waitlist + bh_count_referral, bh_uid(), and everything in
-- the two 20260617 Benchhoard migrations.

-- ---------------------------------------------------------------------------
-- 1. Drop the dating server logic. Functions first — dropping a function never
--    depends on the tables it reads, so order among these does not matter.
-- ---------------------------------------------------------------------------
drop function if exists bh_get_deck(int);
drop function if exists bh_deck_candidates(text, numeric, int);
drop function if exists bh_profile_card(text);
drop function if exists bh_request_screen(text, text, text, text, boolean);
drop function if exists bh_decide_screen(bigint, text, text);
drop function if exists bh_block_user(text);
drop function if exists bh_performance_review();
drop function if exists bh_activate_boost();
drop function if exists bh_apply_executive(text, boolean);
drop function if exists bh_grant_credits(text, int, int);
drop function if exists bh_dev_scatter_seeds();
drop function if exists bh_is_matched(text, text);
drop function if exists bh_age(date);
drop function if exists bh_degree_rank(text);
drop function if exists bh_nightly();

-- Stop the nightly dating-maintenance cron job. pg_cron raises if the job is
-- absent, so guard it — a fresh database that never scheduled it is fine.
do $$
begin
  perform cron.unschedule('ltb-nightly');
exception when others then
  null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Drop the dating tables. CASCADE clears their RLS policies, indexes,
--    foreign keys, and realtime-publication membership in one step.
-- ---------------------------------------------------------------------------
drop table if exists exit_interviews cascade;
drop table if exists rejection_letters cascade;
drop table if exists messages cascade;
drop table if exists matches cascade;
drop table if exists rejects cascade;
drop table if exists screens cascade;
drop table if exists screen_counters cascade;
drop table if exists daily_picks cascade;
drop table if exists impressions cascade;
drop table if exists reports cascade;
drop table if exists blocks cascade;
drop table if exists endorsements cascade;
drop table if exists reference_letters cascade;
drop table if exists reference_invites cascade;
drop table if exists entitlements cascade;
drop table if exists preferences cascade;
drop table if exists photos cascade;
drop table if exists behavioral_answers cascade;
drop table if exists experience cascade;
drop table if exists education cascade;

-- ---------------------------------------------------------------------------
-- 3. Drop the dating storage buckets (public profile photos + private resumes)
--    and their object policies. bench-photos and its policies are untouched.
-- ---------------------------------------------------------------------------
drop policy if exists photos_upload on storage.objects;
drop policy if exists photos_owner_delete on storage.objects;
drop policy if exists resumes_owner_all on storage.objects;
drop policy if exists resumes_matched_read on storage.objects;

delete from storage.objects where bucket_id in ('photos', 'resumes');
delete from storage.buckets where id in ('photos', 'resumes');

-- ---------------------------------------------------------------------------
-- 4. Reduce profiles to a Benchhoard identity: user_id, display_name,
--    created_at. Drop the legacy policies first (they reference is_paused and
--    the now-gone blocks table), then the columns, then re-add clean policies.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_read on profiles;
drop policy if exists profiles_insert on profiles;
drop policy if exists profiles_update on profiles;

alter table profiles
  drop column if exists headline,
  drop column if exists executive_summary,
  drop column if exists current_title,
  drop column if exists employer,
  drop column if exists industry,
  drop column if exists archetype,
  drop column if exists open_to_work,
  drop column if exists birthdate,
  drop column if exists gender,
  drop column if exists height_cm,
  drop column if exists ethnicity,
  drop column if exists religion,
  drop column if exists family_plans,
  drop column if exists location,
  drop column if exists is_business_trip,
  drop column if exists resume_pdf_path,
  drop column if exists out_of_office,
  drop column if exists is_paused,
  drop column if exists desirability,
  drop column if exists completeness,
  drop column if exists last_active_at,
  drop column if exists first_name,
  drop column if exists has_kids,
  drop column if exists smoking,
  drop column if exists drinking,
  drop column if exists cannabis,
  drop column if exists politics,
  drop column if exists boosted_until;

-- A hoarder can only ever see and manage their own identity row. Display names
-- surface to others only through bh_leaderboard, which is SECURITY DEFINER.
create policy profiles_read on profiles for select to authenticated
  using (user_id = bh_uid());
create policy profiles_insert on profiles for insert to authenticated
  with check (user_id = bh_uid());
create policy profiles_update on profiles for update to authenticated
  using (user_id = bh_uid()) with check (user_id = bh_uid());

-- ---------------------------------------------------------------------------
-- 5. Re-theme notification_prefs from the dating categories (screens/matches/
--    messages/rejections) to Benchhoard's (nearby benches / badges / bench
--    confirmations). push_enabled, quiet hours, and tz carry over unchanged.
-- ---------------------------------------------------------------------------
alter table notification_prefs
  drop column if exists screens,
  drop column if exists matches,
  drop column if exists messages,
  drop column if exists rejections,
  add column if not exists nearby   boolean not null default true,  -- new benches nearby
  add column if not exists badges   boolean not null default true,  -- badges & milestones
  add column if not exists verified boolean not null default true;  -- bench confirmations
