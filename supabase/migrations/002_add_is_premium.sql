-- Premium entitlement groundwork (no paywall yet).
-- Adds a single source-of-truth flag for paid entitlement. Defaults to TRUE so
-- every existing and new user stays fully unlocked — the app remains 100% free.
-- When monetization launches, this default flips to FALSE and a payment flow
-- grants TRUE; no structural change required then.
alter table public.users
  add column if not exists is_premium boolean not null default true;
