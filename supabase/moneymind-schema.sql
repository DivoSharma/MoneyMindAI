create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  date date not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(date desc);

alter table public.users enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Users can read own expenses" on public.expenses;
create policy "Users can read own expenses"
  on public.expenses
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses"
  on public.expenses
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
  on public.expenses
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
  on public.expenses
  for delete
  to authenticated
  using (user_id = auth.uid());
