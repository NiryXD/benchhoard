-- ─── [Fable 5] Harden the public bench RPCs + write path ────────────────────
-- Fixes on top of 20260617130000_benchhoard_rpcs.sql:
--
--   1. bh_leaderboard leaked the raw Clerk user id (d.user_id) to anonymous
--      callers — an internal identifier that never needs to leave the server.
--      Replace it with a 1-based rank; the client keys rows by that instead.
--
--   2. bh_add_bench / bh_nearest_benches took float8 lat/lng straight into
--      st_makepoint with no range check. The client validates via Zod, but the
--      RPCs are directly callable, so enforce WGS84 bounds server-side too.
--
--   3. The benches_insert RLS policy let an authenticated user INSERT straight
--      into benches, bypassing bh_add_bench's per-day cap AND the taxonomy the
--      client picks from — arbitrary seat_type/material strings could pollute
--      the public map. Force every add through the RPC (SECURITY DEFINER, so it
--      still inserts) and back it with CHECK constraints as defense in depth.

-- ---------------------------------------------------------------------------
-- leaderboard — top hoarders by discovery points (public; rank + name only)
-- ---------------------------------------------------------------------------
create or replace function bh_leaderboard(lim int default 20) returns jsonb
  language sql stable security definer
  set search_path = public, extensions
  as $$
    select coalesce(jsonb_agg(to_jsonb(t) order by t.points desc), '[]'::jsonb)
    from (
      select
        row_number() over (order by sum(d.points) desc, min(d.created_at))::int as rank,
        coalesce(p.display_name, 'Anonymous hoarder') as name,
        sum(d.points)::int as points,
        (select count(*) from benches b where b.added_by = d.user_id)::int as benches_added
      from discoveries d
      left join profiles p on p.user_id = d.user_id
      group by d.user_id, p.display_name
      order by points desc
      limit lim
    ) t
  $$;

-- ---------------------------------------------------------------------------
-- nearest benches — same body as 20260617130000, with a WGS84 bounds guard.
-- ---------------------------------------------------------------------------
create or replace function bh_nearest_benches(
  in_lng float8,
  in_lat float8,
  radius_km int default 2,
  lim int default 50
)
  returns table(
    id uuid, name text, seat_type text, material text, sun_exposure text,
    noise text, sightline text, amenities text[], capacity int, verified boolean,
    distance_m real, bearing_deg real, lng float8, lat float8
  )
  language sql stable security definer
  set search_path = public, extensions
  as $$
    with origin as (
      select st_setsrid(st_makepoint(
        least(greatest(in_lng, -180), 180),
        least(greatest(in_lat, -90), 90)
      ), 4326)::geography as g
    )
    select b.id, b.name, b.seat_type, b.material, b.sun_exposure, b.noise,
      b.sightline, b.amenities, b.capacity, b.verified,
      st_distance(o.g, b.location)::real as distance_m,
      (mod(degrees(st_azimuth(o.g::geometry, b.location::geometry))::numeric, 360))::real as bearing_deg,
      st_x(b.location::geometry) as lng,
      st_y(b.location::geometry) as lat
    from benches b cross join origin o
    where (b.verified or b.added_by = bh_uid())
      and st_dwithin(o.g, b.location, greatest(radius_km, 1) * 1000)
    order by st_distance(o.g, b.location)
    limit greatest(lim, 1)
  $$;

-- ---------------------------------------------------------------------------
-- add a bench — same body as 20260617130000, with a WGS84 bounds guard.
-- ---------------------------------------------------------------------------
create or replace function bh_add_bench(
  in_lng float8,
  in_lat float8,
  in_seat_type text,
  in_name text default null,
  in_material text default null,
  in_sun_exposure text default null,
  in_noise text default null,
  in_sightline text default null,
  in_amenities text[] default '{}',
  in_capacity int default null,
  in_notes text default null
) returns jsonb
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare
  me        text := bh_uid();
  new_id    uuid;
  today_cnt int;
  pts       int := 25;   -- DISCOVERY_POINTS.addBench
  newly     text[];
begin
  if me is null then raise exception 'unauthenticated'; end if;
  if in_seat_type is null or length(trim(in_seat_type)) = 0 then
    raise exception 'seat type required';
  end if;
  if in_lng is null or in_lat is null
     or in_lng < -180 or in_lng > 180 or in_lat < -90 or in_lat > 90 then
    raise exception 'coordinates out of range';
  end if;

  -- LIMITS.addBenchMaxPerDay = 20 (UTC day)
  select count(*) into today_cnt from benches
    where added_by = me and created_at >= (now() at time zone 'utc')::date;
  if today_cnt >= 20 then raise exception 'DAILY_LIMIT'; end if;

  insert into benches (name, location, seat_type, material, sun_exposure, noise,
                       sightline, amenities, capacity, notes, added_by)
  values (in_name, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography,
          in_seat_type, in_material, in_sun_exposure, in_noise, in_sightline,
          coalesce(in_amenities, '{}'), in_capacity, in_notes, me)
  returning id into new_id;

  insert into discoveries (user_id, bench_id, kind, points)
  values (me, new_id, 'added', pts);

  newly := bh_check_badges(me);
  return jsonb_build_object('benchId', new_id, 'pointsAwarded', pts, 'badges', to_jsonb(newly));
end;
$$;

-- ---------------------------------------------------------------------------
-- Taxonomy integrity: whatever path writes a bench, its qualities must be from
-- the shared taxonomies (packages/shared/src/taxonomies.ts). OSM-seeded rows
-- and RPC inserts already satisfy these; the constraints stop anything else.
-- ---------------------------------------------------------------------------
alter table benches
  add constraint benches_seat_type_valid check (
    seat_type in ('true_bench','picnic_table','individual_seats','divided_bench','ledge','leaning_rail')),
  add constraint benches_material_valid check (
    material is null or material in ('wood','stone','metal','concrete','plastic','mixed')),
  add constraint benches_sun_valid check (
    sun_exposure is null or sun_exposure in ('full_sun','partial_shade','full_shade')),
  add constraint benches_noise_valid check (
    noise is null or noise in ('quiet','moderate','loud')),
  add constraint benches_sightline_valid check (
    sightline is null or sightline in ('people_watching','nature','water','skyline','street','wall')),
  add constraint benches_amenities_valid check (
    amenities <@ array['backrest','covered','lit_at_night','near_water_fountain',
                       'near_restroom','near_trash','wheelchair_accessible']::text[]);

-- Route all bench creation through bh_add_bench (daily cap + points + badges +
-- the bounds guard above). Direct client inserts are no longer permitted; the
-- SECURITY DEFINER RPC still writes because it runs as the function owner.
drop policy if exists benches_insert on benches;

