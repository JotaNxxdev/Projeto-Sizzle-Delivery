-- Sizzle Delivery — sistema de entregadores
-- Rode este script no SQL Editor do Supabase DEPOIS de 007_business_hours_and_menu_categories.sql.

-- Entregador é um 4º papel, vinculado a UM restaurante (como o dono da loja) —
-- quem convida/gerencia entregadores é o dono daquele restaurante.
-- Usa um bloco dinâmico pra achar e trocar a constraint de "role" sem
-- depender de adivinhar o nome que o Postgres gerou automaticamente.
do $$
declare
  found_constraint text;
begin
  select con.conname into found_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%role%';

  if found_constraint is not null then
    execute format('alter table profiles drop constraint %I', found_constraint);
  end if;
end $$;

alter table profiles add constraint profiles_role_check
  check (role in ('customer', 'restaurant_owner', 'admin', 'courier'));

-- Quem está entregando o pedido, e quando pegou / entregou.
alter table orders add column if not exists courier_id uuid references profiles(id) on delete set null;
alter table orders add column if not exists picked_up_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;

create index if not exists idx_orders_courier_id on orders(courier_id);
