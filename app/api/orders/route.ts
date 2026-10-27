import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getRestaurantById } from '@/lib/restaurants';
import { getCurrentProfile } from '@/lib/auth';
import { createPixPayment } from '@/lib/mercadopago';
import { isValidBrazilianPhone } from '@/lib/phone';
import { sendPushToUser } from '@/lib/push';
import { formatCurrency } from '@/lib/format';
import { calculateOrderPricing, type IncomingOrderItem } from '@/lib/order-validation';
import type { DeliveryMethod, OrderOrigin, PaymentMethod } from '@/lib/types';

type IncomingItem = IncomingOrderItem;

// Header usado só pelo bot de WhatsApp (serviço separado, sem sessão de
// cookie) pra se autenticar como um cliente de confiança do backend. Sem
// esse header batendo com a variável de ambiente, a origem do pedido é
// SEMPRE 'web' — nunca confiamos em um campo "origin" vindo do corpo da
// requisição normal do site.
const BOT_TOKEN_HEADER = 'x-sizzle-bot-token';

function isTrustedBotRequest(request: NextRequest): boolean {
  const expected = process.env.WHATSAPP_BOT_API_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get(BOT_TOKEN_HEADER);
  return Boolean(provided) && provided === expected;
}

interface CreateOrderBody {
  restaurantId?: string;
  items?: IncomingItem[];
  notes?: string;
  contact?: string;
  receiverName?: string;
  deliveryMethod?: DeliveryMethod;
  street?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  referencePoint?: string;
  paymentMethod?: PaymentMethod;
  changeFor?: number | null;
  couponCode?: string;
  scheduledFor?: string;
}

function composeAddress(body: CreateOrderBody): string {
  if (body.deliveryMethod === 'pickup') return 'Retirada no local';

  const line1 = [body.street?.trim(), body.streetNumber?.trim()].filter(Boolean).join(', ');
  const line2 = [body.complement?.trim(), body.neighborhood?.trim(), body.city?.trim()].filter(Boolean).join(' - ');
  return [line1, line2].filter(Boolean).join(' - ') || 'Endereço não informado';
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Banco de dados ainda não configurado. Veja o README para configurar o Supabase.' },
      { status: 503 }
    );
  }

  // O pedido do site sempre exige conta — é o que liga o pedido para sempre
  // a quem o fez. O bot de WhatsApp é um serviço de confiança do próprio
  // backend (sem cookie de sessão), autenticado pelo token verificado acima;
  // pra ele o pedido fica com user_id nulo (igual já era previsto pra
  // "pedido de visitante" no banco) e o cliente é identificado pelo telefone.
  const isBotRequest = isTrustedBotRequest(request);

  let profile: { id: string; email: string } | null = null;
  if (!isBotRequest) {
    profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Você precisa estar logado para finalizar um pedido.' }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { restaurantId, items, notes, contact, receiverName } = body;
  const deliveryMethod: DeliveryMethod = body.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

  // 'pix' aqui é SEMPRE a cobrança online via Mercado Pago (exige profile.email
  // mais abaixo) — por isso nunca é aceito de uma requisição do bot. O bot só
  // pode usar 'pix_manual' (chave Pix combinada por fora), que o site nunca
  // envia. 'origin' nunca vem do corpo da requisição: só do token já
  // verificado no servidor, então uma requisição do site jamais grava
  // origin='whatsapp', mesmo que tente.
  const allowedPaymentMethods: PaymentMethod[] = isBotRequest ? ['cash', 'card', 'pix_manual'] : ['pix', 'cash', 'card'];
  const paymentMethod: PaymentMethod = allowedPaymentMethods.includes(body.paymentMethod as PaymentMethod)
    ? (body.paymentMethod as PaymentMethod)
    : 'cash';
  const origin: OrderOrigin = isBotRequest ? 'whatsapp' : 'web';

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Dados do pedido incompletos.' }, { status: 400 });
  }
  if (!contact?.trim() || !receiverName?.trim()) {
    return NextResponse.json({ error: 'Nome e telefone para contato são obrigatórios.' }, { status: 400 });
  }
  if (!isValidBrazilianPhone(contact)) {
    return NextResponse.json({ error: 'Telefone de contato inválido. Informe um número com DDD.' }, { status: 400 });
  }
  if (
    deliveryMethod === 'delivery' &&
    (!body.street?.trim() || !body.streetNumber?.trim() || !body.neighborhood?.trim() || !body.city?.trim())
  ) {
    return NextResponse.json({ error: 'Rua, número, bairro e cidade são obrigatórios para entrega.' }, { status: 400 });
  }

  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
  }

  // Só aceita "pix" (cobrança online) se o restaurante realmente estiver com
  // pagamento online ativado e conectado — nunca confiamos apenas no que o
  // cliente mandou. (Pedido do bot nunca chega aqui com 'pix': ver acima.)
  if (paymentMethod === 'pix' && !restaurant.onlinePaymentEnabled) {
    return NextResponse.json({ error: 'Este restaurante não aceita pagamento online no momento.' }, { status: 400 });
  }

  const isSeedRestaurant = restaurant.id.startsWith('seed-');
  const couponCode = body.couponCode?.trim();

  // Mesmo cálculo/validação usado pelo endpoint de pré-visualização
  // (app/api/orders/preview/route.ts) — nunca confiamos em preço, desconto
  // ou total vindos do cliente (site ou bot).
  const pricing = await calculateOrderPricing({
    restaurant,
    items,
    deliveryMethod,
    couponCode,
    userId: profile?.id ?? null,
    scheduledForRaw: body.scheduledFor,
  });
  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: pricing.status });
  }
  const { resolvedItems, subtotal, deliveryFee, discountAmount, total, appliedCouponId, scheduledFor } = pricing;

  const orderCode = `PED-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
  const changeFor =
    paymentMethod === 'cash' && typeof body.changeFor === 'number' && body.changeFor > total ? body.changeFor : null;

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_code: orderCode,
      restaurant_id: isSeedRestaurant ? null : restaurant.id,
      restaurant_name: restaurant.name,
      contact_number: contact.trim(),
      delivery_address: composeAddress(body),
      receiver_name: receiverName.trim(),
      street: body.street?.trim() || null,
      street_number: body.streetNumber?.trim() || null,
      complement: body.complement?.trim() || null,
      neighborhood: body.neighborhood?.trim() || null,
      city: body.city?.trim() || null,
      reference_point: body.referencePoint?.trim() || null,
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      change_for: changeFor,
      notes: notes?.trim() || null,
      status: 'Pendente',
      subtotal,
      delivery_fee: deliveryFee,
      coupon_code: appliedCouponId ? couponCode!.toUpperCase() : null,
      discount_amount: discountAmount,
      total,
      user_id: profile?.id ?? null,
      scheduled_for: scheduledFor ? scheduledFor.toISOString() : null,
      origin,
    })
    .select()
    .single();

  if (orderError || !orderRow) {
    console.error('[Sizzle] Erro ao salvar pedido:', orderError?.message);
    return NextResponse.json({ error: 'Não foi possível salvar o pedido.' }, { status: 500 });
  }

  if (appliedCouponId) {
    const { error: redemptionError } = await supabase.from('coupon_redemptions').insert({
      coupon_id: appliedCouponId,
      order_id: orderRow.id,
      user_id: profile?.id ?? null,
      discount_applied: discountAmount,
    });
    if (redemptionError) {
      console.error('[Sizzle] Erro ao registrar uso do cupom:', redemptionError.message);
    }
  }

  // Insere item por item (em vez de um insert em lote) pra conseguir o id de
  // cada order_item de volta e gravar seus adicionais como snapshot.
  for (const item of resolvedItems) {
    const { data: insertedItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderRow.id,
        menu_item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image,
      })
      .select('id')
      .single();

    if (itemError || !insertedItem) {
      console.error('[Sizzle] Erro ao salvar item do pedido:', itemError?.message);
      return NextResponse.json({ error: 'Não foi possível salvar os itens do pedido.' }, { status: 500 });
    }

    if (item.options.length > 0) {
      const { error: optionsError } = await supabase.from('order_item_options').insert(
        item.options.map((option) => ({
          order_item_id: insertedItem.id,
          group_name: option.groupName,
          option_name: option.optionName,
          price_delta: option.priceDelta,
        }))
      );
      if (optionsError) {
        console.error('[Sizzle] Erro ao salvar adicionais do item:', optionsError.message);
      }
    }
  }

  // Notifica o(s) dono(s) do restaurante por push — além do aviso sonoro
  // que já existe dentro do painel, isso funciona com o app fechado.
  if (!isSeedRestaurant) {
    const { data: owners } = await supabase
      .from('profiles')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('role', 'restaurant_owner');

    await Promise.all(
      (owners ?? []).map((owner) =>
        sendPushToUser(owner.id, {
          title: 'Novo pedido!',
          body: `Pedido ${orderCode} — ${formatCurrency(total)}${scheduledFor ? ' (agendado)' : ''}`,
          url: '/restaurant',
        })
      )
    );
  }

  if (paymentMethod !== 'pix') {
    // Dinheiro ou cartão na entrega: nenhuma cobrança online é criada.
    return NextResponse.json({ orderCode, payment: null }, { status: 201 });
  }

  // Busca o token de pagamento do PRÓPRIO restaurante — o dinheiro cai
  // direto na conta dele, nunca na da plataforma.
  const { data: restaurantAuth } = await supabase
    .from('restaurants')
    .select('mp_access_token')
    .eq('id', restaurant.id)
    .single();

  if (!restaurantAuth?.mp_access_token) {
    console.error('[Sizzle] Restaurante sem token do Mercado Pago apesar de online_payment_enabled=true:', restaurant.id);
    return NextResponse.json({ orderCode, payment: null, paymentError: true }, { status: 201 });
  }

  try {
    // Chegar até aqui exige paymentMethod === 'pix', e isso nunca é permitido
    // pra requisição do bot (allowedPaymentMethods acima) — então profile
    // sempre existe neste ponto.
    const payment = await createPixPayment({
      amount: total,
      description: `Pedido ${orderCode} - ${restaurant.name}`,
      payerEmail: profile!.email,
      externalReference: orderCode,
      notificationUrl: `${request.nextUrl.origin}/api/webhooks/mercadopago`,
      accessToken: restaurantAuth.mp_access_token,
    });

    await supabase
      .from('orders')
      .update({ mp_payment_id: payment.paymentId, payment_status: payment.status })
      .eq('id', orderRow.id);

    return NextResponse.json(
      {
        orderCode,
        payment: {
          id: payment.paymentId,
          status: payment.status,
          qrCode: payment.qrCode,
          qrCodeBase64: payment.qrCodeBase64,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // O pedido já está salvo — a pessoa só não recebeu o QR Code Pix agora.
    // Deixamos o pedido como "pending" e ela pode tentar de novo pela tela
    // de pedidos (ou combinar o pagamento por fora).
    console.error('[Sizzle] Erro ao criar pagamento Pix:', err);
    return NextResponse.json({ orderCode, payment: null, paymentError: true }, { status: 201 });
  }
}

export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ orders: [] });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado para ver seus pedidos.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_code, restaurant_name, notes, contact_number, delivery_address, receiver_name, street, street_number, complement, neighborhood, city, reference_point, delivery_method, payment_method, change_for, status, rejection_reason, payment_status, subtotal, delivery_fee, coupon_code, discount_amount, total, created_at, scheduled_for, origin, order_items(id, menu_item_name, price, quantity)'
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Sizzle] Erro ao buscar pedidos:', error.message);
    return NextResponse.json({ error: 'Não foi possível buscar os pedidos.' }, { status: 500 });
  }

  // Busca as avaliações já feitas por esse usuário de uma vez, em vez de
  // uma query por pedido, e junta em memória pelo order_id.
  const orderIds = (data ?? []).map((order) => order.id);
  const reviewByOrderId = new Map<string, { rating: number; comment: string | null; restaurant_reply: string | null }>();
  if (orderIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from('reviews')
      .select('order_id, rating, comment, restaurant_reply')
      .in('order_id', orderIds);
    for (const review of reviewRows ?? []) {
      reviewByOrderId.set(review.order_id, review);
    }
  }

  // Idem para os adicionais escolhidos em cada item — uma busca em lote em
  // vez de uma por item.
  const orderItemIds = (data ?? []).flatMap((order) => (order.order_items ?? []).map((item) => item.id));
  const optionsByItemId = new Map<string, { group_name: string; option_name: string; price_delta: number }[]>();
  if (orderItemIds.length > 0) {
    const { data: optionRows } = await supabase
      .from('order_item_options')
      .select('order_item_id, group_name, option_name, price_delta')
      .in('order_item_id', orderItemIds);
    for (const row of optionRows ?? []) {
      const list = optionsByItemId.get(row.order_item_id) ?? [];
      list.push(row);
      optionsByItemId.set(row.order_item_id, list);
    }
  }

  const orders = (data ?? []).map((order) => ({
    id: order.order_code,
    restaurantName: order.restaurant_name,
    notes: order.notes,
    contact: order.contact_number,
    address: order.delivery_address,
    receiverName: order.receiver_name,
    addressDetails: {
      street: order.street,
      streetNumber: order.street_number,
      complement: order.complement,
      neighborhood: order.neighborhood,
      city: order.city,
      referencePoint: order.reference_point,
    },
    deliveryMethod: order.delivery_method,
    paymentMethod: order.payment_method,
    changeFor: order.change_for != null ? Number(order.change_for) : null,
    status: order.status,
    rejectionReason: order.rejection_reason,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    couponCode: order.coupon_code,
    discountAmount: Number(order.discount_amount),
    total: Number(order.total),
    date: new Date(order.created_at).toLocaleString('pt-BR'),
    scheduledFor: order.scheduled_for ? new Date(order.scheduled_for).toLocaleString('pt-BR') : null,
    origin: order.origin,
    items: (order.order_items ?? []).map((item) => ({
      name: item.menu_item_name,
      price: Number(item.price),
      quantity: item.quantity,
      options: (optionsByItemId.get(item.id) ?? []).map((o) => ({
        groupName: o.group_name,
        optionName: o.option_name,
        priceDelta: Number(o.price_delta),
      })),
    })),
    review: reviewByOrderId.has(order.id)
      ? {
          rating: reviewByOrderId.get(order.id)!.rating,
          comment: reviewByOrderId.get(order.id)!.comment,
          restaurantReply: reviewByOrderId.get(order.id)!.restaurant_reply,
        }
      : null,
  }));

  return NextResponse.json({ orders });
}
