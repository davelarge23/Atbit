-- Atbit schema. Run in the Supabase SQL editor (or `supabase db push`).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  currency text not null default 'PHP',
  monthly_budget numeric(12,2) not null default 0 check (monthly_budget >= 0),
  savings_goal numeric(12,2) not null default 0 check (savings_goal >= 0),
  starting_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'savings')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (category in ('groceries','utilities','debts','subscriptions','leisure','salary','savings','other')),
  description text not null default '',
  occurred_on date not null default current_date,
  source text not null default 'manual' check (source in ('manual', 'voice')),
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

create policy "profiles: own row select" on public.profiles for select using (id = (select auth.uid()));
create policy "profiles: own row insert" on public.profiles for insert with check (id = (select auth.uid()));
create policy "profiles: own row update" on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "transactions: own select" on public.transactions for select using (user_id = (select auth.uid()));
create policy "transactions: own insert" on public.transactions for insert with check (user_id = (select auth.uid()));
create policy "transactions: own update" on public.transactions for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "transactions: own delete" on public.transactions for delete using (user_id = (select auth.uid()));

-- Create a profile whenever a user signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Closing balance of everything before p_month = the carryover into that month.
create function public.carryover_balance(p_month date) returns numeric
language sql stable security invoker set search_path = '' as $$
  select coalesce((select starting_balance from public.profiles where id = auth.uid()), 0)
    + coalesce((
      select sum(case when type = 'income' then amount else -amount end)
      from public.transactions
      where user_id = auth.uid() and occurred_on < date_trunc('month', p_month)::date
    ), 0);
$$;

-- Credit cards: a name and the day of the month the statement is due.
create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  due_day int not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

alter table public.credit_cards enable row level security;

create policy "credit_cards: own select" on public.credit_cards for select using (user_id = (select auth.uid()));
create policy "credit_cards: own insert" on public.credit_cards for insert with check (user_id = (select auth.uid()));
create policy "credit_cards: own update" on public.credit_cards for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "credit_cards: own delete" on public.credit_cards for delete using (user_id = (select auth.uid()));

-- Reminders for installments, credit card items and subscriptions.
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'installment' check (kind in ('installment', 'card', 'subscription')),
  title text not null check (char_length(title) between 1 and 80),
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  due_day int not null check (due_day between 1 and 31),
  recurrence text not null default 'monthly' check (recurrence in ('once', 'monthly')),
  start_date date,
  card_id uuid references public.credit_cards (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  installments_total int check (installments_total is null or installments_total > 0),
  installments_paid int not null default 0 check (installments_paid >= 0),
  created_at timestamptz not null default now()
);

create index reminders_user_due_idx on public.reminders (user_id, due_date);

alter table public.reminders enable row level security;

create policy "reminders: own select" on public.reminders for select using (user_id = (select auth.uid()));
create policy "reminders: own insert" on public.reminders for insert with check (user_id = (select auth.uid()));
create policy "reminders: own update" on public.reminders for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "reminders: own delete" on public.reminders for delete using (user_id = (select auth.uid()));