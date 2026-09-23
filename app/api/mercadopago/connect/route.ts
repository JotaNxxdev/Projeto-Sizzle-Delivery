import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { getMercadoPagoConnectUrl, isMercadoPagoOAuthConfigured } from '@/lib/mercadopago';

// Leva o dono do restaurante pra tela de autorização do Mercado Pago.
// Depois de autorizar, o Mercado Pago redireciona pra /api/mercadopago/callback.
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'restaurant_owner' || !profile.restaurantId) {
    return NextResponse.redirect(new URL('/restaurant/settings', request.url));
  }

  if (!isMercadoPagoOAuthConfigured) {
    const url = new URL('/restaurant/settings', request.url);
    url.searchParams.set('error', 'Conexão com Mercado Pago ainda não configurada pelo administrador do sistema.');
    return NextResponse.redirect(url);
  }

  const connectUrl = getMercadoPagoConnectUrl({
    state: profile.restaurantId,
    redirectUri: `${request.nextUrl.origin}/api/mercadopago/callback`,
  });

  return NextResponse.redirect(connectUrl);
}
