-- Área administrativa do catálogo protegido.
-- O administrador entra por e-mail e senha do Supabase Auth; nenhum
-- service_role chega ao navegador.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = auth.uid()
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Administradores podem enviar e remover capas e áudios no bucket privado.
create policy "admins can manage song media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'song-media' and public.is_admin())
  with check (bucket_id = 'song-media' and public.is_admin());

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
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return query
      select s.id, s.title, s.slug, s.subtitle, s.icon, s.cover_path,
        s.audio_path, s.duration_seconds, s.lyrics, null::uuid, null::text
      from public.songs s
      order by s.sort_order, s.created_at, s.title;
    return;
  end if;

  return query
    select distinct on (s.id)
      s.id, s.title, s.slug, s.subtitle, s.icon, s.cover_path,
      s.audio_path, s.duration_seconds, s.lyrics, p.id, p.name
    from public.members m
    join public.member_entitlements e on e.member_id = m.id
    join public.products p on p.hubla_product_id = e.hubla_product_id
      and p.is_active = true
    join public.product_songs ps on ps.product_id = p.id
    join public.songs s on s.id = ps.song_id and s.is_published = true
    where m.auth_user_id = auth.uid()
      and e.subscription_status = 'active'
    order by s.id, p.name;
end;
$$;

revoke all on function public.get_my_library() from public, anon;
grant execute on function public.get_my_library() to authenticated;

create or replace function public.admin_list_songs()
returns table (
  id uuid,
  title text,
  slug text,
  subtitle text,
  icon text,
  cover_path text,
  audio_path text,
  duration_seconds numeric,
  lyrics jsonb,
  is_published boolean,
  sort_order integer,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.title, s.slug, s.subtitle, s.icon, s.cover_path,
    s.audio_path, s.duration_seconds, s.lyrics, s.is_published,
    s.sort_order, s.created_at, s.updated_at
  from public.songs s
  where public.is_admin()
  order by s.sort_order, s.created_at, s.title;
$$;

revoke all on function public.admin_list_songs() from public, anon;
grant execute on function public.admin_list_songs() to authenticated;

create or replace function public.admin_list_products()
returns table (
  id uuid,
  hubla_product_id text,
  name text,
  slug text,
  grants_all_songs boolean,
  is_active boolean,
  song_ids uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.hubla_product_id, p.name, p.slug, p.grants_all_songs,
    p.is_active,
    coalesce(array_agg(ps.song_id) filter (where ps.song_id is not null), '{}'::uuid[])
  from public.products p
  left join public.product_songs ps on ps.product_id = p.id
  where public.is_admin()
  group by p.id
  order by p.created_at, p.name;
$$;

revoke all on function public.admin_list_products() from public, anon;
grant execute on function public.admin_list_products() to authenticated;

create or replace function public.admin_upsert_song(
  p_title text,
  p_slug text,
  p_subtitle text default null,
  p_icon text default '🎵',
  p_cover_path text default null,
  p_audio_path text default null,
  p_duration_seconds numeric default null,
  p_lyrics jsonb default '[]'::jsonb,
  p_is_published boolean default false,
  p_sort_order integer default 0,
  p_id uuid default null
)
returns public.songs
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.songs;
  safe_slug text := lower(trim(regexp_replace(coalesce(p_slug, p_title), '[^a-zA-Z0-9]+', '-', 'g')));
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'O título da música é obrigatório' using errcode = '22023';
  end if;
  safe_slug := trim(both '-' from safe_slug);
  if safe_slug = '' then safe_slug := 'musica'; end if;

  if p_id is null then
    insert into public.songs (
      title, slug, subtitle, icon, cover_path, audio_path, duration_seconds,
      lyrics, is_published, sort_order, created_by
    ) values (
      trim(p_title), safe_slug, nullif(trim(coalesce(p_subtitle, '')), ''),
      coalesce(nullif(trim(p_icon), ''), '🎵'), p_cover_path, p_audio_path,
      p_duration_seconds, coalesce(p_lyrics, '[]'::jsonb), p_is_published,
      coalesce(p_sort_order, 0), auth.uid()
    ) returning * into saved;
  else
    update public.songs set
      title = trim(p_title),
      slug = safe_slug,
      subtitle = nullif(trim(coalesce(p_subtitle, '')), ''),
      icon = coalesce(nullif(trim(p_icon), ''), '🎵'),
      cover_path = p_cover_path,
      audio_path = p_audio_path,
      duration_seconds = p_duration_seconds,
      lyrics = coalesce(p_lyrics, '[]'::jsonb),
      is_published = coalesce(p_is_published, false),
      sort_order = coalesce(p_sort_order, 0),
      updated_at = now()
    where id = p_id
    returning * into saved;
    if saved.id is null then
      raise exception 'Música não encontrada' using errcode = 'P0002';
    end if;
  end if;
  return saved;
end;
$$;

revoke all on function public.admin_upsert_song(text, text, text, text, text, text, numeric, jsonb, boolean, integer, uuid) from public, anon;
grant execute on function public.admin_upsert_song(text, text, text, text, text, text, numeric, jsonb, boolean, integer, uuid) to authenticated;

create or replace function public.admin_update_song_lyrics(p_song_id uuid, p_lyrics jsonb)
returns public.songs
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.songs;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  update public.songs
    set lyrics = coalesce(p_lyrics, '[]'::jsonb), updated_at = now()
    where id = p_song_id
    returning * into saved;
  if saved.id is null then
    raise exception 'Música não encontrada' using errcode = 'P0002';
  end if;
  return saved;
end;
$$;

revoke all on function public.admin_update_song_lyrics(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_song_lyrics(uuid, jsonb) to authenticated;

create or replace function public.admin_link_product_song(
  p_hubla_product_id text,
  p_song_id uuid,
  p_link boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  product_uuid uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  select id into product_uuid from public.products where hubla_product_id = trim(p_hubla_product_id);
  if product_uuid is null then
    raise exception 'Produto da Hubla não encontrado' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.songs where id = p_song_id) then
    raise exception 'Música não encontrada' using errcode = 'P0002';
  end if;
  if coalesce(p_link, true) then
    insert into public.product_songs(product_id, song_id)
    values (product_uuid, p_song_id)
    on conflict do nothing;
  else
    delete from public.product_songs where product_id = product_uuid and song_id = p_song_id;
  end if;
end;
$$;

revoke all on function public.admin_link_product_song(text, uuid, boolean) from public, anon;
grant execute on function public.admin_link_product_song(text, uuid, boolean) to authenticated;
