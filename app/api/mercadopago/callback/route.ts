import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';
import { exchangeMercadoPagoOAuthCode } from '@/lib/mercadopago';

function fail(request: NextRequest, message: string) {
  const url = new URL('/restaurant/settings', request.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return fail(request, 'Autorização do Mercado Pago incompleta. Tente novamente.');
  }

  const profile = await getCurrentProfile();

  // O "state" precisa bater com o restaurante da conta logada — impede que
  // alguém forje esse parâmetro e ligue o token a um restaurante que não é
  // o dela (a checagem real de posse acontece aqui, não no parâmetro em si).
  if (!profile || profile.role !== 'restaurant_owner' || profile.restaurantId !== state) {
    return fail(request, 'Não foi possível confirmar a autorização para o seu restaurante.');
  }

  if (!supabase) {
    return fail(request, 'Banco de dados não configurado.');
  }

  try {
    const tokens = await exchangeMercadoPagoOAuthCode({
      code,
      redirectUri: `${request.nextUrl.origin}/api/mercadopago/callback`,
    });

    const { error } = await supabase
      .from('restaurants')
      .update({
        mp_user_id: tokens.userId,
        mp_access_token: tokens.accessToken,
        mp_refresh_token: tokens.refreshToken,
        online_payment_enabled: true,
      })
      .eq('id', state);

    if (error) {
      console.error('[Sizzle] Erro ao salvar conexão do Mercado Pago:', error.message);
      return fail(request, 'Conectou, mas não conseguimos salvar. Tente novamente.');
    }
  } catch (err) {
    console.error('[Sizzle] Erro ao conectar Mercado Pago:', err);
    return fail(request, 'Não foi possível conectar sua conta do Mercado Pago.');
  }

  const url = new URL('/restaurant/settings', request.url);
  url.searchParams.set('connected', '1');
  return NextResponse.redirect(url);
}
