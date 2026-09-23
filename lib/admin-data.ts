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
  paymentStatus: string;
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
    .select('id, order_code, restaurant_name, status, payment_status, total, created_at')
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
    paymentStatus: o.payment_status,
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
  }));
}

export interface AdminDashboardStats {
  ordersToday: number;
  revenueToday: number;
  totalRestaurants: number;
  openRestaurants: number;
  totalCustomers: number;
  totalCouriers: number;
  cancelledOrders: number;
  averageTicket: number;
  ordersInProgress: number;
}

const EMPTY_DASHBOARD_STATS: AdminDashboardStats = {
  ordersToday: 0,
  revenueToday: 0,
  totalRestaurants: 0,
  openRestaurants: 0,
  totalCustomers: 0,
  totalCouriers: 0,
  cancelledOrders: 0,
  averageTicket: 0,
  ordersInProgress: 0,
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!supabase) return EMPTY_DASHBOARD_STATS;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [ordersTodayRes, restaurantsRes, customersRes, couriersRes, cancelledRes, inProgressRes, allOrdersRes] =
    await Promise.all([
      supabase.from('orders').select('total').gte('created_at', startOfToday.toISOString()),
      supabase.from('restaurants').select('id, is_open'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'courier'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['Cancelado', 'Recusado']),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['Pendente', 'Em Preparação', 'Saiu para entrega']),
      supabase.from('orders').select('total').limit(2000),
    ]);

  const ordersToday = ordersTodayRes.data ?? [];
  const revenueToday = ordersToday.reduce((sum, o) => sum + Number(o.total), 0);
  const restaurants = restaurantsRes.data ?? [];
  const allOrders = allOrdersRes.data ?? [];

  return {
    ordersToday: ordersToday.length,
    revenueToday,
    totalRestaurants: restaurants.length,
    openRestaurants: restaurants.filter((r) => r.is_open).length,
    totalCustomers: customersRes.count ?? 0,
    totalCouriers: couriersRes.count ?? 0,
    cancelledOrders: cancelledRes.count ?? 0,
    ordersInProgress: inProgressRes.count ?? 0,
    averageTicket: allOrders.length > 0 ? allOrders.reduce((sum, o) => sum + Number(o.total), 0) / allOrders.length : 0,
  };
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

export interface AuditLogRow {
  id: string;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
}

export async function listAuditLogs(): Promise<AuditLogRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, user_email, action, entity, entity_id, old_value, new_value, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar logs de auditoria:', error?.message);
    return [];
  }

  return data.map((log) => ({
    id: log.id,
    userEmail: log.user_email,
    action: log.action,
    entity: log.entity,
    entityId: log.entity_id,
    oldValue: log.old_value,
    newValue: log.new_value,
    createdAt: new Date(log.created_at).toLocaleString('pt-BR'),
  }));
}
