import { supabase } from './supabase';
import type { UserRole } from './auth';

export interface RestaurantWithOwner {
  id: string;
  name: string;
  category: string;
  ownerId: string | null;
  ownerEmail: string | null;
}

export interface AdminOrderRow {
  id: string;
  orderCode: string;
  restaurantName: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  restaurantId: string | null;
}

export async function listRestaurantsWithOwner(): Promise<RestaurantWithOwner[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, category, owner_id')
    .order('name', { ascending: true });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar restaurantes (admin):', error?.message);
    return [];
  }

  const ownerIds = data.map((r) => r.owner_id).filter((id): id is string => Boolean(id));
  let emailByOwnerId = new Map<string, string>();

  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from('profiles').select('id, email').in('id', ownerIds);
    emailByOwnerId = new Map((owners ?? []).map((o) => [o.id, o.email]));
  }

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    ownerId: r.owner_id,
    ownerEmail: r.owner_id ? emailByOwnerId.get(r.owner_id) ?? null : null,
  }));
}

export async function listAllOrders(): Promise<AdminOrderRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_code, restaurant_name, status, total, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar pedidos (admin):', error?.message);
    return [];
  }

  return data.map((o) => ({
    id: o.id,
    orderCode: o.order_code,
    restaurantName: o.restaurant_name,
    status: o.status,
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
  }));
}

export async function listAllProfiles(): Promise<ProfileRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, restaurant_id')
    .order('email', { ascending: true });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar usuários (admin):', error?.message);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role as UserRole,
    restaurantId: p.restaurant_id,
  }));
}
