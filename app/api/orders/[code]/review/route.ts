import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado.' }, { status: 401 });
  }

  const { code } = await params;
  const body = (await request.json().catch(() => null)) as { rating?: number; comment?: string } | null;
  const rating = Number(body?.rating);
  const comment = body?.comment?.trim() || null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Avaliação deve ser de 1 a 5 estrelas.' }, { status: 400 });
  }

  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('id, user_id, status, restaurant_id')
    .eq('order_code', code)
    .single();

  if (findError || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }
  if (order.user_id !== profile.id) {
    return NextResponse.json({ error: 'Esse pedido não é seu.' }, { status: 403 });
  }
  if (order.status !== 'Entregue') {
    return NextResponse.json({ error: 'Só é possível avaliar pedidos já entregues.' }, { status: 400 });
  }
  if (!order.restaurant_id) {
    return NextResponse.json({ error: 'Esse pedido não pode ser avaliado.' }, { status: 400 });
  }

  const { error } = await supabase.from('reviews').insert({
    order_id: order.id,
    restaurant_id: order.restaurant_id,
    user_id: profile.id,
    rating,
    comment,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Você já avaliou esse pedido.' }, { status: 409 });
    }
    console.error('[Sizzle] Erro ao salvar avaliação:', error.message);
    return NextResponse.json({ error: 'Não foi possível salvar sua avaliação.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
