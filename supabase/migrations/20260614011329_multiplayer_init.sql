-- Games table
create table public.games (
  id uuid primary key default gen_random_uuid(),
  white_id uuid not null,
  black_id uuid,
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves text[] not null default '{}',
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  result text check (result in ('white', 'black', 'draw')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Matchmaking queue
create table public.matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  created_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- Enable Realtime on games
alter publication supabase_realtime add table public.games;

-- RLS
alter table public.games enable row level security;
alter table public.matchmaking_queue enable row level security;

-- Games: anyone can read a game they're a player in (or a waiting game to join)
create policy "read own games" on public.games
  for select using (
    auth.uid() = white_id or auth.uid() = black_id or status = 'waiting'
  );

-- Games: white player creates the game
create policy "create game" on public.games
  for insert with check (auth.uid() = white_id);

-- Games: players can update their own game
create policy "update game" on public.games
  for update using (auth.uid() = white_id or auth.uid() = black_id);

-- Queue: users manage their own queue entry
create policy "manage own queue entry" on public.matchmaking_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Queue: anyone can read the queue (needed to find a waiting opponent)
create policy "read queue" on public.matchmaking_queue
  for select using (true);
