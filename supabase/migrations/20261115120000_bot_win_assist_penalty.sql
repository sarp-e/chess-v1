-- Bot-win rewards now burn 1 token per takeback or hint the player used.
-- Floor is 0 (never negative, never charges the wallet). The signature
-- changes, so the old 1-arg overload is dropped first; leaving both would make
-- PostgREST's rpc('award_bot_win', ...) resolution ambiguous.
-- Keep the base formula in sync with botWinReward in src/lib/tokenEconomy.ts.
-- Grants: earlier migrations never GRANT/REVOKE, so the default (PUBLIC
-- execute) applies to the new function exactly as it did to the old one.

drop function if exists public.award_bot_win(int);

create or replace function public.award_bot_win(p_bot_elo int, p_assists int default 0)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base int;
  v_amount int;
begin
  if auth.uid() is null then
    return 0;
  end if;

  -- ~5 tokens for the weakest bots (200), ~80 for a 2600-rated win. p_bot_elo
  -- is clamped to the real bot range so a tampered client can't inflate it.
  v_base := round(5 + power((least(greatest(p_bot_elo, 200), 2600) - 200) / 2400.0, 2) * 75)::int;

  -- Each assist (takeback or hint) costs 1 token from this win's reward.
  v_amount := greatest(v_base - greatest(coalesce(p_assists, 0), 0), 0);

  if v_amount > 0 then
    insert into public.wallets (id, tokens) values (auth.uid(), v_amount)
      on conflict (id) do update set tokens = wallets.tokens + v_amount, updated_at = now();
  end if;

  return v_amount;
end;
$$;
