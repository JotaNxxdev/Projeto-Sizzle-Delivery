import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'restaurant_owner' || !profile.restaurantId) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  if (!supabase) {
    return NextResponse.json({ count: 0, latestCreatedAt: null });
  }

  const since = request.nextUrl.searchParams.get('since');
  if (!since) {
    return NextResponse.json({ error: 'Parâmetro since é obrigatório.' }, { status: 400 });
  }

  const { data, error, count } = await supabase
    .from('orders')
    .select('created_at', { count: 'exact' })
    .eq('restaurant_id', profile.restaurantId)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[Sizzle] Erro ao checar pedidos novos:', error.message);
    return NextResponse.json({ error: 'Não foi possível checar pedidos novos.' }, { status: 500 });
  }

  return NextResponse.json({
    count: count ?? 0,
    latestCreatedAt: data?.[0]?.created_at ?? null,
  });
}
