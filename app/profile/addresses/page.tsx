import { redirect } from 'next/navigation';
import { MapPinned } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getAddressesForUser } from '@/lib/addresses';
import { createAddress, deleteAddress, setDefaultAddress } from './actions';
import BackButton from '@/components/BackButton';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

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
        {error && <ErrorState description={error} />}

        {addresses.length === 0 ? (
          <EmptyState icon={MapPinned} title="Nenhum endereço salvo ainda" description="Cadastre um endereço abaixo pra agilizar seus próximos pedidos." />
        ) : (
          addresses.map((address) => (
            <div className="order-item" key={address.id}>
              <div className="order-header">
                <h4>{address.label}</h4>
                {address.isDefault && <Badge tone="success">Padrão</Badge>}
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
              <div className="address-actions">
                {!address.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Tornar padrão
                    </Button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <ConfirmSubmitButton confirmMessage={`Excluir o endereço "${address.label}"?`} className="ui-button ui-button-secondary ui-button-sm">
                    Excluir
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))
        )}

        <h2 style={{ marginTop: 'var(--space-8)' }}>Novo endereço</h2>
        <form action={createAddress} className="checkout-form">
          <Input label="Nome do endereço" id="label" name="label" placeholder="Ex: Casa, Trabalho" defaultValue="Casa" />
          <Input label="Rua" id="street" name="street" required />
          <div className="form-row">
            <Input label="Número" id="streetNumber" name="streetNumber" required />
            <Input label="Complemento" id="complement" name="complement" placeholder="Apto, bloco... (opcional)" />
          </div>
          <Input label="Bairro" id="neighborhood" name="neighborhood" required />
          <Input label="Cidade" id="city" name="city" required />
          <Input label="Ponto de referência" id="referencePoint" name="referencePoint" placeholder="Opcional" />
          <Checkbox name="isDefault" label="Definir como endereço padrão" className="address-default-checkbox" />
          <Button type="submit" variant="primary" fullWidth size="lg">
            Salvar endereço
          </Button>
        </form>
      </main>
    </div>
  );
}
