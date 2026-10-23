-- Sizzle Delivery — bloco 3: pedido agendado, favoritos, notificação push
-- Rode este script no SQL Editor do Supabase DEPOIS de 012_image_uploads.sql.
-- Depois de rodar, também rode: NOTIFY pgrst, 'reload schema';

-- Pedido agendado — null significa "entregar agora" (comportamento atual).
alter table orders add column if not exists scheduled_for timestamptz;

-- Restaurantes favoritos do cliente.
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);
create index if not exists idx_favorites_user on favorites(user_id);
alter table favorites enable row level security;

-- Inscrições de notificação push (Web Push API nativa do navegador — sem
-- serviço externo). Uma pessoa pode ter mais de um dispositivo inscrito.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subscriptions_user on push_subscriptions(user_id);
alter table push_subscriptions enable row level security;

NOTIFY pgrst, 'reload schema';
