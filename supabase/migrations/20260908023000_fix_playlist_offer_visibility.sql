-- Produtos globais (como o acesso interno de teste) só aparecem para quem
-- realmente possui o entitlement. Ofertas bloqueadas precisam estar ligadas a
-- uma playlist ou a músicas daquela playlist.

create or replace function public.get_member_playlists()
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
        or exists (
          select 1
          from public.product_songs product_song
          join public.playlist_songs playlist_song on playlist_song.playlist_id = p.id
            and playlist_song.song_id = product_song.song_id
          where product_song.product_id = product.id
        )
        or (
          product.grants_all_songs
          and exists (
            select 1
            from public.members owned_member
            join public.member_entitlements owned_entitlement
              on owned_entitlement.member_id = owned_member.id
             and owned_entitlement.subscription_status = 'active'
            where owned_member.auth_user_id = auth.uid()
              and owned_entitlement.hubla_product_id = product.hubla_product_id
          )
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
