-- Cinco aulas reais em breve para a playlist 50 Gírias.
-- Os registros ficam no banco desde já, mas só aparecem no catálogo
-- administrativo quando a data de liberação chegar.

insert into public.songs (
  title, slug, subtitle, icon, lyrics, is_published, sort_order, release_at
)
select
  '50 Gírias • Música ' || lpad(number::text, 2, '0'),
  '50-girias-em-breve-' || lpad(number::text, 2, '0'),
  'Nova aula em breve.',
  '💬',
  '[]'::jsonb,
  true,
  100 + number,
  '2026-09-11T00:00:00-03:00'::timestamptz
from generate_series(1, 5) as upcoming(number)
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  icon = excluded.icon,
  is_published = true,
  sort_order = excluded.sort_order,
  release_at = excluded.release_at,
  updated_at = now();

insert into public.playlist_songs (playlist_id, song_id, sort_order)
select
  playlist.id,
  song.id,
  100 + split_part(song.slug, '50-girias-em-breve-', 2)::integer
from public.playlists playlist
join public.songs song on song.slug like '50-girias-em-breve-%'
where playlist.slug = '50-girias'
on conflict (playlist_id, song_id) do update
  set sort_order = excluded.sort_order;

-- A tela administrativa deve mostrar somente o que já pode ser configurado.
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
    and (s.release_at is null or s.release_at <= now())
  group by s.id
  order by s.sort_order, s.created_at, s.title;
$$;

revoke all on function public.admin_list_songs() from public, anon;
grant execute on function public.admin_list_songs() to authenticated;

-- Playlists continuam configuráveis com as faixas liberadas. Os vínculos das
-- aulas futuras são preservados quando uma playlist é salva pelo painel.
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
      filter (where s.id is not null and (s.release_at is null or s.release_at <= now())), '{}'::uuid[]),
    (count(s.id) filter (where s.id is not null and (s.release_at is null or s.release_at <= now())))::integer,
    p.created_at, p.updated_at
  from public.playlists p
  left join public.playlist_songs ps on ps.playlist_id = p.id
  left join public.songs s on s.id = ps.song_id
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

  -- O painel recebe apenas faixas liberadas. Nunca apague os vínculos futuros
  -- ao editar o título, capa ou ordem da playlist.
  delete from public.playlist_songs playlist_song
  using public.songs song
  where playlist_song.playlist_id = saved.id
    and song.id = playlist_song.song_id
    and (song.release_at is null or song.release_at <= now());

  insert into public.playlist_songs (playlist_id, song_id, sort_order)
  select saved.id, item.song_id, item.position - 1
  from unnest(coalesce(p_song_ids, '{}'::uuid[])) with ordinality as item(song_id, position)
  where exists (
    select 1
    from public.songs song
    where song.id = item.song_id
      and (song.release_at is null or song.release_at <= now())
  )
  on conflict (playlist_id, song_id) do update set sort_order = excluded.sort_order;

  return saved;
end;
$$;

revoke all on function public.admin_upsert_playlist(text, text, text, text, timestamptz, boolean, integer, uuid[], uuid) from public, anon;
grant execute on function public.admin_upsert_playlist(text, text, text, text, timestamptz, boolean, integer, uuid[], uuid) to authenticated;
