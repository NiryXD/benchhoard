-- Entitlement write helpers for the revenuecat-webhook Edge Function
-- (docs/plan/08-backend-contracts.md §7). Called with the service role only —
-- no grants to authenticated/anon; RLS on entitlements stays read-own-row.

-- Set/clear the Executive Suite flag. Upserts so the first purchase works
-- before any other entitlements write. A missing profile (user deleted
-- between purchase and webhook) is a no-op, not an error — RevenueCat
-- retries on 5xx and we don't want a poison event.
create or replace function bh_apply_executive(p_user text, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into entitlements (user_id, is_executive, updated_at)
  values (p_user, p_active, now())
  on conflict (user_id) do update
    set is_executive = excluded.is_executive,
        updated_at   = now();
exception
  when foreign_key_violation then
    raise notice 'bh_apply_executive: no profile for %, skipping', p_user;
end;
$$;

-- Atomically grant consumable credits (Headhunt / Expedited Review boosts).
create or replace function bh_grant_credits(p_user text, p_headhunt int, p_boost int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into entitlements (user_id, headhunt_credits, boost_credits, updated_at)
  values (p_user, greatest(p_headhunt, 0), greatest(p_boost, 0), now())
  on conflict (user_id) do update
    set headhunt_credits = entitlements.headhunt_credits + greatest(p_headhunt, 0),
        boost_credits    = entitlements.boost_credits + greatest(p_boost, 0),
        updated_at       = now();
exception
  when foreign_key_violation then
    raise notice 'bh_grant_credits: no profile for %, skipping', p_user;
end;
$$;

revoke execute on function bh_apply_executive(text, boolean) from public, anon, authenticated;
revoke execute on function bh_grant_credits(text, int, int) from public, anon, authenticated;
