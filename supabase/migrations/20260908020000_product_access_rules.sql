-- Produto base, order bumps e regras de identificação automática.
-- Um produto pode liberar uma playlist inteira e pode ser reconhecido por ID
-- exato ou por um trecho do nome recebido da Hubla.

alter table public.products
  add column if not exists playlist_id uuid references public.playlists(id) on delete set null,
  add column if not exists is_order_bump boolean not null default false,
  add column if not exists price numeric(10, 2);

create index if not exists products_playlist_idx on public.products (playlist_id, is_active);

create table if not exists public.product_access_rules (
  id uuid primary key default gen_random_uuid(),
  hubla_product_id text,
  name_contains text,
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  is_order_bump boolean not null default false,
  price numeric(10, 2),
  checkout_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_access_rules_match_check check (
    nullif(trim(coalesce(hubla_product_id, '')), '') is not null
    or nullif(trim(coalesce(name_contains, '')), '') is not null
  )
);

create index if not exists product_access_rules_name_idx
  on public.product_access_rules (lower(name_contains));

create unique index if not exists product_access_rules_hubla_id_idx
  on public.product_access_rules (hubla_product_id)
  where hubla_product_id is not null;

alter table public.product_access_rules enable row level security;
revoke all on table public.product_access_rules from anon, authenticated;

-- Os IDs canônicos encontrados no primeiro checkout real de teste.
insert into public.product_access_rules (
  hubla_product_id, playlist_id, is_order_bump, is_active
)
select 'xcxHSWfX6ERvTrz3Seou', p.id, false, true
from public.playlists p
where p.slug = 'ingles-cantando'
  and not exists (
    select 1 from public.product_access_rules r
    where r.hubla_product_id = 'xcxHSWfX6ERvTrz3Seou'
  );

insert into public.product_access_rules (
  hubla_product_id, playlist_id, is_order_bump, is_active
)
select 'c90yIvXcukcQuuG3HidD', p.id, true, true
from public.playlists p
where p.slug = '50-girias'
  and not exists (
    select 1 from public.product_access_rules r
    where r.hubla_product_id = 'c90yIvXcukcQuuG3HidD'
  );

update public.products product
set playlist_id = playlist.id,
    is_order_bump = false,
    updated_at = now()
from public.playlists playlist
where product.hubla_product_id = 'xcxHSWfX6ERvTrz3Seou'
  and playlist.slug = 'ingles-cantando';

update public.products product
set playlist_id = playlist.id,
    is_order_bump = true,
    updated_at = now()
from public.playlists playlist
where product.hubla_product_id = 'c90yIvXcukcQuuG3HidD'
  and playlist.slug = '50-girias';

-- Estes IDs vieram somente no array de itens da fatura de teste (são IDs de
-- oferta/linha, não os IDs canônicos dos produtos) e não devem aparecer como
-- ofertas independentes para os alunos.
update public.products
set is_active = false, updated_at = now()
where hubla_product_id in ('OO9DfFaGU6rseONUIqUd', 'oV4fg2STcpi2hleWqE4E');

drop function if exists public.admin_list_products();
create function public.admin_list_products()
returns table (
  id uuid,
  hubla_product_id text,
  name text,
  slug text,
  checkout_url text,
  playlist_id uuid,
  playlist_title text,
  is_order_bump boolean,
  price numeric,
  grants_all_songs boolean,
  is_active boolean,
  song_ids uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.hubla_product_id, p.name, p.slug, p.checkout_url,
    p.playlist_id, playlist.title, p.is_order_bump, p.price,
    p.grants_all_songs, p.is_active,
    coalesce(array_agg(ps.song_id) filter (where ps.song_id is not null), '{}'::uuid[])
  from public.products p
  left join public.playlists playlist on playlist.id = p.playlist_id
  left join public.product_songs ps on ps.product_id = p.id
  where public.is_admin()
  group by p.id, playlist.title
  order by p.is_active desc, p.created_at, p.name;
$$;

revoke all on function public.admin_list_products() from public, anon;
grant execute on function public.admin_list_products() to authenticated;

create or replace function public.admin_update_product_access(
  p_hubla_product_id text,
  p_playlist_id uuid default null,
  p_is_order_bump boolean default false,
  p_price numeric default null,
  p_checkout_url text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.products;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  if p_playlist_id is not null and not exists (
    select 1 from public.playlists where id = p_playlist_id
  ) then
    raise exception 'Playlist não encontrada' using errcode = 'P0002';
  end if;
  update public.products
  set playlist_id = p_playlist_id,
      is_order_bump = coalesce(p_is_order_bump, false),
      price = p_price,
      checkout_url = nullif(trim(coalesce(p_checkout_url, '')), ''),
      updated_at = now()
  where hubla_product_id = trim(p_hubla_product_id)
  returning * into saved;
  if saved.id is null then
    raise exception 'Produto da Hubla não encontrado' using errcode = 'P0002';
  end if;
  return saved;
end;
$$;

revoke all on function public.admin_update_product_access(text, uuid, boolean, numeric, text) from public, anon;
grant execute on function public.admin_update_product_access(text, uuid, boolean, numeric, text) to authenticated;

create or replace function public.admin_list_product_rules()
returns table (
  id uuid,
  hubla_product_id text,
  name_contains text,
  playlist_id uuid,
  playlist_title text,
  is_order_bump boolean,
  price numeric,
  checkout_url text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.hubla_product_id, r.name_contains, r.playlist_id,
    p.title, r.is_order_bump, r.price, r.checkout_url, r.is_active,
    r.created_at, r.updated_at
  from public.product_access_rules r
  join public.playlists p on p.id = r.playlist_id
  where public.is_admin()
  order by r.is_active desc, r.created_at, r.name_contains, r.hubla_product_id;
$$;

revoke all on function public.admin_list_product_rules() from public, anon;
grant execute on function public.admin_list_product_rules() to authenticated;

create or replace function public.admin_upsert_product_rule(
  p_hubla_product_id text default null,
  p_name_contains text default null,
  p_playlist_id uuid default null,
  p_is_order_bump boolean default false,
  p_price numeric default null,
  p_checkout_url text default null,
  p_is_active boolean default true,
  p_id uuid default null
)
returns public.product_access_rules
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.product_access_rules;
  existing_id uuid;
  safe_id text := nullif(trim(coalesce(p_hubla_product_id, '')), '');
  safe_name text := nullif(trim(coalesce(p_name_contains, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  if safe_id is null and safe_name is null then
    raise exception 'Informe o ID do produto ou uma palavra do nome' using errcode = '22023';
  end if;
  if p_playlist_id is null or not exists (
    select 1 from public.playlists where id = p_playlist_id
  ) then
    raise exception 'Escolha uma playlist para este produto' using errcode = '22023';
  end if;

  if p_id is null and safe_id is not null then
    select id into existing_id
    from public.product_access_rules
    where hubla_product_id = safe_id
    limit 1;
    p_id := existing_id;
  end if;

  if p_id is null then
    insert into public.product_access_rules (
      hubla_product_id, name_contains, playlist_id, is_order_bump,
      price, checkout_url, is_active
    ) values (
      safe_id, safe_name, p_playlist_id, coalesce(p_is_order_bump, false),
      p_price, nullif(trim(coalesce(p_checkout_url, '')), ''), coalesce(p_is_active, true)
    ) returning * into saved;
  else
    update public.product_access_rules set
      hubla_product_id = safe_id,
      name_contains = safe_name,
      playlist_id = p_playlist_id,
      is_order_bump = coalesce(p_is_order_bump, false),
      price = p_price,
      checkout_url = nullif(trim(coalesce(p_checkout_url, '')), ''),
      is_active = coalesce(p_is_active, true),
      updated_at = now()
    where id = p_id
    returning * into saved;
    if saved.id is null then
      raise exception 'Regra não encontrada' using errcode = 'P0002';
    end if;
  end if;

  -- Aplica imediatamente a regra aos produtos que já chegaram.
  update public.products product
  set playlist_id = saved.playlist_id,
      is_order_bump = saved.is_order_bump,
      price = saved.price,
      checkout_url = saved.checkout_url,
      is_active = saved.is_active,
      updated_at = now()
  where saved.is_active
    and (
      (saved.hubla_product_id is not null and product.hubla_product_id = saved.hubla_product_id)
      or (saved.name_contains is not null and lower(product.name) like '%' || lower(saved.name_contains) || '%')
    );

  return saved;
end;
$$;

revoke all on function public.admin_upsert_product_rule(text, text, uuid, boolean, numeric, text, boolean, uuid) from public, anon;
grant execute on function public.admin_upsert_product_rule(text, text, uuid, boolean, numeric, text, boolean, uuid) to authenticated;

create or replace function public.admin_delete_product_rule(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário' using errcode = '42501';
  end if;
  delete from public.product_access_rules where id = p_id;
  if not found then
    raise exception 'Regra não encontrada' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_delete_product_rule(uuid) from public, anon;
grant execute on function public.admin_delete_product_rule(uuid) to authenticated;

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
  song_count integer,
  is_accessible boolean,
  product_id uuid,
  product_name text,
  checkout_url text,
  is_order_bump boolean,
  price numeric
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
    ),
    coalesce(access_product.is_accessible, false),
    access_product.id, access_product.name, access_product.checkout_url,
    coalesce(access_product.is_order_bump, false), access_product.price
  from public.playlists p
  left join lateral (
    select product.id, product.name, product.checkout_url,
      product.is_order_bump, product.price,
      (
        public.is_admin() or exists (
          select 1
          from public.members m
          join public.member_entitlements e on e.member_id = m.id
            and e.subscription_status = 'active'
          where m.auth_user_id = auth.uid()
            and e.hubla_product_id = product.hubla_product_id
        )
      ) as is_accessible
    from public.products product
    where product.is_active
      and (
        product.playlist_id = p.id
        or product.grants_all_songs
        or exists (
          select 1
          from public.product_songs product_song
          join public.playlist_songs playlist_song on playlist_song.playlist_id = p.id
            and playlist_song.song_id = product_song.song_id
          where product_song.product_id = product.id
        )
      )
    order by is_accessible desc, product.is_order_bump, product.created_at, product.name
    limit 1
  ) access_product on true
  where p.is_published
    and (public.is_admin() or access_product.id is not null)
  order by p.sort_order, p.created_at, p.title;
$$;

revoke all on function public.get_member_playlists() from public, anon;
grant execute on function public.get_member_playlists() to authenticated;

create or replace function public.get_my_playlist_songs(p_playlist_id uuid)
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
      and (
        product.playlist_id = p.id
        or product.grants_all_songs
        or exists (
          select 1
          from public.product_songs product_song
          join public.playlist_songs playlist_song on playlist_song.playlist_id = p.id
            and playlist_song.song_id = product_song.song_id
          where product_song.product_id = product.id
        )
      )
    order by product.name
    limit 1
  ) access_product on true
  where playlist_link.playlist_id = p_playlist_id
    and p.is_published = true
    and (p.release_at is null or p.release_at <= now())
    and (public.is_admin() or (s.is_published and access_product.id is not null))
  order by s.id, playlist_link.sort_order, access_product.name;
$$;

revoke all on function public.get_my_playlist_songs(uuid) from public, anon;
grant execute on function public.get_my_playlist_songs(uuid) to authenticated;

drop function if exists public.get_member_offers();
create function public.get_member_offers()
returns table (
  product_id uuid,
  hubla_product_id text,
  name text,
  checkout_url text,
  has_access boolean,
  playlist_id uuid,
  playlist_title text,
  is_order_bump boolean,
  price numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.hubla_product_id, p.name, p.checkout_url,
    exists (
      select 1
      from public.members m
      join public.member_entitlements e on e.member_id = m.id
        and e.subscription_status = 'active'
      where m.auth_user_id = auth.uid()
        and e.hubla_product_id = p.hubla_product_id
    ),
    p.playlist_id, playlist.title, p.is_order_bump, p.price
  from public.products p
  left join public.playlists playlist on playlist.id = p.playlist_id
  where p.is_active
    and not public.is_admin()
    and not exists (
      select 1
      from public.members m
      join public.member_entitlements e on e.member_id = m.id
        and e.subscription_status = 'active'
      where m.auth_user_id = auth.uid()
        and e.hubla_product_id = p.hubla_product_id
    )
  order by p.is_order_bump desc, p.created_at, p.name;
$$;

revoke all on function public.get_member_offers() from public, anon;
grant execute on function public.get_member_offers() to authenticated;

-- A coluna playlist_id também concede o acesso na biblioteca antiga, caso ela
-- ainda seja usada por alguma tela legada.
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
          select 1 from public.playlist_songs mapped_song
          where mapped_song.playlist_id = p.playlist_id and mapped_song.song_id = s.id
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
