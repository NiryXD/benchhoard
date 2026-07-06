-- ─── [Fable 5] Rate-limit the public join-waitlist endpoint ─────────────────
-- join-waitlist is unauthenticated, so a bot could flood the list with random
-- emails or probe referral-queue positions. Add a fixed-window per-IP limiter,
-- brokered by a SECURITY DEFINER RPC the edge function calls with the service
-- role. IPs are stored only as a SHA-256 hash (computed in the edge function),
-- never in the clear.

create table waitlist_rate (
  key          text primary key,        -- sha-256 hex of the client IP
  window_start timestamptz not null default now(),
  count        int not null default 0
);

-- service-role only: RLS on with no policies locks out anon/authenticated.
alter table waitlist_rate enable row level security;

-- Atomically bump the caller's fixed window and report whether they're still
-- under the limit. A window older than p_window_secs resets to 1.
create or replace function bh_waitlist_rate_ok(
  p_key text,
  p_limit int,
  p_window_secs int
) returns boolean
  language plpgsql
  security definer
  set search_path = public
  as $$
declare
  c int;
begin
  insert into waitlist_rate (key, window_start, count)
    values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when waitlist_rate.window_start < now() - make_interval(secs => p_window_secs) then 1
          else waitlist_rate.count + 1 end,
        window_start = case
          when waitlist_rate.window_start < now() - make_interval(secs => p_window_secs) then now()
          else waitlist_rate.window_start end
  returning count into c;
  return c <= p_limit;
end;
$$;

revoke execute on function bh_waitlist_rate_ok(text, int, int) from public, anon, authenticated;
