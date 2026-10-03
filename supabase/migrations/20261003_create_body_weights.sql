-- Body weight log: one entry per user per day.
-- Run once in Supabase → SQL Editor.
create table if not exists body_weights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  measured_on date not null,
  weight numeric(5,1) not null check (weight between 30 and 300),
  created_at timestamp default now(),
  unique (user_id, measured_on)
);

create index if not exists body_weights_user_date on body_weights (user_id, measured_on);

alter table body_weights enable row level security;

create policy "Users can manage their own body weights"
  on body_weights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
