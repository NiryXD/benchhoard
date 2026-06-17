-- ─── [Opus 4.8] Benchhoard core schema ──────────────────────────────────────
-- Pivot from the dating domain to public-bench discovery. Reuses the existing
-- identity (profiles.user_id = Clerk JWT sub via ltb_uid()) and the PostGIS
-- geography(point,4326) + GIST pattern the deck already relies on.
--
-- Anonymous browsing is a product requirement: the `anon` role can read
-- verified benches and their photos. Writing (adding, hoarding, reviewing)
-- requires an authenticated Clerk session and goes through the bh_* RPCs.

-- profiles loses its dating-era NOT NULLs — a hoarder is just an identity with
-- an optional display name, created lazily on first sign-in (bh_ensure_profile).
alter table profiles alter column birthdate drop not null;
alter table profiles alter column gender drop not null;
alter table profiles add column if not exists display_name text;

-- ---------------------------------------------------------------------------
-- benches — the urban archive. osm_id is set for OpenStreetMap-imported rows
-- (and null for hoarder-added ones); verified gates anonymous visibility.
-- ---------------------------------------------------------------------------
create table benches (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  location     geography(point, 4326) not null,
  seat_type    text not null,                       -- SEAT_TYPES (Hostility Index)
  material     text,
  sun_exposure text,
  noise        text,
  sightline    text,
  amenities    text[] not null default '{}',        -- AMENITIES
  capacity     int check (capacity is null or capacity between 1 and 20),
  notes        text check (char_length(notes) <= 280),
  osm_id       bigint unique,                        -- null = added by a hoarder
  added_by     text references profiles on delete set null,
  verified     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index benches_location_idx on benches using gist (location);
create index benches_added_by_idx on benches (added_by);

create table bench_photos (
  id           bigint generated always as identity primary key,
  bench_id     uuid not null references benches on delete cascade,
  storage_path text not null,
  added_by     text references profiles on delete set null,
  created_at   timestamptz not null default now()
);
create index bench_photos_bench_idx on bench_photos (bench_id);

create table bench_reviews (
  id          bigint generated always as identity primary key,
  bench_id    uuid not null references benches on delete cascade,
  reviewer_id text not null references profiles on delete cascade,
  comfort     int not null check (comfort between 1 and 5),
  note        text check (char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  unique (bench_id, reviewer_id)
);
create index bench_reviews_bench_idx on bench_reviews (bench_id);

-- hoards — the user's private archive of claimed benches, with an optional tag.
create table hoards (
  user_id    text not null references profiles on delete cascade,
  bench_id   uuid not null references benches on delete cascade,
  label      text check (char_length(label) <= 60),
  created_at timestamptz not null default now(),
  primary key (user_id, bench_id)
);
create index hoards_user_idx on hoards (user_id);

-- discoveries — the gamification points ledger. One row per awarded action.
create table discoveries (
  id         bigint generated always as identity primary key,
  user_id    text not null references profiles on delete cascade,
  bench_id   uuid references benches on delete set null,
  kind       text not null check (kind in ('added', 'reviewed', 'first_visit', 'hoarded')),
  points     int not null default 0,
  created_at timestamptz not null default now()
);
create index discoveries_user_idx on discoveries (user_id, created_at desc);

create table badges_earned (
  user_id   text not null references profiles on delete cascade,
  badge     text not null,                          -- BADGES[].key
  earned_at timestamptz not null default now(),
  primary key (user_id, badge)
);

-- ---------------------------------------------------------------------------
-- RLS — deny by default. Public reads for verified benches (anon + auth);
-- everything that writes is owner-scoped and brokered by the bh_* RPCs.
-- ---------------------------------------------------------------------------
alter table benches enable row level security;
alter table bench_photos enable row level security;
alter table bench_reviews enable row level security;
alter table hoards enable row level security;
alter table discoveries enable row level security;
alter table badges_earned enable row level security;

-- benches: anyone (even signed-out) sees verified benches; you also see your own
-- unverified additions. Direct writes are owner-only (the RPC awards points).
create policy benches_read on benches for select to anon, authenticated
  using (verified or added_by = ltb_uid());
create policy benches_insert on benches for insert to authenticated
  with check (added_by = ltb_uid());
create policy benches_update on benches for update to authenticated
  using (added_by = ltb_uid()) with check (added_by = ltb_uid());
create policy benches_delete on benches for delete to authenticated
  using (added_by = ltb_uid());

-- photos + reviews are public to read (they describe a public object).
create policy bench_photos_read on bench_photos for select to anon, authenticated using (true);
create policy bench_photos_write on bench_photos for all to authenticated
  using (added_by = ltb_uid()) with check (added_by = ltb_uid());

create policy bench_reviews_read on bench_reviews for select to anon, authenticated using (true);
create policy bench_reviews_write on bench_reviews for all to authenticated
  using (reviewer_id = ltb_uid()) with check (reviewer_id = ltb_uid());

-- hoards, discoveries, and badges are private to the user.
create policy hoards_owner on hoards for all to authenticated
  using (user_id = ltb_uid()) with check (user_id = ltb_uid());
create policy discoveries_read on discoveries for select to authenticated
  using (user_id = ltb_uid());
create policy badges_read on badges_earned for select to authenticated
  using (user_id = ltb_uid());

-- ---------------------------------------------------------------------------
-- storage — a public bucket for bench photos, owner-scoped by the first path
-- segment (mirrors the existing `photos` bucket convention).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('bench-photos', 'bench-photos', true);

create policy bench_photos_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'bench-photos' and (storage.foldername(name))[1] = ltb_uid());
create policy bench_photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'bench-photos' and (storage.foldername(name))[1] = ltb_uid());
