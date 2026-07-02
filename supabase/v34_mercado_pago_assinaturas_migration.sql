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
