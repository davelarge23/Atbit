-- Upgrade: transaction sources (cash / loan / card), links to reminders, and card-aware cash balance.
-- Run once in the Supabase SQL editor, after reminders_v2.sql.

alter table public.transactions
  add column if not exists funds_source text not null default 'cash' check (funds_source in ('cash', 'loan', 'card')),
  add column if not exists origin text check (origin in ('payment', 'loan', 'card')),
  add column if not exists detail text check (detail is null or char_length(detail) <= 120),
  add column if not exists reminder_id uuid references public.reminders (id) on delete set null;

-- Loans only apply to income, cards only to expenses, savings are always cash.
alter table public.transactions drop constraint if exists transactions_funds_source_type_check;
alter table public.transactions add constraint transactions_funds_source_type_check check (
  funds_source = 'cash'
  or (type = 'income' and funds_source = 'loan')
  or (type = 'expense' and funds_source = 'card')
);

-- Card charges are not cash movements: they hit cash only when the card is paid.
create or replace function public.carryover_balance(p_month date) returns numeric
language sql stable security invoker set search_path = '' as $$
  select coalesce((select starting_balance from public.profiles where id = auth.uid()), 0)
    + coalesce((
      select sum(case when type = 'income' then amount else -amount end)
      from public.transactions
      where user_id = auth.uid() and funds_source <> 'card' and occurred_on < date_trunc('month', p_month)::date
    ), 0);
$$;
