-- Correction migration for the member launch catalog.
-- Existing lessons stay available; twenty new lessons are the only scheduled
-- entries. This file is intentionally idempotent so it also repairs a project
-- where the previous playlists migration was already applied.

alter table public.songs add column if not exists release_at timestamptz;

update public.songs
set release_at = null
where slug not like 'ingles-cantando-em-breve-%';

insert into public.songs (
  title, slug, subtitle, icon, lyrics, is_published, sort_order, release_at
)
select
  'Inglês Cantando • Música ' || lpad(number::text, 2, '0'),
  'ingles-cantando-em-breve-' || lpad(number::text, 2, '0'),
  'Nova aula em breve.',
  '🎤',
  '[]'::jsonb,
  true,
  100 + number,
  '2026-09-11T00:00:00-03:00'::timestamptz
from generate_series(1, 20) as upcoming(number)
on conflict (slug) do update set
  is_published = true,
  release_at = coalesce(public.songs.release_at, excluded.release_at);

insert into public.playlist_songs (playlist_id, song_id, sort_order)
select p.id, s.id, 100 + split_part(s.slug, 'ingles-cantando-em-breve-', 2)::integer
from public.playlists p
join public.songs s on s.slug like 'ingles-cantando-em-breve-%'
where p.slug = 'ingles-cantando'
on conflict (playlist_id, song_id) do update set sort_order = excluded.sort_order;

create or replace function public.get_member_playlists()
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
        and (public.is_admin() or s_count.is_published)
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
          select 1
          from public.product_songs access_visible
          join public.playlist_songs playlist_visible on playlist_visible.playlist_id = p.id
            and playlist_visible.song_id = access_visible.song_id
          where access_visible.product_id = product_visible.id
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
    s.id, s.title, s.slug, s.subtitle, s.icon, s.cover_path,
    s.audio_path, s.duration_seconds,
    case when public.is_admin() or (s.release_at is null or s.release_at <= now())
      then s.lyrics else '[]'::jsonb end,
    access_product.id, access_product.name, s.release_at,
    (public.is_admin() or s.release_at is null or s.release_at <= now()),
    p.id, p.title, p.cover_path
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
        select 1
        from public.product_songs product_song
        join public.playlist_songs playlist_song on playlist_song.playlist_id = p_playlist_id
          and playlist_song.song_id = product_song.song_id
        where product_song.product_id = product.id
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
      and (
        p.grants_all_songs
        or exists (
          select 1 from public.product_songs ps_access
          where ps_access.product_id = p.id and ps_access.song_id = s.id
        )
        or exists (
          select 1
          from public.playlist_songs ps_owned
          join public.playlist_songs ps_playlist on ps_playlist.playlist_id = ps_owned.playlist_id
            and ps_playlist.song_id = s.id
          join public.product_songs product_playlist on product_playlist.product_id = p.id
            and product_playlist.song_id = ps_owned.song_id
        )
      )
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
