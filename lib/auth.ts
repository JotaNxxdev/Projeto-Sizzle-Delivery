import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabase as db, isSupabaseConfigured } from './supabase';

export const isAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// Lê a sessão (cookies) para uso em Server Components e Route Handlers.
// Não grava cookies de volta aqui — isso é responsabilidade do middleware,
// que roda em toda requisição e renova a sessão quando necessário.
async function getSessionUser() {
  if (!isAuthConfigured) return null;

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // Server Components não podem gravar cookies; o middleware cuida disso.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  return user;
}

export type UserRole = 'customer' | 'restaurant_owner' | 'admin' | 'courier';

export interface CurrentProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  restaurantId: string | null;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const user = await getSessionUser();
  if (!user || !isSupabaseConfigured || !db) return null;

  const { data, error } = await db
    .from('profiles')
    .select('id, email, full_name, phone, avatar_url, role, restaurant_id')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.error('[Sizzle] Erro ao buscar perfil:', error?.message);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    role: data.role as UserRole,
    restaurantId: data.restaurant_id,
  };
}
