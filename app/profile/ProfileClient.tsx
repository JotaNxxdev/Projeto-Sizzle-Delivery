'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import type { CurrentProfile } from '@/lib/auth';

const NAME_KEY = 'sizzle_profile_name';
const PHONE_KEY = 'sizzle_profile_phone';
const IMAGE_KEY = 'sizzle_profile_image';

const ROLE_LABEL: Record<CurrentProfile['role'], string> = {
  customer: 'Cliente',
  restaurant_owner: 'Dono de restaurante',
  admin: 'Administrador',
};

export default function ProfileClient({ profile }: { profile: CurrentProfile | null }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('/default-user.svg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // localStorage não existe no servidor, então a leitura só pode
    // acontecer depois da montagem no cliente — é isso que este efeito faz.
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(localStorage.getItem(NAME_KEY) ?? profile?.fullName ?? '');
    setPhone(localStorage.getItem(PHONE_KEY) ?? '');
    const savedImage = localStorage.getItem(IMAGE_KEY);
    if (savedImage) setImage(savedImage);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setImage(result);
      localStorage.setItem(IMAGE_KEY, result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="screen">
      <header className="app-header">
        <div className="header-top">
          <h2>Perfil</h2>
        </div>
      </header>

      <main className="profile-content">
        {profile ? (
          <div className="user-input-group" style={{ textAlign: 'center' }}>
            <p style={{ margin: 0 }}>
              Logado como <strong>{profile.email}</strong>
            </p>
            <p style={{ margin: '4px 0 12px', color: '#666' }}>{ROLE_LABEL[profile.role]}</p>
            <SignOutButton className="checkout-button" />
          </div>
        ) : (
          <div className="user-input-group" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px' }}>Você não está logado.</p>
            <Link href="/login" className="checkout-button" style={{ display: 'block', textDecoration: 'none' }}>
              Entrar
            </Link>
          </div>
        )}

        <div className="profile-info">
          <div className="profile-picture-container">
            <img src={image} alt="Foto de perfil" className="profile-picture" />
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
              onBlur={() => localStorage.setItem(NAME_KEY, name)}
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
              onBlur={() => localStorage.setItem(PHONE_KEY, phone)}
            />
          </div>
        </div>

        <ul className="profile-menu">
          <li>
            <a href="/orders">Histórico de Pedidos</a>
          </li>
          {profile?.role === 'restaurant_owner' && (
            <li>
              <a href="/restaurant">Painel do Restaurante</a>
            </li>
          )}
          {profile?.role === 'admin' && (
            <li>
              <a href="/admin">Painel do Administrador</a>
            </li>
          )}
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
