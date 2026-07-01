-- V32 - Pet Shop
-- Execute este arquivo no SQL Editor do Supabase para ativar pets, vacinas e histórico de saúde.

create table if not exists public.pet_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tutor_name text not null default '',
  pet_name text not null default '',
  species text not null default 'Cachorro',
  breed text default '',
  size text default '',
  weight numeric(10,2) not null default 0,
  birth_date date,
  color text default '',
  temperament text default '',
  allergies text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pet_records(id) on delete set null,
  pet_name text not null default '',
  tutor_name text default '',
  record_type text not null default 'vacina',
  title text not null default '',
  record_date date not null default current_date,
  next_date date,
  professional text default '',
  price numeric(12,2) not null default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pet_records enable row level security;
alter table public.pet_health_records enable row level security;

drop policy if exists "pet_records_owner_all" on public.pet_records;
create policy "pet_records_owner_all" on public.pet_records for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pet_health_records_owner_all" on public.pet_health_records;
create policy "pet_health_records_owner_all" on public.pet_health_records for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists pet_records_user_pet_idx on public.pet_records(user_id, pet_name);
create index if not exists pet_records_user_tutor_idx on public.pet_records(user_id, tutor_name);
create index if not exists pet_health_records_user_date_idx on public.pet_health_records(user_id, record_date desc);
create index if not exists pet_health_records_user_next_idx on public.pet_health_records(user_id, next_date);

-- Ativa os novos módulos do Pet Shop.
update public.store_settings
set enabled_modules = '["dashboard","agenda","pets","vacinas","caixa","pdv","ordens","financeiro","relatorios","produtos","clientes","historico_cliente","configuracoes"]'::jsonb
where business_segment = 'pet_shop';
