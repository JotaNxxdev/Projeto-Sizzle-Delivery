'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

async function requireLoggedIn() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error('Acesso negado.');
  }
  if (!supabase) {
    throw new Error('Banco de dados não configurado.');
  }
  return { profile, db: supabase };
}

function fail(message: string): never {
  redirect(`/profile/addresses?error=${encodeURIComponent(message)}`);
}

export async function createAddress(formData: FormData) {
  const { profile, db } = await requireLoggedIn();

  const label = String(formData.get('label') || '').trim() || 'Endereço';
  const street = String(formData.get('street') || '').trim();
  const streetNumber = String(formData.get('streetNumber') || '').trim();
  const complement = String(formData.get('complement') || '').trim() || null;
  const neighborhood = String(formData.get('neighborhood') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const referencePoint = String(formData.get('referencePoint') || '').trim() || null;
  const makeDefault = formData.get('isDefault') === 'on';

  if (!street || !streetNumber || !neighborhood || !city) {
    fail('Rua, número, bairro e cidade são obrigatórios.');
  }

  if (makeDefault) {
    await db.from('addresses').update({ is_default: false }).eq('user_id', profile.id);
  }

  const { error } = await db.from('addresses').insert({
    user_id: profile.id,
    label,
    street,
    street_number: streetNumber,
    complement,
    neighborhood,
    city,
    reference_point: referencePoint,
    is_default: makeDefault,
  });

  if (error) fail('Não foi possível salvar o endereço.');

  revalidatePath('/profile/addresses');
}

export async function deleteAddress(formData: FormData) {
  const { profile, db } = await requireLoggedIn();

  const addressId = String(formData.get('addressId') || '');
  if (!addressId) fail('Endereço é obrigatório.');

  const { error } = await db.from('addresses').delete().eq('id', addressId).eq('user_id', profile.id);
  if (error) fail('Não foi possível excluir o endereço.');

  revalidatePath('/profile/addresses');
}

export async function setDefaultAddress(formData: FormData) {
  const { profile, db } = await requireLoggedIn();

  const addressId = String(formData.get('addressId') || '');
  if (!addressId) fail('Endereço é obrigatório.');

  await db.from('addresses').update({ is_default: false }).eq('user_id', profile.id);
  const { error } = await db
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', profile.id);
  if (error) fail('Não foi possível definir o endereço padrão.');

  revalidatePath('/profile/addresses');
}
