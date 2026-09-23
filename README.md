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

1. Depois de rodar `supabase/schema.sql`, rode também, nessa ordem, no
   SQL Editor do Supabase:
   - [`supabase/migrations/002_auth_and_roles.sql`](./supabase/migrations/002_auth_and_roles.sql)
     — cria a tabela `profiles` (com o papel de cada usuário) e liga
     `restaurants`/`orders` à conta de quem é dono/fez o pedido.
   - [`supabase/migrations/003_profile_and_restaurant_settings.sql`](./supabase/migrations/003_profile_and_restaurant_settings.sql)
     — adiciona telefone/foto ao perfil, cor/descrição à loja, e torna
     pedido sem conta (visitante) uma coisa só do histórico.
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
   pedidos do sistema e mudar o papel de qualquer usuário. É essa troca
   de papel em **Usuários** que decide o que aparece pra cada pessoa na
   tela de Perfil dela (o botão "Ir para o Painel..." correspondente).
5. Quem é dono de restaurante acessa **`/restaurant`** para ver e
   atualizar o status dos pedidos do próprio restaurante, gerenciar o
   cardápio (criar/editar/excluir itens) e editar a própria loja em
   **`/restaurant/settings`** (foto, cor, categoria, descrição, tempo e
   taxa de entrega).
6. Rotas `/admin`, `/restaurant`, `/checkout`, `/orders` e `/profile` são
   protegidas por `proxy.ts` (middleware): sem login, redireciona pra
   `/login`; a checagem de papel/dono (é admin? é dono deste restaurante?
   é o próprio pedido?) acontece de novo em cada página e em cada Server
   Action, então mesmo alguém adulterando uma requisição não consegue
   agir fora do que o papel permite.
7. **Fazer pedido exige login** — navegar pelo cardápio e montar o
   carrinho continua livre para qualquer visitante, mas ao clicar em
   "Finalizar Pedido" a pessoa é levada para `/login` se ainda não tiver
   conta (o carrinho é mantido, feito no navegador, e continua intacto
   depois do login).

## Pagamento com Pix (Mercado Pago Connect, gratuito)

Cada restaurante conecta a **própria** conta do Mercado Pago — o dinheiro
de cada venda cai direto para o dono daquele restaurante, a plataforma
nunca fica com o dinheiro em nenhum momento. Sem custo de mensalidade ou
de setup; o Mercado Pago só desconta a taxa dele quando um pagamento é
concluído de verdade (nada é cobrado em modo de teste).

### 1. Configuração única (feita por você, dono da plataforma)

1. Crie uma conta em https://www.mercadopago.com.br (pode ser pessoal).
2. Acesse https://www.mercadopago.com.br/developers/panel/app e crie uma
   aplicação (qualquer nome), tipo de integração **Checkout Transparente**,
   API de **Payments**.
3. Nessa aplicação, ache a seção com o **Client ID** e o **Client Secret**
   (em **Credenciais de teste**, pra testar sem movimentar dinheiro).
   Estas duas são as credenciais da SUA aplicação — o que autoriza o botão
   "Conectar com Mercado Pago" a existir, não são usadas pra receber
   pagamento nenhum diretamente.
4. Adicione no `.env.local` (e depois nas variáveis de ambiente da
   Vercel, marcando Production/Preview/Development):
   ```
   MERCADOPAGO_CLIENT_ID=sua-client-id-aqui
   MERCADOPAGO_CLIENT_SECRET=sua-client-secret-aqui
   ```
5. Em **Credenciais de teste/produção** da mesma aplicação, cadastre a
   **URL de redirecionamento**: `https://SEU-APP.vercel.app/api/mercadopago/callback`
   (troque pelo seu domínio real; em teste local seria
   `http://localhost:3000/api/mercadopago/callback`).
6. Rode [`supabase/migrations/004_pix_payments.sql`](./supabase/migrations/004_pix_payments.sql)
   e [`supabase/migrations/005_marketplace_and_order_details.sql`](./supabase/migrations/005_marketplace_and_order_details.sql)
   no SQL Editor do Supabase.

### 2. Cada restaurante conecta a própria conta

1. Logado como dono de restaurante, acesse **`/restaurant/settings`**.
2. Clique em **Conectar com Mercado Pago** — vai pra tela do próprio
   Mercado Pago pra autorizar (login na conta dele, não na sua).
3. Depois de autorizar, volta pro app já conectado, com o pagamento
   online **ativado**. Dá pra desativar (sem desconectar) ou desconectar
   a qualquer momento na mesma tela.
4. Sem conexão, o restaurante simplesmente não oferece Pix como opção de
   pagamento no checkout — só dinheiro/cartão na entrega, e o app
   continua funcionando normalmente.

### 3. Testando sem mexer com dinheiro de verdade

Use as [contas e cartões de teste do Mercado
Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test/accounts):
crie um usuário de teste **vendedor** (conecta ele como se fosse o dono
do restaurante) e um usuário de teste **comprador** (faz o pedido) — o
Pix simulado entre os dois é aprovado automaticamente em poucos
segundos, sem custo.

Quando um restaurante estiver pronto pra receber pagamentos de verdade,
troque `MERCADOPAGO_CLIENT_ID`/`MERCADOPAGO_CLIENT_SECRET` pelas
credenciais de **produção** da sua aplicação (mesma tela) e peça pro
dono desconectar e conectar de novo — nenhuma outra mudança é necessária.

### Limitações atuais (próximos passos possíveis)

- Cadastro de dono de restaurante é sempre feito em duas etapas: a
  pessoa se cadastra normalmente em `/signup` (vira cliente) e só depois
  um administrador a promove em `/admin`. Não existe um convite direto
  por e-mail ainda.
- Não há recuperação de senha "esqueci minha senha" nas telas — o
  Supabase Auth já suporta isso, só falta a tela; por enquanto pode ser
  feito manualmente pelo painel do Supabase (Authentication > Users).
- Fotos de perfil e de loja são guardadas como imagem embutida
  (base64) direto numa coluna do banco — funciona bem na escala atual,
  mas pra um catálogo grande de fotos o passo natural é migrar pro
  Supabase Storage (também tem plano gratuito).
- Pix não pago expira sozinho (o Mercado Pago cancela automaticamente
  depois de um tempo), mas ainda não existe uma limpeza automática que
  cancele o *pedido* correspondente — hoje ele só fica visível como
  "Aguardando pagamento" indefinidamente na lista.
- O token de acesso de cada restaurante (Mercado Pago Connect) fica salvo
  direto na tabela `restaurants`, sem criptografia adicional além do
  acesso restrito por `service_role`/RLS já usado no resto do app — é
  seguro nesse nível, mas nunca é exibido em tela nenhuma nem enviado ao
  navegador. Se um dia o dono trocar a senha da conta Mercado Pago, pode
  ser necessário desconectar e conectar de novo.
- Adicionais/opções por item do cardápio (ex.: "sem cebola", ponto da
  carne, bacon extra) ainda não existem — hoje só há o campo geral de
  observações no pedido.

## Deploy na Vercel

1. Faça push deste repositório para o GitHub (branch já configurada).
2. Importe o projeto em https://vercel.com/new.
3. Em **Environment Variables**, adicione as variáveis do `.env.local`
   (marcando Production, Preview e Development): `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e, se for usar Pix,
   `MERCADOPAGO_CLIENT_ID` e `MERCADOPAGO_CLIENT_SECRET`.
4. Deploy. O build usa `next build` automaticamente.
5. Se for usar Pix, cadastre a URL de redirecionamento de produção
   (`https://SEU-APP.vercel.app/api/mercadopago/callback`) nas
   credenciais da sua aplicação no painel do Mercado Pago — veja
   "Pagamento com Pix" acima.

## Estrutura do projeto

```
app/                     rotas (App Router)
  page.tsx                → "/" (busca restaurantes no servidor)
  HomeClient.tsx           → busca/categorias/carrossel (interativo)
  restaurants/[id]/        → cardápio de um restaurante
  cart/                    → carrinho
  checkout/                → formulário completo (entrega/retirada, pagamento) + PixPayment.tsx (QR Code)
  orders/                  → histórico de pedidos (exige login)
  profile/                 → perfil salvo no banco (nome/telefone/foto) + atalhos de painel
  login/, signup/          → autenticação (Supabase Auth)
  admin/                   → painel do administrador (restaurantes, pedidos, usuários)
  restaurant/              → painel do dono de restaurante (pedidos, cardápio, loja, Mercado Pago)
  api/orders/route.ts      → cria e lista pedidos (exige login, recalcula preços, gera Pix)
  api/orders/[code]/payment-status/  → consultado pela tela de Pix enquanto aguarda pagamento
  api/webhooks/mercadopago/          → recebe avisos de pagamento do Mercado Pago
  api/mercadopago/connect, callback/ → fluxo OAuth de cada restaurante conectar a própria conta
components/               BackButton, BottomNav, SignOutButton
contexts/CartContext.tsx  estado do carrinho (persistido em localStorage)
proxy.ts                  protege rotas que exigem login, renova a sessão
lib/
  supabase.ts              cliente Supabase (server-only, service_role key)
  supabase-auth-browser.ts cliente de login para uso no navegador
  auth.ts                  lê a sessão/papel do usuário atual (server-only)
  mercadopago.ts           cria/consulta pagamentos Pix e OAuth Connect (server-only)
  restaurants.ts           leitura de restaurantes (Supabase ou seed)
  admin-data.ts            consultas usadas pelo painel do administrador
  restaurant-data.ts       consultas/edição usadas pelo painel do dono de restaurante
  seed-data.ts             dados de exemplo/fallback
  types.ts, format.ts
supabase/
  schema.sql                                  schema principal + RLS + dados iniciais
  migrations/002_auth_and_roles.sql            login, papéis e vínculos de dono
  migrations/003_profile_and_restaurant_settings.sql  perfil e loja editáveis
  migrations/004_pix_payments.sql              status de pagamento Pix nos pedidos
  migrations/005_marketplace_and_order_details.sql    Mercado Pago Connect + mais dados no pedido
```
