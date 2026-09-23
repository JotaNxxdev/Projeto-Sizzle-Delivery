import { toggleStoreOpen } from '../actions';

export default function StoreStatus({ restaurantId, isOpen }: { restaurantId: string; isOpen: boolean }) {
  return (
    <div className="checkout-form" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Status da loja</h3>
      <p style={{ color: isOpen ? '#43B55C' : '#F26666', fontWeight: 600 }}>
        {isOpen ? '● Aberta — recebendo pedidos' : '● Pausada — não aparece pra novos pedidos'}
      </p>
      <form action={toggleStoreOpen}>
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="isOpen" value={(!isOpen).toString()} />
        <button type="submit" className="checkout-button" style={{ marginTop: 0 }}>
          {isOpen ? 'Pausar loja temporariamente' : 'Reabrir loja'}
        </button>
      </form>
    </div>
  );
}
