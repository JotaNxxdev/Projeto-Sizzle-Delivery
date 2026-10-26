import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getRestaurantById } from '@/lib/restaurants';
import { calculateOrderPricing, type IncomingOrderItem } from '@/lib/order-validation';
import type { DeliveryMethod } from '@/lib/types';

// Endpoint de uso exclusivo do bot de WhatsApp — mostra o resumo do pedido
// (itens, taxa, desconto, total) ANTES da confirmação final, usando
// exatamente o mesmo cálculo de app/api/orders/route.ts (lib/order-validation.ts),
// sem gravar nada no banco. Protegido pelo mesmo token interno: sem ele,
// ninguém consegue usar esse endpoint pra "sondar" preço/cupom de um
// restaurante.
const BOT_TOKEN_HEADER = 'x-sizzle-bot-token';

function isTrustedBotRequest(request: NextRequest): boolean {
  const expected = process.env.WHATSAPP_BOT_API_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get(BOT_TOKEN_HEADER);
  return Boolean(provided) && provided === expected;
}

interface PreviewOrderBody {
  restaurantId?: string;
  items?: IncomingOrderItem[];
  deliveryMethod?: DeliveryMethod;
  couponCode?: string;
  scheduledFor?: string;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Banco de dados ainda não configurado. Veja o README para configurar o Supabase.' },
      { status: 503 }
    );
  }

  if (!isTrustedBotRequest(request)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PreviewOrderBody | null;
  if (!body?.restaurantId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Dados do pedido incompletos.' }, { status: 400 });
  }

  const restaurant = await getRestaurantById(body.restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
  }

  const deliveryMethod: DeliveryMethod = body.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

  // Pré-visualização nunca grava cupom usado nem precisa de um cliente
  // logado — por isso userId sempre null aqui (o limite "por cliente" de um
  // cupom só é checado de verdade na criação do pedido de fato).
  const pricing = await calculateOrderPricing({
    restaurant,
    items: body.items,
    deliveryMethod,
    couponCode: body.couponCode,
    userId: null,
    scheduledForRaw: body.scheduledFor,
  });

  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: pricing.status });
  }

  return NextResponse.json({
    items: pricing.resolvedItems.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      options: item.options,
    })),
    subtotal: pricing.subtotal,
    deliveryFee: pricing.deliveryFee,
    discountAmount: pricing.discountAmount,
    total: pricing.total,
  });
}
