-- ========================================
-- da3jae Database Schema
-- Run this in your Supabase SQL Editor
-- ========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------
-- PROFILES (extends auth.users)
-- ----------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  real_name text,
  age integer check (age >= 18 and age <= 100),
  city text,
  bio text,
  interests text[],
  religion text,
  job text,
  education text,
  height integer, -- in cm
  relationship_goals text,
  role text default 'user' check (role in ('user', 'admin')),
  is_banned boolean default false,
  avatar_url text,
  gallery_urls text[],
  is_online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ----------------------------------------
-- SWIPES
-- ----------------------------------------
create table public.swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  action text not null check (action in ('like', 'super_like', 'pass')),
  created_at timestamptz default now(),
  unique(swiper_id, target_id)
);

-- ----------------------------------------
-- MESSAGES
-- ----------------------------------------
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  type text default 'text' check (type in ('text', 'image', 'video', 'voice', 'emoji')),
  media_url text,
  reply_to uuid references public.messages(id),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ----------------------------------------
-- CALLS
-- ----------------------------------------
create table public.calls (
  id uuid default uuid_generate_v4() primary key,
  caller_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('voice', 'video')),
  status text default 'ringing' check (status in ('ringing', 'active', 'ended', 'missed')),
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- ----------------------------------------
-- REPORTS
-- ----------------------------------------
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  created_at timestamptz default now()
);

-- ----------------------------------------
-- RLS POLICIES
-- ----------------------------------------
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.messages enable row level security;
alter table public.calls enable row level security;
alter table public.reports enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Swipes: only owner can read/write their swipes
create policy "Users can view own swipes" on public.swipes for select using (auth.uid() = swiper_id);
create policy "Users can insert swipes" on public.swipes for insert with check (auth.uid() = swiper_id);
create policy "Users can delete own swipes" on public.swipes for delete using (auth.uid() = swiper_id);

-- Messages: sender and receiver can read
create policy "Users can view their messages" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on public.messages for insert
  with check (auth.uid() = sender_id);

-- Calls: caller and receiver can read
create policy "Users can view their calls" on public.calls for select
  using (auth.uid() = caller_id or auth.uid() = receiver_id);
create policy "Users can start calls" on public.calls for insert
  with check (auth.uid() = caller_id);
create policy "Users can update calls" on public.calls for update
  using (auth.uid() = caller_id or auth.uid() = receiver_id);

-- ----------------------------------------
-- TRIGGER: auto-create profile on signup
-- ----------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, real_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'real_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------
-- TRIGGER: updated_at on profiles
-- ----------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
