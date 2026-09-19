-- Custom background image uploads were briefly gated behind a one-time
-- 40-token unlock (see 20260919120000_gate_custom_background_upload.sql).
-- Per explicit product decision, this is now changed to per-upload
-- charging instead: every uploaded image costs tokens, there's no
-- permanent unlock. unlock_cosmetic() no longer handles 'background:custom'
-- (reverted to the price list from 20260917000000_swap_pieceset_shop_item.sql)
-- and a dedicated charge_custom_background_upload() function is added for
-- the per-upload charge. Keep in sync with SHOP_ITEMS in src/data/shop.ts.

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
    when 'pieceSet:modern' then 40
    when 'colorTheme:slate-mono' then 30
    when 'colorTheme:championship-green' then 30
    when 'colorTheme:forest' then 30
    when 'colorTheme:ocean' then 30
    when 'background:flat' then 40
    when 'background:ambient-glow' then 40
    when 'background:vignette' then 40
    when 'background:checkered' then 40
    when 'background:contour' then 40
    when 'background:photo-aurora' then 40
    when 'background:photo-dusk' then 40
    when 'background:photo-lagoon' then 40
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

create or replace function public.charge_custom_background_upload()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price constant int := 40;
  v_tokens int;
begin
  if auth.uid() is null then
    return false;
  end if;

  select tokens into v_tokens from public.wallets where id = auth.uid();
  if v_tokens is null or v_tokens < v_price then
    return false;
  end if;

  update public.wallets set tokens = tokens - v_price, updated_at = now() where id = auth.uid();

  return true;
end;
$$;
