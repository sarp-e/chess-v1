-- Token economy: win games to earn tokens, spend them unlocking cosmetics
-- (piece sets, board themes). Balances and unlocks live server-side so they
-- can't just be edited in localStorage/devtools.

create table public.wallets (
  id uuid primary key references auth.users(id) on delete cascade,
  tokens integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger wallets_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

alter table public.wallets enable row level security;

-- Balances are only ever written by the SECURITY DEFINER functions below —
-- no insert/update policy for the authenticated role, so a client can't just
-- award itself tokens via a normal .update() call.
create policy "read own wallet" on public.wallets
  for select using (auth.uid() = id);

create table public.unlocked_cosmetics (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.unlocked_cosmetics enable row level security;

create policy "read own unlocks" on public.unlocked_cosmetics
  for select using (auth.uid() = user_id);

-- Prevents a finished online game from being claimed for tokens more than once.
alter table public.games add column tokens_awarded boolean not null default false;

-- Bot-game wins: there's no server record of a client-side Stockfish game, so
-- the win itself is trusted (same trust level the app already gives client
-- move history for bot games). What the client can't do is dictate the
-- amount — that's computed here from the bot's ELO.
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

  -- Reward scales super-linearly with bot strength: ~5 tokens for the weakest
  -- bots (200), ~80 for a 2600-rated win, so beating a stronger bot is worth
  -- disproportionately more. p_bot_elo is clamped to the real bot range so a
  -- tampered client can't inflate the payout by passing a huge number.
  v_amount := round(5 + power((least(greatest(p_bot_elo, 200), 2600) - 200) / 2400.0, 2) * 75)::int;

  insert into public.wallets (id, tokens) values (auth.uid(), v_amount)
    on conflict (id) do update set tokens = wallets.tokens + v_amount, updated_at = now();

  return v_amount;
end;
$$;

-- Online-game wins: the games row is the authoritative record the rest of
-- the app already uses (result, participants). This just checks the caller
-- is the declared winner and claims the game's tokens exactly once.
create or replace function public.award_online_win(p_game_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount constant int := 15;
  v_game public.games;
  v_claimed int;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select * into v_game from public.games where id = p_game_id;
  if not found or v_game.status <> 'finished' then
    return 0;
  end if;

  if not (
    (v_game.result = 'white' and v_game.white_id = auth.uid()) or
    (v_game.result = 'black' and v_game.black_id = auth.uid())
  ) then
    return 0;
  end if;

  update public.games set tokens_awarded = true
    where id = p_game_id and tokens_awarded = false;
  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    return 0; -- already claimed
  end if;

  insert into public.wallets (id, tokens) values (auth.uid(), v_amount)
    on conflict (id) do update set tokens = wallets.tokens + v_amount, updated_at = now();

  return v_amount;
end;
$$;

-- Cosmetic shop. Prices are hardcoded here (not passed by the client) so a
-- client can't unlock a 40-token item for 0. Keep this catalog in sync with
-- SHOP_ITEMS in src/data/shop.ts.
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
