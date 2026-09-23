import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getPaymentStatus } from '@/lib/mercadopago';

// O Mercado Pago chama esta rota quando o status de um pagamento muda.
// Nunca confiamos no corpo da notificação em si (qualquer um pode fazer um
// POST fingindo ser o Mercado Pago) — usamos só o ID que ele informa pra
// perguntar pro próprio Mercado Pago qual é o status real daquele pagamento,
// usando o token do restaurante dono do pedido (cada um tem sua própria
// conta conectada via Mercado Pago Connect).
//
// Sempre respondemos 200 rapidamente (mesmo em erro interno) pra evitar que
// o Mercado Pago fique reenviando a notificação sem parar.
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabase) {
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

    const { data: order } = await supabase
      .from('orders')
      .select('id, restaurant_id')
      .eq('mp_payment_id', paymentId)
      .single();

    if (!order) {
      return NextResponse.json({ received: true });
    }

    let restaurantToken: string | null = null;
    if (order.restaurant_id) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('mp_access_token')
        .eq('id', order.restaurant_id)
        .single();
      restaurantToken = restaurant?.mp_access_token ?? null;
    }

    const status = await getPaymentStatus(paymentId, restaurantToken);
    if (status) {
      await supabase.from('orders').update({ payment_status: status }).eq('id', order.id);
    }
  } catch (err) {
    console.error('[Sizzle] Erro ao processar webhook do Mercado Pago:', err);
  }

  return NextResponse.json({ received: true });
}
