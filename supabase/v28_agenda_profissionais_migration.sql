-- V28 Agenda e Profissionais
-- Execute no SQL Editor do Supabase para atualizar bancos que já estavam na V27.

create extension if not exists "pgcrypto";

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  commission_percent numeric(8,2) not null default 0,
  work_schedule text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  customer_name text,
  service_name text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30,
  price numeric(12,2) not null default 0,
  status text not null default 'agendado',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.professionals enable row level security;
alter table public.appointments enable row level security;

drop policy if exists professionals_owner_all on public.professionals;
drop policy if exists appointments_owner_all on public.appointments;

create policy professionals_owner_all on public.professionals
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy appointments_owner_all on public.appointments
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_professionals_user_name on public.professionals(user_id, name);
create index if not exists idx_appointments_user_date on public.appointments(user_id, starts_at desc);
create index if not exists idx_appointments_professional_date on public.appointments(professional_id, starts_at desc);

-- Ativa o módulo agenda nos segmentos que usam agendamento.
update public.store_settings
set enabled_modules = (
  select jsonb_agg(distinct module)
  from jsonb_array_elements_text(coalesce(enabled_modules, '[]'::jsonb) || '["agenda"]'::jsonb) as module
)
where business_segment in ('barbearia', 'salao_beleza', 'pet_shop', 'academia', 'escola_cursos');
