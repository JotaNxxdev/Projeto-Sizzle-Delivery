-- Sizzle Delivery — perfil no banco, loja editável pelo dono
-- Rode este script no SQL Editor do Supabase DEPOIS de 002_auth_and_roles.sql.

-- Perfil (telefone e foto) passa a ficar salvo na conta, não só no navegador.
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists avatar_url text;

-- Identidade visual e descrição da loja, editáveis pelo dono do restaurante.
alter table restaurants add column if not exists brand_color text;
alter table restaurants add column if not exists description text;

-- Pedido agora exige login (ver app/api/orders): device_id deixa de ser
-- preenchido em pedidos novos, mas continua aqui pra não perder o histórico
-- de pedidos antigos feitos como visitante.
alter table orders alter column device_id drop not null;
