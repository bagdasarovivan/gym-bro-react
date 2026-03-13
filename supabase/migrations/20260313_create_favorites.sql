create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  exercise_name text not null,
  created_at timestamp default now(),
  unique(user_id, exercise_name)
);

alter table favorites enable row level security;

create policy "Users can manage their own favorites"
  on favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
