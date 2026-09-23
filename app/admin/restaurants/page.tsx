import { listRestaurantsWithOwner } from '@/lib/admin-data';
import { createRestaurant, assignOwner, removeOwner } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const restaurants = await listRestaurantsWithOwner();

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}

      <h2>Restaurantes ({restaurants.length})</h2>
      {restaurants.length === 0 ? (
        <p className="empty-state">Nenhum restaurante cadastrado ainda.</p>
      ) : (
        <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Dono</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id}>
                <td>{restaurant.name}</td>
                <td>{restaurant.category}</td>
                <td>{restaurant.ownerEmail ?? '— sem dono —'}</td>
                <td>
                  {restaurant.ownerId ? (
                    <form action={removeOwner}>
                      <input type="hidden" name="restaurantId" value={restaurant.id} />
                      <input type="hidden" name="ownerId" value={restaurant.ownerId} />
                      <button type="submit" className="quantity-btn admin-btn">
                        Remover dono
                      </button>
                    </form>
                  ) : (
                    <form action={assignOwner} className="admin-inline-form">
                      <input type="hidden" name="restaurantId" value={restaurant.id} />
                      <input type="email" name="ownerEmail" placeholder="email@dono.com" required />
                      <button type="submit" className="add-to-cart-button">
                        Atribuir dono
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <h2 style={{ marginTop: 30 }}>Novo restaurante</h2>
      <form action={createRestaurant} className="checkout-form">
        <div className="form-group">
          <label htmlFor="name">Nome</label>
          <input id="name" name="name" required />
        </div>
        <div className="form-group">
          <label htmlFor="category">Categoria</label>
          <input id="category" name="category" placeholder="pizza, lanches, japonesa..." required />
        </div>
        <div className="form-group">
          <label htmlFor="deliveryTime">Tempo de entrega</label>
          <input id="deliveryTime" name="deliveryTime" placeholder="30-40 min" />
        </div>
        <div className="form-group">
          <label htmlFor="deliveryFee">Taxa de entrega (R$)</label>
          <input id="deliveryFee" name="deliveryFee" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrl">URL da imagem (ex: /unnamed.png)</label>
          <input id="imageUrl" name="imageUrl" placeholder="/unnamed.png" />
        </div>
        <button type="submit" className="checkout-button">
          Criar restaurante
        </button>
      </form>
    </div>
  );
}
