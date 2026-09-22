'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

export async function updateMyProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Não autenticado.');
  if (!supabase) throw new Error('Banco de dados não configurado.');

  const fullName = String(formData.get('fullName') || '').trim();
  const phone = String(formData.get('phone') || '').trim();

  const updates: { full_name: string | null; phone: string | null; avatar_url?: string | null } = {
    full_name: fullName || null,
    phone: phone || null,
  };

  // Só troca a foto se veio uma nova (o formulário só manda este campo
  // quando a pessoa escolhe um arquivo novo) — assim não apaga a foto
  // atual sem querer.
  const avatarUrl = formData.get('avatarUrl');
  if (avatarUrl !== null) {
    updates.avatar_url = String(avatarUrl).trim() || null;
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);

  if (error) {
    console.error('[Sizzle] Erro ao atualizar perfil:', error.message);
    throw new Error('Não foi possível salvar o perfil.');
  }

  revalidatePath('/profile');
}
