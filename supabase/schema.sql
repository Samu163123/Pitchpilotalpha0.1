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

-- Chat sessions table to save and resume conversations
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id text not null,
  status text not null default 'in_progress', -- in_progress | completed | abandoned
  outcome text, -- accepted | declined | null
  messages jsonb not null default '[]'::jsonb, -- array of {role, content}
  product jsonb,
  persona jsonb,
  scenario_settings jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Uniqueness per user per session_id
create unique index if not exists chat_sessions_user_session_idx
  on public.chat_sessions (user_id, session_id);

-- Helpful list queries
create index if not exists chat_sessions_user_updated_idx
  on public.chat_sessions (user_id, updated_at desc);

alter table public.chat_sessions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'Users can view own chat sessions'
  ) then
    create policy "Users can view own chat sessions"
      on public.chat_sessions for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'Users can insert own chat sessions'
  ) then
    create policy "Users can insert own chat sessions"
      on public.chat_sessions for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'Users can update own chat sessions'
  ) then
    create policy "Users can update own chat sessions"
      on public.chat_sessions for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
