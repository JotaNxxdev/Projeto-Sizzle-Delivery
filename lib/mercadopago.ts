// Integração com a API de Pagamentos do Mercado Pago (Pix) + OAuth
// ("Mercado Pago Connect"), que permite cada restaurante ligar a própria
// conta — o dinheiro cai direto para o dono, não para a plataforma.
//
// Documentação:
//   Pagamentos: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
//   OAuth: https://www.mercadopago.com.br/developers/pt/docs/security/oauth/creation
//
// Uso exclusivamente server-side: nenhum token deve ser exposto ao navegador.
const clientId = process.env.MERCADOPAGO_CLIENT_ID;
const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

export const isMercadoPagoOAuthConfigured = Boolean(clientId && clientSecret);

const BASE_URL = 'https://api.mercadopago.com';

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

// accessToken: o token do restaurante (via Mercado Pago Connect) — o
// pagamento é criado na conta dele, o dinheiro cai direto lá.
export async function createPixPayment(params: {
  amount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
  accessToken: string;
}): Promise<PixPaymentResult> {
  const response = await fetch(`${BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      // Evita cobrar duas vezes se a requisição for reenviada (ex.: timeout e retry).
      'X-Idempotency-Key': params.externalReference,
    },
    body: JSON.stringify({
      transaction_amount: Math.round(params.amount * 100) / 100,
      description: params.description,
      payment_method_id: 'pix',
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body) {
    console.error('[Sizzle] Erro ao criar pagamento Pix no Mercado Pago:', body);
    throw new Error(body?.message || 'Não foi possível criar o pagamento Pix.');
  }

  return {
    paymentId: String(body.id),
    status: body.status,
    qrCode: body.point_of_interaction?.transaction_data?.qr_code ?? null,
    qrCodeBase64: body.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
  };
}

// Consulta o status atual de um pagamento direto na API do Mercado Pago —
// nunca confiamos no status que vier de fora (webhook), só no que a própria
// API do Mercado Pago responde quando perguntamos por este ID. Precisa do
// token do restaurante dono do pagamento (mesma conta usada para criá-lo).
export async function getPaymentStatus(paymentId: string, accessToken: string | null): Promise<string | null> {
  if (!accessToken) return null;

  const response = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error('[Sizzle] Erro ao consultar pagamento no Mercado Pago:', await response.text());
    return null;
  }

  const body = await response.json().catch(() => null);
  return body?.status ?? null;
}

// --- Checkout Pro (conta da própria plataforma) ---------------------------
//
// Diferente do Pix acima (que usa o token de CADA restaurante, dinheiro cai
// direto pra ele), isto aqui usa a conta do Mercado Pago da PRÓPRIA Sizzle —
// é pra cobrar o restaurante por um serviço da plataforma (ex.: destaque
// pago na home), não um pedido de cliente. O Checkout Pro é a página
// hospedada do Mercado Pago: ela já aceita cartão, Pix e boleto sem a gente
// precisar lidar com dado de cartão em momento nenhum.
const platformAccessToken = process.env.MERCADOPAGO_PLATFORM_ACCESS_TOKEN;

export const isMercadoPagoPlatformConfigured = Boolean(platformAccessToken);

export interface CheckoutPreferenceResult {
  preferenceId: string;
  initPoint: string;
}

export async function createCheckoutPreference(params: {
  title: string;
  price: number;
  externalReference: string;
  notificationUrl: string;
  successUrl: string;
  failureUrl: string;
}): Promise<CheckoutPreferenceResult> {
  if (!platformAccessToken) {
    throw new Error('Pagamento por cartão não configurado (falta MERCADOPAGO_PLATFORM_ACCESS_TOKEN).');
  }

  const response = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${platformAccessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ title: params.title, quantity: 1, unit_price: Math.round(params.price * 100) / 100, currency_id: 'BRL' }],
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      back_urls: { success: params.successUrl, failure: params.failureUrl, pending: params.successUrl },
      auto_return: 'approved',
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.id || !body?.init_point) {
    console.error('[Sizzle] Erro ao criar preferência de checkout no Mercado Pago:', body);
    throw new Error(body?.message || 'Não foi possível iniciar o pagamento.');
  }

  return { preferenceId: String(body.id), initPoint: body.init_point };
}

export interface PlatformPaymentInfo {
  status: string;
  externalReference: string | null;
}

// Consulta um pagamento feito na conta da plataforma (Checkout Pro acima) —
// usa platformAccessToken, nunca o token de um restaurante.
export async function getPlatformPayment(paymentId: string): Promise<PlatformPaymentInfo | null> {
  if (!platformAccessToken) return null;

  const response = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${platformAccessToken}` },
  });

  if (!response.ok) return null;

  const body = await response.json().catch(() => null);
  if (!body) return null;

  return { status: body.status, externalReference: body.external_reference ?? null };
}

// --- Mercado Pago Connect (OAuth) -----------------------------------------

export function getMercadoPagoConnectUrl(params: { state: string; redirectUri: string }): string {
  if (!clientId) {
    throw new Error('Mercado Pago Connect não configurado (falta MERCADOPAGO_CLIENT_ID).');
  }

  const url = new URL('https://auth.mercadopago.com.br/authorization');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', params.state);
  url.searchParams.set('redirect_uri', params.redirectUri);
  return url.toString();
}

export interface MercadoPagoOAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  userId: string | null;
}

export async function exchangeMercadoPagoOAuthCode(params: {
  code: string;
  redirectUri: string;
}): Promise<MercadoPagoOAuthTokens> {
  if (!clientId || !clientSecret) {
    throw new Error('Mercado Pago Connect não configurado.');
  }

  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.access_token) {
    console.error('[Sizzle] Erro ao trocar código OAuth do Mercado Pago:', body);
    throw new Error(body?.message || 'Não foi possível conectar sua conta do Mercado Pago.');
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? null,
    userId: body.user_id != null ? String(body.user_id) : null,
  };
}
