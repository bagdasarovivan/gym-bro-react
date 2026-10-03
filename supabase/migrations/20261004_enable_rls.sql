-- Turn Row Level Security back on for every public table the app uses.
-- Without RLS, anyone holding the public anon key (it ships inside the web app)
-- can read, change or delete every user's workouts.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- 1) Drop whatever policies exist on these tables (some may be too permissive), then recreate them below.
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('workouts', 'sets', 'exercises', 'workout_plans', 'plan_weights', 'app_meta', 'favorites', 'body_weights')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 2) Enable RLS
alter table public.workouts      enable row level security;
alter table public.sets          enable row level security;
alter table public.exercises     enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_weights  enable row level security;
alter table public.app_meta      enable row level security; -- not used by the app: no policies = closed to clients
alter table public.favorites     enable row level security;
alter table public.body_weights  enable row level security;

-- 3) Policies. `(select auth.uid())` is evaluated once per query instead of once per row.

-- Own rows only
create policy "Own workouts" on public.workouts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Own workout plans" on public.workout_plans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Own plan weights" on public.plan_weights for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Own favorites" on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Own body weights" on public.body_weights for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Sets have no user_id: they belong to the user who owns the parent workout
create policy "Sets of own workouts" on public.sets for all to authenticated
  using (exists (select 1 from public.workouts w where w.id = sets.workout_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.workouts w where w.id = sets.workout_id and w.user_id = (select auth.uid())));

-- Exercise names are a shared catalog: signed-in users can read and add, nobody can edit or delete
create policy "Read exercise catalog" on public.exercises for select to authenticated using (true);
create policy "Add to exercise catalog" on public.exercises for insert to authenticated with check (true);
