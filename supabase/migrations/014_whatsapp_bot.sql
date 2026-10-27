-- Sizzle Delivery — bot de WhatsApp (pedido e status pelo WhatsApp)
-- Rode este script no SQL Editor do Supabase DEPOIS de 013_scheduled_orders_favorites_push.sql.
-- Tudo aqui é aditivo: nenhuma coluna existente é removida ou tem seu
-- comportamento alterado, e os valores padrão preservam os pedidos já
-- existentes (origin='web' pra tudo que já está no banco).

-- ============================================================
-- Origem do pedido (site ou WhatsApp) + controle de notificação de status
-- ============================================================
alter table orders add column if not exists origin text not null default 'web'
  check (origin in ('web', 'whatsapp'));

alter table orders add column if not exists updated_at timestamptz not null default now();

-- Qual foi o último status já avisado pro cliente no WhatsApp — evita
-- reenviar o mesmo aviso duas vezes e permite ao bot, ao reconectar,
-- varrer os pedidos e mandar só os avisos que ainda faltam.
alter table orders add column if not exists whatsapp_notified_status text;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function public.set_orders_updated_at();

-- Garante que a tabela orders está na publicação do Realtime (o bot escuta
-- mudança de status via Supabase Realtime). Se já estiver, o bloco só ignora
-- o erro de duplicidade.
do $$
begin
  execute 'alter publication supabase_realtime add table orders';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Pedido criado via bot precisa de REPLICA IDENTITY FULL pra o evento de
-- UPDATE do Realtime trazer o valor antigo das colunas junto (senão só vem
-- a chave primária) — é o que deixa o bot comparar o status antigo x novo.
alter table orders replica identity full;

-- ============================================================
-- Novo método de pagamento: Pix combinado por fora (mostrado no WhatsApp),
-- diferente do Pix "online" via Mercado Pago que já existia.
-- ============================================================
do $$
declare
  found_constraint text;
begin
  select con.conname into found_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'orders'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%payment_method%';

  if found_constraint is not null then
    execute format('alter table orders drop constraint %I', found_constraint);
  end if;
end $$;

alter table orders add constraint orders_payment_method_check
  check (payment_method in ('pix', 'cash', 'card', 'pix_manual'));

-- ============================================================
-- Configuração do bot por restaurante
-- ============================================================
-- Chave Pix exibida no fluxo manual do WhatsApp (nada a ver com a conta do
-- Mercado Pago usada no Pix online do site).
alter table restaurants add column if not exists manual_pix_key text;

-- Liga/desliga o bot pra essa loja. Fica desligado por padrão: o operador
-- do bot (não o dono pelo site) habilita depois de parear o WhatsApp
-- daquele restaurante (ver whatsapp-bot/README.md).
alter table restaurants add column if not exists whatsapp_bot_enabled boolean not null default false;

-- ============================================================
-- Sessão de conversa do cliente no WhatsApp (1 por telefone por restaurante)
-- ============================================================
create table if not exists whatsapp_customer_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  phone text not null,
  step text not null default 'greeting',
  cart jsonb not null default '[]',
  draft jsonb not null default '{}',
  payment_method text,
  paused_for_agent boolean not null default false,
  paused_at timestamptz,
  message_count int not null default 0,
  message_window_started_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (restaurant_id, phone)
);

create index if not exists idx_whatsapp_sessions_restaurant on whatsapp_customer_sessions(restaurant_id);
alter table whatsapp_customer_sessions enable row level security;

-- ============================================================
-- Idempotência: mensagens do WhatsApp já processadas (evita responder duas
-- vezes se o Baileys reentregar o mesmo evento).
-- ============================================================
create table if not exists whatsapp_processed_messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  message_id text not null,
  processed_at timestamptz not null default now(),
  unique (restaurant_id, message_id)
);

create index if not exists idx_whatsapp_processed_restaurant on whatsapp_processed_messages(restaurant_id);
alter table whatsapp_processed_messages enable row level security;

-- Nenhuma policy criada pras duas tabelas acima: igual orders/profiles, só
-- o backend com a service_role key (o próprio bot) consegue ler/gravar.
