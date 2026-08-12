-- Allow single interior spaces in usernames (e.g. "cool guy"), while still
-- disallowing leading/trailing/double spaces and non-alphanumeric characters.
alter table public.profiles drop constraint username_format;

alter table public.profiles add constraint username_format check (
  char_length(username) between 3 and 20
  and username ~ '^[A-Za-z0-9_]+( [A-Za-z0-9_]+)*$'
);
