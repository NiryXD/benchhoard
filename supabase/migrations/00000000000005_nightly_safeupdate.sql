-- ltb_nightly's full-table UPDATE breaks under pg_safeupdate when invoked
-- through the API (PostgREST sessions require a WHERE clause). Add `where
-- true` so it works from both pg_cron and service-role RPC calls.

create or replace function ltb_nightly() returns void
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
    + 0.15 * (exists (select 1 from experience ex where ex.user_id = p.user_id))::int
  where true;

  delete from rejects where created_at < now() - interval '30 days';
end;
$$;
