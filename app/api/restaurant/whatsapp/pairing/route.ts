import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getCurrentProfile } from '@/lib/auth';
import { getWhatsappPairingStatus, isWhatsappBotConfigured, startWhatsappPairing, type PairingStatus } from '@/lib/whatsapp-bot-client';

// Só o dono logado do próprio restaurante pode iniciar/consultar o pareamento
// — nunca aceita restaurantId vindo do cliente, sempre o da sessão atual.
async function requireOwnerRestaurantId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'restaurant_owner' || !profile.restaurantId) return null;
  return profile.restaurantId;
}

// O QR que o Baileys gera é só uma string — convertida aqui pra imagem
// (mesma lib `qrcode` já usada no Pix/comanda) pra renderizar direto num
// <img>, sem o painel precisar saber nada sobre o formato do Baileys.
async function toResponse(result: PairingStatus): Promise<NextResponse> {
  if (result.status === 'pairing' && result.qr) {
    const qrCodeImage = await QRCode.toDataURL(result.qr, { margin: 1, width: 280 });
    return NextResponse.json({ status: 'pairing', qrCodeImage });
  }
  if (result.status === 'pairing') {
    return NextResponse.json({ status: 'pairing', qrCodeImage: null });
  }
  return NextResponse.json({ status: result.status });
}

export async function POST() {
  if (!isWhatsappBotConfigured) {
    return NextResponse.json({ error: 'Bot de WhatsApp não configurado nesta instância.' }, { status: 503 });
  }

  const restaurantId = await requireOwnerRestaurantId();
  if (!restaurantId) return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });

  try {
    const result = await startWhatsappPairing(restaurantId);
    return await toResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado ao iniciar o pareamento.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET() {
  if (!isWhatsappBotConfigured) {
    return NextResponse.json({ status: 'unavailable' });
  }

  const restaurantId = await requireOwnerRestaurantId();
  if (!restaurantId) return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });

  try {
    const result = await getWhatsappPairingStatus(restaurantId);
    return await toResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado ao consultar o pareamento.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
