// Integração com a API de Pagamentos do Mercado Pago (Pix).
// Documentação: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
//
// Uso exclusivamente server-side: o Access Token nunca deve ser exposto ao
// navegador. Fica em MERCADOPAGO_ACCESS_TOKEN (.env.local / Vercel).
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

export const isMercadoPagoConfigured = Boolean(accessToken);

const BASE_URL = 'https://api.mercadopago.com';

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

export async function createPixPayment(params: {
  amount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
}): Promise<PixPaymentResult> {
  if (!accessToken) {
    throw new Error('Mercado Pago não configurado.');
  }

  const response = await fetch(`${BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
// API do Mercado Pago responde quando perguntamos por este ID.
export async function getPaymentStatus(paymentId: string): Promise<string | null> {
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
