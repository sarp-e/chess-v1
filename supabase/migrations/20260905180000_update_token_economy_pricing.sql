-- Re-defines two token-economy functions whose bodies changed after
-- 20260821120000 was already applied to production:
--   * award_bot_win  — reward now scales super-linearly with bot ELO
--   * unlock_cosmetic — adds the background:* catalogue at 30 tokens each
-- Both are create-or-replace and carry no data change, so this is safe to
-- re-run. Keep in sync with SHOP_ITEMS in src/data/shop.ts.

create or replace function public.award_bot_win(p_bot_elo int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount int;
begin
  if auth.uid() is null then
    return 0;
  end if;

  -- ~5 tokens for the weakest bots (200), ~80 for a 2600-rated win. p_bot_elo
  -- is clamped to the real bot range so a tampered client can't inflate it.
  v_amount := round(5 + power((least(greatest(p_bot_elo, 200), 2600) - 200) / 2400.0, 2) * 75)::int;

  insert into public.wallets (id, tokens) values (auth.uid(), v_amount)
    on conflict (id) do update set tokens = wallets.tokens + v_amount, updated_at = now();

  return v_amount;
end;
$$;

create or replace function public.unlock_cosmetic(p_item_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price int;
  v_tokens int;
begin
  if auth.uid() is null then
    return false;
  end if;

  v_price := case p_item_id
    when 'pieceSet:cburnett' then 40
    when 'colorTheme:slate-mono' then 30
    when 'colorTheme:championship-green' then 30
    when 'colorTheme:forest' then 30
    when 'colorTheme:ocean' then 30
    when 'background:flat' then 30
    when 'background:ambient-glow' then 30
    when 'background:vignette' then 30
    when 'background:checkered' then 30
    when 'background:contour' then 30
    when 'background:photo-aurora' then 30
    when 'background:photo-dusk' then 30
    when 'background:photo-lagoon' then 30
    else null
  end;
  if v_price is null then
    raise exception 'Unknown shop item: %', p_item_id;
  end if;

  if exists (
    select 1 from public.unlocked_cosmetics
    where user_id = auth.uid() and item_id = p_item_id
  ) then
    return true;
  end if;

  select tokens into v_tokens from public.wallets where id = auth.uid();
  if v_tokens is null or v_tokens < v_price then
    return false;
  end if;

  update public.wallets set tokens = tokens - v_price, updated_at = now() where id = auth.uid();
  insert into public.unlocked_cosmetics (user_id, item_id) values (auth.uid(), p_item_id);

  return true;
end;
$$;
