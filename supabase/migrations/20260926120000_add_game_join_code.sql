-- Short join code so a friend can join a waiting game without the invite link.
-- Alphabet omits 0/O/1/I/L to avoid look-alike characters.
create or replace function public.generate_game_code()
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.games where code = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.games add column code text;

-- Backfill existing rows (the function checks uniqueness against rows already filled)
update public.games set code = public.generate_game_code() where code is null;

alter table public.games
  alter column code set default public.generate_game_code(),
  alter column code set not null,
  add constraint games_code_key unique (code);
