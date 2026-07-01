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
