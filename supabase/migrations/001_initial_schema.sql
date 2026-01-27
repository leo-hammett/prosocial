-- Prosocial Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PEOPLE TABLE
-- Stores information about contacts
-- ============================================
create table if not exists public.people (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  photo_url text,
  birthday date,
  anniversary date,
  relationship text not null default 'acquaintance' 
    check (relationship in ('family', 'friend', 'work', 'acquaintance')),
  notes text, -- Plaintext notes (deprecated, kept for migration)
  notes_encrypted text, -- Encrypted notes (client-side encryption)
  tags text[] default '{}',
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster queries
create index if not exists people_user_id_idx on public.people(user_id);
create index if not exists people_birthday_idx on public.people(birthday);
create index if not exists people_last_contacted_idx on public.people(last_contacted_at);

-- ============================================
-- INTERACTIONS TABLE
-- Logs of interactions with people
-- ============================================
create table if not exists public.interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  person_id uuid references public.people(id) on delete cascade not null,
  note text,
  note_encrypted text,
  mood text not null default 'good'
    check (mood in ('good', 'okay', 'awkward')),
  interaction_type text not null default 'in_person'
    check (interaction_type in ('in_person', 'call', 'text', 'video')),
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for faster queries
create index if not exists interactions_user_id_idx on public.interactions(user_id);
create index if not exists interactions_person_id_idx on public.interactions(person_id);
create index if not exists interactions_occurred_at_idx on public.interactions(occurred_at);

-- ============================================
-- IMPORTANT DATES TABLE
-- Custom important dates beyond birthday/anniversary
-- ============================================
create table if not exists public.important_dates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  person_id uuid references public.people(id) on delete cascade,
  title text not null,
  date date not null,
  recurring boolean default true,
  remind_days_before integer[] default '{7, 1, 0}',
  created_at timestamptz default now()
);

create index if not exists important_dates_user_id_idx on public.important_dates(user_id);
create index if not exists important_dates_date_idx on public.important_dates(date);

-- ============================================
-- STREAKS TABLE
-- Tracks user's streak progress
-- ============================================
create table if not exists public.streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  streak_type text not null
    check (streak_type in ('contact', 'checkin', 'remember')),
  current_count integer default 0,
  longest_count integer default 0,
  last_updated_at timestamptz default now(),
  created_at timestamptz default now(),
  -- Ensure one streak per type per user
  unique(user_id, streak_type)
);

create index if not exists streaks_user_id_idx on public.streaks(user_id);

-- ============================================
-- USER PREFERENCES TABLE
-- User settings and preferences
-- ============================================
create table if not exists public.user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  notifications_enabled boolean default true,
  reminder_time time default '09:00',
  streak_reminder boolean default true,
  theme text default 'system'
    check (theme in ('light', 'dark', 'system')),
  expo_push_token text,
  google_calendar_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================

-- Enable RLS on all tables
alter table public.people enable row level security;
alter table public.interactions enable row level security;
alter table public.important_dates enable row level security;
alter table public.streaks enable row level security;
alter table public.user_preferences enable row level security;

-- People policies
create policy "Users can view own people"
  on public.people for select
  using (auth.uid() = user_id);

create policy "Users can insert own people"
  on public.people for insert
  with check (auth.uid() = user_id);

create policy "Users can update own people"
  on public.people for update
  using (auth.uid() = user_id);

create policy "Users can delete own people"
  on public.people for delete
  using (auth.uid() = user_id);

-- Interactions policies
create policy "Users can view own interactions"
  on public.interactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own interactions"
  on public.interactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interactions"
  on public.interactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own interactions"
  on public.interactions for delete
  using (auth.uid() = user_id);

-- Important dates policies
create policy "Users can view own important_dates"
  on public.important_dates for select
  using (auth.uid() = user_id);

create policy "Users can insert own important_dates"
  on public.important_dates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own important_dates"
  on public.important_dates for update
  using (auth.uid() = user_id);

create policy "Users can delete own important_dates"
  on public.important_dates for delete
  using (auth.uid() = user_id);

-- Streaks policies
create policy "Users can view own streaks"
  on public.streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on public.streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on public.streaks for update
  using (auth.uid() = user_id);

-- User preferences policies
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers to auto-update updated_at
create trigger people_updated_at
  before update on public.people
  for each row execute function public.update_updated_at();

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.update_updated_at();

-- Function to get upcoming birthdays
create or replace function public.get_upcoming_birthdays(days_ahead integer default 7)
returns table (
  id uuid,
  name text,
  birthday date,
  days_until integer
) as $$
begin
  return query
  select 
    p.id,
    p.name,
    p.birthday,
    (
      case 
        when extract(doy from p.birthday) >= extract(doy from current_date)
        then extract(doy from p.birthday) - extract(doy from current_date)
        else 365 - extract(doy from current_date) + extract(doy from p.birthday)
      end
    )::integer as days_until
  from public.people p
  where p.user_id = auth.uid()
    and p.birthday is not null
    and (
      case 
        when extract(doy from p.birthday) >= extract(doy from current_date)
        then extract(doy from p.birthday) - extract(doy from current_date)
        else 365 - extract(doy from current_date) + extract(doy from p.birthday)
      end
    ) <= days_ahead
  order by days_until;
end;
$$ language plpgsql security definer;

-- Function to get people needing reconnection
create or replace function public.get_people_needing_reconnection(threshold_days integer default 30)
returns table (
  id uuid,
  name text,
  relationship text,
  last_contacted_at timestamptz,
  days_since integer
) as $$
begin
  return query
  select 
    p.id,
    p.name,
    p.relationship,
    p.last_contacted_at,
    extract(day from now() - coalesce(p.last_contacted_at, p.created_at))::integer as days_since
  from public.people p
  where p.user_id = auth.uid()
    and p.relationship in ('family', 'friend')
    and (
      p.last_contacted_at is null 
      or extract(day from now() - p.last_contacted_at) >= threshold_days
    )
  order by days_since desc;
end;
$$ language plpgsql security definer;
