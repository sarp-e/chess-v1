-- Token-economy hardening. Closes three known exploits and lands the
-- award_bot_win(p_bot_elo, p_assists) signature from PR #16.
--
--   1. award_bot_win could be called in a loop (no game record, no limit).
--      -> Each award now consumes one server-created bot session
--         (start_bot_game), plus a rolling 24h cap.
--   2. RLS on games let a player UPDATE status/result/tokens_awarded and
--      INSERT already-finished games, so award_online_win could be farmed.
--      -> No direct UPDATE on games at all. Join / move / resign / draw go
--         through SECURITY DEFINER RPCs; INSERT only accepts fresh games.
--   3. unlock_cosmetic (and charge_custom_background_upload) read the balance
--      without a lock, so concurrent calls could double-spend / go negative.
--      -> Balance row is locked FOR UPDATE, plus CHECK (tokens >= 0).
--
-- Concurrency model: every function that reads or changes a user's balance,
-- caps or bot session first locks that user's wallets row. That serializes
-- all token operations per user, so the cap and "consume once" checks can't
-- race each other.
--
-- Supersedes 20261115120000_bot_win_assist_penalty.sql (PR #16). Safe to apply
-- whether or not that file was applied first.

------------------------------------------------------------------------------
-- 0. Balance can never go negative
------------------------------------------------------------------------------
-- NOT VALID enforces the rule on every future write without scanning old
-- rows; we then try to validate. If a negative balance already exists (only
-- possible via exploit 3) the migration still succeeds, the rule still applies
-- to all new writes, and a warning tells you to fix those rows and re-run
--   alter table public.wallets validate constraint wallets_tokens_nonnegative;
alter table public.wallets
  add constraint wallets_tokens_nonnegative check (tokens >= 0) not valid;

do $$
begin
  alter table public.wallets validate constraint wallets_tokens_nonnegative;
exception when check_violation then
  raise warning 'wallets has rows with tokens < 0; constraint left NOT VALID (still enforced for new writes)';
end;
$$;

------------------------------------------------------------------------------
-- 1. Bot wins: server-side bot sessions
------------------------------------------------------------------------------
create table public.bot_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bot_elo int not null,
  created_at timestamptz not null default now(),
  finished_at timestamptz,               -- null = open (claimable once)
  tokens_awarded int not null default 0
);

-- At most one open session per user: starting a new game closes the old one,
-- so sessions can't be stockpiled and claimed later.
create unique index bot_games_one_open_per_user
  on public.bot_games (user_id) where finished_at is null;
create index bot_games_user_finished on public.bot_games (user_id, finished_at);

-- RLS on, no policies: only the SECURITY DEFINER functions below touch it.
alter table public.bot_games enable row level security;

create or replace function public.start_bot_game(p_bot_elo int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  -- Must match BOTS in src/data/bots.ts.
  if p_bot_elo is null or p_bot_elo not in (200, 400, 800, 1200, 1500, 1800, 2000, 2300, 2600) then
    raise exception 'Unknown bot elo: %', p_bot_elo using errcode = '22023';
  end if;

  insert into public.wallets (id) values (v_uid) on conflict (id) do nothing;
  perform 1 from public.wallets where id = v_uid for update;

  update public.bot_games set finished_at = now()
    where user_id = v_uid and finished_at is null;
  insert into public.bot_games (user_id, bot_elo) values (v_uid, p_bot_elo)
    returning id into v_id;

  return v_id;
end;
$$;

-- Old 1-arg version and PR #16's 2-arg version are both replaced. Dropping
-- (not create-or-replace) avoids an ambiguous PostgREST overload and resets
-- grants so the revoke/grant below is the whole story.
drop function if exists public.award_bot_win(int);
drop function if exists public.award_bot_win(int, int);

-- The win itself is still client-reported (no server-side move validation).
-- What the server now guarantees: one award per started game, the elo is the
-- one recorded at start, and at most v_daily_cap tokens per rolling 24h.
create function public.award_bot_win(p_bot_elo int, p_assists int default 0)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_daily_cap constant int := 500;
  v_game public.bot_games;
  v_base int;
  v_amount int;
  v_today int;
begin
  if v_uid is null then
    return 0;
  end if;

  insert into public.wallets (id) values (v_uid) on conflict (id) do nothing;
  perform 1 from public.wallets where id = v_uid for update;

  select * into v_game from public.bot_games
    where user_id = v_uid and finished_at is null;
  if not found or v_game.bot_elo is distinct from p_bot_elo then
    return 0;
  end if;

  -- Base: 200->5, 400->6, 800->10, 1200->18, 1500->27, 1800->38, 2000->47,
  -- 2300->62, 2600->80. Keep in sync with botWinReward (PR #16,
  -- src/lib/tokenEconomy.ts). Each assist (hint/takeback) burns 1, floor 0.
  v_base := round(5 + power((v_game.bot_elo - 200) / 2400.0, 2) * 75)::int;
  v_amount := greatest(v_base - greatest(coalesce(p_assists, 0), 0), 0);

  select coalesce(sum(tokens_awarded), 0) into v_today from public.bot_games
    where user_id = v_uid and finished_at > now() - interval '24 hours';
  v_amount := least(v_amount, greatest(v_daily_cap - v_today, 0));

  update public.bot_games set finished_at = now(), tokens_awarded = v_amount
    where id = v_game.id;
  if v_amount > 0 then
    update public.wallets set tokens = tokens + v_amount where id = v_uid;
  end if;

  return v_amount;
end;
$$;

------------------------------------------------------------------------------
-- 2. Online games: no direct writes to status/result/tokens_awarded
------------------------------------------------------------------------------
alter table public.games add column tokens_awarded_at timestamptz;
create index games_tokens_awarded_at on public.games (tokens_awarded_at)
  where tokens_awarded_at is not null;

-- UPDATE is now only possible through the RPCs below.
drop policy if exists "update game" on public.games;
drop policy if exists "join waiting game" on public.games;
revoke update on public.games from anon, authenticated;

-- INSERT: the creator is white, and the row must be a fresh game (create
-- game / matchmaking / rematch all insert exactly this shape).
drop policy if exists "create game" on public.games;
create policy "create game" on public.games
  for insert with check (
    auth.uid() = white_id
    and black_id is distinct from white_id
    and ((status = 'waiting' and black_id is null) or (status = 'active' and black_id is not null))
    and result is null
    and moves = '{}'
    and fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    and tokens_awarded = false
    and tokens_awarded_at is null
  );

-- Take the open black seat. Returns false if the seat is gone (race/full).
create or replace function public.join_game(p_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.games set black_id = v_uid, status = 'active'
    where id = p_game_id and status = 'waiting' and black_id is null and white_id <> v_uid;
  return found;
end;
$$;

-- Append one move. Turn order is enforced from the move count (white moves on
-- even plies), so each seat's moves can only come from that seat's account.
-- The move's legality and the FEN are still trusted from the client.
-- p_result: null (game continues), the mover's colour (checkmate), or 'draw'.
create or replace function public.make_move(p_game_id uuid, p_move text, p_fen text, p_result text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game public.games;
  v_ply int;
  v_mover text;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_game from public.games where id = p_game_id for update;
  if not found then
    raise exception 'Game not found' using errcode = 'P0002';
  end if;
  if v_game.status <> 'active' or v_game.black_id is null then
    raise exception 'Game is not active' using errcode = '22023';
  end if;

  v_ply := coalesce(array_length(v_game.moves, 1), 0);
  v_mover := case when v_ply % 2 = 0 then 'white' else 'black' end;
  if v_uid is distinct from (case when v_mover = 'white' then v_game.white_id else v_game.black_id end) then
    raise exception 'Not your turn' using errcode = '42501';
  end if;

  if p_move is null or p_move !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' then
    raise exception 'Invalid move: %', p_move using errcode = '22023';
  end if;
  -- After the move it must be the other side's turn in the FEN too, so the
  -- client's FEN-based turn and this move-count turn can't drift apart.
  if p_fen is null or length(p_fen) > 100
     or split_part(p_fen, ' ', 2) <> (case when v_mover = 'white' then 'b' else 'w' end) then
    raise exception 'Invalid FEN' using errcode = '22023';
  end if;
  if p_result is not null and p_result not in (v_mover, 'draw') then
    raise exception 'Invalid result: %', p_result using errcode = '22023';
  end if;
  -- Fastest possible mate is ply 4 (fool's mate).
  if p_result = v_mover and v_ply + 1 < 4 then
    raise exception 'Checkmate is not possible yet' using errcode = '22023';
  end if;

  update public.games set
    fen = p_fen,
    moves = moves || p_move,
    status = case when p_result is null then 'active' else 'finished' end,
    result = p_result
  where id = p_game_id;
end;
$$;

-- Resigning can only make the caller lose.
create or replace function public.resign_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.games set
    status = 'finished',
    result = case when white_id = v_uid then 'black' else 'white' end
  where id = p_game_id
    and status in ('waiting', 'active')
    and (white_id = v_uid or black_id = v_uid);
  if not found then
    raise exception 'Cannot resign this game' using errcode = '22023';
  end if;
end;
$$;

-- Draws pay nothing, so the only check is that the caller is a player in an
-- active game. (Draw offers stay a client broadcast, as before.)
create or replace function public.accept_draw(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.games set status = 'finished', result = 'draw'
  where id = p_game_id
    and status = 'active'
    and (white_id = v_uid or black_id = v_uid);
  if not found then
    raise exception 'Cannot draw this game' using errcode = '22023';
  end if;
end;
$$;

-- Idempotent per game: the game row is locked and tokens_awarded is checked
-- under that lock, so repeated or concurrent calls pay at most once.
create or replace function public.award_online_win(p_game_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_amount constant int := 15;
  v_daily_cap constant int := 20; -- paid online wins per rolling 24h
  v_game public.games;
  v_today int;
begin
  if v_uid is null then
    return 0;
  end if;

  insert into public.wallets (id) values (v_uid) on conflict (id) do nothing;
  perform 1 from public.wallets where id = v_uid for update;

  select * into v_game from public.games where id = p_game_id for update;
  if not found or v_game.status <> 'finished' or v_game.tokens_awarded then
    return 0;
  end if;
  if v_game.black_id is null or v_game.black_id = v_game.white_id then
    return 0;
  end if;
  if not (
    (v_game.result = 'white' and v_game.white_id = v_uid) or
    (v_game.result = 'black' and v_game.black_id = v_uid)
  ) then
    return 0;
  end if;
  -- Both sides must have moved at least once (no join-and-resign payouts).
  if coalesce(array_length(v_game.moves, 1), 0) < 2 then
    return 0;
  end if;

  select count(*) into v_today from public.games
    where tokens_awarded_at > now() - interval '24 hours'
      and ((result = 'white' and white_id = v_uid) or (result = 'black' and black_id = v_uid));

  -- Mark the game consumed even when capped, so capped wins can't be
  -- stockpiled and claimed later.
  update public.games set tokens_awarded = true, tokens_awarded_at = now()
    where id = p_game_id;
  if v_today >= v_daily_cap then
    return 0;
  end if;

  update public.wallets set tokens = tokens + v_amount where id = v_uid;
  return v_amount;
end;
$$;

------------------------------------------------------------------------------
-- 3. Spending: lock the balance row, idempotent unlock
------------------------------------------------------------------------------
-- Price list carried over verbatim from 20261111120000_add_animated_pieces_bundle.sql.
-- Keep in sync with SHOP_ITEMS in src/data/shop.ts.
create or replace function public.unlock_cosmetic(p_item_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_price int;
  v_tokens int;
begin
  if v_uid is null then
    return false;
  end if;

  v_price := case p_item_id
    when 'pieceSet:modern' then 40
    when 'pieceSet:outlined' then 40
    when 'pieceSet:sculpted' then 40
    when 'pieceSet:glass' then 40
    when 'pieceSet:bauhaus' then 40
    when 'pieceSet:line' then 40
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
    when 'animation:pieces' then 60
    else null
  end;
  if v_price is null then
    raise exception 'Unknown shop item: %', p_item_id;
  end if;

  -- Lock first, then check ownership: a concurrent unlock of the same item
  -- has either committed (and is seen here) or is waiting behind us.
  select tokens into v_tokens from public.wallets where id = v_uid for update;

  if exists (
    select 1 from public.unlocked_cosmetics
    where user_id = v_uid and item_id = p_item_id
  ) then
    return true;
  end if;

  if v_tokens is null or v_tokens < v_price then
    return false;
  end if;

  update public.wallets set tokens = tokens - v_price where id = v_uid;
  insert into public.unlocked_cosmetics (user_id, item_id) values (v_uid, p_item_id)
    on conflict do nothing;

  return true;
end;
$$;

-- Same race as unlock_cosmetic; same fix.
create or replace function public.charge_custom_background_upload()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_price constant int := 40;
  v_tokens int;
begin
  if v_uid is null then
    return false;
  end if;

  select tokens into v_tokens from public.wallets where id = v_uid for update;
  if v_tokens is null or v_tokens < v_price then
    return false;
  end if;

  update public.wallets set tokens = tokens - v_price where id = v_uid;
  return true;
end;
$$;

------------------------------------------------------------------------------
-- 4. Execute grants: signed-in users only
------------------------------------------------------------------------------
-- Supabase grants EXECUTE to PUBLIC and anon by default; none of these make
-- sense without a session.
revoke all on function public.start_bot_game(int) from public, anon;
revoke all on function public.award_bot_win(int, int) from public, anon;
revoke all on function public.join_game(uuid) from public, anon;
revoke all on function public.make_move(uuid, text, text, text) from public, anon;
revoke all on function public.resign_game(uuid) from public, anon;
revoke all on function public.accept_draw(uuid) from public, anon;
revoke all on function public.award_online_win(uuid) from public, anon;
revoke all on function public.unlock_cosmetic(text) from public, anon;
revoke all on function public.charge_custom_background_upload() from public, anon;

grant execute on function public.start_bot_game(int) to authenticated;
grant execute on function public.award_bot_win(int, int) to authenticated;
grant execute on function public.join_game(uuid) to authenticated;
grant execute on function public.make_move(uuid, text, text, text) to authenticated;
grant execute on function public.resign_game(uuid) to authenticated;
grant execute on function public.accept_draw(uuid) to authenticated;
grant execute on function public.award_online_win(uuid) to authenticated;
grant execute on function public.unlock_cosmetic(text) to authenticated;
grant execute on function public.charge_custom_background_upload() to authenticated;
