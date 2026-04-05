create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null check (score >= 0),
  lines integer not null default 0 check (lines >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  highest_score integer not null default 0 check (highest_score >= 0),
  total_games integer not null default 0 check (total_games >= 0),
  total_lines integer not null default 0 check (total_lines >= 0),
  avg_score numeric(10, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists scores_user_id_idx on public.scores (user_id);
create index if not exists scores_created_at_idx on public.scores (created_at desc);
create index if not exists user_stats_highest_score_idx on public.user_stats (highest_score desc, updated_at asc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.email, 'pilot-' || left(new.id::text, 8)))
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.user_stats enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
for select
using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists scores_select_all on public.scores;
create policy scores_select_all on public.scores
for select
using (true);

drop policy if exists scores_insert_self on public.scores;
create policy scores_insert_self on public.scores
for insert
with check (auth.uid() = user_id);

drop policy if exists user_stats_select_public on public.user_stats;
create policy user_stats_select_public on public.user_stats
for select
using (true);

drop policy if exists user_stats_insert_self on public.user_stats;
create policy user_stats_insert_self on public.user_stats
for insert
with check (auth.uid() = user_id);

drop policy if exists user_stats_update_self on public.user_stats;
create policy user_stats_update_self on public.user_stats
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);