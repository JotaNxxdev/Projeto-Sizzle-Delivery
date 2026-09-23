-- Sizzle Delivery — horário estruturado por dia da semana + categorias no cardápio
-- Rode este script no SQL Editor do Supabase DEPOIS de 006_store_hours_and_reports.sql.

-- Horário por dia da semana: array de 7 posições (domingo=0 ... sábado=6), cada
-- uma como {"enabled": bool, "open": "HH:MM", "close": "HH:MM"}. Substitui o
-- campo de texto livre "opening_hours" (mantido na tabela sem uso, pode ser
-- removido depois se quiser). Sem valor definido = loja sempre aberta (só o
-- toggle "pausar loja" controla o pedido), pra não fechar sozinho quem ainda
-- não configurou.
alter table restaurants add column if not exists business_hours jsonb;

-- Categoria do item do cardápio (ex.: "Lanches", "Bebidas", "Sobremesas").
alter table menu_items add column if not exists category text not null default 'Geral';
