import { toggleStoreOpen } from '../actions';

export default function StoreStatus({
  restaurantId,
  isOpen,
  isOpenNow,
}: {
  restaurantId: string;
  isOpen: boolean;
  isOpenNow: boolean;
}) {
  let statusColor = '#43B55C';
  let statusText = '● Aberta — recebendo pedidos';
  if (!isOpen) {
    statusColor = '#F26666';
    statusText = '● Pausada manualmente — não aparece pra novos pedidos';
  } else if (!isOpenNow) {
    statusColor = '#D97706';
    statusText = '● Fechada agora — fora do horário de funcionamento configurado';
  }

  return (
    <div className="checkout-form" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Status da loja</h3>
      <p style={{ color: statusColor, fontWeight: 600 }}>{statusText}</p>
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
