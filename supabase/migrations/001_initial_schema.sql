-- ============================================================
-- CallerBot Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  phone_number    text,                        -- E.164 format e.g. +918698316883
  reminder_minutes int not null default 10,    -- How many mins before to call
  is_active       boolean not null default true,
  google_access_token  text,
  google_refresh_token text,
  google_token_expiry  timestamptz,
  calendar_id     text,                        -- e.g. user@gmail.com
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Track which events we've already called for (prevents duplicate calls)
create table if not exists public.called_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  event_id    text not null,                   -- Google Calendar event ID
  called_at   timestamptz default now(),
  unique(user_id, event_id)
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.called_events enable row level security;

create policy "Users can read own data"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update using (auth.uid() = id);

create policy "Users can read own called events"
  on public.called_events for select using (auth.uid() = user_id);

-- Function to auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
