-- Sizzle Delivery — adicionais de produto, avaliações, cupons, endereços salvos, auditoria
-- Rode este script no SQL Editor do Supabase DEPOIS de 009_orders_flow_and_store_rules.sql.

-- ============================================================
-- Adicionais / variações de produto
-- ============================================================
-- Grupo de opções de um item (ex.: "Adicionais", "Ponto da carne", "Tamanho").
-- min_selections = 0 é opcional; max_selections = 1 é escolha única (rádio),
-- >1 é múltipla escolha (checkbox) até esse limite.
create table if not exists menu_item_option_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  name text not null,
  min_selections int not null default 0,
  max_selections int not null default 1,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists menu_item_option_values (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references menu_item_option_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_option_groups_menu_item on menu_item_option_groups(menu_item_id);
create index if not exists idx_option_values_group on menu_item_option_values(group_id);

-- Snapshot das opções escolhidas em cada item de pedido (igual order_items já
-- guarda nome/preço do item em vez de só referenciar o cardápio — assim o
-- pedido não muda se o dono editar/excluir o adicional depois).
create table if not exists order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  group_name text not null,
  option_name text not null,
  price_delta numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_item_options_order_item on order_item_options(order_item_id);

alter table menu_item_option_groups enable row level security;
alter table menu_item_option_values enable row level security;
alter table order_item_options enable row level security;

-- ============================================================
-- Avaliações
-- ============================================================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  restaurant_reply text,
  created_at timestamptz not null default now(),
  unique (order_id)
);

create index if not exists idx_reviews_restaurant_id on reviews(restaurant_id);
alter table reviews enable row level security;

-- ============================================================
-- Cupons de desconto
-- ============================================================
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_value numeric(10,2) not null default 0,
  max_discount numeric(10,2),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int,
  usage_limit_per_customer int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, code)
);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  discount_applied numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_coupon_redemptions_coupon on coupon_redemptions(coupon_id);
create index if not exists idx_coupon_redemptions_user on coupon_redemptions(user_id);

alter table orders add column if not exists coupon_code text;
alter table orders add column if not exists discount_amount numeric(10,2) not null default 0;

alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;

-- ============================================================
-- Endereços salvos
-- ============================================================
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Endereço',
  street text not null,
  street_number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  reference_point text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_user_id on addresses(user_id);
alter table addresses enable row level security;

-- ============================================================
-- Auditoria
-- ============================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null,
  entity text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on audit_logs(entity, entity_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
alter table audit_logs enable row level security;
