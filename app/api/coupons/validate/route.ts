import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { validateCoupon } from '@/lib/coupons';

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ valid: false, error: 'Você precisa estar logado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { restaurantId?: string; code?: string; subtotal?: number } | null;
  if (!body?.restaurantId || !body.code || typeof body.subtotal !== 'number') {
    return NextResponse.json({ valid: false, error: 'Dados inválidos.' }, { status: 400 });
  }

  const result = await validateCoupon(body.restaurantId, body.code, body.subtotal, profile.id);
  return NextResponse.json(result);
}
