import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';
import { getPaymentStatus } from '@/lib/mercadopago';

// Consultado pela tela de checkout enquanto o cliente espera o Pix cair.
// Sempre que possível, confere direto com o Mercado Pago (fonte da verdade)
// em vez de confiar só no que já está salvo no banco — assim funciona mesmo
// que o aviso automático (webhook) do Mercado Pago atrase ou falhe.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado.' }, { status: 401 });
  }

  const { code } = await params;

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, user_id, restaurant_id, mp_payment_id, payment_status')
    .eq('order_code', code)
    .single();

  if (error || !order || order.user_id !== profile.id) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }

  if (!order.mp_payment_id) {
    return NextResponse.json({ paymentStatus: order.payment_status });
  }

  // Precisa do token do restaurante DONO do pagamento (foi criado na conta
  // dele, não na da plataforma) para conseguir consultar o status.
  let restaurantToken: string | null = null;
  if (order.restaurant_id) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('mp_access_token')
      .eq('id', order.restaurant_id)
      .single();
    restaurantToken = restaurant?.mp_access_token ?? null;
  }

  const liveStatus = await getPaymentStatus(order.mp_payment_id, restaurantToken);
  if (liveStatus && liveStatus !== order.payment_status) {
    await supabase.from('orders').update({ payment_status: liveStatus }).eq('id', order.id);
  }

  return NextResponse.json({ paymentStatus: liveStatus ?? order.payment_status });
}
