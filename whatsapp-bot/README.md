# Bot de WhatsApp — Sizzle Delivery

Bot que permite o cliente **fazer pedido** e **receber status** direto pelo WhatsApp,
usando a biblioteca não-oficial [Baileys](https://github.com/WhiskeySockets/Baileys)
(conexão via QR Code, igual o WhatsApp Web).

**Isso é um serviço separado do site.** A Vercel (onde o site roda) não mantém
processos ligados o tempo todo — por isso o bot precisa rodar num VPS, 24 horas,
com PM2 ou similar. Ele nunca é implantado junto com o site.

O bot **não calcula preço nem grava pedido direto no banco**: tudo passa pelas
rotas do site (`/api/orders/preview` e `/api/orders`), autenticado por um token
interno. O servidor do site é a única fonte de verdade sobre preço, cardápio,
cupom e regras do restaurante — o bot só conversa e repassa.

## Arquitetura (resumo)

```
whatsapp-bot/
├── src/
│   ├── messaging/        → adapter.ts (interface) + baileys-adapter.ts (implementação)
│   ├── conversation/      → flow.ts (máquina de estados PURA, sem rede/banco) + testes
│   ├── catalog.ts         → lê cardápio do Supabase (só pra EXIBIR, nunca pra calcular preço)
│   ├── order-client.ts    → chama /api/orders/preview e /api/orders no site
│   ├── sessions.ts        → carrinho/etapa da conversa, pausa de atendente, rate limit
│   ├── dedupe.ts          → idempotência por message id (evita responder 2x)
│   ├── status-watcher.ts  → avisa o cliente quando o status do pedido muda
│   ├── engine.ts          → liga tudo isso numa mensagem só
│   └── index.ts           → sobe 1 sessão do WhatsApp por restaurante habilitado
├── scripts/
│   ├── connect.ts          → pareia o WhatsApp de um restaurante (mostra o QR Code)
│   └── unpause.ts          → CLI de emergência pra reativar o bot pra um número
└── sessions/<restaurantId>/  → credenciais do WhatsApp de cada restaurante (NUNCA comitar)
```

Trocar o Baileys por uma API oficial (Twilio, Meta Cloud API) no futuro = escrever
um novo arquivo em `src/messaging/` implementando a mesma interface `MessagingAdapter`.
Nada em `conversation/`, `order-client.ts`, `sessions.ts` etc. precisa mudar.

## Pré-requisitos no site (Sizzle)

Antes de rodar o bot, confirme que:

1. A migration `supabase/migrations/014_whatsapp_bot.sql` já foi rodada no Supabase.
2. A variável de ambiente `WHATSAPP_BOT_API_TOKEN` está configurada na Vercel do
   site com um valor longo e aleatório — **o mesmo valor** vai no `.env` do bot.
3. Cada restaurante que vai usar o bot tem uma **chave Pix manual** cadastrada
   em "Minha loja" no painel do dono (campo "Chave Pix (usada no pedido por
   WhatsApp)") — é o que aparece pro cliente quando ele escolhe pagar por Pix.

## Variáveis de ambiente

Copie `.env.example` pra `.env` e preencha (veja os comentários no arquivo):

| Variável | O que é |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Mesmo projeto Supabase do site |
| `SIZZLE_API_BASE_URL` | URL do site em produção (ex.: `https://seu-dominio.vercel.app`) |
| `WHATSAPP_BOT_API_TOKEN` | Igual à variável de mesmo nome na Vercel |
| `SESSION_EXPIRY_MINUTES` | Depois de quanto tempo sem mensagem a conversa reseta (padrão 30) |
| `RATE_LIMIT_MAX_MESSAGES` / `RATE_LIMIT_WINDOW_SECONDS` | Limite de mensagens por cliente, pra evitar spam |
| `PAUSE_AUTO_EXPIRE_HOURS` | Depois de quanto tempo uma pausa de "atendente" esquecida expira sozinha |

**Nunca** commite o `.env` nem coloque essas variáveis em código do site — o
`WHATSAPP_BOT_API_TOKEN` em especial dá permissão de criar pedido em nome de
qualquer cliente; trate como senha.

## Rodando localmente (para testar)

```bash
npm install
cp .env.example .env   # e preencha
npm test                # roda os testes de conversation/flow.ts
```

## Conectando o WhatsApp de um restaurante (QR Code)

Cada restaurante usa **um número de WhatsApp próprio** (de preferência um chip
separado, nunca o WhatsApp pessoal de alguém — a biblioteca é não-oficial e o
número conectado corre risco de ser suspenso pelo WhatsApp).

1. Pegue o `id` do restaurante (no painel do dono, ou direto no Supabase, tabela `restaurants`).
2. Rode:
   ```bash
   npm run connect -- <restaurantId>
   ```
3. Um QR Code aparece no terminal. No celular do número que vai atender:
   **WhatsApp → Configurações → Dispositivos conectados → Conectar um dispositivo** → escaneie.
4. Depois de conectar, o script encerra sozinho e mostra o comando SQL pra habilitar o bot:
   ```sql
   update restaurants set whatsapp_bot_enabled = true where id = '<restaurantId>';
   ```
5. Rode esse SQL no Supabase. Da próxima vez que o processo principal (`npm start`)
   subir, esse restaurante já entra na lista e usa a sessão salva — **sem pedir QR Code de novo**.

Repita pra cada restaurante que for usar o bot.

## Subindo no VPS com PM2

```bash
npm install
npm run build          # compila TypeScript pra dist/
npm install -g pm2      # se ainda não tiver
pm2 start dist/index.js --name sizzle-whatsapp-bot
pm2 save
pm2 startup             # pra sobreviver a reinício do servidor
```

Pra ver os logs: `pm2 logs sizzle-whatsapp-bot`.
Pra reiniciar depois de uma atualização de código: `git pull && npm install && npm run build && pm2 restart sizzle-whatsapp-bot`.

## Protegendo e fazendo backup da pasta `sessions/`

A pasta `sessions/<restaurantId>/` guarda as **credenciais de login** do
WhatsApp daquele número — equivalente a estar logado no WhatsApp Web
permanentemente. Quem tiver acesso a esses arquivos consegue ler e mandar
mensagem como aquele número.

- **Permissões no VPS**: deixe a pasta legível só pelo usuário que roda o bot:
  ```bash
  chmod 700 sessions
  chmod -R 600 sessions/*/*
  ```
- **Nunca** coloque `sessions/` num repositório git público (o `.gitignore`
  deste projeto já exclui o conteúdo dela por padrão — só o diretório vazio
  fica versionado).
- **Backup**: faça backup regular da pasta inteira (ex.: `tar` + envio pra um
  storage privado), do mesmo jeito que você faria backup de qualquer segredo
  de produção. Restaurar o backup num VPS novo recoloca a sessão sem precisar
  escanear o QR Code de novo.
- **Se a pasta for perdida** (disco corrompido, VPS recriado sem backup
  etc.): não tem recuperação — é necessário rodar `npm run connect --
  <restaurantId>` de novo pra cada restaurante afetado e escanear o QR Code
  outra vez. Nenhum pedido ou dado do site é perdido nesse caso (o bot não
  guarda nada além da sessão do WhatsApp em si); só a conexão com aquele
  número precisa ser refeita.

## Pausa de atendimento ("falar com atendente")

Quando o cliente digita *atendente*, o bot para de responder aquele número
(fica marcado em `whatsapp_customer_sessions.paused_for_agent`). Pra voltar a
responder:

1. **Normal**: o dono acessa **Painel do Restaurante → WhatsApp** no site e
   clica em "Reativar bot pra esse número", depois de já ter resolvido por
   fora (ligando, respondendo pelo WhatsApp normal da loja, etc.).
2. **Emergência / sem acesso ao painel**: rode no bot:
   ```bash
   npm run unpause -- <restaurantId> <telefone-sem-ddi>
   ```
3. **Rede de segurança**: se ninguém reativar, a pausa expira sozinha depois
   de `PAUSE_AUTO_EXPIRE_HOURS` (padrão 4h) e o bot volta a responder.

## Testes

```bash
npm test
```

Cobre o fluxo completo do pedido (do "1 - Fazer pedido" até a confirmação),
voltar ao menu (`0`/`menu`), cancelar (`cancelar`), pausa de atendente e
entradas inválidas em cada etapa (`src/conversation/flow.test.ts`). A máquina
de estados (`flow.ts`) é testada isoladamente, sem WhatsApp nem banco de
dados de verdade — por isso os testes rodam instantâneos e sem configurar nada.
