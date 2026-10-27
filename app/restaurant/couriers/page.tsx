import { Bike } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getCouriersForRestaurant } from '@/lib/restaurant-data';
import { inviteCourier, removeCourier } from '../actions';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import Button from '@/components/ui/Button';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export const dynamic = 'force-dynamic';

export default async function RestaurantCouriersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const couriers = await getCouriersForRestaurant(restaurantId);

  return (
    <div>
      {error && <ErrorState description={error} />}

      <h2>Entregadores ({couriers.length})</h2>
      <p className="hint-text">
        Pra vincular um entregador, a pessoa precisa ter criado conta em <strong>/signup</strong> primeiro (com o
        e-mail que você vai informar abaixo).
      </p>

      {couriers.length === 0 ? (
        <EmptyState icon={Bike} title="Nenhum entregador vinculado ainda" description="Vincule um entregador no formulário abaixo." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((courier) => (
              <tr key={courier.id}>
                <Td label="Nome">{courier.fullName || '—'}</Td>
                <Td label="E-mail">{courier.email}</Td>
                <Td label="Ação">
                  <form action={removeCourier}>
                    <input type="hidden" name="restaurantId" value={restaurantId} />
                    <input type="hidden" name="courierId" value={courier.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Remover ${courier.fullName || courier.email} como entregador dessa loja?`}
                      className="ui-button ui-button-secondary ui-button-sm"
                    >
                      Remover
                    </ConfirmSubmitButton>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Vincular entregador</h2>
      <form action={inviteCourier} className="admin-inline-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="email" name="email" placeholder="email@entregador.com" required />
        <Button type="submit" variant="primary">
          Vincular
        </Button>
      </form>
    </div>
  );
}
