'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

async function requireOwnerOf(restaurantId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'restaurant_owner' || profile.restaurantId !== restaurantId) {
    throw new Error('Acesso negado.');
  }
  if (!supabase) {
    throw new Error('Banco de dados não configurado.');
  }
  return supabase;
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function updateOrderStatusAsOwner(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const orderId = String(formData.get('orderId') || '');
  const status = String(formData.get('status') || '');
  if (!orderId || !status) fail('/restaurant', 'Pedido e status são obrigatórios.');

  const { error } = await db.from('orders').update({ status }).eq('id', orderId).eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant', 'Não foi possível atualizar o status.');

  revalidatePath('/restaurant');
}

export async function updateRestaurantSettings(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const deliveryTime = String(formData.get('deliveryTime') || '').trim();
  const deliveryFee = Number(formData.get('deliveryFee') || 0);
  const brandColor = String(formData.get('brandColor') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;

  if (!name || !category || !deliveryTime || !(deliveryFee >= 0)) {
    fail('/restaurant/settings', 'Nome, categoria, tempo de entrega e taxa são obrigatórios.');
  }

  const updates: {
    name: string;
    category: string;
    delivery_time: string;
    delivery_fee: number;
    brand_color: string | null;
    description: string | null;
    image_url?: string;
  } = {
    name,
    category,
    delivery_time: deliveryTime,
    delivery_fee: deliveryFee,
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

export async function disconnectMercadoPago(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const { error } = await db
    .from('restaurants')
    .update({ mp_user_id: null, mp_access_token: null, mp_refresh_token: null, online_payment_enabled: false })
    .eq('id', restaurantId);

  if (error) fail('/restaurant/settings', 'Não foi possível desconectar o Mercado Pago.');

  revalidatePath('/restaurant/settings');
}

export async function toggleOnlinePayment(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const enabled = formData.get('enabled') === 'true';

  const { error } = await db.from('restaurants').update({ online_payment_enabled: enabled }).eq('id', restaurantId);
  if (error) fail('/restaurant/settings', 'Não foi possível atualizar essa opção.');

  revalidatePath('/restaurant/settings');
}

export async function createMenuItem(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const price = Number(formData.get('price') || 0);
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null;

  if (!name || !(price > 0)) fail('/restaurant/menu', 'Nome e preço válido são obrigatórios.');

  const { error } = await db.from('menu_items').insert({
    restaurant_id: restaurantId,
    name,
    description,
    price,
    image_url: imageUrl,
  });
  if (error) fail('/restaurant/menu', 'Não foi possível criar o item.');

  revalidatePath('/restaurant/menu');
}

export async function updateMenuItem(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const price = Number(formData.get('price') || 0);
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null;

  if (!itemId || !name || !(price > 0)) fail('/restaurant/menu', 'Dados inválidos.');

  const { error } = await db
    .from('menu_items')
    .update({ name, description, price, image_url: imageUrl })
    .eq('id', itemId)
    .eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant/menu', 'Não foi possível atualizar o item.');

  revalidatePath('/restaurant/menu');
}

export async function deleteMenuItem(formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '');
  const db = await requireOwnerOf(restaurantId);

  const itemId = String(formData.get('itemId') || '');
  if (!itemId) fail('/restaurant/menu', 'Item é obrigatório.');

  const { error } = await db.from('menu_items').delete().eq('id', itemId).eq('restaurant_id', restaurantId);
  if (error) fail('/restaurant/menu', 'Não foi possível excluir o item.');

  revalidatePath('/restaurant/menu');
}
