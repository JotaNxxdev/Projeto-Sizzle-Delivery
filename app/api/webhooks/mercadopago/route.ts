import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getPaymentStatus, isMercadoPagoConfigured } from '@/lib/mercadopago';

// O Mercado Pago chama esta rota quando o status de um pagamento muda.
// Nunca confiamos no corpo da notificação em si (qualquer um pode fazer um
// POST fingindo ser o Mercado Pago) — usamos só o ID que ele informa pra
// perguntar pro próprio Mercado Pago qual é o status real daquele pagamento.
//
// Sempre respondemos 200 rapidamente (mesmo em erro interno) pra evitar que
// o Mercado Pago fique reenviando a notificação sem parar.
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabase || !isMercadoPagoConfigured) {
      return NextResponse.json({ received: true });
    }

    const body = (await request.json().catch(() => null)) as { data?: { id?: string | number } } | null;
    const paymentId =
      body?.data?.id != null
        ? String(body.data.id)
        : request.nextUrl.searchParams.get('data.id') || request.nextUrl.searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    const status = await getPaymentStatus(paymentId);
    if (status) {
      await supabase.from('orders').update({ payment_status: status }).eq('mp_payment_id', paymentId);
    }
  } catch (err) {
    console.error('[Sizzle] Erro ao processar webhook do Mercado Pago:', err);
  }

  return NextResponse.json({ received: true });
}
