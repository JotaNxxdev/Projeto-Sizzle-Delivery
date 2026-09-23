import { notFound } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { getMenuItemsForRestaurant } from '@/lib/restaurant-data';
import { getOptionGroupsForMenuItems } from '@/lib/menu-options';
import { createOptionGroup, deleteOptionGroup, createOptionValue, deleteOptionValue } from '../../../actions';
import { formatCurrency } from '@/lib/format';
import BackButton from '@/components/BackButton';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

export const dynamic = 'force-dynamic';

export default async function MenuItemOptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { itemId } = await params;
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const items = await getMenuItemsForRestaurant(restaurantId);
  const item = items.find((i) => i.id === itemId);
  if (!item) notFound();

  const groupsByItem = await getOptionGroupsForMenuItems([itemId]);
  const groups = groupsByItem.get(itemId) ?? [];

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
        <BackButton />
        <h2 style={{ marginBottom: 0 }}>Adicionais de &quot;{item.name}&quot;</h2>
      </header>
      {error && <p className="empty-state">{error}</p>}

      {groups.length === 0 ? (
        <p className="empty-state">Nenhum grupo de opções criado ainda.</p>
      ) : (
        groups.map((group) => (
          <div key={group.id} className="order-item" style={{ marginBottom: 15 }}>
            <div className="order-header">
              <h4>{group.name}</h4>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>
                {group.minSelections === 0 ? 'Opcional' : `Mín. ${group.minSelections}`} · Máx. {group.maxSelections}
              </span>
            </div>
            <div className="order-details">
              {group.values.length === 0 ? (
                <p className="empty-state">Nenhuma opção cadastrada nesse grupo.</p>
              ) : (
                <ul>
                  {group.values.map((value) => (
                    <li
                      key={value.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                    >
                      <span>
                        {value.name}
                        {value.priceDelta > 0 && ` (+${formatCurrency(value.priceDelta)})`}
                      </span>
                      <form action={deleteOptionValue}>
                        <input type="hidden" name="restaurantId" value={restaurantId} />
                        <input type="hidden" name="itemId" value={itemId} />
                        <input type="hidden" name="valueId" value={value.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Excluir a opção "${value.name}"?`}
                          className="quantity-btn admin-btn"
                        >
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={createOptionValue} className="admin-inline-form" style={{ marginTop: 10 }}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="itemId" value={itemId} />
                <input type="hidden" name="groupId" value={group.id} />
                <input type="text" name="name" placeholder="Nome da opção" required />
                <input type="number" name="priceDelta" placeholder="Preço extra (R$)" step="0.01" min="0" defaultValue="0" />
                <button type="submit" className="quantity-btn admin-btn">
                  Adicionar opção
                </button>
              </form>

              <form action={deleteOptionGroup} style={{ marginTop: 10 }}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="itemId" value={itemId} />
                <input type="hidden" name="groupId" value={group.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Excluir o grupo "${group.name}" e todas as suas opções?`}
                  className="quantity-btn admin-btn"
                >
                  Excluir grupo
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))
      )}

      <h2 style={{ marginTop: 30 }}>Novo grupo de opções</h2>
      <form action={createOptionGroup} className="checkout-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="itemId" value={itemId} />
        <div className="form-group">
          <label htmlFor="name">Nome do grupo</label>
          <input id="name" name="name" placeholder="Ex: Tamanho, Adicionais, Ponto da carne" required />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="minSelections">Mínimo de seleções</label>
            <input id="minSelections" name="minSelections" type="number" min="0" defaultValue="0" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="maxSelections">Máximo de seleções</label>
            <input id="maxSelections" name="maxSelections" type="number" min="1" defaultValue="1" />
          </div>
        </div>
        <button type="submit" className="checkout-button" style={{ marginTop: 20 }}>
          Criar grupo
        </button>
      </form>
    </div>
  );
}
