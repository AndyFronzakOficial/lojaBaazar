-- V29 - Restaurante e Pizzaria
-- Execute no SQL Editor do Supabase para ativar mesas, comandas, cozinha e delivery.

create table if not exists public.restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text default '',
  table_number text,
  order_type text not null default 'mesa',
  items_description text not null default '',
  total numeric(12,2) not null default 0,
  status text not null default 'novo',
  delivery_address text,
  delivery_fee numeric(12,2) not null default 0,
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurant_orders enable row level security;

drop policy if exists "restaurant_orders_select_own" on public.restaurant_orders;
create policy "restaurant_orders_select_own" on public.restaurant_orders for select using (auth.uid() = user_id);

drop policy if exists "restaurant_orders_insert_own" on public.restaurant_orders;
create policy "restaurant_orders_insert_own" on public.restaurant_orders for insert with check (auth.uid() = user_id);

drop policy if exists "restaurant_orders_update_own" on public.restaurant_orders;
create policy "restaurant_orders_update_own" on public.restaurant_orders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "restaurant_orders_delete_own" on public.restaurant_orders;
create policy "restaurant_orders_delete_own" on public.restaurant_orders for delete using (auth.uid() = user_id);

create index if not exists restaurant_orders_user_created_idx on public.restaurant_orders(user_id, created_at desc);
create index if not exists restaurant_orders_user_status_idx on public.restaurant_orders(user_id, status);
create index if not exists restaurant_orders_user_type_idx on public.restaurant_orders(user_id, order_type);

alter table public.store_settings add column if not exists business_segment text;
alter table public.store_settings add column if not exists enabled_modules text[] default array[]::text[];
