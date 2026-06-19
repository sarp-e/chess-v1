-- Allow a new player to join a waiting game as black.
-- The existing "update game" policy only covers white/black once they're already set.
create policy "join waiting game" on public.games
  for update
  using (status = 'waiting' and black_id is null and auth.uid() != white_id)
  with check (black_id = auth.uid() and status = 'active');
