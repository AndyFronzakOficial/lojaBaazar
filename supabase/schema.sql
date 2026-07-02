create extension if not exists "pgcrypto";

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  store_name text not null default 'Minha Empresa',
  cnpj text,
  phone text,
  address text,
  logo_url text,
  theme text default 'dark',
  business_segment text,
  enabled_modules jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.products (
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

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  document text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.suppliers (
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

create table if not exists public.cash_sessions (
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

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
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

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  quantity numeric(12,2) default 1,
  unit_price numeric(12,2) default 0,
  cost_price numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  total numeric(12,2) default 0,
  profit numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  movement_type text not null,
  quantity numeric(12,2) not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text default 'aberto',
  subtotal numeric(12,2) default 0,
  freight numeric(12,2) default 0,
  extra_costs numeric(12,2) default 0,
  total numeric(12,2) default 0,
  due_date date,
  received_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  quantity numeric(12,2) default 1,
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) default 0,
  total numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_name text not null,
  instagram text,
  whatsapp text,
  order_date date not null default current_date,
  payment_method text default 'Pix',
  payment_status text not null default 'pendente' check (payment_status in ('pendente', 'pago')),
  paid_at timestamptz,
  delivered boolean not null default false,
  delivered_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  pix_key text not null default '41-98464-8144',
  pix_holder text not null default 'Abquella Carmo de Lima',
  pix_bank text not null default 'Banco Itaú',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_code text,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  service_order_id uuid references public.service_orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
  description text not null,
  type text not null,
  payment_method text,
  amount numeric(12,2) default 0,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Compatibilidade com bancos de versões anteriores.
alter table public.store_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.store_settings add column if not exists business_segment text;
alter table public.store_settings add column if not exists enabled_modules jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.products add column if not exists product_code text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists cost_price numeric(12,2) default 0;
alter table public.products add column if not exists sale_price numeric(12,2) default 0;
alter table public.products add column if not exists stock integer default 0;
alter table public.products add column if not exists min_stock integer default 0;
alter table public.customers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.suppliers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.cash_sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.sales add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.sales add column if not exists cash_session_id uuid references public.cash_sessions(id) on delete set null;
alter table public.sales add column if not exists seller_name text;
alter table public.sales add column if not exists employee_name text;
alter table public.sale_items add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.stock_movements add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.purchases add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.purchase_items add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.financial_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.financial_entries add column if not exists cash_session_id uuid references public.cash_sessions(id) on delete set null;
alter table public.financial_entries add column if not exists service_order_id uuid references public.service_orders(id) on delete set null;

alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.financial_entries enable row level security;

-- Remove políticas antigas amplas e políticas da versão anterior.
drop policy if exists store_settings_authenticated_all on public.store_settings;
drop policy if exists products_authenticated_all on public.products;
drop policy if exists customers_authenticated_all on public.customers;
drop policy if exists suppliers_authenticated_all on public.suppliers;
drop policy if exists cash_sessions_authenticated_all on public.cash_sessions;
drop policy if exists sales_authenticated_all on public.sales;
drop policy if exists sale_items_authenticated_all on public.sale_items;
drop policy if exists stock_movements_authenticated_all on public.stock_movements;
drop policy if exists purchases_authenticated_all on public.purchases;
drop policy if exists purchase_items_authenticated_all on public.purchase_items;
drop policy if exists financial_entries_authenticated_all on public.financial_entries;

drop policy if exists store_settings_owner_all on public.store_settings;
drop policy if exists products_owner_all on public.products;
drop policy if exists customers_owner_all on public.customers;
drop policy if exists suppliers_owner_all on public.suppliers;
drop policy if exists cash_sessions_owner_all on public.cash_sessions;
drop policy if exists sales_owner_all on public.sales;
drop policy if exists sale_items_owner_all on public.sale_items;
drop policy if exists stock_movements_owner_all on public.stock_movements;
drop policy if exists purchases_owner_all on public.purchases;
drop policy if exists purchase_items_owner_all on public.purchase_items;
drop policy if exists service_orders_owner_all on public.service_orders;
drop policy if exists service_order_items_owner_all on public.service_order_items;
drop policy if exists financial_entries_owner_all on public.financial_entries;

create policy store_settings_owner_all on public.store_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy products_owner_all on public.products for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy customers_owner_all on public.customers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy suppliers_owner_all on public.suppliers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cash_sessions_owner_all on public.cash_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sales_owner_all on public.sales for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sale_items_owner_all on public.sale_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy stock_movements_owner_all on public.stock_movements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchases_owner_all on public.purchases for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchase_items_owner_all on public.purchase_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy service_orders_owner_all on public.service_orders for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy service_order_items_owner_all on public.service_order_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy financial_entries_owner_all on public.financial_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_service_orders_user_date on public.service_orders(user_id, order_date desc);
create index if not exists idx_service_orders_payment on public.service_orders(user_id, payment_status);
create index if not exists idx_service_order_items_order on public.service_order_items(service_order_id);
create index if not exists idx_financial_service_order on public.financial_entries(service_order_id);


-- V20 Histórico completo do cliente
create extension if not exists "pgcrypto";

create table if not exists product_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id),
  product_name text,
  quantity numeric(12,2) default 1,
  status text default 'reservado',
  notes text,
  created_at timestamptz default now()
);

create table if not exists customer_returns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  sale_id uuid references sales(id),
  product_id uuid references products(id),
  product_name text,
  reason text,
  amount numeric(12,2) default 0,
  status text default 'registrado',
  created_at timestamptz default now()
);

create table if not exists warranties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  sale_id uuid references sales(id),
  product_id uuid references products(id),
  product_name text,
  serial_number text,
  imei text,
  start_date date,
  end_date date,
  status text default 'ativa',
  notes text,
  created_at timestamptz default now()
);

alter table product_reservations enable row level security;
alter table customer_returns enable row level security;
alter table warranties enable row level security;

drop policy if exists product_reservations_owner_all on product_reservations;
drop policy if exists customer_returns_owner_all on customer_returns;
drop policy if exists warranties_owner_all on warranties;

create policy product_reservations_owner_all
on product_reservations for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy customer_returns_owner_all
on customer_returns for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy warranties_owner_all
on warranties for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Melhora compatibilidade caso sua tabela service_orders ainda não tenha customer_id.
alter table service_orders add column if not exists customer_id uuid references customers(id);
alter table service_orders add column if not exists customer_name text;
alter table service_orders add column if not exists customer_whatsapp text;



-- V21 Ordem de Serviço completa
create extension if not exists "pgcrypto";

create sequence if not exists service_orders_os_number_seq start 1;

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  os_number bigint not null default nextval('service_orders_os_number_seq'),
  customer_id uuid references customers(id),
  customer_name text,
  instagram text,
  whatsapp text,
  device text,
  reported_defect text,
  visual_condition text,
  requested_service text,
  technician text,
  priority text default 'Normal',
  estimated_deadline date,
  estimated_value numeric(12,2) default 0,
  final_value numeric(12,2) default 0,
  paid_entry numeric(12,2) default 0,
  remaining_balance numeric(12,2) default 0,
  payment_method text,
  service_status text default 'Recebido',
  internal_notes text,
  assistance_terms text,
  customer_signature text,
  photos text,
  product_id uuid references products(id),
  product_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table service_orders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table service_orders add column if not exists os_number bigint default nextval('service_orders_os_number_seq');
alter table service_orders add column if not exists customer_id uuid references customers(id);
alter table service_orders add column if not exists customer_name text;
alter table service_orders add column if not exists instagram text;
alter table service_orders add column if not exists whatsapp text;
alter table service_orders add column if not exists device text;
alter table service_orders add column if not exists reported_defect text;
alter table service_orders add column if not exists visual_condition text;
alter table service_orders add column if not exists requested_service text;
alter table service_orders add column if not exists technician text;
alter table service_orders add column if not exists priority text default 'Normal';
alter table service_orders add column if not exists estimated_deadline date;
alter table service_orders add column if not exists estimated_value numeric(12,2) default 0;
alter table service_orders add column if not exists final_value numeric(12,2) default 0;
alter table service_orders add column if not exists paid_entry numeric(12,2) default 0;
alter table service_orders add column if not exists remaining_balance numeric(12,2) default 0;
alter table service_orders add column if not exists payment_method text;
alter table service_orders add column if not exists service_status text default 'Recebido';
alter table service_orders add column if not exists internal_notes text;
alter table service_orders add column if not exists assistance_terms text;
alter table service_orders add column if not exists customer_signature text;
alter table service_orders add column if not exists photos text;
alter table service_orders add column if not exists product_id uuid references products(id);
alter table service_orders add column if not exists product_name text;
alter table service_orders add column if not exists updated_at timestamptz default now();

alter table financial_entries add column if not exists service_order_id uuid references service_orders(id);

alter table service_orders enable row level security;
drop policy if exists service_orders_owner_all on service_orders;
create policy service_orders_owner_all on service_orders for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_service_orders_user_id on service_orders(user_id);
create index if not exists idx_service_orders_customer_id on service_orders(customer_id);
create index if not exists idx_financial_entries_service_order_id on financial_entries(service_order_id);


-- V22 Romaneios e upload de logo
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

-- V29 - Restaurante e Pizzaria
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
-- V31 - Escola, Cursos e Academia
-- Execute no SQL Editor do Supabase para ativar matrículas, turmas, presença e certificados.

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  student_name text not null default '',
  course_name text not null default '',
  plan_name text default '',
  start_date date,
  end_date date,
  monthly_fee numeric(12,2) not null default 0,
  status text not null default 'ativo',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instructor_id uuid references public.professionals(id) on delete set null,
  name text not null default '',
  instructor_name text default '',
  weekday text default '',
  start_time time,
  end_time time,
  room text default '',
  capacity integer not null default 0,
  price numeric(12,2) not null default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.classes_courses(id) on delete set null,
  student_name text not null default '',
  class_name text default '',
  attendance_date date not null default current_date,
  status text not null default 'presente',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null default '',
  course_name text not null default '',
  issue_date date not null default current_date,
  workload_hours numeric(10,2) not null default 0,
  grade text default '',
  status text not null default 'emitido',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_enrollments enable row level security;
alter table public.classes_courses enable row level security;
alter table public.student_attendance enable row level security;
alter table public.student_certificates enable row level security;

drop policy if exists "student_enrollments_owner_all" on public.student_enrollments;
create policy "student_enrollments_owner_all" on public.student_enrollments for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "classes_courses_owner_all" on public.classes_courses;
create policy "classes_courses_owner_all" on public.classes_courses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "student_attendance_owner_all" on public.student_attendance;
create policy "student_attendance_owner_all" on public.student_attendance for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "student_certificates_owner_all" on public.student_certificates;
create policy "student_certificates_owner_all" on public.student_certificates for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists student_enrollments_user_status_idx on public.student_enrollments(user_id, status);
create index if not exists student_enrollments_user_student_idx on public.student_enrollments(user_id, student_name);
create index if not exists classes_courses_user_name_idx on public.classes_courses(user_id, name);
create index if not exists student_attendance_user_date_idx on public.student_attendance(user_id, attendance_date desc);
create index if not exists student_certificates_user_created_idx on public.student_certificates(user_id, created_at desc);

-- Ativa os módulos educacionais nos segmentos de escola/cursos e academia.
update public.store_settings
set enabled_modules = '["dashboard","agenda","matriculas","turmas","presenca","certificados","caixa","financeiro","relatorios","produtos","clientes","historico_cliente","configuracoes"]'::jsonb
where business_segment in ('academia', 'escola_cursos');
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


-- ============================================================
-- V34 - Mercado Pago e assinaturas por segmento
-- ============================================================
-- V34 - Mercado Pago, Pix, bloqueio por segmento e renovação a cada 30 dias
-- Execute este arquivo no Supabase SQL Editor depois da V33.

create table if not exists public.segment_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  segment text not null,
  amount numeric(12,2) not null default 59.90,
  status text not null default 'inactive',
  valid_from timestamptz,
  valid_until timestamptz,
  last_payment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint segment_subscriptions_user_segment_unique unique (user_id, segment),
  constraint segment_subscriptions_segment_check check (segment in (
    'loja', 'comunicacao_visual', 'assistencia_tecnica', 'oficina', 'barbearia',
    'salao_beleza', 'pet_shop', 'academia', 'escola_cursos', 'restaurante'
  )),
  constraint segment_subscriptions_status_check check (status in ('inactive', 'active', 'expired', 'cancelled'))
);

create table if not exists public.segment_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  segment text not null,
  amount numeric(12,2) not null default 59.90,
  status text not null default 'pending',
  provider text not null default 'mercado_pago',
  provider_order_id text,
  provider_payment_id text,
  provider_status text,
  provider_status_detail text,
  payer_email text,
  qr_code text,
  qr_code_base64 text,
  ticket_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint segment_payments_segment_check check (segment in (
    'loja', 'comunicacao_visual', 'assistencia_tecnica', 'oficina', 'barbearia',
    'salao_beleza', 'pet_shop', 'academia', 'escola_cursos', 'restaurante'
  )),
  constraint segment_payments_status_check check (status in (
    'pending', 'processing', 'approved', 'expired', 'failed', 'rejected',
    'canceled', 'refunded', 'charged_back'
  ))
);

alter table public.segment_subscriptions
  drop constraint if exists segment_subscriptions_last_payment_id_fkey;
alter table public.segment_subscriptions
  add constraint segment_subscriptions_last_payment_id_fkey
  foreign key (last_payment_id) references public.segment_payments(id) on delete set null;

create index if not exists idx_segment_subscriptions_user_id on public.segment_subscriptions(user_id);
create index if not exists idx_segment_subscriptions_valid_until on public.segment_subscriptions(valid_until);
create index if not exists idx_segment_payments_user_segment on public.segment_payments(user_id, segment);
create index if not exists idx_segment_payments_provider_order on public.segment_payments(provider_order_id);
create index if not exists idx_segment_payments_provider_payment on public.segment_payments(provider_payment_id);
create index if not exists idx_segment_payments_status on public.segment_payments(status);

alter table public.segment_subscriptions enable row level security;
alter table public.segment_payments enable row level security;

drop policy if exists "segment_subscriptions_select_own" on public.segment_subscriptions;
create policy "segment_subscriptions_select_own"
on public.segment_subscriptions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "segment_payments_select_own" on public.segment_payments;
create policy "segment_payments_select_own"
on public.segment_payments for select
to authenticated
using (auth.uid() = user_id);

-- A aprovação é feita somente pelo backend usando a SERVICE ROLE.
-- A função bloqueia a linha do pagamento para impedir que webhook e consulta
-- estendam a assinatura duas vezes para a mesma cobrança.
create or replace function public.confirm_segment_payment(
  p_payment_id uuid,
  p_provider_status text,
  p_provider_order_id text default null,
  p_provider_payment_id text default null,
  p_paid_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.segment_payments%rowtype;
  v_current_until timestamptz;
  v_new_until timestamptz;
  v_paid_at timestamptz := coalesce(p_paid_at, now());
begin
  select *
    into v_payment
  from public.segment_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Pagamento não encontrado';
  end if;

  if v_payment.status = 'approved' then
    select valid_until
      into v_current_until
    from public.segment_subscriptions
    where user_id = v_payment.user_id
      and segment = v_payment.segment;

    return jsonb_build_object(
      'already_confirmed', true,
      'payment_id', v_payment.id,
      'segment', v_payment.segment,
      'valid_until', v_current_until
    );
  end if;

  update public.segment_payments
  set status = 'approved',
      provider_status = coalesce(nullif(p_provider_status, ''), 'approved'),
      provider_order_id = coalesce(nullif(p_provider_order_id, ''), provider_order_id),
      provider_payment_id = coalesce(nullif(p_provider_payment_id, ''), provider_payment_id),
      paid_at = v_paid_at,
      updated_at = now()
  where id = p_payment_id;

  select valid_until
    into v_current_until
  from public.segment_subscriptions
  where user_id = v_payment.user_id
    and segment = v_payment.segment
  for update;

  v_new_until := greatest(coalesce(v_current_until, now()), now()) + interval '30 days';

  insert into public.segment_subscriptions (
    user_id, segment, amount, status, valid_from, valid_until, last_payment_id, updated_at
  ) values (
    v_payment.user_id, v_payment.segment, v_payment.amount, 'active', v_paid_at, v_new_until, v_payment.id, now()
  )
  on conflict (user_id, segment)
  do update set
    amount = excluded.amount,
    status = 'active',
    valid_from = excluded.valid_from,
    valid_until = excluded.valid_until,
    last_payment_id = excluded.last_payment_id,
    updated_at = now();

  return jsonb_build_object(
    'already_confirmed', false,
    'payment_id', v_payment.id,
    'segment', v_payment.segment,
    'valid_until', v_new_until
  );
end;
$$;

revoke all on function public.confirm_segment_payment(uuid, text, text, text, timestamptz) from public;
revoke all on function public.confirm_segment_payment(uuid, text, text, text, timestamptz) from anon;
revoke all on function public.confirm_segment_payment(uuid, text, text, text, timestamptz) from authenticated;
grant execute on function public.confirm_segment_payment(uuid, text, text, text, timestamptz) to service_role;

notify pgrst, 'reload schema';
