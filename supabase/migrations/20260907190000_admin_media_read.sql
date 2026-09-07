-- Administradores também conseguem testar o karaokê e revisar os áudios
-- cadastrados, mesmo sem depender de uma compra na tabela de membros.
drop policy if exists "members can read entitled song media" on storage.objects;

create policy "members and admins can read song media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'song-media'
    and (public.is_admin() or public.can_read_song_media(name))
  );
