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

  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .eq('order_code', code)
    .single();

  if (findError || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }
  if (order.user_id !== profile.id) {
    return NextResponse.json({ error: 'Esse pedido não é seu.' }, { status: 403 });
  }
  if (order.status !== 'Pendente') {
    return NextResponse.json(
      { error: 'Esse pedido já está em preparo e não pode mais ser cancelado por aqui.' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('orders').update({ status: 'Cancelado' }).eq('id', order.id);
  if (error) {
    console.error('[Sizzle] Erro ao cancelar pedido:', error.message);
    return NextResponse.json({ error: 'Não foi possível cancelar o pedido.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
