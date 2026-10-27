'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview instantâneo local — o upload de verdade acontece em paralelo,
    // sem nunca guardar o arquivo inteiro em base64 no formulário.
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const uploadData = new FormData();
      uploadData.set('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Não foi possível enviar a foto.');
      setNewAvatar(body.url);
    } catch (err) {
      console.error('[Sizzle] Erro ao enviar foto:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível enviar a foto.';
      showToast(message, 'error');
      setAvatarPreview(profile.avatarUrl ?? '/default-user.svg');
    } finally {
      setUploadingAvatar(false);
    }
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
          <p style={{ margin: 'var(--space-1) 0 var(--space-3)', color: 'var(--color-text-muted)' }}>{ROLE_LABEL[profile.role]}</p>
          <SignOutButton />
          <PushNotificationToggle />
        </div>

        {(profile.role === 'admin' || profile.role === 'restaurant_owner' || profile.role === 'courier') && (
          <div className="user-input-group" style={{ width: '100%', maxWidth: 400 }}>
            {profile.role === 'admin' && (
              <Link href="/admin" className="checkout-button profile-panel-link">
                Ir para o Painel do Administrador
              </Link>
            )}
            {profile.role === 'restaurant_owner' && (
              <Link href="/restaurant" className="checkout-button profile-panel-link">
                Ir para o Painel do Restaurante
              </Link>
            )}
            {profile.role === 'courier' && (
              <Link href="/courier" className="checkout-button profile-panel-link">
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
              <Camera size={15} aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div style={{ width: '100%', maxWidth: 400 }}>
            <Input label="Nome de usuário" id="profile-name" type="text" placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} />
            <Input
              label="Número de telefone"
              id="profile-phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Button variant="primary" fullWidth onClick={handleSave} loading={saving || uploadingAvatar}>
              {uploadingAvatar ? 'Enviando foto...' : saved ? 'Salvo!' : 'Salvar alterações'}
            </Button>
          </div>
        </div>

        <ul className="profile-menu">
          <li>
            <a href="/orders">Histórico de Pedidos</a>
          </li>
          <li>
            <a href="/favorites">Meus Favoritos</a>
          </li>
          <li>
            <a href="/profile/addresses">Meus Endereços</a>
          </li>
          <li>
            <a href="#">Configurações</a>
          </li>
        </ul>
      </main>
    </div>
  );
}
