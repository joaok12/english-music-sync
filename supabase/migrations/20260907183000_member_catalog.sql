-- Catálogo público da área de membros: músicas liberadas, músicas bloqueadas
-- e ofertas ainda não compradas. O preço não é armazenado nem exibido aqui;
-- cada produto pode apontar para seu checkout da Hubla.

alter table public.products add column if not exists checkout_url text;

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
      and e.subscription_status = 'active'
    join public.products p on p.hubla_product_id = e.hubla_product_id
      and p.is_active = true
    join public.songs s on s.is_published = true
      and (p.grants_all_songs or exists (
        select 1 from public.product_songs ps
        where ps.product_id = p.id and ps.song_id = s.id
      ))
    where m.auth_user_id = auth.uid()
    order by s.id, p.name;
end;
$$;

revoke all on function public.get_my_library() from public, anon;
grant execute on function public.get_my_library() to authenticated;

create or replace function public.get_member_catalog()
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
  checkout_url text
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
    case when public.is_admin() or exists (
      select 1
      from public.members m
      join public.member_entitlements e on e.member_id = m.id
        and e.subscription_status = 'active'
      where m.auth_user_id = auth.uid()
        and e.hubla_product_id = p.hubla_product_id
    ) then s.lyrics else '[]'::jsonb end,
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
    p.checkout_url
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

create or replace function public.get_member_offers()
returns table (
  product_id uuid,
  hubla_product_id text,
  name text,
  checkout_url text,
  has_access boolean
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
    ) as has_access
  from public.products p
  where p.is_active = true
    and not public.is_admin()
    and not exists (
      select 1
      from public.members m
      join public.member_entitlements e on e.member_id = m.id
        and e.subscription_status = 'active'
      where m.auth_user_id = auth.uid()
        and e.hubla_product_id = p.hubla_product_id
    )
  order by p.created_at, p.name;
$$;

revoke all on function public.get_member_offers() from public, anon;
grant execute on function public.get_member_offers() to authenticated;

drop function if exists public.admin_list_products();
create function public.admin_list_products()
returns table (
  id uuid,
  hubla_product_id text,
  name text,
  slug text,
  checkout_url text,
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
    p.grants_all_songs, p.is_active,
    coalesce(array_agg(ps.song_id) filter (where ps.song_id is not null), '{}'::uuid[])
  from public.products p
  left join public.product_songs ps on ps.product_id = p.id
  where public.is_admin()
  group by p.id
  order by p.created_at, p.name;
$$;

revoke all on function public.admin_list_products() from public, anon;
grant execute on function public.admin_list_products() to authenticated;

create or replace function public.admin_update_product_checkout(
  p_hubla_product_id text,
  p_checkout_url text
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
  update public.products
    set checkout_url = nullif(trim(coalesce(p_checkout_url, '')), ''), updated_at = now()
    where hubla_product_id = trim(p_hubla_product_id)
    returning * into saved;
  if saved.id is null then
    raise exception 'Produto da Hubla não encontrado' using errcode = 'P0002';
  end if;
  return saved;
end;
$$;

revoke all on function public.admin_update_product_checkout(text, text) from public, anon;
grant execute on function public.admin_update_product_checkout(text, text) to authenticated;
