create extension if not exists "pgcrypto";

create sequence if not exists romaneios_number_seq start 1;

create table if not exists romaneios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  romaneio_number bigint not null default nextval('romaneios_number_seq'),
  customer_id uuid references customers(id),
  customer_name text,
  instagram text,
  whatsapp text,
  purchase_date date,
  payment_status text default 'Pendente',
  delivery_status text default 'Pendente',
  payment_method text default 'Pix',
  notes text,
  total numeric(12,2) default 0,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table romaneios enable row level security;

drop policy if exists romaneios_owner_all on romaneios;

create policy romaneios_owner_all
on romaneios for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table financial_entries
add column if not exists romaneio_id uuid references romaneios(id);

alter table customers
add column if not exists instagram text;

alter table store_settings
add column if not exists logo_url text;

create index if not exists idx_romaneios_user_id on romaneios(user_id);
create index if not exists idx_romaneios_customer_id on romaneios(customer_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 52428800, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists logos_public_read on storage.objects;
drop policy if exists logos_authenticated_upload on storage.objects;
drop policy if exists logos_authenticated_update on storage.objects;

create policy logos_public_read
on storage.objects for select
using (bucket_id = 'logos');

create policy logos_authenticated_upload
on storage.objects for insert to authenticated
with check (bucket_id = 'logos');

create policy logos_authenticated_update
on storage.objects for update to authenticated
using (bucket_id = 'logos') with check (bucket_id = 'logos');
