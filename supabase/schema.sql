create extension if not exists "pgcrypto";

create table if not exists store_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  store_name text not null default 'Bazar Eletrônicos',
  cnpj text,
  phone text,
  address text,
  logo_url text,
  theme text default 'dark',
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  product_code text,
  barcode text,
  brand text,
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) default 0,
  stock integer default 0,
  min_stock integer default 0,
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  document text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  document text,
  phone text,
  contact_name text,
  address text,
  notes text,
  created_at timestamptz default now()
);


create table if not exists cash_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  opened_at timestamptz default now(),
  closed_at timestamptz,
  opening_amount numeric(12,2) default 0,
  closing_amount numeric(12,2) default 0,
  expected_amount numeric(12,2) default 0,
  difference numeric(12,2) default 0,
  status text default 'aberto',
  created_at timestamptz default now()
);

alter table cash_sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table sales add column if not exists cash_session_id uuid references cash_sessions(id);
alter table financial_entries add column if not exists cash_session_id uuid references cash_sessions(id);

alter table cash_sessions enable row level security;
drop policy if exists cash_sessions_owner_all on cash_sessions;
create policy cash_sessions_owner_all on cash_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references customers(id),
  cash_session_id uuid references cash_sessions(id),
  status text default 'finalizada',
  payment_method text,
  seller_name text,
  employee_name text,
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  addition numeric(12,2) default 0,
  total numeric(12,2) default 0,
  profit numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric(12,2) default 1,
  unit_price numeric(12,2) default 0,
  cost_price numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  total numeric(12,2) default 0,
  profit numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id),
  movement_type text not null,
  quantity numeric(12,2) not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  status text default 'aberto',
  subtotal numeric(12,2) default 0,
  freight numeric(12,2) default 0,
  extra_costs numeric(12,2) default 0,
  total numeric(12,2) default 0,
  due_date date,
  received_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric(12,2) default 1,
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) default 0,
  total numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists financial_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sale_id uuid references sales(id),
  purchase_id uuid references purchases(id),
  customer_id uuid references customers(id),
  supplier_id uuid references suppliers(id),
  cash_session_id uuid references cash_sessions(id),
  description text not null,
  type text not null,
  payment_method text,
  amount numeric(12,2) default 0,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table store_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table products add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table customers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table suppliers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table sales add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table sales add column if not exists seller_name text;
alter table sales add column if not exists employee_name text;
alter table sale_items add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table stock_movements add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table purchases add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table purchase_items add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table financial_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table store_settings enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table suppliers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table stock_movements enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table financial_entries enable row level security;

drop policy if exists store_settings_owner_all on store_settings;
drop policy if exists products_owner_all on products;
drop policy if exists customers_owner_all on customers;
drop policy if exists suppliers_owner_all on suppliers;
drop policy if exists sales_owner_all on sales;
drop policy if exists sale_items_owner_all on sale_items;
drop policy if exists stock_movements_owner_all on stock_movements;
drop policy if exists purchases_owner_all on purchases;
drop policy if exists purchase_items_owner_all on purchase_items;
drop policy if exists financial_entries_owner_all on financial_entries;

create policy store_settings_owner_all on store_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy products_owner_all on products for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy customers_owner_all on customers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy suppliers_owner_all on suppliers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sales_owner_all on sales for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sale_items_owner_all on sale_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy stock_movements_owner_all on stock_movements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchases_owner_all on purchases for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchase_items_owner_all on purchase_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy financial_entries_owner_all on financial_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
