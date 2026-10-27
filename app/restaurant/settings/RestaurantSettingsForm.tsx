'use client';

import { useState } from 'react';
import { updateRestaurantSettings } from '../actions';
import { useToast } from '@/contexts/ToastContext';
import type { RestaurantSettings } from '@/lib/restaurant-data';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';

export default function RestaurantSettingsForm({ settings }: { settings: RestaurantSettings }) {
  const { showToast } = useToast();
  const [imagePreview, setImagePreview] = useState(settings.imageUrl ?? '');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(file: File) {
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

      <FileUpload label="Foto da loja" previewUrl={imagePreview || null} loading={uploading} onFileSelect={handleFileSelect} />

      <Input label="Nome da loja" id="name" name="name" defaultValue={settings.name} required />
      <Input label="Categoria" id="category" name="category" defaultValue={settings.category} required />
      <Textarea label="Descrição / observações" id="description" name="description" rows={3} defaultValue={settings.description ?? ''} />
      <Input label="Tempo de entrega" id="deliveryTime" name="deliveryTime" placeholder="Ex: 30-40 min" defaultValue={settings.deliveryTime} required />
      <Input
        label="Taxa de entrega (R$)"
        id="deliveryFee"
        name="deliveryFee"
        type="number"
        step="0.01"
        min="0"
        defaultValue={settings.deliveryFee}
        required
      />
      <Input
        label="Pedido mínimo (R$) — deixe 0 pra não exigir mínimo"
        id="minOrderValue"
        name="minOrderValue"
        type="number"
        step="0.01"
        min="0"
        defaultValue={settings.minOrderValue}
      />
      <div className="ui-field">
        <label className="ui-field-label" htmlFor="brandColor">
          Cor da loja
        </label>
        <input id="brandColor" name="brandColor" type="color" defaultValue={settings.brandColor ?? '#000000'} className="color-input" />
      </div>
      <Input
        label="Chave Pix (usada no pedido por WhatsApp)"
        id="manualPixKey"
        name="manualPixKey"
        placeholder="CPF, e-mail, telefone ou chave aleatória"
        defaultValue={settings.manualPixKey ?? ''}
        hint="Mostrada pro cliente quando ele escolhe pagar por Pix no bot do WhatsApp. O pagamento é combinado direto com você — não passa pelo Mercado Pago."
      />

      <Button type="submit" variant="primary" fullWidth loading={uploading}>
        {uploading ? 'Enviando imagem...' : 'Salvar loja'}
      </Button>
    </form>
  );
}
