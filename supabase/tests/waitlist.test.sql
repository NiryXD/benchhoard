-- ─── [Fable 5] Waitlist rate-limiter pgTAP suite ────────────────────────────
-- Run: supabase test db
-- Runs as the migration/owner role, which retains EXECUTE on the SECURITY
-- DEFINER limiter (it's revoked only from public/anon/authenticated).

begin;
select plan(4);

-- Fixed window of 2 requests: the third in-window call is blocked.
select ok(bh_waitlist_rate_ok('ip-hash-a', 2, 3600), 'first request is under the limit');
select ok(bh_waitlist_rate_ok('ip-hash-a', 2, 3600), 'second request is under the limit');
select ok(not bh_waitlist_rate_ok('ip-hash-a', 2, 3600), 'third request in the window is blocked');

-- Each key (hashed IP) has its own independent window.
select ok(bh_waitlist_rate_ok('ip-hash-b', 2, 3600), 'a different IP is tracked independently');

select * from finish();
rollback;
