import { Megaphone } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getPromotionsForRestaurant } from '@/lib/restaurant-data';
import PromoteForm from './PromoteForm';
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

export default async function RestaurantPromotePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { error, status } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const promotions = await getPromotionsForRestaurant(profile.restaurantId);

  return (
    <div>
      {error && <ErrorState description={error} />}
      {status === 'approved' && (
        <p className="empty-state" style={{ color: 'var(--color-success)' }}>
          Pagamento aprovado! Seu destaque já deve aparecer como &quot;Ativo&quot; na tabela abaixo.
        </p>
      )}
      {status === 'pending' && (
        <p className="empty-state">Pagamento em processamento — assim que o Mercado Pago confirmar, seu destaque é ativado automaticamente.</p>
      )}
      {status === 'rejected' && <p className="empty-state">O pagamento não foi aprovado. Você pode tentar de novo no formulário abaixo.</p>}

      <h2>Destaque na home ({promotions.length})</h2>
      <p className="hint-text">
        Apareça no carrossel &quot;Destaques para você&quot; da home, acima da lista de restaurantes — mais visibilidade
        pros seus clientes.
      </p>

      {promotions.length === 0 ? (
        <EmptyState icon={Megaphone} title="Você ainda não tem nenhum destaque" description="Compre o primeiro no formulário abaixo." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Banner</th>
              <th>Período</th>
              <th>Valor</th>
              <th>Status</th>
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
                  <Td label="Banner">{promo.title}</Td>
                  <Td label="Período">
                    {promo.startsAt && promo.expiresAt
                      ? `${new Date(promo.startsAt).toLocaleDateString('pt-BR')} – ${new Date(promo.expiresAt).toLocaleDateString('pt-BR')}`
                      : `${promo.durationDays} dias (não iniciado)`}
                  </Td>
                  <Td label="Valor">{formatCurrency(promo.price)}</Td>
                  <Td label="Status">
                    <Badge tone={tone}>{displayStatus}</Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Comprar novo destaque</h2>
      <PromoteForm restaurantId={profile.restaurantId} />
    </div>
  );
}
