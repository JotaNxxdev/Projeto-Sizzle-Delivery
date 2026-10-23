import { describe, expect, it } from 'vitest';
import { calculateCouponDiscount, type DiscountableCoupon } from './coupons';

describe('calculateCouponDiscount', () => {
  it('calcula desconto percentual', () => {
    const coupon: DiscountableCoupon = { discountType: 'percent', discountValue: 10, maxDiscount: null };
    expect(calculateCouponDiscount(coupon, 100)).toBe(10);
  });

  it('calcula desconto fixo', () => {
    const coupon: DiscountableCoupon = { discountType: 'fixed', discountValue: 15, maxDiscount: null };
    expect(calculateCouponDiscount(coupon, 100)).toBe(15);
  });

  it('aplica o teto de desconto máximo', () => {
    const coupon: DiscountableCoupon = { discountType: 'percent', discountValue: 50, maxDiscount: 20 };
    expect(calculateCouponDiscount(coupon, 100)).toBe(20);
  });

  it('nunca deixa o desconto passar do subtotal (evita total negativo)', () => {
    const coupon: DiscountableCoupon = { discountType: 'fixed', discountValue: 999, maxDiscount: null };
    expect(calculateCouponDiscount(coupon, 50)).toBe(50);
  });

  it('arredonda o resultado em duas casas decimais', () => {
    const coupon: DiscountableCoupon = { discountType: 'percent', discountValue: 33.333, maxDiscount: null };
    expect(calculateCouponDiscount(coupon, 10)).toBe(3.33);
  });
});
