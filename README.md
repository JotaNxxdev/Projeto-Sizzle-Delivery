# Sizzle Delivery

App de delivery construído em **Next.js 16 (App Router) + TypeScript**, com
backend próprio (rotas de API) e persistência de pedidos em **Supabase**
(Postgres gratuito).

## O que mudou em relação à versão anterior

O projeto era um site estático (HTML/CSS/JS puro) sem backend: o cardápio
ficava fixo no código e os pedidos eram salvos só no `localStorage` do
navegador — ninguém além do próprio cliente via os pedidos, e eles somem se
o cache for limpo. Esta versão:

- Migra tudo para **Next.js + TypeScript**, com páginas/rotas reais
  (`/`, `/restaurants/[id]`, `/cart`, `/checkout`, `/orders`, `/profile`)
  em vez de esconder/mostrar `<div>`s com JavaScript.
- Adiciona um **backend** (`app/api/orders`) que valida os pedidos e
  **recalcula os preços no servidor a partir do cardápio salvo no banco**
  — o cliente nunca pode adulterar o valor de um pedido.
- Persiste restaurantes, cardápio e pedidos no **Supabase** (Postgres),
  com RLS (Row Level Security) travado: o navegador nunca fala direto com
  o banco, só através das nossas próprias rotas de API, que usam a
  `service_role key` (nunca exposta ao cliente).
- Corrige bugs do protótipo: nome/telefone do perfil não eram salvos em
  lugar nenhum, a imagem padrão do perfil apontava para um arquivo que não
  existia, o carrinho podia ser finalizado sem telefone/endereço, e era
  possível misturar itens de restaurantes diferentes no mesmo carrinho sem
  aviso.
- Elimina o risco de XSS que existia no protótipo (`innerHTML` com texto
  digitado pelo usuário, como observações e endereço, sem escapar) — o
  React escapa esse conteúdo automaticamente.
- Troca a formatação manual de moeda por `Intl.NumberFormat` (via
  `toLocaleString`), acessibilidade básica (`aria-label`, navegação por
  teclado nos ícones clicáveis) e o carregamento da fonte por `next/font`.
- Continua funcionando sem o Supabase configurado (usa dados de exemplo em
  `lib/seed-data.ts`), então dá para rodar e navegar o app imediatamente;
  só a criação de pedidos exige o banco configurado.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — o cardápio aparece com dados de exemplo,
mesmo sem configurar nada. Para poder **finalizar pedidos de verdade**,
configure o Supabase (próxima seção).

## Configurando o Supabase (gratuito, sem cartão de crédito)

1. Crie uma conta em https://supabase.com e um novo projeto (escolha
   qualquer região e senha de banco).
2. No painel do projeto, vá em **SQL Editor > New query**, cole todo o
   conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e rode.
   Isso cria as tabelas (`restaurants`, `menu_items`, `orders`,
   `order_items`), configura as políticas de RLS e já popula o cardápio
   inicial (os mesmos restaurantes do protótipo).
3. Em **Project Settings > API**, copie:
   - **Project URL**
   - a chave privilegiada de servidor (⚠️ é uma chave poderosa — nunca a
     exponha no navegador nem a commite no Git). O nome dela depende de
     quando seu projeto foi criado:
     - Projetos novos: seção **Secret keys**, chave `sb_secret_...`
     - Projetos antigos: seção **Project API keys**, chave `service_role`
       (formato JWT, começa com `eyJ...`)
     - Em ambos os casos, **não** use a "Publishable key" / `anon` — essa é
       para uso no navegador, não serve pra isso.
4. Copie `.env.local.example` para `.env.local` e preencha:
   ```
   SUPABASE_URL=https://SEU-PROJETO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
   ```
5. Reinicie `npm run dev`. O cardápio passa a vir do banco e os pedidos
   feitos em "Finalizar Pedido" são salvos nas tabelas `orders`/`order_items`.

`.env.local` já está no `.gitignore` — nunca será commitado.

### Limitações atuais (próximos passos possíveis)

- Não há login: "Meus Pedidos" identifica o cliente por um ID gerado no
  navegador (`localStorage`), não por uma conta de verdade. O próximo
  passo natural é adicionar **Supabase Auth** (e-mail/senha ou magic
  link) e associar pedidos ao usuário autenticado em vez do device ID.
- O painel de "status do pedido" (Pendente / Em Preparação / Entregue)
  ainda não tem uma tela de administração para o restaurante atualizar o
  status — hoje isso só pode ser feito manualmente pela tabela `orders`
  no painel do Supabase.

## Deploy na Vercel

1. Faça push deste repositório para o GitHub (branch já configurada).
2. Importe o projeto em https://vercel.com/new.
3. Em **Environment Variables**, adicione `SUPABASE_URL` e
   `SUPABASE_SERVICE_ROLE_KEY` com os mesmos valores do seu `.env.local`.
4. Deploy. O build usa `next build` automaticamente.

## Estrutura do projeto

```
app/                     rotas (App Router)
  page.tsx                → "/" (busca restaurantes no servidor)
  HomeClient.tsx           → busca/categorias/carrossel (interativo)
  restaurants/[id]/        → cardápio de um restaurante
  cart/                    → carrinho
  checkout/                → formulário de finalização
  orders/                  → histórico de pedidos (busca via API)
  profile/                 → perfil local (nome/telefone/foto)
  api/orders/route.ts      → cria e lista pedidos (valida e recalcula preços)
components/               BackButton, BottomNav
contexts/CartContext.tsx  estado do carrinho (persistido em localStorage)
lib/
  supabase.ts              cliente Supabase (server-only, service_role key)
  restaurants.ts           leitura de restaurantes (Supabase ou seed)
  seed-data.ts             dados de exemplo/fallback
  types.ts, format.ts, device.ts
supabase/schema.sql        schema + RLS + dados iniciais
```
