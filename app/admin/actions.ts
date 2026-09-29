'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { isValidImageUrl } from '@/lib/image-url';

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
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    fail('/admin/restaurants', 'URL da imagem inválida.');
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
  const { profile, db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  const ownerEmail = String(formData.get('ownerEmail') || '').trim().toLowerCase();

  if (!restaurantId || !ownerEmail) {
    fail('/admin/restaurants', 'Restaurante e e-mail são obrigatórios.');
  }

  const { data: ownerProfile, error: findError } = await db
    .from('profiles')
    .select('id, role')
    .eq('email', ownerEmail)
    .single();

  if (findError || !ownerProfile) {
    fail('/admin/restaurants', 'Nenhum usuário com esse e-mail. Peça pra pessoa criar conta em /signup primeiro.');
  }

  // Atribuir um restaurante nunca deve sobrescrever o papel de quem já é
  // administrador da plataforma — isso já travou um admin fora do próprio
  // painel em teste de QA.
  if (ownerProfile!.role === 'admin') {
    fail(
      '/admin/restaurants',
      'Esse e-mail pertence a uma conta de administrador. Atribuir um restaurante a ela mudaria o papel dela — use um e-mail que não seja de admin.'
    );
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

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'assign_owner',
    entity: 'restaurant',
    entityId: restaurantId,
    newValue: { ownerEmail },
  });

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin/users');
}

export async function removeOwner(formData: FormData) {
  const { profile, db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  const ownerId = String(formData.get('ownerId') || '');
  if (!restaurantId) fail('/admin/restaurants', 'Restaurante é obrigatório.');

  await db.from('restaurants').update({ owner_id: null }).eq('id', restaurantId);
  if (ownerId) {
    await db.from('profiles').update({ role: 'customer', restaurant_id: null }).eq('id', ownerId);
  }

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'remove_owner',
    entity: 'restaurant',
    entityId: restaurantId,
    oldValue: { ownerId },
  });

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin/users');
}

export async function archiveRestaurant(formData: FormData) {
  const { profile, db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  if (!restaurantId) fail('/admin/restaurants', 'Restaurante é obrigatório.');

  const { error } = await db.from('restaurants').update({ is_archived: true }).eq('id', restaurantId);
  if (error) fail('/admin/restaurants', 'Não foi possível arquivar o restaurante.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'archive_restaurant',
    entity: 'restaurant',
    entityId: restaurantId,
  });

  revalidatePath('/admin/restaurants');
  revalidatePath('/');
}

export async function unarchiveRestaurant(formData: FormData) {
  const { profile, db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  if (!restaurantId) fail('/admin/restaurants', 'Restaurante é obrigatório.');

  const { error } = await db.from('restaurants').update({ is_archived: false }).eq('id', restaurantId);
  if (error) fail('/admin/restaurants', 'Não foi possível reativar o restaurante.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'unarchive_restaurant',
    entity: 'restaurant',
    entityId: restaurantId,
  });

  revalidatePath('/admin/restaurants');
  revalidatePath('/');
}

export async function deleteRestaurant(formData: FormData) {
  const { profile, db } = await requireAdmin();

  const restaurantId = String(formData.get('restaurantId') || '');
  if (!restaurantId) fail('/admin/restaurants', 'Restaurante é obrigatório.');

  // Só permite excluir de verdade quando não há nenhum pedido registrado —
  // caso contrário perderíamos histórico. Restaurante com pedidos deve ser
  // arquivado em vez de excluído.
  const { count } = await db
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId);
  if ((count ?? 0) > 0) {
    fail('/admin/restaurants', 'Esse restaurante já tem pedidos registrados — exclua não é permitido. Use "Arquivar" para escondê-lo dos clientes sem perder o histórico.');
  }

  const { data: restaurant } = await db.from('restaurants').select('owner_id').eq('id', restaurantId).single();

  // Limpa explicitamente os itens do cardápio (e, em cascata, seus grupos de
  // adicionais) antes de excluir o restaurante — não dependemos de o schema
  // original ter "on delete cascade" configurado em menu_items.
  await db.from('menu_items').delete().eq('restaurant_id', restaurantId);

  const { error } = await db.from('restaurants').delete().eq('id', restaurantId);
  if (error) {
    console.error('[Sizzle] Erro ao excluir restaurante:', error.message);
    fail('/admin/restaurants', 'Não foi possível excluir o restaurante.');
  }

  if (restaurant?.owner_id) {
    await db.from('profiles').update({ role: 'customer', restaurant_id: null }).eq('id', restaurant.owner_id);
  }

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'delete_restaurant',
    entity: 'restaurant',
    entityId: restaurantId,
  });

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin/users');
  revalidatePath('/');
}

export async function updateOrderStatusAsAdmin(formData: FormData) {
  const { profile, db } = await requireAdmin();

  const orderId = String(formData.get('orderId') || '');
  const status = String(formData.get('status') || '');
  if (!orderId || !status) fail('/admin/orders', 'Pedido e status são obrigatórios.');

  const { error } = await db.from('orders').update({ status }).eq('id', orderId);
  if (error) fail('/admin/orders', 'Não foi possível atualizar o status.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'update_status',
    entity: 'order',
    entityId: orderId,
    newValue: { status },
  });

  revalidatePath('/admin/orders');
}

export async function updateUserRole(formData: FormData) {
  const { profile, db } = await requireAdmin();

  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || '');
  if (!userId || !role) fail('/admin/users', 'Usuário e papel são obrigatórios.');
  if (!['customer', 'restaurant_owner', 'admin'].includes(role)) {
    fail('/admin/users', 'Papel inválido.');
  }

  if (userId === profile.id) {
    fail('/admin/users', 'Você não pode alterar o seu próprio papel. Peça para outro administrador fazer essa mudança.');
  }

  // "Dono de restaurante" só pode ser definido pela aba Restaurantes
  // (assignOwner), que vincula o restaurant_id junto — por esse seletor
  // genérico, ficava fácil criar um "dono" sem restaurante nenhum.
  if (role === 'restaurant_owner') {
    fail('/admin/users', 'Pra tornar alguém dono de restaurante, use a aba Restaurantes e atribua o e-mail dele a uma loja.');
  }

  if (role !== 'admin') {
    const { data: targetProfile } = await db.from('profiles').select('role').eq('id', userId).single();
    if (targetProfile?.role === 'admin') {
      const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
      if ((count ?? 0) <= 1) {
        fail('/admin/users', 'Não é possível remover o último administrador do sistema.');
      }
    }
  }

  // Chegando aqui, role só pode ser 'customer' ou 'admin' (restaurant_owner
  // já foi recusado acima) — sempre limpa qualquer vínculo de loja/entrega.
  await db.from('restaurants').update({ owner_id: null }).eq('owner_id', userId);
  await db.from('profiles').update({ role, restaurant_id: null }).eq('id', userId);

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'update_role',
    entity: 'profile',
    entityId: userId,
    newValue: { role },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/restaurants');
}
