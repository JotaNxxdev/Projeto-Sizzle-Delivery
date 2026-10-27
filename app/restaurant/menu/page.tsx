import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getMenuItemsForRestaurant, type OwnerMenuItem } from '@/lib/restaurant-data';
import { createMenuItem, updateMenuItem, deleteMenuItem } from '../actions';
import { formatCurrency } from '@/lib/format';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export const dynamic = 'force-dynamic';

function groupByCategory(items: OwnerMenuItem[]) {
  const groups = new Map<string, OwnerMenuItem[]>();
  for (const item of items) {
    const key = item.category || 'Geral';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

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
  const groupedItems = groupByCategory(items);
  const existingCategories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <div>
      {error && <ErrorState description={error} />}

      <datalist id="menu-categories">
        {existingCategories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <h2>Itens do cardápio ({items.length})</h2>
      {items.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Nenhum item cadastrado ainda" description="Cadastre o primeiro item no formulário abaixo." />
      ) : (
        groupedItems.map(([category, categoryItems]) => (
          <div key={category} style={{ marginBottom: 'var(--space-5)' }}>
            <h3 className="menu-category-title">{category}</h3>
            {categoryItems.map((item) => (
              <details key={item.id} className="menu-item-editor">
                <summary>
                  {item.name} — {formatCurrency(item.price)}
                  {!item.active && (
                    <span style={{ marginLeft: 'var(--space-2)' }}>
                      <Badge tone="neutral">Inativo</Badge>
                    </span>
                  )}
                </summary>
                <form action={updateMenuItem} className="menu-item-editor-form">
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <Input label="Nome" id={`name-${item.id}`} name="name" defaultValue={item.name} required />
                  <Checkbox
                    name="active"
                    defaultChecked={item.active}
                    label="Item ativo (visível pro cliente)"
                    className="menu-item-active-checkbox"
                  />
                  <Input
                    label="Categoria"
                    id={`category-${item.id}`}
                    name="category"
                    list="menu-categories"
                    defaultValue={item.category}
                    placeholder="Ex: Lanches, Bebidas, Sobremesas"
                  />
                  <Input label="Descrição" id={`description-${item.id}`} name="description" defaultValue={item.description ?? ''} />
                  <Input
                    label="Preço (R$)"
                    id={`price-${item.id}`}
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={item.price}
                    required
                  />
                  <Input label="URL da imagem" id={`imageUrl-${item.id}`} name="imageUrl" defaultValue={item.imageUrl ?? ''} />
                  <Button type="submit" variant="primary">
                    Salvar
                  </Button>
                </form>
                <div className="menu-item-editor-actions">
                  <Link href={`/restaurant/menu/${item.id}/options`} className="ui-button ui-button-secondary ui-button-sm">
                    Gerenciar adicionais
                  </Link>
                  <form action={deleteMenuItem}>
                    <input type="hidden" name="restaurantId" value={restaurantId} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Excluir "${item.name}" do cardápio? Essa ação não pode ser desfeita — se preferir só esconder do cliente, desmarque "Item ativo" em vez disso.`}
                      className="ui-button ui-button-secondary ui-button-sm"
                    >
                      Excluir item
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        ))
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Novo item</h2>
      <form action={createMenuItem} className="checkout-form">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <Input label="Nome" id="name" name="name" required />
        <Input label="Categoria" id="category" name="category" list="menu-categories" placeholder="Ex: Lanches, Bebidas, Sobremesas" defaultValue="Geral" />
        <Input label="Descrição" id="description" name="description" />
        <Input label="Preço (R$)" id="price" name="price" type="number" step="0.01" min="0.01" required />
        <Input label="URL da imagem" id="imageUrl" name="imageUrl" placeholder="/unnamed.png" />
        <Button type="submit" variant="primary" fullWidth>
          Adicionar item
        </Button>
      </form>
    </div>
  );
}
