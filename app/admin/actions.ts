'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
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

export async function createRestaurant(formData: FormData) {
  const { db } = await requireAdmin();

  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const deliveryTime = String(formData.get('deliveryTime') || '').trim() || '30-40 min';
  const deliveryFee = Number(formData.get('deliveryFee') || 0);
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null;

  if (!name || !category) {
    fail('/admin/restaurants', 'Nome e categoria são obrigatórios.');
  }

  const { error } = await db.from('restaurants').insert({
    name,
    category,
    delivery_time: deliveryTime,
    delivery_fee: Number.isFinite(deliveryFee) ? deliveryFee : 0,
    image_url: imageUrl,
  });

  if (error) {
    console.error('[Sizzle] Erro ao criar restaurante:', error.message);
    fail('/admin/restaurants', 'Não foi possível criar o restaurante.');
  }

  revalidatePath('/admin/restaurants');
}

export async function assignOwner(formData: FormData) {
  const { db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  const ownerEmail = String(formData.get('ownerEmail') || '').trim().toLowerCase();

  if (!restaurantId || !ownerEmail) {
    fail('/admin/restaurants', 'Restaurante e e-mail são obrigatórios.');
  }

  const { data: ownerProfile, error: findError } = await db
    .from('profiles')
    .select('id')
    .eq('email', ownerEmail)
    .single();

  if (findError || !ownerProfile) {
    fail('/admin/restaurants', 'Nenhum usuário com esse e-mail. Peça pra pessoa criar conta em /signup primeiro.');
  }

  const { error: restaurantError } = await db
    .from('restaurants')
    .update({ owner_id: ownerProfile!.id })
    .eq('id', restaurantId);

  if (restaurantError) {
    fail('/admin/restaurants', 'Não foi possível vincular o dono ao restaurante.');
  }

  const { error: profileError } = await db
    .from('profiles')
    .update({ role: 'restaurant_owner', restaurant_id: restaurantId })
    .eq('id', ownerProfile!.id);

  if (profileError) {
    fail('/admin/restaurants', 'Restaurante vinculado, mas não foi possível atualizar o papel do usuário.');
  }

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin/users');
}

export async function removeOwner(formData: FormData) {
  const { db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  const ownerId = String(formData.get('ownerId') || '');
  if (!restaurantId) fail('/admin/restaurants', 'Restaurante é obrigatório.');

  await db.from('restaurants').update({ owner_id: null }).eq('id', restaurantId);
  if (ownerId) {
    await db.from('profiles').update({ role: 'customer', restaurant_id: null }).eq('id', ownerId);
  }

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin/users');
}

export async function updateOrderStatusAsAdmin(formData: FormData) {
  const { db } = await requireAdmin();

  const orderId = String(formData.get('orderId') || '');
  const status = String(formData.get('status') || '');
  if (!orderId || !status) fail('/admin/orders', 'Pedido e status são obrigatórios.');

  const { error } = await db.from('orders').update({ status }).eq('id', orderId);
  if (error) fail('/admin/orders', 'Não foi possível atualizar o status.');

  revalidatePath('/admin/orders');
}

export async function updateUserRole(formData: FormData) {
  const { db } = await requireAdmin();

  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || '');
  if (!userId || !role) fail('/admin/users', 'Usuário e papel são obrigatórios.');
  if (!['customer', 'restaurant_owner', 'admin'].includes(role)) {
    fail('/admin/users', 'Papel inválido.');
  }

  if (role !== 'restaurant_owner') {
    await db.from('restaurants').update({ owner_id: null }).eq('owner_id', userId);
    await db.from('profiles').update({ role, restaurant_id: null }).eq('id', userId);
  } else {
    await db.from('profiles').update({ role }).eq('id', userId);
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/restaurants');
}
