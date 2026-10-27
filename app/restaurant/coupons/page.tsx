import { Tag } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getCouponsForRestaurant } from '@/lib/restaurant-data';
import { createCoupon, toggleCouponActive } from '../actions';
import { formatCurrency } from '@/lib/format';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

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
      {error && <ErrorState description={error} />}

      <h2>Cupons ({coupons.length})</h2>
      {coupons.length === 0 ? (
        <EmptyState icon={Tag} title="Nenhum cupom criado ainda" description="Crie o primeiro cupom no formulário abaixo." />
      ) : (
        <Table>
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
                <Td label="Código">{coupon.code}</Td>
                <Td label="Desconto">
                  {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}
                  {coupon.maxDiscount != null && ` (até ${formatCurrency(coupon.maxDiscount)})`}
                </Td>
                <Td label="Pedido mínimo">{coupon.minOrderValue > 0 ? formatCurrency(coupon.minOrderValue) : '—'}</Td>
                <Td label="Validade">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('pt-BR') : 'Sem validade'}</Td>
                <Td label="Uso">
                  {coupon.timesUsed}
                  {coupon.usageLimit != null && ` / ${coupon.usageLimit}`}
                </Td>
                <Td label="Status">
                  <Badge tone={coupon.active ? 'success' : 'neutral'}>{coupon.active ? 'Ativo' : 'Inativo'}</Badge>
                </Td>
                <Td label="Ação">
                  <form action={toggleCouponActive}>
                    <input type="hidden" name="restaurantId" value={restaurantId} />
                    <input type="hidden" name="couponId" value={coupon.id} />
                    <input type="hidden" name="active" value={(!coupon.active).toString()} />
                    <Button type="submit" variant="secondary" size="sm">
                      {coupon.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Novo cupom</h2>
      <form action={createCoupon} className="checkout-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <Input label="Código" id="code" name="code" placeholder="Ex: BEMVINDO10" required />
        <div className="form-row">
          <Select label="Tipo" id="discountType" name="discountType">
            <option value="percent">Percentual</option>
            <option value="fixed">Valor fixo (R$)</option>
          </Select>
          <Input label="Valor" id="discountValue" name="discountValue" type="number" step="0.01" min="0.01" required />
        </div>
        <Input
          label="Desconto máximo (R$) — só pra cupom percentual, opcional"
          id="maxDiscount"
          name="maxDiscount"
          type="number"
          step="0.01"
          min="0"
        />
        <Input label="Pedido mínimo pra usar (R$)" id="minOrderValue" name="minOrderValue" type="number" step="0.01" min="0" defaultValue="0" />
        <Input label="Validade até" id="expiresAt" name="expiresAt" type="date" />
        <div className="form-row">
          <Input label="Limite total de usos (opcional)" id="usageLimit" name="usageLimit" type="number" min="1" />
          <Input label="Usos por cliente" id="usageLimitPerCustomer" name="usageLimitPerCustomer" type="number" min="1" defaultValue="1" />
        </div>
        <Button type="submit" variant="primary" fullWidth>
          Criar cupom
        </Button>
      </form>
    </div>
  );
}
