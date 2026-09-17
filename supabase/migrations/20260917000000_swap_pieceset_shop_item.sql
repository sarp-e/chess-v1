-- Cburnett (the classic set) is now the free default pieceSet instead of a
-- paid unlock — react-chessboard's own built-in default piece render IS
-- Cburnett, so gating it behind tokens meant every visitor already saw the
-- "paid" look for free while the setting itself was ignored (see
-- ChessBoard.tsx). The old free "standard" flat/geometric set is now the
-- paid shop item instead, renamed pieceSet:modern. Keep in sync with
-- SHOP_ITEMS in src/data/shop.ts.
--
-- Note: any user who previously spent tokens unlocking pieceSet:cburnett
-- keeps that unlocked_cosmetics row (harmless — the client no longer looks
-- it up), but effectively paid for what's now free. Consider a manual token
-- refund for affected accounts if any exist.

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
