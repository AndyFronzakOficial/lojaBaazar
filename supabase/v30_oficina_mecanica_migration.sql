-- V30 - Oficina Mecânica
-- Execute no SQL Editor do Supabase para ativar veículos, checklist e manutenção preventiva.

create table if not exists public.workshop_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null default '',
  plate text not null default '',
  brand text default '',
  model text default '',
  year text default '',
  color text default '',
  chassis text default '',
  renavam text default '',
  current_km numeric(12,0) not null default 0,
  fuel text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null default '',
  plate text not null default '',
  current_km numeric(12,0) not null default 0,
  fuel_level text default '',
  damages text default '',
  accessories text default '',
  diagnosis text default '',
  services text default '',
  parts text default '',
  warranty text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null default '',
  plate text not null default '',
  service_name text not null default '',
  due_date date,
  due_km numeric(12,0) not null default 0,
  last_km numeric(12,0) not null default 0,
  status text not null default 'pendente',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workshop_vehicles enable row level security;
alter table public.workshop_checklists enable row level security;
alter table public.workshop_maintenance enable row level security;

drop policy if exists "workshop_vehicles_select_own" on public.workshop_vehicles;
create policy "workshop_vehicles_select_own" on public.workshop_vehicles for select using (auth.uid() = user_id);
drop policy if exists "workshop_vehicles_insert_own" on public.workshop_vehicles;
create policy "workshop_vehicles_insert_own" on public.workshop_vehicles for insert with check (auth.uid() = user_id);
drop policy if exists "workshop_vehicles_update_own" on public.workshop_vehicles;
create policy "workshop_vehicles_update_own" on public.workshop_vehicles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "workshop_vehicles_delete_own" on public.workshop_vehicles;
create policy "workshop_vehicles_delete_own" on public.workshop_vehicles for delete using (auth.uid() = user_id);

drop policy if exists "workshop_checklists_select_own" on public.workshop_checklists;
create policy "workshop_checklists_select_own" on public.workshop_checklists for select using (auth.uid() = user_id);
drop policy if exists "workshop_checklists_insert_own" on public.workshop_checklists;
create policy "workshop_checklists_insert_own" on public.workshop_checklists for insert with check (auth.uid() = user_id);
drop policy if exists "workshop_checklists_update_own" on public.workshop_checklists;
create policy "workshop_checklists_update_own" on public.workshop_checklists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "workshop_checklists_delete_own" on public.workshop_checklists;
create policy "workshop_checklists_delete_own" on public.workshop_checklists for delete using (auth.uid() = user_id);

drop policy if exists "workshop_maintenance_select_own" on public.workshop_maintenance;
create policy "workshop_maintenance_select_own" on public.workshop_maintenance for select using (auth.uid() = user_id);
drop policy if exists "workshop_maintenance_insert_own" on public.workshop_maintenance;
create policy "workshop_maintenance_insert_own" on public.workshop_maintenance for insert with check (auth.uid() = user_id);
drop policy if exists "workshop_maintenance_update_own" on public.workshop_maintenance;
create policy "workshop_maintenance_update_own" on public.workshop_maintenance for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "workshop_maintenance_delete_own" on public.workshop_maintenance;
create policy "workshop_maintenance_delete_own" on public.workshop_maintenance for delete using (auth.uid() = user_id);

create index if not exists workshop_vehicles_user_plate_idx on public.workshop_vehicles(user_id, plate);
create index if not exists workshop_checklists_user_created_idx on public.workshop_checklists(user_id, created_at desc);
create index if not exists workshop_maintenance_user_due_idx on public.workshop_maintenance(user_id, due_date);
