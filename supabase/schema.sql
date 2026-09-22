-- Sizzle Delivery — schema do Supabase
-- Rode este script inteiro no SQL Editor do seu projeto (supabase.com > seu projeto > SQL Editor > New query).

create extension if not exists "pgcrypto";

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  rating numeric(2,1) not null default 5.0,
  delivery_time text not null default '30-40 min',
  delivery_fee numeric(10,2) not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  restaurant_id uuid references restaurants(id) on delete set null,
  restaurant_name text not null,
  contact_number text not null,
  delivery_address text not null,
  notes text,
  status text not null default 'Pendente',
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  device_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_name text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  image_url text
);

create index if not exists idx_menu_items_restaurant_id on menu_items(restaurant_id);
create index if not exists idx_orders_device_id on orders(device_id);
create index if not exists idx_order_items_order_id on order_items(order_id);

-- Row Level Security -----------------------------------------------------
-- O app Next.js acessa o Supabase usando a service_role key, que ignora RLS.
-- Isso significa que SÓ o nosso backend (rotas em app/api) consegue ler ou
-- gravar qualquer uma dessas tabelas — não existe policy liberando acesso
-- direto do navegador com a chave anônima. Restaurantes e cardápio ficam
-- com leitura pública liberada apenas como conveniência caso você queira, no
-- futuro, consultá-los direto do cliente também.
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Restaurantes são visíveis publicamente" on restaurants
  for select using (true);

create policy "Itens do cardápio são visíveis publicamente" on menu_items
  for select using (true);

-- Nenhuma policy é criada para orders/order_items: por padrão, com RLS
-- ativado e sem policies, o acesso via chave anônima fica totalmente
-- bloqueado. A service_role key usada pelo servidor continua funcionando
-- normalmente, pois ela ignora RLS.

-- Dados iniciais -----------------------------------------------------------
-- Os mesmos restaurantes do protótipo original, usando as imagens que já
-- estão em /public (servidas pelo próprio app Next.js em produção).
insert into restaurants (name, category, rating, delivery_time, delivery_fee, image_url) values
  ('Pizzaria Nostra', 'pizza', 4.9, '20-30 min', 5.00, '/unnamed.png'),
  ('Lanchonete Express', 'lanches', 4.7, '15-25 min', 0.00, '/express.png'),
  ('Comida Japonesa Kori', 'japonesa', 4.6, '35-45 min', 8.00, '/kori.png'),
  ('Bar do Dedé', 'brasileira', 4.8, '35-45 min', 15.00, '/unnamed (1).png');

insert into menu_items (restaurant_id, name, description, price, image_url)
select id, 'Pizza Calabresa', 'Calabresa, cebola e azeitona.', 35.00, '/1.png' from restaurants where name = 'Pizzaria Nostra'
union all
select id, 'Pizza Margherita', 'Tomate, mussarela e manjericão.', 40.00, '/2.png' from restaurants where name = 'Pizzaria Nostra'
union all
select id, 'X-Bacon', 'Hambúrguer, bacon, queijo e salada.', 20.00, '/express.png' from restaurants where name = 'Lanchonete Express'
union all
select id, 'Cachorro-Quente', 'Salsicha, pão e molho.', 15.00, '/express.png' from restaurants where name = 'Lanchonete Express'
union all
select id, 'Combinado Sushi', '20 peças de sushi e sashimi.', 85.00, '/kori.png' from restaurants where name = 'Comida Japonesa Kori'
union all
select id, 'Temaki Salmão', 'Cone de arroz com salmão e cream cheese.', 25.00, '/kori.png' from restaurants where name = 'Comida Japonesa Kori'
union all
select id, 'Bisteca acompanhada', 'Prato completo com bisteca.', 15.00, '/unnamed (1).png' from restaurants where name = 'Bar do Dedé'
union all
select id, 'Lasanha', 'Prato acompanhado com lasanha.', 25.00, '/unnamed (1).png' from restaurants where name = 'Bar do Dedé';
