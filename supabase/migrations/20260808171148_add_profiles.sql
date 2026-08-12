-- Profiles: lets a signed-in user pick a unique display name.
create extension if not exists citext;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Usernames are public (needed to show opponents' names, leaderboards, etc.)
create policy "profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Users can only create/edit their own profile row
create policy "users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
