import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { getAddressesForUser } from '@/lib/addresses';
import { createAddress, deleteAddress, setDefaultAddress } from './actions';
import BackButton from '@/components/BackButton';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

export const dynamic = 'force-dynamic';

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/profile/addresses');

  const addresses = await getAddressesForUser(profile.id);

  return (
    <div className="screen">
      <header className="app-header-menu">
        <BackButton />
        <h1>Meus Endereços</h1>
      </header>
      <main className="app-main-menu">
        {error && <p className="empty-state">{error}</p>}

        {addresses.length === 0 ? (
          <p className="empty-state">Nenhum endereço salvo ainda.</p>
        ) : (
          addresses.map((address) => (
            <div className="order-item" key={address.id}>
              <div className="order-header">
                <h4>
                  {address.label}
                  {address.isDefault && <span style={{ color: '#43B55C', fontWeight: 600 }}> (padrão)</span>}
                </h4>
              </div>
              <div className="order-details">
                <p>
                  {address.street}, {address.streetNumber}
                  {address.complement && ` - ${address.complement}`}
                </p>
                <p>
                  {address.neighborhood} - {address.city}
                </p>
                {address.referencePoint && (
                  <p>
                    <strong>Referência:</strong> {address.referencePoint}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {!address.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button type="submit" className="quantity-btn admin-btn">
                      Tornar padrão
                    </button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Excluir o endereço "${address.label}"?`}
                    className="quantity-btn admin-btn"
                  >
                    Excluir
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))
        )}

        <h2 style={{ marginTop: 30 }}>Novo endereço</h2>
        <form action={createAddress} className="checkout-form">
          <div className="form-group">
            <label htmlFor="label">Nome do endereço</label>
            <input id="label" name="label" placeholder="Ex: Casa, Trabalho" defaultValue="Casa" />
          </div>
          <div className="form-group">
            <label htmlFor="street">Rua</label>
            <input id="street" name="street" required />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="streetNumber">Número</label>
              <input id="streetNumber" name="streetNumber" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="complement">Complemento</label>
              <input id="complement" name="complement" placeholder="Apto, bloco... (opcional)" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="neighborhood">Bairro</label>
            <input id="neighborhood" name="neighborhood" required />
          </div>
          <div className="form-group">
            <label htmlFor="city">Cidade</label>
            <input id="city" name="city" required />
          </div>
          <div className="form-group">
            <label htmlFor="referencePoint">Ponto de referência</label>
            <input id="referencePoint" name="referencePoint" placeholder="Opcional" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <input type="checkbox" name="isDefault" style={{ width: 20, height: 20, flexShrink: 0, margin: 0 }} />
            Definir como endereço padrão
          </label>
          <button type="submit" className="checkout-button">
            Salvar endereço
          </button>
        </form>
      </main>
    </div>
  );
}
