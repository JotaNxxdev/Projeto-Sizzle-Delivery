import { getCurrentProfile } from '@/lib/auth';
import { getCouriersForRestaurant } from '@/lib/restaurant-data';
import { inviteCourier, removeCourier } from '../actions';

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
      {error && <p className="empty-state">{error}</p>}

      <h2>Entregadores ({couriers.length})</h2>
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0 }}>
        Pra vincular um entregador, a pessoa precisa ter criado conta em <strong>/signup</strong> primeiro (com o
        e-mail que você vai informar abaixo).
      </p>

      {couriers.length === 0 ? (
        <p className="empty-state">Nenhum entregador vinculado ainda.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
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
                  <td>{courier.fullName || '—'}</td>
                  <td>{courier.email}</td>
                  <td>
                    <form action={removeCourier}>
                      <input type="hidden" name="restaurantId" value={restaurantId} />
                      <input type="hidden" name="courierId" value={courier.id} />
                      <button type="submit" className="quantity-btn admin-btn">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: 30 }}>Vincular entregador</h2>
      <form action={inviteCourier} className="admin-inline-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="email" name="email" placeholder="email@entregador.com" required />
        <button type="submit" className="add-to-cart-button">
          Vincular
        </button>
      </form>
    </div>
  );
}
