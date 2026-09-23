'use client';

import { useRef, useState } from 'react';
import { updateRestaurantSettings } from '../actions';
import type { RestaurantSettings } from '@/lib/restaurant-data';

export default function RestaurantSettingsForm({ settings }: { settings: RestaurantSettings }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState(settings.imageUrl ?? '');
  const [newImage, setNewImage] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setImagePreview(result);
      setNewImage(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <form action={updateRestaurantSettings} className="checkout-form">
      <input type="hidden" name="restaurantId" value={settings.id} />
      {newImage && <input type="hidden" name="imageUrl" value={newImage} />}

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
        <input id="deliveryTime" name="deliveryTime" defaultValue={settings.deliveryTime} required />
      </div>
      <div className="form-group">
        <label htmlFor="openingHours">Horário de funcionamento</label>
        <input
          id="openingHours"
          name="openingHours"
          placeholder="Ex: Seg a Sáb, 18h às 23h"
          defaultValue={settings.openingHours ?? ''}
        />
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
        <label htmlFor="brandColor">Cor da loja</label>
        <input id="brandColor" name="brandColor" type="color" defaultValue={settings.brandColor ?? '#000000'} style={{ height: 45, padding: 4 }} />
      </div>

      <button type="submit" className="checkout-button">
        Salvar loja
      </button>
    </form>
  );
}
