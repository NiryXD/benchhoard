-- Dev-only helper for seeding: scatter seed profiles (user_id like 'seed_%')
-- within ~12km of the most recently active real user's location, so the
-- discovery deck has candidates during testing. Service-role only.

create or replace function bh_dev_scatter_seeds() returns int
  language plpgsql security definer
  set search_path = public, extensions
  as $$
declare
  center geography;
  moved int;
begin
  select p.location into center
    from profiles p
    where p.user_id not like 'seed_%' and p.location is not null
    order by p.last_active_at desc
    limit 1;
  if center is null then
    return 0; -- no located real user yet; seeds stay where they are
  end if;

  update profiles set location = st_project(
      center,
      random() * 12000,          -- up to 12km out
      radians(random() * 360)    -- any bearing
    )::geography
    where user_id like 'seed_%';
  get diagnostics moved = row_count;
  return moved;
end;
$$;

revoke execute on function bh_dev_scatter_seeds() from public, anon, authenticated;
grant execute on function bh_dev_scatter_seeds() to service_role;
