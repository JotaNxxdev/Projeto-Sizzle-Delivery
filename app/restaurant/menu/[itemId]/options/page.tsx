import { notFound } from 'next/navigation';
import { ListTree } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getMenuItemsForRestaurant } from '@/lib/restaurant-data';
import { getOptionGroupsForMenuItems } from '@/lib/menu-options';
import { createOptionGroup, deleteOptionGroup, createOptionValue, deleteOptionValue } from '../../../actions';
import { formatCurrency } from '@/lib/format';
import BackButton from '@/components/BackButton';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

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
      <header className="page-header-row">
        <BackButton />
        <h2 style={{ marginBottom: 0 }}>Adicionais de &quot;{item.name}&quot;</h2>
      </header>
      {error && <ErrorState description={error} />}

      {groups.length === 0 ? (
        <EmptyState icon={ListTree} title="Nenhum grupo de opções criado ainda" description="Crie o primeiro grupo no formulário abaixo." />
      ) : (
        groups.map((group) => (
          <div key={group.id} className="order-item">
            <div className="order-header">
              <h4>{group.name}</h4>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {group.minSelections === 0 ? 'Opcional' : `Mín. ${group.minSelections}`} · Máx. {group.maxSelections}
              </span>
            </div>
            <div className="order-details">
              {group.values.length === 0 ? (
                <p className="empty-state">Nenhuma opção cadastrada nesse grupo.</p>
              ) : (
                <ul className="option-value-list">
                  {group.values.map((value) => (
                    <li key={value.id}>
                      <span>
                        {value.name}
                        {value.priceDelta > 0 && ` (+${formatCurrency(value.priceDelta)})`}
                      </span>
                      <form action={deleteOptionValue}>
                        <input type="hidden" name="restaurantId" value={restaurantId} />
                        <input type="hidden" name="itemId" value={itemId} />
                        <input type="hidden" name="valueId" value={value.id} />
                        <ConfirmSubmitButton confirmMessage={`Excluir a opção "${value.name}"?`} className="ui-button ui-button-secondary ui-button-sm">
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={createOptionValue} className="admin-inline-form" style={{ marginTop: 'var(--space-3)' }}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="itemId" value={itemId} />
                <input type="hidden" name="groupId" value={group.id} />
                <input type="text" name="name" placeholder="Nome da opção" required />
                <input type="number" name="priceDelta" placeholder="Preço extra (R$)" step="0.01" min="0" defaultValue="0" />
                <Button type="submit" variant="secondary" size="sm">
                  Adicionar opção
                </Button>
              </form>

              <form action={deleteOptionGroup} style={{ marginTop: 'var(--space-3)' }}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="itemId" value={itemId} />
                <input type="hidden" name="groupId" value={group.id} />
                <ConfirmSubmitButton confirmMessage={`Excluir o grupo "${group.name}" e todas as suas opções?`} className="ui-button ui-button-secondary ui-button-sm">
                  Excluir grupo
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Novo grupo de opções</h2>
      <form action={createOptionGroup} className="checkout-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="itemId" value={itemId} />
        <Input label="Nome do grupo" id="name" name="name" placeholder="Ex: Tamanho, Adicionais, Ponto da carne" required />
        <div className="form-row">
          <Input label="Mínimo de seleções" id="minSelections" name="minSelections" type="number" min="0" defaultValue="0" />
          <Input label="Máximo de seleções" id="maxSelections" name="maxSelections" type="number" min="1" defaultValue="1" />
        </div>
        <Button type="submit" variant="primary" fullWidth>
          Criar grupo
        </Button>
      </form>
    </div>
  );
}
