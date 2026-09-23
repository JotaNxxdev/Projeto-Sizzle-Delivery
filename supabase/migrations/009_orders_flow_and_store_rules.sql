-- Sizzle Delivery — aceitar/recusar pedido, pedido mínimo, produto ativo/inativo,
-- idempotência do webhook do Mercado Pago
-- Rode este script no SQL Editor do Supabase DEPOIS de 008_couriers.sql.

-- Motivo informado pelo dono ao recusar um pedido.
alter table orders add column if not exists rejection_reason text;

-- Valor mínimo do pedido pra essa loja aceitar (0 = sem mínimo).
alter table restaurants add column if not exists min_order_value numeric(10,2) not null default 0;

-- Permite desativar um item do cardápio sem excluir (some do cliente, mas o
-- dono continua vendo e podendo reativar).
alter table menu_items add column if not exists active boolean not null default true;

-- Log de notificações de webhook já processadas, pra não reprocessar a
-- mesma notificação duas vezes se o Mercado Pago reenviar.
create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  payload jsonb,
  processed_at timestamptz not null default now(),
  unique (source, external_id)
);

alter table webhook_events enable row level security;
