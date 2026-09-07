-- Modelo de acesso da área de membros.
-- O CPF nunca é armazenado em texto puro: a Edge Function grava somente um HMAC.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  hubla_product_id text not null unique,
  name text not null,
  slug text not null unique,
  grants_all_songs boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  icon text not null default '🎵',
  cover_path text,
  audio_path text,
  duration_seconds numeric(10, 3),
  lyrics jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_songs (
  product_id uuid not null references public.products(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, song_id)
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  hubla_user_id text unique,
  email text not null,
  cpf_hash text,
  cpf_last4 text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists members_email_lower_idx on public.members (lower(email));
create index if not exists members_hubla_user_id_idx on public.members (hubla_user_id);

create table if not exists public.member_entitlements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  hubla_product_id text not null,
  product_name text not null,
  subscription_id text not null default '',
  subscription_status text not null default 'active' check (subscription_status in ('active', 'inactive', 'pending', 'unknown')),
  subscription_version integer,
  source_event_type text not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  access_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, hubla_product_id, subscription_id)
);

create index if not exists member_entitlements_active_idx
  on public.member_entitlements (member_id, subscription_status);

create table if not exists public.hubla_webhook_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  event_type text not null,
  contract_version text,
  is_sandbox boolean not null default false,
  payload jsonb not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'failed', 'ignored')),
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists hubla_webhook_events_type_idx
  on public.hubla_webhook_events (event_type, received_at desc);

create table if not exists public.member_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists member_login_attempts_email_time_idx
  on public.member_login_attempts (lower(email), created_at desc);

-- O áudio fica privado no Storage. A aplicação só recebe uma URL assinada depois
-- que o RPC abaixo confirma que o membro possui um produto correspondente.
insert into storage.buckets (id, name, public)
values ('song-media', 'song-media', false)
on conflict (id) do update set public = excluded.public;

alter table public.products enable row level security;
alter table public.songs enable row level security;
alter table public.product_songs enable row level security;
alter table public.members enable row level security;
alter table public.member_entitlements enable row level security;
alter table public.hubla_webhook_events enable row level security;
alter table public.member_login_attempts enable row level security;

-- Nenhuma dessas tabelas fica aberta diretamente ao navegador. O catálogo de um
-- membro é entregue somente por funções controladas abaixo.
revoke all on table public.products from anon, authenticated;
revoke all on table public.songs from anon, authenticated;
revoke all on table public.product_songs from anon, authenticated;
revoke all on table public.members from anon, authenticated;
revoke all on table public.member_entitlements from anon, authenticated;
revoke all on table public.hubla_webhook_events from anon, authenticated;
revoke all on table public.member_login_attempts from anon, authenticated;

create or replace function public.get_my_library()
returns table (
  song_id uuid,
  title text,
  slug text,
  subtitle text,
  icon text,
  cover_path text,
  audio_path text,
  duration_seconds numeric,
  lyrics jsonb,
  product_id uuid,
  product_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (s.id)
    s.id,
    s.title,
    s.slug,
    s.subtitle,
    s.icon,
    s.cover_path,
    s.audio_path,
    s.duration_seconds,
    s.lyrics,
    p.id,
    p.name
  from public.members m
  join public.member_entitlements e on e.member_id = m.id
  join public.products p on p.hubla_product_id = e.hubla_product_id
    and p.is_active = true
  join public.product_songs ps on ps.product_id = p.id
  join public.songs s on s.id = ps.song_id and s.is_published = true
  where m.auth_user_id = auth.uid()
    and e.subscription_status = 'active'
  order by s.id, p.name;
$$;

revoke all on function public.get_my_library() from public, anon;
grant execute on function public.get_my_library() to authenticated;

create or replace function public.can_read_song_media(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
    from public.members m
    join public.member_entitlements e on e.member_id = m.id
      and e.subscription_status = 'active'
    join public.products p on p.hubla_product_id = e.hubla_product_id
      and p.is_active = true
    join public.product_songs ps on ps.product_id = p.id
    join public.songs s on s.id = ps.song_id
    where m.auth_user_id = auth.uid()
      and split_part(object_name, '/', 1) = s.id::text
  );
$$;

revoke all on function public.can_read_song_media(text) from public, anon;
grant execute on function public.can_read_song_media(text) to authenticated;

create policy "members can read entitled song media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'song-media' and public.can_read_song_media(name));
