'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile, type CurrentProfile } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { BusinessHours } from '@/lib/types';

async function requireOwnerOf(restaurantId: string): Promise<{ profile: CurrentProfile; db: NonNullable<typeof supabase> }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'restaurant_owner' || profile.restaurantId !== restaurantId) {
    throw new Error('Acesso negado.');
  }
  if (!supabase) {
    throw new Error('Banco de dados não configurado.');
  }
  return { profile, db: supabase };
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function updateOrderStatusAsOwner(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const orderId = String(formData.get('orderId') || '');
  const status = String(formData.get('status') || '');
  if (!orderId || !status) fail('/restaurant', 'Pedido e status são obrigatórios.');

  const { error } = await db.from('orders').update({ status }).eq('id', orderId).eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant', 'Não foi possível atualizar o status.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'update_status',
    entity: 'order',
    entityId: orderId,
    newValue: { status },
  });

  revalidatePath('/restaurant');
}

export async function acceptOrder(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const orderId = String(formData.get('orderId') || '');
  if (!orderId) fail('/restaurant', 'Pedido é obrigatório.');

  const { error } = await db
    .from('orders')
    .update({ status: 'Em Preparação' })
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'Pendente');
  if (error) fail('/restaurant', 'Não foi possível aceitar o pedido.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'accept_order',
    entity: 'order',
    entityId: orderId,
    oldValue: { status: 'Pendente' },
    newValue: { status: 'Em Preparação' },
  });

  revalidatePath('/restaurant');
}

export async function rejectOrder(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const orderId = String(formData.get('orderId') || '');
  const reason = String(formData.get('reason') || '').trim();
  if (!orderId) fail('/restaurant', 'Pedido é obrigatório.');
  if (!reason) fail('/restaurant', 'Informe o motivo da recusa.');

  const { error } = await db
    .from('orders')
    .update({ status: 'Recusado', rejection_reason: reason })
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant', 'Não foi possível recusar o pedido.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'reject_order',
    entity: 'order',
    entityId: orderId,
    newValue: { status: 'Recusado', reason },
  });

  revalidatePath('/restaurant');
  revalidatePath('/orders');
}

export async function updateRestaurantSettings(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const deliveryTime = String(formData.get('deliveryTime') || '').trim();
  const deliveryFee = Number(formData.get('deliveryFee') || 0);
  const minOrderValue = Number(formData.get('minOrderValue') || 0);
  const brandColor = String(formData.get('brandColor') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;

  if (!name || !category || !deliveryTime || !(deliveryFee >= 0) || !(minOrderValue >= 0)) {
    fail('/restaurant/settings', 'Nome, categoria, tempo de entrega e taxa são obrigatórios.');
  }

  const updates: {
    name: string;
    category: string;
    delivery_time: string;
    delivery_fee: number;
    min_order_value: number;
    brand_color: string | null;
    description: string | null;
    image_url?: string;
  } = {
    name,
    category,
    delivery_time: deliveryTime,
    delivery_fee: deliveryFee,
    min_order_value: minOrderValue,
    brand_color: brandColor,
    description,
  };

  // Só troca a foto se veio uma nova (o formulário só manda este campo
  // quando o dono escolhe um arquivo novo).
  const imageUrl = formData.get('imageUrl');
  if (imageUrl !== null && String(imageUrl).trim()) {
    updates.image_url = String(imageUrl).trim();
  }

  const { error } = await db.from('restaurants').update(updates).eq('id', restaurantId);
  if (error) {
    console.error('[Sizzle] Erro ao atualizar loja:', error.message);
    fail('/restaurant/settings', 'Não foi possível salvar as informações da loja.');
  }

  revalidatePath('/restaurant/settings');
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function toggleStoreOpen(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const isOpen = formData.get('isOpen') === 'true';

  const { error } = await db.from('restaurants').update({ is_open: isOpen }).eq('id', restaurantId);
  if (error) fail('/restaurant/settings', 'Não foi possível atualizar essa opção.');

  revalidatePath('/restaurant/settings');
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function updateBusinessHours(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const businessHours: BusinessHours = Array.from({ length: 7 }, (_, index) => ({
    enabled: formData.get(`enabled-${index}`) === 'on',
    open: String(formData.get(`open-${index}`) || '00:00'),
    close: String(formData.get(`close-${index}`) || '00:00'),
  }));

  const { error } = await db.from('restaurants').update({ business_hours: businessHours }).eq('id', restaurantId);
  if (error) fail('/restaurant/settings', 'Não foi possível salvar o horário de funcionamento.');

  revalidatePath('/restaurant/settings');
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function disconnectMercadoPago(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const { error } = await db
    .from('restaurants')
    .update({ mp_user_id: null, mp_access_token: null, mp_refresh_token: null, online_payment_enabled: false })
    .eq('id', restaurantId);

  if (error) fail('/restaurant/settings', 'Não foi possível desconectar o Mercado Pago.');

  revalidatePath('/restaurant/settings');
}

export async function toggleOnlinePayment(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const enabled = formData.get('enabled') === 'true';

  const { error } = await db.from('restaurants').update({ online_payment_enabled: enabled }).eq('id', restaurantId);
  if (error) fail('/restaurant/settings', 'Não foi possível atualizar essa opção.');

  revalidatePath('/restaurant/settings');
}

export async function createMenuItem(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const price = Number(formData.get('price') || 0);
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null;
  const category = String(formData.get('category') || '').trim() || 'Geral';

  if (!name || !(price > 0)) fail('/restaurant/menu', 'Nome e preço válido são obrigatórios.');

  const { error } = await db.from('menu_items').insert({
    restaurant_id: restaurantId,
    name,
    description,
    price,
    image_url: imageUrl,
    category,
  });
  if (error) fail('/restaurant/menu', 'Não foi possível criar o item.');

  revalidatePath('/restaurant/menu');
}

export async function updateMenuItem(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const price = Number(formData.get('price') || 0);
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null;
  const category = String(formData.get('category') || '').trim() || 'Geral';
  const active = formData.get('active') === 'on';

  if (!itemId || !name || !(price > 0)) fail('/restaurant/menu', 'Dados inválidos.');

  const { data: previousItem } = await db.from('menu_items').select('name, price').eq('id', itemId).single();

  const { error } = await db
    .from('menu_items')
    .update({ name, description, price, image_url: imageUrl, category, active })
    .eq('id', itemId)
    .eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant/menu', 'Não foi possível atualizar o item.');

  if (previousItem && (previousItem.name !== name || Number(previousItem.price) !== price)) {
    await logAudit(db, {
      userId: profile.id,
      userEmail: profile.email,
      action: 'update_menu_item',
      entity: 'menu_item',
      entityId: itemId,
      oldValue: { name: previousItem.name, price: previousItem.price },
      newValue: { name, price },
    });
  }

  revalidatePath('/restaurant/menu');
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function deleteMenuItem(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  if (!itemId) fail('/restaurant/menu', 'Item é obrigatório.');

  const { data: deletedItem } = await db.from('menu_items').select('name, price').eq('id', itemId).single();

  const { error } = await db.from('menu_items').delete().eq('id', itemId).eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant/menu', 'Não foi possível excluir o item.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'delete_menu_item',
    entity: 'menu_item',
    entityId: itemId,
    oldValue: deletedItem ?? undefined,
  });

  revalidatePath('/restaurant/menu');
}

export async function inviteCourier(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email) fail('/restaurant/couriers', 'E-mail é obrigatório.');

  const { data: courierProfile, error: findError } = await db
    .from('profiles')
    .select('id, role, restaurant_id')
    .eq('email', email)
    .single();

  if (findError || !courierProfile) {
    fail('/restaurant/couriers', 'Nenhum usuário com esse e-mail. Peça pra pessoa criar conta em /signup primeiro.');
  }

  if (courierProfile!.role !== 'customer') {
    fail('/restaurant/couriers', 'Esse e-mail já está vinculado a outro papel no sistema (dono de loja, admin ou já é entregador de outra loja).');
  }

  const { error: updateError } = await db
    .from('profiles')
    .update({ role: 'courier', restaurant_id: restaurantId })
    .eq('id', courierProfile!.id);

  if (updateError) fail('/restaurant/couriers', 'Não foi possível vincular o entregador.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'invite_courier',
    entity: 'profile',
    entityId: courierProfile!.id,
    newValue: { role: 'courier', restaurant_id: restaurantId, email },
  });

  revalidatePath('/restaurant/couriers');
}

export async function removeCourier(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { profile, db } = await requireOwnerOf(restaurantId);

  const courierId = String(formData.get('courierId') || '');
  if (!courierId) fail('/restaurant/couriers', 'Entregador é obrigatório.');

  const { error } = await db
    .from('profiles')
    .update({ role: 'customer', restaurant_id: null })
    .eq('id', courierId)
    .eq('restaurant_id', restaurantId)
    .eq('role', 'courier');

  if (error) fail('/restaurant/couriers', 'Não foi possível remover o entregador.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'remove_courier',
    entity: 'profile',
    entityId: courierId,
    oldValue: { role: 'courier', restaurant_id: restaurantId },
    newValue: { role: 'customer', restaurant_id: null },
  });

  revalidatePath('/restaurant/couriers');
}

export async function assignCourierToOrder(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const orderId = String(formData.get('orderId') || '');
  const courierId = String(formData.get('courierId') || '') || null;
  if (!orderId) fail('/restaurant', 'Pedido é obrigatório.');

  if (courierId) {
    const { data: courierProfile } = await db
      .from('profiles')
      .select('id')
      .eq('id', courierId)
      .eq('restaurant_id', restaurantId)
      .eq('role', 'courier')
      .single();

    if (!courierProfile) fail('/restaurant', 'Esse entregador não pertence a essa loja.');
  }

  const { error } = await db
    .from('orders')
    .update({ courier_id: courierId })
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId);

  if (error) fail('/restaurant', 'Não foi possível atribuir o entregador.');

  revalidatePath('/restaurant');
}

export async function createCoupon(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const code = String(formData.get('code') || '').trim().toUpperCase();
  const discountType = String(formData.get('discountType') || 'percent');
  const discountValue = Number(formData.get('discountValue') || 0);
  const minOrderValue = Number(formData.get('minOrderValue') || 0);
  const maxDiscountRaw = String(formData.get('maxDiscount') || '').trim();
  const maxDiscount = maxDiscountRaw ? Number(maxDiscountRaw) : null;
  const expiresAtRaw = String(formData.get('expiresAt') || '').trim();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;
  const usageLimitRaw = String(formData.get('usageLimit') || '').trim();
  const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null;
  const usageLimitPerCustomer = Number(formData.get('usageLimitPerCustomer') || 1);

  if (!code || !(discountValue > 0) || !['percent', 'fixed'].includes(discountType)) {
    fail('/restaurant/coupons', 'Código e valor de desconto válidos são obrigatórios.');
  }

  const { error } = await db.from('coupons').insert({
    restaurant_id: restaurantId,
    code,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_value: minOrderValue >= 0 ? minOrderValue : 0,
    max_discount: maxDiscount,
    expires_at: expiresAt,
    usage_limit: usageLimit,
    usage_limit_per_customer: usageLimitPerCustomer >= 1 ? usageLimitPerCustomer : 1,
  });

  if (error) {
    if (error.code === '23505') fail('/restaurant/coupons', 'Já existe um cupom com esse código.');
    fail('/restaurant/coupons', 'Não foi possível criar o cupom.');
  }

  revalidatePath('/restaurant/coupons');
}

export async function toggleCouponActive(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const couponId = String(formData.get('couponId') || '');
  const active = formData.get('active') === 'true';
  if (!couponId) fail('/restaurant/coupons', 'Cupom é obrigatório.');

  const { error } = await db.from('coupons').update({ active }).eq('id', couponId).eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant/coupons', 'Não foi possível atualizar o cupom.');

  revalidatePath('/restaurant/coupons');
}

async function requireOwnedMenuItem(db: NonNullable<typeof supabase>, restaurantId: string, itemId: string) {
  const { data: item } = await db.from('menu_items').select('id').eq('id', itemId).eq('restaurant_id', restaurantId).single();
  if (!item) fail('/restaurant/menu', 'Item não encontrado.');
}

export async function createOptionGroup(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  const name = String(formData.get('name') || '').trim();
  const minSelections = Number(formData.get('minSelections') || 0);
  const maxSelections = Number(formData.get('maxSelections') || 1);

  if (!itemId) fail('/restaurant/menu', 'Item é obrigatório.');
  const optionsPath = `/restaurant/menu/${itemId}/options`;
  if (!name || minSelections < 0 || maxSelections < 1 || minSelections > maxSelections) {
    fail(optionsPath, 'Dados inválidos para o grupo de opções.');
  }

  await requireOwnedMenuItem(db, restaurantId, itemId);

  const { error } = await db.from('menu_item_option_groups').insert({
    menu_item_id: itemId,
    name,
    min_selections: minSelections,
    max_selections: maxSelections,
  });
  if (error) fail(optionsPath, 'Não foi possível criar o grupo.');

  revalidatePath(optionsPath);
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function deleteOptionGroup(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  const groupId = String(formData.get('groupId') || '');
  if (!itemId || !groupId) fail('/restaurant/menu', 'Dados inválidos.');
  const optionsPath = `/restaurant/menu/${itemId}/options`;

  await requireOwnedMenuItem(db, restaurantId, itemId);

  const { error } = await db.from('menu_item_option_groups').delete().eq('id', groupId).eq('menu_item_id', itemId);
  if (error) fail(optionsPath, 'Não foi possível excluir o grupo.');

  revalidatePath(optionsPath);
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function createOptionValue(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  const groupId = String(formData.get('groupId') || '');
  const name = String(formData.get('name') || '').trim();
  const priceDelta = Number(formData.get('priceDelta') || 0);

  if (!itemId || !groupId) fail('/restaurant/menu', 'Dados inválidos.');
  const optionsPath = `/restaurant/menu/${itemId}/options`;
  if (!name || !(priceDelta >= 0)) fail(optionsPath, 'Nome e preço válidos são obrigatórios.');

  await requireOwnedMenuItem(db, restaurantId, itemId);

  const { data: group } = await db
    .from('menu_item_option_groups')
    .select('id')
    .eq('id', groupId)
    .eq('menu_item_id', itemId)
    .single();
  if (!group) fail('/restaurant/menu', 'Grupo não encontrado.');

  const { error } = await db.from('menu_item_option_values').insert({ group_id: groupId, name, price_delta: priceDelta });
  if (error) fail(optionsPath, 'Não foi possível criar a opção.');

  revalidatePath(optionsPath);
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function deleteOptionValue(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  const valueId = String(formData.get('valueId') || '');
  if (!itemId || !valueId) fail('/restaurant/menu', 'Dados inválidos.');
  const optionsPath = `/restaurant/menu/${itemId}/options`;

  await requireOwnedMenuItem(db, restaurantId, itemId);

  const { data: value } = await db.from('menu_item_option_values').select('group_id').eq('id', valueId).single();
  if (!value) fail('/restaurant/menu', 'Opção não encontrada.');

  const { data: group } = await db
    .from('menu_item_option_groups')
    .select('id')
    .eq('id', value!.group_id)
    .eq('menu_item_id', itemId)
    .single();
  if (!group) fail('/restaurant/menu', 'Essa opção não pertence a esse item.');

  const { error } = await db.from('menu_item_option_values').delete().eq('id', valueId);
  if (error) fail(optionsPath, 'Não foi possível excluir a opção.');

  revalidatePath(optionsPath);
  revalidatePath('/');
  revalidatePath(`/restaurants/${restaurantId}`);
}

export async function replyToReview(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const { db } = await requireOwnerOf(restaurantId);

  const reviewId = String(formData.get('reviewId') || '');
  const reply = String(formData.get('reply') || '').trim();
  if (!reviewId || !reply) fail('/restaurant/reviews', 'Resposta é obrigatória.');

  const { error } = await db
    .from('reviews')
    .update({ restaurant_reply: reply })
    .eq('id', reviewId)
    .eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant/reviews', 'Não foi possível salvar a resposta.');

  revalidatePath('/restaurant/reviews');
}
