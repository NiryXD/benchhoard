-- ─── [Fable 5] Enforce the hoard cap in bh_toggle_hoard ─────────────────────
-- LIMITS.hoardMax (200) in packages/shared exists but nothing enforced it, so a
-- hoard could grow without bound. Add the guard on the claim branch; releasing a
-- bench is always allowed. Body is otherwise identical to 20260617130000.

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
    -- LIMITS.hoardMax = 200
    if (select count(*) from hoards where user_id = me) >= 200 then
      raise exception 'HOARD_LIMIT';
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
