-- Sizzle Delivery — bucket de imagens (Supabase Storage)
-- Rode este script no SQL Editor do Supabase DEPOIS de 011_restaurant_archiving.sql.
--
-- Corrige o problema de fotos de loja/perfil sendo salvas como base64 direto
-- no banco (inflava a página inicial pra vários MB) — agora o upload vai
-- pra esse bucket e só a URL pública é salva em restaurants.image_url /
-- profiles.avatar_url.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;
