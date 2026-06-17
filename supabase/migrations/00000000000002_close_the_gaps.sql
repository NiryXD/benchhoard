-- Close the gaps found in the full-plan audit (docs/plan/08, 09):
-- name field, lifestyle vectors, 18+ constraint, impressions, daily picks,
-- realtime publication, block-aware profile reads, nightly maintenance in SQL.

-- ---------------------------------------------------------------------------
-- profiles: name + the lifestyle fields promised in docs/plan/03
-- ---------------------------------------------------------------------------
alter table profiles
  add column first_name text not null,
  add column has_kids   text check (has_kids in ('no_kids','has_kids')),
  add column smoking    text check (smoking  in ('yes','sometimes','no')),
  add column drinking   text check (drinking in ('yes','sometimes','no')),
  add column cannabis   text check (cannabis in ('yes','sometimes','no')),
  add column politics   text check (politics in ('liberal','moderate','conservative','apolitical','other')),
  add constraint profiles_18_plus check (birthdate <= current_date - interval '18 years');

-- ---------------------------------------------------------------------------
-- preferences: matching vectors (value + dealbreaker flag, same pattern)
-- ---------------------------------------------------------------------------
alter table preferences
  add column has_kids     text[],
  add column has_kids_db  boolean not null default false,
  add column smoking      text[],
  add column smoking_db   boolean not null default false,
  add column drinking     text[],
  add column drinking_db  boolean not null default false,
  add column cannabis     text[],
  add column cannabis_db  boolean not null default false,
  add column politics     text[],
  add column politics_db  boolean not null default false;

-- ---------------------------------------------------------------------------
-- impressions: per-pair recency + counts, written by the get-deck Edge
-- Function (service role). Powers recently-seen deck exclusion, the
-- desirability denominator, and Quarterly Performance Review.
-- ---------------------------------------------------------------------------
create table impressions (
  viewer       text not null references profiles on delete cascade,
  viewed       text not null references profiles on delete cascade,
  count        int not null default 1,
  last_seen_at timestamptz not null default now(),
  primary key (viewer, viewed)
);
create index impressions_viewed_idx on impressions (viewed, last_seen_at desc);

alter table impressions enable row level security;
create policy impressions_read on impressions for select to authenticated
  using (viewer = bh_uid() or viewed = bh_uid());

-- ---------------------------------------------------------------------------
-- daily picks: the day's Recruiter's Pick, stored so it can be pinned and
-- excluded from the regular deck. Written by get-deck (service role).
-- ---------------------------------------------------------------------------
create table daily_picks (
  user_id      text not null references profiles on delete cascade,
  day          date not null default current_date,
  pick_user_id text not null references profiles on delete cascade,
  primary key (user_id, day)
);

alter table daily_picks enable row level security;
create policy daily_picks_read on daily_picks for select to authenticated
  using (user_id = bh_uid());

-- ---------------------------------------------------------------------------
-- realtime: chat needs messages in the publication or Phase 3 hears nothing
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table messages;

-- ---------------------------------------------------------------------------
-- blocks are mutual invisibility: tighten profile reads
-- ---------------------------------------------------------------------------
drop policy profiles_read on profiles;
create policy profiles_read on profiles for select to authenticated
  using (
    (is_paused = false or user_id = bh_uid())
    and not exists (
      select 1 from blocks b
      where (b.blocker = profiles.user_id and b.blocked = bh_uid())
         or (b.blocker = bh_uid() and b.blocked = profiles.user_id)
    )
  );

-- ---------------------------------------------------------------------------
-- nightly maintenance, pure SQL (no Edge Function / pg_net needed):
--   - desirability: Bayesian-smoothed inbound screens-per-impression over a
--     trailing 30-day window (window is approximate for impressions, which
--     keep one row per pair). Prior a=3, b=15 (d0 ≈ 0.17).
--   - completeness: photos/answers/education/experience filled.
--   - purge rejects past the 30-day recycle window (LIMITS.rejectRecycleDays).
-- ---------------------------------------------------------------------------
create or replace function bh_nightly() returns void
  language plpgsql security definer
  as $$
begin
  update profiles p set
    desirability = (
      (select count(*) from screens s
        where s.to_user = p.user_id
          and s.created_at > now() - interval '30 days') + 3
    )::real / (
      (select coalesce(sum(i.count), 0) from impressions i
        where i.viewed = p.user_id
          and i.last_seen_at > now() - interval '30 days') + 3 + 15
    )::real,
    completeness =
      0.40 * least((select count(*) from photos ph where ph.user_id = p.user_id), 4) / 4.0
    + 0.30 * least((select count(*) from behavioral_answers ba where ba.user_id = p.user_id), 3) / 3.0
    + 0.15 * (exists (select 1 from education ed where ed.user_id = p.user_id))::int
    + 0.15 * (exists (select 1 from experience ex where ex.user_id = p.user_id))::int;

  delete from rejects where created_at < now() - interval '30 days';
end;
$$;

select cron.schedule('ltb-nightly', '0 9 * * *', 'select bh_nightly()');
