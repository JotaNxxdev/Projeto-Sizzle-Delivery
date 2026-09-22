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
