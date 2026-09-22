import { getCurrentProfile } from '@/lib/auth';
import { getMenuItemsForRestaurant } from '@/lib/restaurant-data';
import { createMenuItem, updateMenuItem, deleteMenuItem } from '../actions';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RestaurantMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const items = await getMenuItemsForRestaurant(restaurantId);

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}

      <h2>Itens do cardápio ({items.length})</h2>
      {items.length === 0 ? (
        <p className="empty-state">Nenhum item cadastrado ainda.</p>
      ) : (
        items.map((item) => (
          <details key={item.id} className="menu-item" style={{ display: 'block', padding: 15 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              {item.name} — {formatCurrency(item.price)}
            </summary>
            <form action={updateMenuItem} className="checkout-form" style={{ marginTop: 15, boxShadow: 'none' }}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="itemId" value={item.id} />
              <div className="form-group">
                <label htmlFor={`name-${item.id}`}>Nome</label>
                <input id={`name-${item.id}`} name="name" defaultValue={item.name} required />
              </div>
              <div className="form-group">
                <label htmlFor={`description-${item.id}`}>Descrição</label>
                <input id={`description-${item.id}`} name="description" defaultValue={item.description ?? ''} />
              </div>
              <div className="form-group">
                <label htmlFor={`price-${item.id}`}>Preço (R$)</label>
                <input
                  id={`price-${item.id}`}
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={item.price}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor={`imageUrl-${item.id}`}>URL da imagem</label>
                <input id={`imageUrl-${item.id}`} name="imageUrl" defaultValue={item.imageUrl ?? ''} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="checkout-button" style={{ marginTop: 0 }}>
                  Salvar
                </button>
              </div>
            </form>
            <form action={deleteMenuItem} style={{ marginTop: 10 }}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="itemId" value={item.id} />
              <button type="submit" className="quantity-btn admin-btn">
                Excluir item
              </button>
            </form>
          </details>
        ))
      )}

      <h2 style={{ marginTop: 30 }}>Novo item</h2>
      <form action={createMenuItem} className="checkout-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <div className="form-group">
          <label htmlFor="name">Nome</label>
          <input id="name" name="name" required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Descrição</label>
          <input id="description" name="description" />
        </div>
        <div className="form-group">
          <label htmlFor="price">Preço (R$)</label>
          <input id="price" name="price" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrl">URL da imagem</label>
          <input id="imageUrl" name="imageUrl" placeholder="/unnamed.png" />
        </div>
        <button type="submit" className="checkout-button">
          Adicionar item
        </button>
      </form>
    </div>
  );
}
