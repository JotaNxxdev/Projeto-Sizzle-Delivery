import { Megaphone } from 'lucide-react';
import { listAllPromotions, listRestaurantsWithOwner } from '@/lib/admin-data';
import { PROMOTION_PLANS } from '@/lib/promotions';
import { createPromotionManual, confirmPromotionPayment, togglePromotionStatus, deletePromotion } from '../actions';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Aguardando pagamento',
  active: 'Ativo',
  paused: 'Pausado',
  cancelled: 'Cancelado',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  manual: 'Manual (Pix combinado)',
  mercadopago: 'Cartão/Pix (Mercado Pago)',
};

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [promotions, restaurants] = await Promise.all([listAllPromotions(), listRestaurantsWithOwner()]);
  const activeRestaurants = restaurants.filter((r) => !r.isArchived);

  return (
    <div>
      {error && <ErrorState description={error} />}

      <h2>Destaques pagos ({promotions.length})</h2>
      <p className="hint-text">
        Aparecem no carrossel &quot;Destaques para você&quot; da home enquanto estiverem com status Ativo e dentro do
        período. O dono também pode comprar sozinho pelo painel dele (Mercado Pago — cartão, Pix ou boleto).
      </p>

      {promotions.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nenhum destaque criado ainda" description="Crie o primeiro no formulário abaixo." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Restaurante</th>
              <th>Banner</th>
              <th>Período</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => {
              const displayStatus = promo.status === 'active' && promo.isExpired ? 'Expirado' : STATUS_LABEL[promo.status];
              const tone =
                promo.status === 'active' && !promo.isExpired
                  ? 'success'
                  : promo.status === 'pending_payment'
                    ? 'warning'
                    : 'neutral';

              return (
                <tr key={promo.id}>
                  <Td label="Restaurante">{promo.restaurantName}</Td>
                  <Td label="Banner">{promo.title}</Td>
                  <Td label="Período">
                    {promo.startsAt && promo.expiresAt
                      ? `${new Date(promo.startsAt).toLocaleDateString('pt-BR')} – ${new Date(promo.expiresAt).toLocaleDateString('pt-BR')}`
                      : `${promo.durationDays} dias (não iniciado)`}
                  </Td>
                  <Td label="Pagamento">
                    {PAYMENT_METHOD_LABEL[promo.paymentMethod]}
                    <br />
                    <span className="hint-text">{formatCurrency(promo.price)}</span>
                  </Td>
                  <Td label="Status">
                    <Badge tone={tone}>{displayStatus}</Badge>
                  </Td>
                  <Td label="Ação">
                    <div className="table-action-group">
                      {promo.status === 'pending_payment' && (
                        <form action={confirmPromotionPayment}>
                          <input type="hidden" name="promotionId" value={promo.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Confirmar que o pagamento (${formatCurrency(promo.price)}) de "${promo.title}" caiu? O destaque fica ativo a partir de agora.`}
                            className="ui-button ui-button-primary ui-button-sm"
                          >
                            Confirmar pagamento
                          </ConfirmSubmitButton>
                        </form>
                      )}
                      {promo.status === 'active' && (
                        <form action={togglePromotionStatus}>
                          <input type="hidden" name="promotionId" value={promo.id} />
                          <input type="hidden" name="nextStatus" value="paused" />
                          <Button type="submit" variant="secondary" size="sm">
                            Pausar
                          </Button>
                        </form>
                      )}
                      {promo.status === 'paused' && (
                        <form action={togglePromotionStatus}>
                          <input type="hidden" name="promotionId" value={promo.id} />
                          <input type="hidden" name="nextStatus" value="active" />
                          <Button type="submit" variant="secondary" size="sm">
                            Reativar
                          </Button>
                        </form>
                      )}
                      <form action={deletePromotion}>
                        <input type="hidden" name="promotionId" value={promo.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Excluir o destaque "${promo.title}" de ${promo.restaurantName}?`}
                          className="ui-button ui-button-danger ui-button-sm"
                        >
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Novo destaque manual</h2>
      <p className="hint-text">
        Use quando o dono combinou e já pagou por fora (ex. Pix direto). Já nasce ativo — não precisa de confirmação
        de pagamento.
      </p>
      <form action={createPromotionManual} className="checkout-form">
        <Select label="Restaurante" id="restaurantId" name="restaurantId" required defaultValue="">
          <option value="" disabled>
            Selecione um restaurante
          </option>
          {activeRestaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
        <Input label="Texto do banner" id="title" name="title" placeholder="Ex: 2 Hambúrgueres por R$ 35,00!" required />
        <Input label="URL da imagem (ex: /promocao.png)" id="imageUrl" name="imageUrl" placeholder="/promocao.png" />
        <Select label="Duração" id="days" name="days" required defaultValue={String(PROMOTION_PLANS[0].days)}>
          {PROMOTION_PLANS.map((plan) => (
            <option key={plan.days} value={plan.days}>
              {plan.days} dias
            </option>
          ))}
        </Select>
        <Input label="Valor combinado (R$)" id="price" name="price" type="number" step="0.01" min="0" defaultValue="0" />
        <Button type="submit" variant="primary" fullWidth>
          Criar destaque
        </Button>
      </form>
    </div>
  );
}
