-- Sizzle Delivery — login e papéis (cliente / dono de restaurante / dono do sistema)
-- Rode este script no SQL Editor do Supabase DEPOIS do supabase/schema.sql.

-- Perfil de cada usuário autenticado (1 linha por usuário do Supabase Auth).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'restaurant_owner', 'admin')),
  restaurant_id uuid references restaurants(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Cria automaticamente um perfil (papel "customer") sempre que alguém se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Liga cada restaurante ao usuário que é o dono dele.
alter table restaurants add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Liga cada pedido ao usuário logado que fez ele (fica null pra pedidos de visitantes, sem login).
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_restaurants_owner_id on restaurants(owner_id);
create index if not exists idx_orders_user_id on orders(user_id);

-- RLS: assim como orders/order_items, esta tabela fica bloqueada por padrão
-- pra chave pública (nenhuma policy criada) — só o backend (service_role)
-- consegue ler/gravar perfis e papéis.
alter table profiles enable row level security;

-- Último passo (fazer manualmente, uma única vez): depois de se cadastrar
-- pelo app em /signup, promova sua própria conta a administradora do
-- sistema rodando (troque pelo seu e-mail de verdade):
--
--   update profiles set role = 'admin' where email = 'seuemail@exemplo.com';
