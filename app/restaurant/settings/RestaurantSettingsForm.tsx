'use client';

import { useRef, useState } from 'react';
import { updateRestaurantSettings } from '../actions';
import { useToast } from '@/contexts/ToastContext';
import type { RestaurantSettings } from '@/lib/restaurant-data';

export default function RestaurantSettingsForm({ settings }: { settings: RestaurantSettings }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [imagePreview, setImagePreview] = useState(settings.imageUrl ?? '');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview instantâneo local — o upload de verdade acontece em paralelo,
    // sem nunca guardar o arquivo inteiro em base64 no formulário.
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.set('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Não foi possível enviar a imagem.');
      setNewImageUrl(body.url);
    } catch (err) {
      console.error('[Sizzle] Erro ao enviar imagem:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível enviar a imagem.';
      showToast(message, 'error');
      setImagePreview(settings.imageUrl ?? '');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={updateRestaurantSettings} className="checkout-form">
      <input type="hidden" name="restaurantId" value={settings.id} />
      {newImageUrl && <input type="hidden" name="imageUrl" value={newImageUrl} />}

      <div className="profile-picture-container" style={{ marginBottom: 20 }}>
        {imagePreview ? (
          <img src={imagePreview} alt="Foto da loja" className="profile-picture" style={{ borderRadius: 15 }} />
        ) : (
          <div className="profile-picture" style={{ borderRadius: 15, backgroundColor: '#eee' }} />
        )}
        <button
          type="button"
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Alterar foto da loja"
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

      <div className="form-group">
        <label htmlFor="name">Nome da loja</label>
        <input id="name" name="name" defaultValue={settings.name} required />
      </div>
      <div className="form-group">
        <label htmlFor="category">Categoria</label>
        <input id="category" name="category" defaultValue={settings.category} required />
      </div>
      <div className="form-group">
        <label htmlFor="description">Descrição / observações</label>
        <textarea id="description" name="description" rows={3} defaultValue={settings.description ?? ''} />
      </div>
      <div className="form-group">
        <label htmlFor="deliveryTime">Tempo de entrega</label>
        <input id="deliveryTime" name="deliveryTime" placeholder="Ex: 30-40 min" defaultValue={settings.deliveryTime} required />
      </div>
      <div className="form-group">
        <label htmlFor="deliveryFee">Taxa de entrega (R$)</label>
        <input
          id="deliveryFee"
          name="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={settings.deliveryFee}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="minOrderValue">Pedido mínimo (R$) — deixe 0 pra não exigir mínimo</label>
        <input
          id="minOrderValue"
          name="minOrderValue"
          type="number"
          step="0.01"
          min="0"
          defaultValue={settings.minOrderValue}
        />
      </div>
      <div className="form-group">
        <label htmlFor="brandColor">Cor da loja</label>
        <input id="brandColor" name="brandColor" type="color" defaultValue={settings.brandColor ?? '#000000'} style={{ height: 45, padding: 4 }} />
      </div>

      <button type="submit" className="checkout-button" disabled={uploading}>
        {uploading ? 'Enviando imagem...' : 'Salvar loja'}
      </button>
    </form>
  );
}
