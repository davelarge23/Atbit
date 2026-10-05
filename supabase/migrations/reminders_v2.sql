-- Upgrade an existing Atbit database: reminders v2 (installments / credit cards / subscriptions).
-- Safe to run once in the Supabase SQL editor.

alter table public.transactions drop constraint if exists transactions_category_check;
alter table public.transactions add constraint transactions_category_check
  check (category in ('groceries','utilities','debts','subscriptions','leisure','salary','savings','other'));

create table if not exists public.credit_cards (
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

alter table public.reminders
  add column if not exists kind text not null default 'installment' check (kind in ('installment', 'card', 'subscription')),
  add column if not exists start_date date,
  add column if not exists card_id uuid references public.credit_cards (id) on delete cascade,
  add column if not exists status text not null default 'active' check (status in ('active', 'paused', 'completed'));
