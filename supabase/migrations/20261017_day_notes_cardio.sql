-- Day notes (illness, injury, vacation, workout notes) and cardio fields.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- 1) One note per user per day
create table if not exists public.day_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  note_date date not null,
  kind text not null check (kind in ('sick', 'injury', 'vacation', 'rest', 'tired', 'max', 'note')),
  body_part text,
  text text check (char_length(text) <= 500),
  created_at timestamp default now(),
  unique (user_id, note_date)
);

create index if not exists day_notes_user_date on public.day_notes (user_id, note_date);

alter table public.day_notes enable row level security;

drop policy if exists "Own day notes" on public.day_notes;
create policy "Own day notes" on public.day_notes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2) Cardio: distance and calories of a set (time is stored in sets.time_sec)
alter table public.sets add column if not exists distance_km numeric(6,2);
alter table public.sets add column if not exists calories integer;
