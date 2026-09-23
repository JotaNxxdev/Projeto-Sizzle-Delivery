-- Sizzle Delivery — Mercado Pago Connect (por restaurante) + mais dados no pedido
-- Rode este script no SQL Editor do Supabase DEPOIS de 004_pix_payments.sql.

-- Cada restaurante conecta a própria conta do Mercado Pago (OAuth). O
-- pagamento passa a ser criado usando o token do PRÓPRIO dono, então o
-- dinheiro cai direto na conta dele, não na da plataforma.
alter table restaurants add column if not exists online_payment_enabled boolean not null default false;
alter table restaurants add column if not exists mp_user_id text;
alter table restaurants add column if not exists mp_access_token text;
alter table restaurants add column if not exists mp_refresh_token text;

-- Mais informações no pedido: quem recebe, endereço em campos separados,
-- forma de entrega e forma de pagamento (nem todo pedido é Pix — pode ser
-- combinado em dinheiro/cartão na entrega).
alter table orders add column if not exists receiver_name text;
alter table orders add column if not exists street text;
alter table orders add column if not exists street_number text;
alter table orders add column if not exists complement text;
alter table orders add column if not exists neighborhood text;
alter table orders add column if not exists city text;
alter table orders add column if not exists reference_point text;
alter table orders add column if not exists delivery_method text not null default 'delivery'
  check (delivery_method in ('delivery', 'pickup'));
alter table orders add column if not exists payment_method text not null default 'pix'
  check (payment_method in ('pix', 'cash', 'card'));
alter table orders add column if not exists change_for numeric(10,2);
