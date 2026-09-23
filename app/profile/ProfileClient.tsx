'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { updateMyProfile } from './actions';
import type { CurrentProfile } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';

const ROLE_LABEL: Record<CurrentProfile['role'], string> = {
  customer: 'Cliente',
  restaurant_owner: 'Dono de restaurante',
  admin: 'Administrador',
  courier: 'Entregador',
};

export default function ProfileClient({ profile }: { profile: CurrentProfile }) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.fullName ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl ?? '/default-user.svg');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setAvatarPreview(result);
      setNewAvatar(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const formData = new FormData();
      formData.set('fullName', name);
      formData.set('phone', phone);
      if (newAvatar) formData.set('avatarUrl', newAvatar);

      await updateMyProfile(formData);
      setNewAvatar(null);
      setSaved(true);
      showToast('Perfil atualizado!', 'success');
      router.refresh();
    } catch (err) {
      console.error('[Sizzle] Erro ao salvar perfil:', err);
      showToast('Não foi possível salvar seu perfil. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <header className="app-header">
        <div className="header-top">
          <h2>Perfil</h2>
        </div>
      </header>

      <main className="profile-content">
        <div className="user-input-group" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            Logado como <strong>{profile.email}</strong>
          </p>
          <p style={{ margin: '4px 0 12px', color: '#666' }}>{ROLE_LABEL[profile.role]}</p>
          <SignOutButton className="checkout-button" />
        </div>

        {(profile.role === 'admin' || profile.role === 'restaurant_owner' || profile.role === 'courier') && (
          <div className="user-input-group" style={{ width: '100%', maxWidth: 400 }}>
            {profile.role === 'admin' && (
              <Link href="/admin" className="checkout-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 0, marginBottom: 10 }}>
                Ir para o Painel do Administrador
              </Link>
            )}
            {profile.role === 'restaurant_owner' && (
              <Link href="/restaurant" className="checkout-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 0 }}>
                Ir para o Painel do Restaurante
              </Link>
            )}
            {profile.role === 'courier' && (
              <Link href="/courier" className="checkout-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 0 }}>
                Ir para o Painel do Entregador
              </Link>
            )}
          </div>
        )}

        <div className="profile-info">
          <div className="profile-picture-container">
            <img src={avatarPreview} alt="Foto de perfil" className="profile-picture" />
            <button
              type="button"
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Alterar foto de perfil"
            >
              <i className="fas fa-camera" aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div className="user-input-group">
            <label htmlFor="profile-name">Nome de Usuário</label>
            <input
              id="profile-name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="user-input-group">
            <label htmlFor="profile-phone">Número de Telefone</label>
            <input
              id="profile-phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <button type="button" className="checkout-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alterações'}
          </button>
        </div>

        <ul className="profile-menu">
          <li>
            <a href="/orders">Histórico de Pedidos</a>
          </li>
          <li>
            <a href="#">Meus Endereços</a>
          </li>
          <li>
            <a href="#">Configurações</a>
          </li>
        </ul>
      </main>
    </div>
  );
}
