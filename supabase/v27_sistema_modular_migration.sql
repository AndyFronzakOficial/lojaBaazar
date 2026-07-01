-- V27 - Sistema modular por segmento
-- Execute este arquivo no SQL Editor do Supabase para atualizar um banco já existente.

alter table public.store_settings
  add column if not exists business_segment text;

alter table public.store_settings
  add column if not exists enabled_modules jsonb not null default '[]'::jsonb;

comment on column public.store_settings.business_segment is
  'Segmento principal da empresa usado para personalizar o menu e os módulos.';

comment on column public.store_settings.enabled_modules is
  'Lista JSON dos módulos habilitados para a empresa.';
