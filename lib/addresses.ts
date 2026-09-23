import { supabase } from './supabase';

export interface Address {
  id: string;
  label: string;
  street: string;
  streetNumber: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  referencePoint: string | null;
  isDefault: boolean;
}

export async function getAddressesForUser(userId: string): Promise<Address[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('addresses')
    .select('id, label, street, street_number, complement, neighborhood, city, reference_point, is_default')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar endereços:', error?.message);
    return [];
  }

  return data.map((a) => ({
    id: a.id,
    label: a.label,
    street: a.street,
    streetNumber: a.street_number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    referencePoint: a.reference_point,
    isDefault: a.is_default,
  }));
}
