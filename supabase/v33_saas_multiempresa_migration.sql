-- V33 - SaaS, assinaturas, planos e multiempresa
-- Execute este arquivo no Supabase SQL Editor depois da V32.

create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  monthly_price numeric(12,2) default 0,
  max_users integer default 1,
  max_companies integer default 1,
  storage_gb numeric(12,2) default 1,
  modules text,
  trial_days integer default 7,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.saas_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_name text not null,
  responsible_name text,
  email text,
  phone text,
  document text,
  segment text default 'loja',
  status text default 'trial',
  plan_name text default 'Profissional',
  trial_ends_at date,
  subscription_ends_at date,
  created_at timestamptz default now()
);

create table if not exists public.saas_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid references public.saas_companies(id) on delete cascade,
  amount numeric(12,2) default 0,
  payment_method text,
  due_date date,
  paid_at date,
  status text default 'pending',
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_saas_plans_user_id on public.saas_plans(user_id);
create index if not exists idx_saas_companies_user_id on public.saas_companies(user_id);
create index if not exists idx_saas_companies_status on public.saas_companies(status);
create index if not exists idx_saas_payments_user_id on public.saas_subscription_payments(user_id);

alter table public.saas_plans enable row level security;
alter table public.saas_companies enable row level security;
alter table public.saas_subscription_payments enable row level security;

drop policy if exists "saas_plans_select_own" on public.saas_plans;
create policy "saas_plans_select_own" on public.saas_plans for select using (auth.uid() = user_id);
drop policy if exists "saas_plans_insert_own" on public.saas_plans;
create policy "saas_plans_insert_own" on public.saas_plans for insert with check (auth.uid() = user_id);
drop policy if exists "saas_plans_update_own" on public.saas_plans;
create policy "saas_plans_update_own" on public.saas_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "saas_plans_delete_own" on public.saas_plans;
create policy "saas_plans_delete_own" on public.saas_plans for delete using (auth.uid() = user_id);

drop policy if exists "saas_companies_select_own" on public.saas_companies;
create policy "saas_companies_select_own" on public.saas_companies for select using (auth.uid() = user_id);
drop policy if exists "saas_companies_insert_own" on public.saas_companies;
create policy "saas_companies_insert_own" on public.saas_companies for insert with check (auth.uid() = user_id);
drop policy if exists "saas_companies_update_own" on public.saas_companies;
create policy "saas_companies_update_own" on public.saas_companies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "saas_companies_delete_own" on public.saas_companies;
create policy "saas_companies_delete_own" on public.saas_companies for delete using (auth.uid() = user_id);

drop policy if exists "saas_payments_select_own" on public.saas_subscription_payments;
create policy "saas_payments_select_own" on public.saas_subscription_payments for select using (auth.uid() = user_id);
drop policy if exists "saas_payments_insert_own" on public.saas_subscription_payments;
create policy "saas_payments_insert_own" on public.saas_subscription_payments for insert with check (auth.uid() = user_id);
drop policy if exists "saas_payments_update_own" on public.saas_subscription_payments;
create policy "saas_payments_update_own" on public.saas_subscription_payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "saas_payments_delete_own" on public.saas_subscription_payments;
create policy "saas_payments_delete_own" on public.saas_subscription_payments for delete using (auth.uid() = user_id);
