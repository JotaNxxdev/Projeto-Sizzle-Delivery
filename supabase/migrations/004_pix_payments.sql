-- Sizzle Delivery — pagamento via Pix (Mercado Pago)
-- Rode este script no SQL Editor do Supabase DEPOIS de 003_profile_and_restaurant_settings.sql.

alter table orders add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'));

alter table orders add column if not exists mp_payment_id text;

create index if not exists idx_orders_mp_payment_id on orders(mp_payment_id);
