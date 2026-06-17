-- ─── [Opus 4.8] Benchhoard server logic as SECURITY DEFINER RPCs ─────────────
-- Same discipline as the dating-era RPCs: the caller's identity always comes
-- from bh_uid(), never from an argument, and point/badge awards are atomic
-- with the write that earns them. Point values mirror DISCOVERY_POINTS and the
-- caps mirror LIMITS in packages/shared/src/taxonomies.ts.

-- ---------------------------------------------------------------------------
-- identity bootstrap — create the profile row lazily on first sign-in
-- ---------------------------------------------------------------------------
create or replace function bh_ensure_profile(display_name text default null) returns void
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare me text := bh_uid();
begin
  if me is null then raise exception 'unauthenticated'; end if;
  insert into profiles (user_id, display_name)
  values (me, display_name)
  on conflict (user_id) do update
    set display_name = coalesce(excluded.display_name, profiles.display_name);
end;
$$;

-- ---------------------------------------------------------------------------
-- nearest benches — the single source of truth for both the map list and the
-- compass. Returns distance AND bearing from the query point so the arrow and
-- the "42 m away" label never disagree. Callable anonymously (verified only).
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
      select st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography as g
    )
    select b.id, b.name, b.seat_type, b.material, b.sun_exposure, b.noise,
      b.sightline, b.amenities, b.capacity, b.verified,
      st_distance(o.g, b.location)::real as distance_m,
      -- st_azimuth returns radians clockwise from north; normalise to [0,360)
      (mod(degrees(st_azimuth(o.g::geometry, b.location::geometry))::numeric, 360))::real as bearing_deg,
      st_x(b.location::geometry) as lng,
      st_y(b.location::geometry) as lat
    from benches b cross join origin o
    where (b.verified or b.added_by = bh_uid())
      and st_dwithin(o.g, b.location, radius_km * 1000)
    order by st_distance(o.g, b.location)
    limit lim
  $$;

-- ---------------------------------------------------------------------------
-- badge evaluation — insert any newly-earned badges, return their keys. Mirrors
-- the BADGES list and its criteria in packages/shared/src/taxonomies.ts.
-- ---------------------------------------------------------------------------
create or replace function bh_check_badges(me text) returns text[]
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare
  added   int;
  hoarded int;
  pts     int;
  newly   text[];
begin
  select count(*) into added from benches where added_by = me;
  select count(*) into hoarded from hoards where user_id = me;
  select coalesce(sum(points), 0) into pts from discoveries where user_id = me;

  with candidates as (
    select 'first_claim'::text as badge where hoarded >= 1
    union all select 'pathfinder'     where added   >= 1
    union all select 'cartographer'   where added   >= 10
    union all select 'hoarder'        where hoarded >= 25
    union all select 'centurion'      where pts     >= 100
    union all select 'shade_seeker'   where exists (
      select 1 from hoards h join benches b on b.id = h.bench_id
      where h.user_id = me and b.sun_exposure = 'full_shade')
    union all select 'night_owl'      where exists (
      select 1 from hoards h join benches b on b.id = h.bench_id
      where h.user_id = me and 'lit_at_night' = any(b.amenities))
    union all select 'people_watcher' where exists (
      select 1 from hoards h join benches b on b.id = h.bench_id
      where h.user_id = me and b.sightline = 'people_watching')
  ),
  ins as (
    insert into badges_earned (user_id, badge)
    select me, badge from candidates
    on conflict (user_id, badge) do nothing
    returning badge
  )
  select coalesce(array_agg(badge), '{}') into newly from ins;
  return newly;
end;
$$;

-- ---------------------------------------------------------------------------
-- add a bench — validates, inserts, awards points, evaluates badges (atomic)
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
-- toggle hoard — claim or release a bench. Points only on the first claim.
-- ---------------------------------------------------------------------------
create or replace function bh_toggle_hoard(in_bench uuid, in_label text default null)
  returns jsonb
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare
  me      text := bh_uid();
  hoarded boolean;
  pts     int := 0;       -- DISCOVERY_POINTS.hoardBench on first claim
  newly   text[] := '{}';
begin
  if me is null then raise exception 'unauthenticated'; end if;

  if exists (select 1 from hoards where user_id = me and bench_id = in_bench) then
    delete from hoards where user_id = me and bench_id = in_bench;
    hoarded := false;
  else
    if not exists (select 1 from benches where id = in_bench) then
      raise exception 'bench not found';
    end if;
    insert into hoards (user_id, bench_id, label) values (me, in_bench, in_label);
    hoarded := true;
    if not exists (select 1 from discoveries
                   where user_id = me and bench_id = in_bench and kind = 'hoarded') then
      pts := 2;
      insert into discoveries (user_id, bench_id, kind, points)
      values (me, in_bench, 'hoarded', pts);
    end if;
    newly := bh_check_badges(me);
  end if;

  return jsonb_build_object('hoarded', hoarded, 'pointsAwarded', pts, 'badges', to_jsonb(newly));
end;
$$;

-- ---------------------------------------------------------------------------
-- review a bench — upsert a 1–5 comfort rating; points on the first review.
-- ---------------------------------------------------------------------------
create or replace function bh_review_bench(in_bench uuid, in_comfort int, in_note text default null)
  returns jsonb
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare
  me    text := bh_uid();
  pts   int := 0;        -- DISCOVERY_POINTS.reviewBench, first review only
  newly text[] := '{}';
begin
  if me is null then raise exception 'unauthenticated'; end if;
  if in_comfort < 1 or in_comfort > 5 then raise exception 'comfort must be 1-5'; end if;
  if not exists (select 1 from benches where id = in_bench) then
    raise exception 'bench not found';
  end if;

  insert into bench_reviews (bench_id, reviewer_id, comfort, note)
  values (in_bench, me, in_comfort, in_note)
  on conflict (bench_id, reviewer_id)
    do update set comfort = excluded.comfort, note = excluded.note;

  if not exists (select 1 from discoveries
                 where user_id = me and bench_id = in_bench and kind = 'reviewed') then
    pts := 10;
    insert into discoveries (user_id, bench_id, kind, points)
    values (me, in_bench, 'reviewed', pts);
    newly := bh_check_badges(me);
  end if;

  return jsonb_build_object('pointsAwarded', pts, 'badges', to_jsonb(newly));
end;
$$;

-- ---------------------------------------------------------------------------
-- record a visit — first arrival at a bench earns a small discovery bonus.
-- ---------------------------------------------------------------------------
create or replace function bh_record_visit(in_bench uuid) returns jsonb
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare
  me    text := bh_uid();
  pts   int := 0;        -- DISCOVERY_POINTS.firstVisit
  newly text[] := '{}';
begin
  if me is null then raise exception 'unauthenticated'; end if;
  if not exists (select 1 from benches where id = in_bench) then
    raise exception 'bench not found';
  end if;
  if not exists (select 1 from discoveries
                 where user_id = me and bench_id = in_bench and kind = 'first_visit') then
    pts := 5;
    insert into discoveries (user_id, bench_id, kind, points)
    values (me, in_bench, 'first_visit', pts);
    newly := bh_check_badges(me);
  end if;
  return jsonb_build_object('pointsAwarded', pts, 'badges', to_jsonb(newly));
end;
$$;

-- ---------------------------------------------------------------------------
-- streak — consecutive UTC days with at least one discovery, anchored at today
-- (or yesterday, so a streak isn't lost until a full day lapses).
-- ---------------------------------------------------------------------------
create or replace function bh_streak(me text) returns int
  language plpgsql stable security definer
  set search_path = public, extensions
  as $$
declare
  streak int := 0;
  cur    date := (now() at time zone 'utc')::date;
begin
  if not exists (select 1 from discoveries
                 where user_id = me and (created_at at time zone 'utc')::date = cur) then
    cur := cur - 1;   -- nothing today yet; the streak may still stand from yesterday
  end if;
  loop
    exit when not exists (
      select 1 from discoveries
      where user_id = me and (created_at at time zone 'utc')::date = cur
    );
    streak := streak + 1;
    cur := cur - 1;
  end loop;
  return streak;
end;
$$;

-- ---------------------------------------------------------------------------
-- my stats — the You tab's discovery summary
-- ---------------------------------------------------------------------------
create or replace function bh_my_stats() returns jsonb
  language sql stable security definer
  set search_path = public, extensions
  as $$
    select jsonb_build_object(
      'points', coalesce((select sum(points) from discoveries where user_id = bh_uid()), 0),
      'benchesAdded', (select count(*) from benches where added_by = bh_uid()),
      'benchesHoarded', (select count(*) from hoards where user_id = bh_uid()),
      'streak', bh_streak(bh_uid()),
      'badges', coalesce(
        (select jsonb_agg(badge order by earned_at) from badges_earned where user_id = bh_uid()),
        '[]'::jsonb)
    )
  $$;

-- ---------------------------------------------------------------------------
-- leaderboard — top hoarders by discovery points (public; names only)
-- ---------------------------------------------------------------------------
create or replace function bh_leaderboard(lim int default 20) returns jsonb
  language sql stable security definer
  set search_path = public, extensions
  as $$
    select coalesce(jsonb_agg(to_jsonb(t) order by t.points desc), '[]'::jsonb)
    from (
      select d.user_id,
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
-- grants — anonymous users may browse the map + leaderboard; everything that
-- writes or reads private state requires an authenticated session.
-- ---------------------------------------------------------------------------
revoke execute on function bh_ensure_profile(text) from anon;
revoke execute on function bh_check_badges(text) from anon, authenticated;  -- internal helper
revoke execute on function bh_add_bench(float8, float8, text, text, text, text, text, text, text[], int, text) from anon;
revoke execute on function bh_toggle_hoard(uuid, text) from anon;
revoke execute on function bh_review_bench(uuid, int, text) from anon;
revoke execute on function bh_record_visit(uuid) from anon;
revoke execute on function bh_streak(text) from anon, authenticated;        -- internal helper
revoke execute on function bh_my_stats() from anon;
