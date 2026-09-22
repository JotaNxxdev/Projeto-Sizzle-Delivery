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
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-publishable-key-aqui
   ```
   As duas últimas são as mesmas usadas pelo login (ver próxima seção) —
   `NEXT_PUBLIC_SUPABASE_URL` é igual a `SUPABASE_URL`, só que também
   acessível pelo navegador (é só a URL do projeto, não é segredo).
5. Reinicie `npm run dev`. O cardápio passa a vir do banco e os pedidos
   feitos em "Finalizar Pedido" são salvos nas tabelas `orders`/`order_items`.

`.env.local` já está no `.gitignore` — nunca será commitado.

## Login e papéis (cliente / dono de restaurante / administrador)

1. Depois de rodar `supabase/schema.sql`, rode também
   [`supabase/migrations/002_auth_and_roles.sql`](./supabase/migrations/002_auth_and_roles.sql)
   no SQL Editor do Supabase — cria a tabela `profiles` (com o papel de
   cada usuário) e liga `restaurants`/`orders` à conta de quem é dono/fez
   o pedido.
2. Em **Project Settings > API**, copie a **Publishable key**
   (`sb_publishable_...` em projetos novos, ou a chave `anon` em projetos
   antigos) e preencha `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no
   `.env.local` (e nas variáveis de ambiente da Vercel). Essa chave é
   diferente da `SUPABASE_SERVICE_ROLE_KEY` — ela é feita pra ficar
   exposta no navegador, protegida pelas políticas de RLS.
3. Todo mundo que se cadastra em `/signup` vira **cliente** por padrão.
   Pra virar administrador do sistema, cadastre sua própria conta pelo
   app e depois rode no SQL Editor (troque pelo seu e-mail):
   ```sql
   update profiles set role = 'admin' where email = 'seuemail@exemplo.com';
   ```
4. Logado como administrador, acesse **`/admin`** para: cadastrar
   restaurantes, atribuir um dono a cada um (pelo e-mail da conta dele —
   a pessoa precisa ter se cadastrado antes em `/signup`), ver todos os
   pedidos do sistema e mudar o papel de qualquer usuário.
5. Quem é dono de restaurante acessa **`/restaurant`** para ver e
   atualizar o status dos pedidos do próprio restaurante, e gerenciar o
   cardápio (criar/editar/excluir itens).
6. Rotas `/admin` e `/restaurant` são protegidas por `proxy.ts`
   (middleware): sem login, redireciona pra `/login`; a checagem de papel
   (é admin? é dono deste restaurante?) acontece de novo em cada página e
   em cada Server Action, então mesmo alguém adulterando uma requisição
   não consegue agir fora do que o papel permite.

### Limitações atuais (próximos passos possíveis)

- Cadastro de dono de restaurante é sempre feito em duas etapas: a
  pessoa se cadastra normalmente em `/signup` (vira cliente) e só depois
  um administrador a promove em `/admin`. Não existe um convite direto
  por e-mail ainda.
- Não há recuperação de senha "esqueci minha senha" nas telas — o
  Supabase Auth já suporta isso, só falta a tela; por enquanto pode ser
  feito manualmente pelo painel do Supabase (Authentication > Users).
- Pedidos feitos como visitante (sem login) continuam funcionando como
  antes, identificados por um ID salvo no navegador; ao logar, os pedidos
  novos passam a ficar ligados à conta.

## Deploy na Vercel

1. Faça push deste repositório para o GitHub (branch já configurada).
2. Importe o projeto em https://vercel.com/new.
3. Em **Environment Variables**, adicione as quatro variáveis do
   `.env.local` (marcando Production, Preview e Development):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
   e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
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
  profile/                 → estado de login + perfil local (nome/telefone/foto)
  login/, signup/          → autenticação (Supabase Auth)
  admin/                   → painel do administrador (restaurantes, pedidos, usuários)
  restaurant/              → painel do dono de restaurante (pedidos, cardápio)
  api/orders/route.ts      → cria e lista pedidos (valida e recalcula preços)
components/               BackButton, BottomNav, SignOutButton
contexts/CartContext.tsx  estado do carrinho (persistido em localStorage)
proxy.ts                  protege /admin e /restaurant, renova a sessão de login
lib/
  supabase.ts              cliente Supabase (server-only, service_role key)
  supabase-auth-browser.ts cliente de login para uso no navegador
  auth.ts                  lê a sessão/papel do usuário atual (server-only)
  restaurants.ts           leitura de restaurantes (Supabase ou seed)
  admin-data.ts            consultas usadas pelo painel do administrador
  restaurant-data.ts       consultas usadas pelo painel do dono de restaurante
  seed-data.ts             dados de exemplo/fallback
  types.ts, format.ts, device.ts
supabase/
  schema.sql                        schema principal + RLS + dados iniciais
  migrations/002_auth_and_roles.sql login, papéis e vínculos de dono
```
