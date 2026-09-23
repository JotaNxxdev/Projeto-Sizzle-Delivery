-- Sizzle Delivery — horário de funcionamento / pausar loja
-- Rode este script no SQL Editor do Supabase DEPOIS de 005_marketplace_and_order_details.sql.
-- (Relatórios e filtros de pedido usam as tabelas que já existem, sem precisar de coluna nova.)

alter table restaurants add column if not exists is_open boolean not null default true;
alter table restaurants add column if not exists opening_hours text;

create index if not exists idx_orders_restaurant_created_at on orders(restaurant_id, created_at);
