alter table public.letters drop constraint if exists letters_id_check;
alter table public.letters drop constraint if exists letters_id_format;
alter table public.letters
  add constraint letters_id_format check (id ~ '^[a-f0-9]{16}$');
