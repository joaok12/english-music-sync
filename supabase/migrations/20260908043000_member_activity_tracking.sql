-- Registro de uso da área de membros.
-- Cada combinação usuário + música tem uma única linha para que o percentual
-- conte faixas distintas, mesmo quando a pessoa escuta a mesma faixa várias vezes.

create table if not exists public.member_song_activity (
  member_id uuid not null references public.members(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  play_count integer not null default 0 check (play_count >= 0),
  seconds_listened numeric(12, 3) not null default 0 check (seconds_listened >= 0),
  first_listened_at timestamptz not null default now(),
  last_listened_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (member_id, song_id)
);

create index if not exists member_song_activity_last_idx
  on public.member_song_activity (last_listened_at desc);

alter table public.member_song_activity enable row level security;
revoke all on table public.member_song_activity from anon, authenticated;

-- O navegador só consegue registrar uma faixa que a sessão realmente pode
-- acessar. O CPF e qualquer outro dado sensível continuam fora desta tabela.
create or replace function public.record_song_listen(
  p_song_id uuid,
  p_is_start boolean default true,
  p_seconds_listened numeric default 0,
  p_completed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_member_id uuid;
  safe_seconds numeric(12, 3) := greatest(0, least(coalesce(p_seconds_listened, 0), 86400));
begin
  if auth.uid() is null then
    raise exception 'Sessão necessária' using errcode = '42501';
  end if;
  if p_song_id is null then
    raise exception 'Música inválida' using errcode = '22023';
  end if;

  select m.id
    into current_member_id
  from public.members m
  where m.auth_user_id = auth.uid()
  limit 1;

  if current_member_id is null then
    raise exception 'Membro não encontrado' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.songs song
    where song.id = p_song_id
      and song.is_published = true
      and (song.release_at is null or song.release_at <= now())
  ) then
    raise exception 'Esta música ainda não está disponível' using errcode = '42501';
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.members member
    join public.member_entitlements entitlement
      on entitlement.member_id = member.id
     and entitlement.subscription_status = 'active'
    join public.products product
      on product.hubla_product_id = entitlement.hubla_product_id
     and product.is_active = true
    join public.songs song on song.id = p_song_id
    where member.id = current_member_id
      and (
        product.grants_all_songs
        or exists (
          select 1
          from public.product_songs direct_song
          where direct_song.product_id = product.id
            and direct_song.song_id = song.id
        )
        or exists (
          select 1
          from public.playlist_songs mapped_song
          where mapped_song.playlist_id = product.playlist_id
            and mapped_song.song_id = song.id
        )
        or exists (
          select 1
          from public.playlist_songs owned_song
          join public.playlist_songs playlist_song
            on playlist_song.playlist_id = owned_song.playlist_id
           and playlist_song.song_id = song.id
          join public.product_songs product_playlist
            on product_playlist.product_id = product.id
           and product_playlist.song_id = owned_song.song_id
        )
      )
  ) then
    raise exception 'Você não possui acesso a esta música' using errcode = '42501';
  end if;

  insert into public.member_song_activity (
    member_id, song_id, play_count, seconds_listened,
    first_listened_at, last_listened_at, completed_at, updated_at
  ) values (
    current_member_id,
    p_song_id,
    case when coalesce(p_is_start, true) then 1 else 0 end,
    safe_seconds,
    now(),
    now(),
    case when coalesce(p_completed, false) then now() else null end,
    now()
  )
  on conflict (member_id, song_id) do update set
    play_count = public.member_song_activity.play_count
      + case when coalesce(p_is_start, true) then 1 else 0 end,
    seconds_listened = greatest(public.member_song_activity.seconds_listened, excluded.seconds_listened),
    last_listened_at = now(),
    completed_at = case
      when coalesce(p_completed, false) then coalesce(public.member_song_activity.completed_at, now())
      else public.member_song_activity.completed_at
    end,
    updated_at = now();
end;
$$;

revoke all on function public.record_song_listen(uuid, boolean, numeric, boolean) from public, anon;
grant execute on function public.record_song_listen(uuid, boolean, numeric, boolean) to authenticated;

-- Uma consulta já agregada deixa o painel leve e mostra somente membros, sem
-- expor a tabela de atividade diretamente ao cliente.
drop function if exists public.admin_list_member_activity();
create function public.admin_list_member_activity()
returns table (
  member_id uuid,
  email text,
  full_name text,
  total_songs integer,
  listened_songs integer,
  listened_percent numeric,
  last_listened_at timestamptz,
  product_names text[],
  songs_listened jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with eligible_songs as (
    select distinct
      member.id as member_id,
      song.id as song_id,
      song.title,
      song.sort_order,
      song.created_at
    from public.members member
    join public.member_entitlements entitlement
      on entitlement.member_id = member.id
     and entitlement.subscription_status = 'active'
    join public.products product
      on product.hubla_product_id = entitlement.hubla_product_id
     and product.is_active = true
    join public.songs song
      on song.is_published = true
     and (song.release_at is null or song.release_at <= now())
    where
      product.grants_all_songs
      or exists (
        select 1
        from public.product_songs direct_song
        where direct_song.product_id = product.id
          and direct_song.song_id = song.id
      )
      or exists (
        select 1
        from public.playlist_songs mapped_song
        where mapped_song.playlist_id = product.playlist_id
          and mapped_song.song_id = song.id
      )
      or exists (
        select 1
        from public.playlist_songs owned_song
        join public.playlist_songs playlist_song
          on playlist_song.playlist_id = owned_song.playlist_id
         and playlist_song.song_id = song.id
        join public.product_songs product_playlist
          on product_playlist.product_id = product.id
         and product_playlist.song_id = owned_song.song_id
      )
  ),
  member_products as (
    select
      member.id as member_id,
      coalesce(
        array_agg(distinct product.name order by product.name)
          filter (where product.id is not null),
        '{}'::text[]
      ) as product_names
    from public.members member
    left join public.member_entitlements entitlement
      on entitlement.member_id = member.id
     and entitlement.subscription_status = 'active'
    left join public.products product
      on product.hubla_product_id = entitlement.hubla_product_id
     and product.is_active = true
    group by member.id
  )
  select
    member.id,
    member.email,
    member.full_name,
    count(eligible.song_id)::integer,
    count(activity.song_id)::integer,
    case
      when count(eligible.song_id) = 0 then 0::numeric
      else round(
        count(activity.song_id)::numeric * 100
        / count(eligible.song_id)::numeric,
        1
      )
    end,
    max(activity.last_listened_at),
    member_products.product_names,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', eligible.song_id,
          'title', eligible.title,
          'play_count', activity.play_count,
          'seconds_listened', activity.seconds_listened,
          'last_listened_at', activity.last_listened_at,
          'completed', activity.completed_at is not null
        )
        order by eligible.sort_order, eligible.created_at, eligible.title
      ) filter (where activity.song_id is not null),
      '[]'::jsonb
    )
  from public.members member
  left join eligible_songs eligible on eligible.member_id = member.id
  left join public.member_song_activity activity
    on activity.member_id = member.id
   and activity.song_id = eligible.song_id
  join member_products on member_products.member_id = member.id
  where public.is_admin()
  group by member.id, member_products.product_names
  order by max(activity.last_listened_at) desc nulls last, member.created_at desc, member.email;
$$;

revoke all on function public.admin_list_member_activity() from public, anon;
grant execute on function public.admin_list_member_activity() to authenticated;
