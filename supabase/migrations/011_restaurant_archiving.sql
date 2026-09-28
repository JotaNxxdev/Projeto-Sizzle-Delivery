-- Sizzle Delivery — arquivamento de restaurante (admin)
-- Rode este script no SQL Editor do Supabase DEPOIS de 010_options_reviews_coupons_addresses_audit.sql.
-- Depois de rodar, também rode: NOTIFY pgrst, 'reload schema';

-- Restaurante arquivado some da home/checkout do cliente, mas o histórico
-- (pedidos, avaliações etc.) continua intacto — diferente de excluir de
-- verdade, que só é permitido quando o restaurante não tem nenhum pedido.
alter table restaurants add column if not exists is_archived boolean not null default false;

NOTIFY pgrst, 'reload schema';
