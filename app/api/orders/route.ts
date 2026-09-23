import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getRestaurantById } from '@/lib/restaurants';
import { getCurrentProfile } from '@/lib/auth';
import { createPixPayment, isMercadoPagoConfigured } from '@/lib/mercadopago';

interface IncomingItem {
  menuItemId: string;
  quantity: number;
}

interface CreateOrderBody {
  restaurantId?: string;
  items?: IncomingItem[];
  notes?: string;
  contact?: string;
  address?: string;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Banco de dados ainda não configurado. Veja o README para configurar o Supabase.' },
      { status: 503 }
    );
  }

  // Fazer pedido exige conta — é o que liga o pedido para sempre a quem o fez,
  // em vez de um ID solto no navegador que some se o cache for limpo.
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado para finalizar um pedido.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { restaurantId, items, notes, contact, address } = body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Dados do pedido incompletos.' }, { status: 400 });
  }
  if (!contact?.trim() || !address?.trim()) {
    return NextResponse.json({ error: 'Telefone e endereço são obrigatórios.' }, { status: 400 });
  }

  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
  }

  // Nunca confiamos em preços vindos do cliente: recalculamos tudo a partir
  // do cardápio carregado no servidor, para o pedido não poder ser adulterado.
  let subtotal = 0;
  const resolvedItems: { name: string; price: number; quantity: number; image: string }[] = [];

  for (const incoming of items) {
    const menuItem = restaurant.menu.find((item) => item.id === incoming.menuItemId);
    if (!menuItem || !Number.isInteger(incoming.quantity) || incoming.quantity <= 0) {
      return NextResponse.json({ error: 'Item do pedido inválido.' }, { status: 400 });
    }
    subtotal += menuItem.price * incoming.quantity;
    resolvedItems.push({
      name: menuItem.name,
      price: menuItem.price,
      quantity: incoming.quantity,
      image: menuItem.image,
    });
  }

  const deliveryFee = restaurant.deliveryFee;
  const total = subtotal + deliveryFee;
  const orderCode = `PED-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_code: orderCode,
      restaurant_id: restaurant.id.startsWith('seed-') ? null : restaurant.id,
      restaurant_name: restaurant.name,
      contact_number: contact.trim(),
      delivery_address: address.trim(),
      notes: notes?.trim() || null,
      status: 'Pendente',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      user_id: profile.id,
    })
    .select()
    .single();

  if (orderError || !orderRow) {
    console.error('[Sizzle] Erro ao salvar pedido:', orderError?.message);
    return NextResponse.json({ error: 'Não foi possível salvar o pedido.' }, { status: 500 });
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    resolvedItems.map((item) => ({
      order_id: orderRow.id,
      menu_item_name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image,
    }))
  );

  if (itemsError) {
    console.error('[Sizzle] Erro ao salvar itens do pedido:', itemsError.message);
    return NextResponse.json({ error: 'Não foi possível salvar os itens do pedido.' }, { status: 500 });
  }

  // Sem Mercado Pago configurado, o pedido continua funcionando (fica
  // registrado como "pending" — combine o pagamento por fora, por enquanto).
  if (!isMercadoPagoConfigured) {
    return NextResponse.json({ orderCode, payment: null }, { status: 201 });
  }

  try {
    const payment = await createPixPayment({
      amount: total,
      description: `Pedido ${orderCode} - ${restaurant.name}`,
      payerEmail: profile.email,
      externalReference: orderCode,
      notificationUrl: `${request.nextUrl.origin}/api/webhooks/mercadopago`,
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
      'order_code, restaurant_name, notes, contact_number, delivery_address, status, payment_status, subtotal, delivery_fee, total, created_at, order_items(menu_item_name, price, quantity)'
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Sizzle] Erro ao buscar pedidos:', error.message);
    return NextResponse.json({ error: 'Não foi possível buscar os pedidos.' }, { status: 500 });
  }

  const orders = (data ?? []).map((order) => ({
    id: order.order_code,
    restaurantName: order.restaurant_name,
    notes: order.notes,
    contact: order.contact_number,
    address: order.delivery_address,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    date: new Date(order.created_at).toLocaleString('pt-BR'),
    items: (order.order_items ?? []).map((item) => ({
      name: item.menu_item_name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  }));

  return NextResponse.json({ orders });
}
