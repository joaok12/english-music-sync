-- Playlists, ordering and scheduled availability for the protected catalog.
-- All catalog mutations stay behind security-definer functions checked by is_admin().

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  cover_path text,
  release_at timestamptz,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.songs add column if not exists release_at timestamptz;

create table if not exists public.playlist_songs (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (playlist_id, song_id)
);

create index if not exists playlist_songs_song_idx on public.playlist_songs(song_id, sort_order);
create index if not exists playlists_sort_idx on public.playlists(sort_order, created_at);

alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;
revoke all on table public.playlists from anon, authenticated;
revoke all on table public.playlist_songs from anon, authenticated;

-- These are the initial collections requested for the member area. Covers remain
-- local fallbacks until an administrator uploads a cover in the panel.
insert into public.playlists (title, slug, subtitle, sort_order, is_published)
values
  ('Inglês Cantando', 'ingles-cantando', 'Pratique cantando, uma música por vez.', 0, true),
  ('50 Gírias', '50-girias', 'Expressões naturais para conversar melhor.', 1, true)
on conflict (slug) do nothing;

-- Existing songs are placed automatically: the first “De boa” lesson belongs to
-- 50 Gírias and every other song starts in Inglês Cantando. This can be changed
-- at any time in the administrator panel.
insert into public.playlist_songs (playlist_id, song_id, sort_order)
select p.id, s.id, row_number() over (order by s.sort_order, s.created_at, s.title) - 1
from public.playlists p
cross join public.songs s
where p.slug = '50-girias'
  and lower(s.title) like 'de boa%'
on conflict (playlist_id, song_id) do nothing;

insert into public.playlist_songs (playlist_id, song_id, sort_order)
select p.id, s.id, row_number() over (order by s.sort_order, s.created_at, s.title) - 1
from public.playlists p
cross join public.songs s
where p.slug = 'ingles-cantando'
  and lower(s.title) not like 'de boa%'
on conflict (playlist_id, song_id) do nothing;

-- The release timer is per song. The “De boa” lesson is immediately available;
-- other seeded songs can be released together and then adjusted individually.
update public.songs
set release_at = case
  when lower(title) like 'de boa%' then null
  when release_at is null then '2026-09-11T00:00:00-03:00'::timestamptz
  else release_at
end;

create or replace function public.admin_list_playlists()
returns table (
  id uuid,
  title text,
  slug text,
  subtitle text,
  cover_path text,
  release_at timestamptz,
  is_published boolean,
  sort_order integer,
  song_ids uuid[],
  song_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.title, p.slug, p.subtitle, p.cover_path, p.release_at,
    p.is_published, p.sort_order,
    coalesce(array_agg(ps.song_id order by ps.sort_order, ps.created_at)
      filter (where ps.song_id is not null), '{}'::uuid[]),
    count(ps.song_id)::integer,
    p.created_at, p.updated_at
  from public.playlists p
  left join public.playlist_songs ps on ps.playlist_id = p.id
  where public.is_admin()
  group by p.id
  order by p.sort_order, p.created_at, p.title;
$$;

revoke all on function public.admin_list_playlists() from public, anon;
grant execute on function public.admin_list_playlists() to authenticated;

create or replace function public.admin_upsert_playlist(
  p_title text,
  p_slug text,
  p_subtitle text default null,
  p_cover_path text default null,
  p_release_at timestamptz default null,
  p_is_published boolean default true,
  p_sort_order integer default 0,
  p_song_ids uuid[] default '{}'::uuid[],
  p_id uuid default null
)
returns public.playlists
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.playlists;
  safe_slug text := lower(trim(regexp_replace(coalesce(p_slug, p_title), '[^a-zA-Z0-9]+', '-', 'g')));
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'O nome da playlist é obrigatório' using errcode = '22023';
  end if;
  safe_slug := trim(both '-' from safe_slug);
  if safe_slug = '' then safe_slug := 'playlist'; end if;

  if p_id is null then
    insert into public.playlists (
      title, slug, subtitle, cover_path, release_at, is_published,
      sort_order, created_by
    ) values (
      trim(p_title), safe_slug,
      nullif(trim(coalesce(p_subtitle, '')), ''), p_cover_path, p_release_at,
      coalesce(p_is_published, true), coalesce(p_sort_order, 0), auth.uid()
    ) returning * into saved;
  else
    update public.playlists set
      title = trim(p_title),
      slug = safe_slug,
      subtitle = nullif(trim(coalesce(p_subtitle, '')), ''),
      cover_path = p_cover_path,
      release_at = p_release_at,
      is_published = coalesce(p_is_published, true),
      sort_order = coalesce(p_sort_order, 0),
      updated_at = now()
    where id = p_id
    returning * into saved;
    if saved.id is null then
      raise exception 'Playlist não encontrada' using errcode = 'P0002';
    end if;
  end if;

  delete from public.playlist_songs where playlist_id = saved.id;
  insert into public.playlist_songs (playlist_id, song_id, sort_order)
  select saved.id, item.song_id, item.position - 1
  from unnest(coalesce(p_song_ids, '{}'::uuid[])) with ordinality as item(song_id, position)
  where exists (select 1 from public.songs s where s.id = item.song_id)
  on conflict (playlist_id, song_id) do update set sort_order = excluded.sort_order;

  return saved;
end;
$$;

revoke all on function public.admin_upsert_playlist(text, text, text, text, timestamptz, boolean, integer, uuid[], uuid) from public, anon;
grant execute on function public.admin_upsert_playlist(text, text, text, text, timestamptz, boolean, integer, uuid[], uuid) to authenticated;

create or replace function public.admin_delete_playlist(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  delete from public.playlists where id = p_id;
  if not found then
    raise exception 'Playlist não encontrada' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_delete_playlist(uuid) from public, anon;
grant execute on function public.admin_delete_playlist(uuid) to authenticated;

create or replace function public.admin_set_song_playlists(
  p_song_id uuid,
  p_playlist_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  if not exists (select 1 from public.songs where id = p_song_id) then
    raise exception 'Música não encontrada' using errcode = 'P0002';
  end if;
  delete from public.playlist_songs where song_id = p_song_id;
  insert into public.playlist_songs (playlist_id, song_id, sort_order)
  select item.playlist_id, p_song_id, item.position - 1
  from unnest(coalesce(p_playlist_ids, '{}'::uuid[])) with ordinality as item(playlist_id, position)
  where exists (select 1 from public.playlists p where p.id = item.playlist_id)
  on conflict (playlist_id, song_id) do update set sort_order = excluded.sort_order;
end;
$$;

revoke all on function public.admin_set_song_playlists(uuid, uuid[]) from public, anon;
grant execute on function public.admin_set_song_playlists(uuid, uuid[]) to authenticated;

create or replace function public.admin_update_song_release(
  p_song_id uuid,
  p_release_at timestamptz default null
)
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
  update public.songs set release_at = p_release_at, updated_at = now()
  where id = p_song_id
  returning * into saved;
  if saved.id is null then
    raise exception 'Música não encontrada' using errcode = 'P0002';
  end if;
  return saved;
end;
$$;

revoke all on function public.admin_update_song_release(uuid, timestamptz) from public, anon;
grant execute on function public.admin_update_song_release(uuid, timestamptz) to authenticated;

drop function if exists public.admin_list_songs();
create function public.admin_list_songs()
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
  release_at timestamptz,
  playlist_ids uuid[],
  playlist_names text[],
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
    s.sort_order, s.release_at,
    coalesce(array_agg(p.id order by p.sort_order, p.title)
      filter (where p.id is not null), '{}'::uuid[]),
    coalesce(array_agg(p.title order by p.sort_order, p.title)
      filter (where p.id is not null), '{}'::text[]),
    s.created_at, s.updated_at
  from public.songs s
  left join public.playlist_songs ps on ps.song_id = s.id
  left join public.playlists p on p.id = ps.playlist_id
  where public.is_admin()
  group by s.id
  order by s.sort_order, s.created_at, s.title;
$$;

revoke all on function public.admin_list_songs() from public, anon;
grant execute on function public.admin_list_songs() to authenticated;

drop function if exists public.get_member_playlists();
create function public.get_member_playlists()
returns table (
  playlist_id uuid,
  title text,
  slug text,
  subtitle text,
  cover_path text,
  release_at timestamptz,
  is_available boolean,
  song_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.title, p.slug, p.subtitle, p.cover_path, p.release_at,
    (p.release_at is null or p.release_at <= now()),
    (
      select count(*)::integer
      from public.playlist_songs ps_count
      join public.songs s_count on s_count.id = ps_count.song_id
      where ps_count.playlist_id = p.id
        and (public.is_admin() or (
          s_count.is_published
          and exists (
            select 1
            from public.members m_count
            join public.member_entitlements e_count on e_count.member_id = m_count.id
              and e_count.subscription_status = 'active'
            join public.products product_count on product_count.hubla_product_id = e_count.hubla_product_id
              and product_count.is_active = true
            where m_count.auth_user_id = auth.uid()
              and (product_count.grants_all_songs or exists (
                select 1 from public.product_songs access_count
                where access_count.product_id = product_count.id
                  and access_count.song_id = s_count.id
              ))
          )
        ))
    )
  from public.playlists p
  where p.is_published = true
    and (public.is_admin() or exists (
      select 1
      from public.playlist_songs ps_visible
      join public.songs s_visible on s_visible.id = ps_visible.song_id
      join public.members m_visible on m_visible.auth_user_id = auth.uid()
      join public.member_entitlements e_visible on e_visible.member_id = m_visible.id
        and e_visible.subscription_status = 'active'
      join public.products product_visible on product_visible.hubla_product_id = e_visible.hubla_product_id
        and product_visible.is_active = true
      where ps_visible.playlist_id = p.id
        and s_visible.is_published
        and (product_visible.grants_all_songs or exists (
          select 1 from public.product_songs access_visible
          where access_visible.product_id = product_visible.id
            and access_visible.song_id = s_visible.id
        ))
    ))
  order by p.sort_order, p.created_at, p.title;
$$;

revoke all on function public.get_member_playlists() from public, anon;
grant execute on function public.get_member_playlists() to authenticated;

drop function if exists public.get_my_playlist_songs(uuid);
create function public.get_my_playlist_songs(p_playlist_id uuid)
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
  product_name text,
  release_at timestamptz,
  is_available boolean,
  playlist_id uuid,
  playlist_title text,
  playlist_cover_path text
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
    case when public.is_admin() or (s.release_at is null or s.release_at <= now()) then s.lyrics else '[]'::jsonb end,
    access_product.id,
    access_product.name,
    s.release_at,
    (public.is_admin() or s.release_at is null or s.release_at <= now()),
    p.id,
    p.title,
    p.cover_path
  from public.playlist_songs playlist_link
  join public.playlists p on p.id = playlist_link.playlist_id
  join public.songs s on s.id = playlist_link.song_id
  left join lateral (
    select product.id, product.name
    from public.members m
    join public.member_entitlements e on e.member_id = m.id
      and e.subscription_status = 'active'
    join public.products product on product.hubla_product_id = e.hubla_product_id
      and product.is_active = true
    where m.auth_user_id = auth.uid()
      and (product.grants_all_songs or exists (
        select 1 from public.product_songs product_song
        where product_song.product_id = product.id
          and product_song.song_id = s.id
      ))
    order by product.name
    limit 1
  ) access_product on true
  where playlist_link.playlist_id = p_playlist_id
    and p.is_published = true
    and (public.is_admin() or (s.is_published and access_product.id is not null))
  order by s.id, playlist_link.sort_order, access_product.name;
$$;

revoke all on function public.get_my_playlist_songs(uuid) from public, anon;
grant execute on function public.get_my_playlist_songs(uuid) to authenticated;

drop function if exists public.get_my_library();
create function public.get_my_library()
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
  product_name text,
  release_at timestamptz,
  is_available boolean,
  playlist_id uuid,
  playlist_title text,
  playlist_cover_path text
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
        s.audio_path, s.duration_seconds, s.lyrics, null::uuid, null::text,
        s.release_at, true, pl.id, pl.title, pl.cover_path
      from public.songs s
      left join lateral (
        select p.id, p.title, p.cover_path
        from public.playlist_songs ps
        join public.playlists p on p.id = ps.playlist_id
        where ps.song_id = s.id
        order by p.sort_order, ps.sort_order, p.title
        limit 1
      ) pl on true
      order by s.sort_order, s.created_at, s.title;
    return;
  end if;

  return query
    select distinct on (s.id)
      s.id, s.title, s.slug, s.subtitle, s.icon, s.cover_path,
      s.audio_path, s.duration_seconds, s.lyrics, p.id, p.name,
      s.release_at, (s.release_at is null or s.release_at <= now()),
      pl.id, pl.title, pl.cover_path
    from public.members m
    join public.member_entitlements e on e.member_id = m.id
      and e.subscription_status = 'active'
    join public.products p on p.hubla_product_id = e.hubla_product_id
      and p.is_active = true
    join public.songs s on s.is_published = true
      and (p.grants_all_songs or exists (
        select 1 from public.product_songs ps_access
        where ps_access.product_id = p.id and ps_access.song_id = s.id
      ))
    left join lateral (
      select pl_inner.id, pl_inner.title, pl_inner.cover_path
      from public.playlist_songs ps_inner
      join public.playlists pl_inner on pl_inner.id = ps_inner.playlist_id
      where ps_inner.song_id = s.id
      order by pl_inner.sort_order, ps_inner.sort_order, pl_inner.title
      limit 1
    ) pl on true
    where m.auth_user_id = auth.uid()
    order by s.id, p.name;
end;
$$;

revoke all on function public.get_my_library() from public, anon;
grant execute on function public.get_my_library() to authenticated;

-- The explore rail also knows when an entitled song is still scheduled. Lyrics
-- remain hidden until the release date, even though the member can see the card.
drop function if exists public.get_member_catalog();
create function public.get_member_catalog()
returns table (
  song_id uuid,
  title text,
  slug text,
  subtitle text,
  icon text,
  cover_path text,
  duration_seconds numeric,
  lyrics jsonb,
  is_accessible boolean,
  product_id uuid,
  product_name text,
  checkout_url text,
  release_at timestamptz,
  is_available boolean
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
    s.duration_seconds,
    case when public.is_admin() or (exists (
      select 1
      from public.members m
      join public.member_entitlements e on e.member_id = m.id
        and e.subscription_status = 'active'
      where m.auth_user_id = auth.uid()
        and e.hubla_product_id = p.hubla_product_id
    ) and (s.release_at is null or s.release_at <= now())) then s.lyrics else '[]'::jsonb end,
    (public.is_admin() or exists (
      select 1
      from public.members m
      join public.member_entitlements e on e.member_id = m.id
        and e.subscription_status = 'active'
      where m.auth_user_id = auth.uid()
        and e.hubla_product_id = p.hubla_product_id
    )) as is_accessible,
    p.id,
    p.name,
    p.checkout_url,
    s.release_at,
    (s.release_at is null or s.release_at <= now()) as is_available
  from public.songs s
  join public.products p on p.is_active = true
    and (p.grants_all_songs or exists (
      select 1 from public.product_songs ps
      where ps.product_id = p.id and ps.song_id = s.id
    ))
  where s.is_published = true or public.is_admin()
  order by s.id, is_accessible desc, p.name;
$$;

revoke all on function public.get_member_catalog() from public, anon;
grant execute on function public.get_member_catalog() to authenticated;
