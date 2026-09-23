import { supabase } from './supabase';

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount?: number;
  couponId?: string;
}

// Usada tanto na pré-visualização do desconto no checkout quanto (de novo,
// nunca confiando no valor calculado pelo navegador) na criação do pedido.
export async function validateCoupon(
  restaurantId: string,
  rawCode: string,
  subtotal: number,
  userId: string | null
): Promise<CouponValidationResult> {
  if (!supabase) return { valid: false, error: 'Banco de dados não configurado.' };

  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, error: 'Informe o código do cupom.' };

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select(
      'id, discount_type, discount_value, min_order_value, max_discount, starts_at, expires_at, usage_limit, usage_limit_per_customer, active'
    )
    .eq('restaurant_id', restaurantId)
    .eq('code', code)
    .single();

  if (error || !coupon) return { valid: false, error: 'Cupom não encontrado.' };
  if (!coupon.active) return { valid: false, error: 'Esse cupom não está mais ativo.' };

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, error: 'Esse cupom ainda não é válido.' };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, error: 'Esse cupom expirou.' };
  }
  if (subtotal < Number(coupon.min_order_value)) {
    return { valid: false, error: `Esse cupom exige pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2)}.` };
  }

  if (coupon.usage_limit != null) {
    const { count } = await supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id);
    if ((count ?? 0) >= coupon.usage_limit) {
      return { valid: false, error: 'Esse cupom atingiu o limite de uso.' };
    }
  }

  if (userId) {
    const { count } = await supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);
    if ((count ?? 0) >= coupon.usage_limit_per_customer) {
      return { valid: false, error: 'Você já usou esse cupom o máximo de vezes permitido.' };
    }
  }

  let discount =
    coupon.discount_type === 'percent' ? (subtotal * Number(coupon.discount_value)) / 100 : Number(coupon.discount_value);

  if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.min(discount, subtotal);
  discount = Math.round(discount * 100) / 100;

  return { valid: true, discount, couponId: coupon.id };
}
