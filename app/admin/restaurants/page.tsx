import { Store } from 'lucide-react';
import { listRestaurantsWithOwner } from '@/lib/admin-data';
import { createRestaurant, assignOwner, removeOwner, archiveRestaurant, unarchiveRestaurant, deleteRestaurant } from '../actions';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

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
      {error && <ErrorState description={error} />}

      <h2>Restaurantes ({restaurants.length})</h2>
      {restaurants.length === 0 ? (
        <EmptyState icon={Store} title="Nenhum restaurante cadastrado ainda" description="Cadastre o primeiro no formulário abaixo." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Dono</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id}>
                <Td label="Nome">{restaurant.name}</Td>
                <Td label="Categoria">{restaurant.category}</Td>
                <Td label="Status">
                  <Badge tone={restaurant.isArchived ? 'neutral' : 'success'}>{restaurant.isArchived ? 'Arquivado' : 'Ativo'}</Badge>
                </Td>
                <Td label="Dono">{restaurant.ownerEmail ?? '— sem dono —'}</Td>
                <Td label="Ação">
                  <div className="table-action-group">
                    {restaurant.ownerId ? (
                      <form action={removeOwner}>
                        <input type="hidden" name="restaurantId" value={restaurant.id} />
                        <input type="hidden" name="ownerId" value={restaurant.ownerId} />
                        <ConfirmSubmitButton
                          confirmMessage={`Remover ${restaurant.ownerEmail ?? 'o dono atual'} como dono de "${restaurant.name}"?`}
                          className="ui-button ui-button-secondary ui-button-sm"
                        >
                          Remover dono
                        </ConfirmSubmitButton>
                      </form>
                    ) : (
                      <form action={assignOwner} className="admin-inline-form">
                        <input type="hidden" name="restaurantId" value={restaurant.id} />
                        <input type="email" name="ownerEmail" placeholder="email@dono.com" required />
                        <Button type="submit" variant="primary" size="sm">
                          Atribuir dono
                        </Button>
                      </form>
                    )}

                    {restaurant.isArchived ? (
                      <form action={unarchiveRestaurant}>
                        <input type="hidden" name="restaurantId" value={restaurant.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          Reativar
                        </Button>
                      </form>
                    ) : (
                      <form action={archiveRestaurant}>
                        <input type="hidden" name="restaurantId" value={restaurant.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Arquivar "${restaurant.name}"? Ele some da home e do checkout dos clientes, mas o histórico continua salvo. Dá pra reativar depois.`}
                          className="ui-button ui-button-secondary ui-button-sm"
                        >
                          Arquivar
                        </ConfirmSubmitButton>
                      </form>
                    )}

                    {restaurant.orderCount === 0 && (
                      <form action={deleteRestaurant}>
                        <input type="hidden" name="restaurantId" value={restaurant.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Excluir "${restaurant.name}" definitivamente? Esse restaurante não tem pedidos, então dá pra excluir de verdade — mas não tem como desfazer.`}
                          className="ui-button ui-button-danger ui-button-sm"
                        >
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <h2 style={{ marginTop: 'var(--space-8)' }}>Novo restaurante</h2>
      <form action={createRestaurant} className="checkout-form">
        <Input label="Nome" id="name" name="name" required />
        <Input label="Categoria" id="category" name="category" placeholder="pizza, lanches, japonesa..." required />
        <Input label="Tempo de entrega" id="deliveryTime" name="deliveryTime" placeholder="30-40 min" />
        <Input label="Taxa de entrega (R$)" id="deliveryFee" name="deliveryFee" type="number" step="0.01" min="0" defaultValue="0" />
        <Input label="URL da imagem (ex: /unnamed.png)" id="imageUrl" name="imageUrl" placeholder="/unnamed.png" />
        <Button type="submit" variant="primary" fullWidth>
          Criar restaurante
        </Button>
      </form>
    </div>
  );
}
