-- Call history table
create table if not exists public.call_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id text not null,
  product_name text not null,
  persona text not null,
  difficulty text not null,
  status text not null default 'started',
  duration integer,
  score integer,
  outcome text,
  created_at timestamptz not null default now()
);

-- Ensure pgcrypto for gen_random_uuid (if not enabled)
-- create extension if not exists pgcrypto;

-- RLS: enable and restrict rows to owner
alter table public.call_history enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'call_history' and policyname = 'Individuals can view their own history'
  ) then
    create policy "Individuals can view their own history"
      on public.call_history for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'call_history' and policyname = 'Individuals can insert their own history'
  ) then
    create policy "Individuals can insert their own history"
      on public.call_history for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Helpful index
create index if not exists call_history_user_created_at_idx on public.call_history (user_id, created_at desc);
