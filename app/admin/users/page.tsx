import { Users } from 'lucide-react';
import { listAllProfiles } from '@/lib/admin-data';
import { getCurrentProfile } from '@/lib/auth';
import { updateUserRole } from '../actions';
import InlineSelect from '@/components/ui/InlineSelect';
import Button from '@/components/ui/Button';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Cliente',
  restaurant_owner: 'Dono de restaurante',
  admin: 'Administrador',
  courier: 'Entregador',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [profiles, currentProfile] = await Promise.all([listAllProfiles(), getCurrentProfile()]);

  return (
    <div>
      {error && <ErrorState description={error} />}

      <h2>Usuários ({profiles.length})</h2>
      {profiles.length === 0 ? (
        <EmptyState icon={Users} title="Ninguém se cadastrou ainda" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Papel atual</th>
              <th>Alterar papel</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((user) => (
              <tr key={user.id}>
                <Td label="E-mail">{user.email}</Td>
                <Td label="Papel atual">{ROLE_LABEL[user.role] ?? user.role}</Td>
                <Td label="Alterar papel">
                  {user.id === currentProfile?.id ? (
                    <span className="hint-text">Você — peça a outro admin pra alterar seu papel</span>
                  ) : user.role === 'restaurant_owner' ? (
                    <span className="hint-text">Gerencie pela aba Restaurantes (Remover dono)</span>
                  ) : user.role === 'courier' ? (
                    <span className="hint-text">Gerencie pela aba Entregadores do painel do dono</span>
                  ) : (
                    <form action={updateUserRole} className="admin-inline-form">
                      <input type="hidden" name="userId" value={user.id} />
                      <InlineSelect name="role" defaultValue={user.role}>
                        <option value="customer">Cliente</option>
                        <option value="admin">Administrador</option>
                      </InlineSelect>
                      <Button type="submit" variant="secondary" size="sm">
                        Salvar
                      </Button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="hint-text" style={{ marginTop: 'var(--space-2)' }}>
        Esse seletor só troca entre Cliente e Administrador. Pra tornar alguém dono de restaurante, use a aba
        Restaurantes (atribui o e-mail a uma loja específica). Entregadores são vinculados pelo próprio dono de
        restaurante, na aba Entregadores do painel dele.
      </p>
    </div>
  );
}
