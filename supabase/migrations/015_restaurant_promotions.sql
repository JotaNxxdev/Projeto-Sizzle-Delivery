-- Destaques pagos no carrossel da home ("Destaques para você") — hoje são
-- só duas imagens fixas no código; isso aqui permite o dono de restaurante
-- pagar (cartão via Mercado Pago Checkout Pro) ou o admin criar manualmente
-- (pagamento combinado por fora, ex. Pix) pra aparecer ali por um período.

create table if not exists restaurant_promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  title text not null,
  image_url text,
  duration_days int not null check (duration_days > 0),
  price numeric(10,2) not null default 0,
  -- 'manual': admin criou direto (dono pagou por fora, ex. Pix combinado).
  -- 'mercadopago': dono pagou sozinho via Checkout Pro (inclui cartão).
  payment_method text not null default 'manual' check (payment_method in ('manual', 'mercadopago')),
  -- 'pending_payment': aguardando confirmação do Mercado Pago (só existe
  -- pra payment_method='mercadopago' — o manual já nasce 'active').
  -- 'active'/'paused' são alternados pelo admin; expiração é calculada na
  -- consulta a partir de expires_at, não precisa de job pra marcar
  -- 'expired' (mesmo padrão do "isOpenNow" computado em lib/restaurants.ts).
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'paused', 'cancelled')),
  mp_preference_id text,
  mp_payment_id text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurant_promotions_restaurant on restaurant_promotions(restaurant_id);
create index if not exists idx_restaurant_promotions_status on restaurant_promotions(status);

alter table restaurant_promotions enable row level security;

-- Leitura pública só do que está realmente ativo e dentro do período — é o
-- que a home usa pra montar o carrossel sem precisar de service role.
create policy "Qualquer um lê destaques ativos e no período"
  on restaurant_promotions for select
  using (status = 'active' and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at >= now()));

-- Dono do restaurante lê (e cria, pelo fluxo de pagamento) os próprios
-- destaques, inclusive os pendentes/pausados/cancelados.
create policy "Dono gerencia os próprios destaques"
  on restaurant_promotions for all
  using (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  )
  with check (
    restaurant_id in (select id from restaurants where owner_id = auth.uid())
  );
