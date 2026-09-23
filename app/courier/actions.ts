'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

async function requireCourier() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'courier' || !profile.restaurantId) {
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

export async function claimDelivery(formData: FormData) {
  const { profile, db } = await requireCourier();

  const code = String(formData.get('code') || '').trim().toUpperCase();
  if (!code) fail('/courier', 'Informe o código do pedido.');

  const { data: order, error: findError } = await db
    .from('orders')
    .select('id, courier_id, status')
    .eq('order_code', code)
    .eq('restaurant_id', profile.restaurantId)
    .single();

  if (findError || !order) fail('/courier', 'Pedido não encontrado nessa loja. Confira o código.');
  if (order!.status === 'Entregue') fail('/courier', 'Esse pedido já foi entregue.');
  if (order!.status === 'Recusado' || order!.status === 'Cancelado') {
    fail('/courier', 'Esse pedido foi recusado ou cancelado e não precisa mais de entrega.');
  }
  if (order!.courier_id && order!.courier_id !== profile.id) {
    fail('/courier', 'Esse pedido já foi atribuído a outro entregador.');
  }

  const { error } = await db.from('orders').update({ courier_id: profile.id }).eq('id', order!.id);
  if (error) fail('/courier', 'Não foi possível assumir essa entrega.');

  revalidatePath('/courier');
  revalidatePath('/restaurant');
}

export async function markPickedUp(formData: FormData) {
  const { profile, db } = await requireCourier();

  const orderId = String(formData.get('orderId') || '');
  if (!orderId) fail('/courier', 'Pedido é obrigatório.');

  const { error } = await db
    .from('orders')
    .update({ status: 'Saiu para entrega', picked_up_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('courier_id', profile.id);

  if (error) fail('/courier', 'Não foi possível atualizar o pedido.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'update_status',
    entity: 'order',
    entityId: orderId,
    newValue: { status: 'Saiu para entrega' },
  });

  revalidatePath('/courier');
  revalidatePath('/restaurant');
}

export async function markDelivered(formData: FormData) {
  const { profile, db } = await requireCourier();

  const orderId = String(formData.get('orderId') || '');
  if (!orderId) fail('/courier', 'Pedido é obrigatório.');

  const { error } = await db
    .from('orders')
    .update({ status: 'Entregue', delivered_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('courier_id', profile.id);

  if (error) fail('/courier', 'Não foi possível marcar como entregue.');

  await logAudit(db, {
    userId: profile.id,
    userEmail: profile.email,
    action: 'update_status',
    entity: 'order',
    entityId: orderId,
    newValue: { status: 'Entregue' },
  });

  revalidatePath('/courier');
  revalidatePath('/restaurant');
  revalidatePath('/orders');
}
