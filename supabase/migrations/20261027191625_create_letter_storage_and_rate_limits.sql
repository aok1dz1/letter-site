create table if not exists public.letters (
  id text primary key check (id ~ '^[a-f0-9]{12}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.letters enable row level security;
revoke all on table public.letters from anon, authenticated;
grant all on table public.letters to service_role;

create table if not exists public.letter_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 1,
  primary key (ip_hash, window_start)
);
alter table public.letter_rate_limits enable row level security;
revoke all on table public.letter_rate_limits from anon, authenticated;
grant all on table public.letter_rate_limits to service_role;

create or replace function public.consume_letter_rate_limit(p_ip_hash text, p_max_attempts integer default 12)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_attempts integer;
  v_window_start timestamptz := date_trunc('hour', now());
begin
  insert into public.letter_rate_limits(ip_hash, window_start, attempts)
  values (p_ip_hash, v_window_start, 1)
  on conflict (ip_hash, window_start)
  do update set attempts = public.letter_rate_limits.attempts + 1
  returning attempts into v_attempts;

  if random() < 0.02 then
    delete from public.letter_rate_limits
    where window_start < v_window_start - interval '24 hours';
  end if;

  return v_attempts <= greatest(1, least(p_max_attempts, 50));
end;
$$;
revoke all on function public.consume_letter_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.consume_letter_rate_limit(text, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('letter-media', 'letter-media', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
