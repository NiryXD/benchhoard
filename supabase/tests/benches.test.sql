-- ─── [Opus 4.8] Benchhoard pgTAP suite — geo queries, RLS, points + badges ──
-- Run: supabase test db   (applies migrations, then this in a rolled-back txn)

begin;
select plan(12);

-- ── Setup as the owner (RLS bypassed) ───────────────────────────────────────
-- Two hoarders; three benches around a known origin (0,0). Distances grow east.
insert into profiles (user_id, display_name) values
  ('user_a', 'Ada'),
  ('user_b', 'Bo');

insert into benches (id, name, location, seat_type, sun_exposure, sightline, amenities, verified, added_by) values
  ('11111111-1111-4111-8111-111111111111', 'Near',  'SRID=4326;POINT(0 0)'::geography,      'true_bench',   'full_shade', 'people_watching', '{lit_at_night}', true,  null),
  ('22222222-2222-4222-8222-222222222222', 'Mid',   'SRID=4326;POINT(0.01 0)'::geography,   'divided_bench','full_sun',   'street',          '{}',             true,  null),
  ('33333333-3333-4333-8333-333333333333', 'Far',   'SRID=4326;POINT(0.05 0)'::geography,   'leaning_rail', 'full_sun',   'wall',            '{}',             true,  null);

-- An unverified bench added by user_b — only user_b should see it.
insert into benches (id, name, location, seat_type, verified, added_by) values
  ('44444444-4444-4444-8444-444444444444', 'Bo''s secret', 'SRID=4326;POINT(0 0.001)'::geography, 'true_bench', false, 'user_b');

-- ── Act as user_a under RLS ─────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_a","role":"authenticated"}', true);

select is(bh_uid(), 'user_a', 'bh_uid() resolves the JWT sub');

-- nearest benches: ordered by distance, bearing roughly east (~90°), bonus filtered
select is(
  (select array_agg(name order by distance_m) from bh_nearest_benches(0, 0, 25, 50)),
  array['Near', 'Mid', 'Far'],
  'bh_nearest_benches orders verified benches by distance'
);
select ok(
  (select bearing_deg from bh_nearest_benches(0, 0, 25, 50) where name = 'Mid') between 80 and 100,
  'bearing to a bench due east is ~90°'
);
select is(
  (select count(*)::int from bh_nearest_benches(0, 0, 1, 50)),
  1,
  'a 1 km radius only includes the nearest bench'
);

-- RLS: user_a cannot see user_b's unverified bench
select is(
  (select count(*)::int from benches where name = 'Bo''s secret'),
  0,
  'unverified benches are hidden from other users (RLS)'
);

-- add a bench → returns id, awards 25 points, unlocks Pathfinder
select ok(
  (bh_add_bench(0.0001, 0.0001, 'true_bench', 'My spot') ->> 'pointsAwarded')::int = 25,
  'bh_add_bench awards the add bonus'
);
select is(
  (select (bh_my_stats() ->> 'benchesAdded')::int),
  1,
  'the added bench counts toward my stats'
);
select ok(
  (select badges_earned.badge is not null from badges_earned
   where user_id = 'user_a' and badge = 'pathfinder'),
  'adding the first bench unlocks the Pathfinder badge'
);

-- hoard a shaded, night-lit, people-watching bench → first-claim + themed badges
select ok(
  (bh_toggle_hoard('11111111-1111-4111-8111-111111111111') ->> 'hoarded')::boolean,
  'bh_toggle_hoard claims a bench'
);
select is(
  (select array_agg(badge order by badge) from badges_earned
   where user_id = 'user_a'
     and badge in ('first_claim', 'shade_seeker', 'night_owl', 'people_watcher')),
  array['first_claim', 'night_owl', 'people_watcher', 'shade_seeker'],
  'claiming a shaded, lit, people-watching bench unlocks all four themed badges'
);

-- toggling again releases the claim
select is(
  (bh_toggle_hoard('11111111-1111-4111-8111-111111111111') ->> 'hoarded')::boolean,
  false,
  'toggling an already-hoarded bench releases it'
);

-- a second add the same day is fine; the daily cap is far away
select ok(
  (bh_add_bench(0.0002, 0.0002, 'ledge') ->> 'benchId') is not null,
  'a second add within the daily cap succeeds'
);

select * from finish();
rollback;
