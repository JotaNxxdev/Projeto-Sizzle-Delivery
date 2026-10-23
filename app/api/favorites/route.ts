import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ restaurantIds: [] });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ restaurantIds: [] });
  }

  const { data, error } = await supabase.from('favorites').select('restaurant_id').eq('user_id', profile.id);
  if (error) {
    console.error('[Sizzle] Erro ao buscar favoritos:', error.message);
    return NextResponse.json({ restaurantIds: [] });
  }

  return NextResponse.json({ restaurantIds: (data ?? []).map((f) => f.restaurant_id) });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado pra favoritar.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { restaurantId?: string } | null;
  const restaurantId = body?.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: 'Restaurante é obrigatório.' }, { status: 400 });
  }

  // Alterna: se já é favorito, desfavorita; senão, favorita.
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', profile.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
    if (error) return NextResponse.json({ error: 'Não foi possível desfavoritar.' }, { status: 500 });
    return NextResponse.json({ favorited: false });
  }

  const { error } = await supabase.from('favorites').insert({ user_id: profile.id, restaurant_id: restaurantId });
  if (error) {
    console.error('[Sizzle] Erro ao favoritar restaurante:', error.message);
    return NextResponse.json({ error: 'Não foi possível favoritar esse restaurante.' }, { status: 400 });
  }
  return NextResponse.json({ favorited: true });
}
