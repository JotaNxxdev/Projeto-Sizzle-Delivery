import { getCurrentProfile } from '@/lib/auth';
import { getCouponsForRestaurant } from '@/lib/restaurant-data';
import { createCoupon, toggleCouponActive } from '../actions';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RestaurantCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const coupons = await getCouponsForRestaurant(restaurantId);

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}

      <h2>Cupons ({coupons.length})</h2>
      {coupons.length === 0 ? (
        <p className="empty-state">Nenhum cupom criado ainda.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Desconto</th>
                <th>Pedido mínimo</th>
                <th>Validade</th>
                <th>Uso</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.code}</td>
                  <td>
                    {coupon.discountType === 'percent'
                      ? `${coupon.discountValue}%`
                      : formatCurrency(coupon.discountValue)}
                    {coupon.maxDiscount != null && ` (até ${formatCurrency(coupon.maxDiscount)})`}
                  </td>
                  <td>{coupon.minOrderValue > 0 ? formatCurrency(coupon.minOrderValue) : '—'}</td>
                  <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('pt-BR') : 'Sem validade'}</td>
                  <td>
                    {coupon.timesUsed}
                    {coupon.usageLimit != null && ` / ${coupon.usageLimit}`}
                  </td>
                  <td>{coupon.active ? 'Ativo' : 'Inativo'}</td>
                  <td>
                    <form action={toggleCouponActive}>
                      <input type="hidden" name="restaurantId" value={restaurantId} />
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <input type="hidden" name="active" value={(!coupon.active).toString()} />
                      <button type="submit" className="quantity-btn admin-btn">
                        {coupon.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: 30 }}>Novo cupom</h2>
      <form action={createCoupon} className="checkout-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <div className="form-group">
          <label htmlFor="code">Código</label>
          <input id="code" name="code" placeholder="Ex: BEMVINDO10" required />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="discountType">Tipo</label>
            <select id="discountType" name="discountType">
              <option value="percent">Percentual</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="discountValue">Valor</label>
            <input id="discountValue" name="discountValue" type="number" step="0.01" min="0.01" required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="maxDiscount">Desconto máximo (R$) — só pra cupom percentual, opcional</label>
          <input id="maxDiscount" name="maxDiscount" type="number" step="0.01" min="0" />
        </div>
        <div className="form-group">
          <label htmlFor="minOrderValue">Pedido mínimo pra usar (R$)</label>
          <input id="minOrderValue" name="minOrderValue" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div className="form-group">
          <label htmlFor="expiresAt">Validade até</label>
          <input id="expiresAt" name="expiresAt" type="date" />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="usageLimit">Limite total de usos (opcional)</label>
            <input id="usageLimit" name="usageLimit" type="number" min="1" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="usageLimitPerCustomer">Usos por cliente</label>
            <input id="usageLimitPerCustomer" name="usageLimitPerCustomer" type="number" min="1" defaultValue="1" />
          </div>
        </div>
        <button type="submit" className="checkout-button" style={{ marginTop: 20 }}>
          Criar cupom
        </button>
      </form>
    </div>
  );
}
