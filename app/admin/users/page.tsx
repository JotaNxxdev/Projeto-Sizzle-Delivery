import { listAllProfiles } from '@/lib/admin-data';
import { getCurrentProfile } from '@/lib/auth';
import { updateUserRole } from '../actions';

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
      {error && <p className="empty-state">{error}</p>}

      <h2>Usuários ({profiles.length})</h2>
      {profiles.length === 0 ? (
        <p className="empty-state">Ninguém se cadastrou ainda.</p>
      ) : (
        <div className="admin-table-wrapper">
        <table className="admin-table">
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
                <td>{user.email}</td>
                <td>{ROLE_LABEL[user.role] ?? user.role}</td>
                <td>
                  {user.id === currentProfile?.id ? (
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      Você — peça a outro admin pra alterar seu papel
                    </span>
                  ) : (
                    <form action={updateUserRole} className="admin-inline-form">
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="role" defaultValue={user.role}>
                        <option value="customer">Cliente</option>
                        <option value="restaurant_owner">Dono de restaurante</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <button type="submit" className="quantity-btn admin-btn">
                        Salvar
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
      <p className="empty-state" style={{ marginTop: 10 }}>
        Promover alguém a &quot;Dono de restaurante&quot; por aqui não vincula nenhum restaurante a ele — use a aba
        Restaurantes para atribuir o dono pelo e-mail. Entregadores não são atribuídos por aqui — cada dono de
        restaurante vincula os próprios entregadores na aba Entregadores do painel dele.
      </p>
    </div>
  );
}
