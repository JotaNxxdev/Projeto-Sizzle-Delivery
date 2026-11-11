'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { purchasePromotion } from '../actions';
import { PROMOTION_PLANS } from '@/lib/promotions';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';

export default function PromoteForm({ restaurantId }: { restaurantId: string }) {
  const { showToast } = useToast();
  const [imagePreview, setImagePreview] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [days, setDays] = useState<number>(PROMOTION_PLANS[0].days);

  async function handleFileSelect(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Falha no upload.');
      setNewImageUrl(body.url);
      setImagePreview(body.url);
    } catch (err) {
      console.error('[Sizzle] Erro ao enviar imagem do destaque:', err);
      showToast('Não foi possível enviar a imagem.', 'error');
    } finally {
      setUploading(false);
    }
  }

  const selectedPlan = PROMOTION_PLANS.find((p) => p.days === days) ?? PROMOTION_PLANS[0];

  return (
    <form action={purchasePromotion} className="checkout-form">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="days" value={days} />
      {newImageUrl && <input type="hidden" name="imageUrl" value={newImageUrl} />}

      <FileUpload
        label="Imagem do banner (opcional)"
        hint="Arraste uma imagem ou clique pra escolher"
        previewUrl={imagePreview || null}
        loading={uploading}
        onFileSelect={handleFileSelect}
      />

      <Input label="Texto do banner" id="title" name="title" placeholder="Ex: 2 Hambúrgueres por R$ 35,00!" required />

      <div className="form-group">
        <label>Duração</label>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {PROMOTION_PLANS.map((plan) => (
            <button
              key={plan.days}
              type="button"
              onClick={() => setDays(plan.days)}
              className={`ui-button ui-button-sm ${days === plan.days ? 'ui-button-primary' : 'ui-button-secondary'}`}
            >
              {plan.days} dias — R$ {plan.price}
            </button>
          ))}
        </div>
      </div>

      <p className="hint-text">
        Plano escolhido: {selectedPlan.days} dias por R$ {selectedPlan.price}. O pagamento acontece numa página segura
        do Mercado Pago, que aceita cartão de crédito, Pix e boleto.
      </p>

      <Button type="submit" variant="primary" fullWidth icon={<CreditCard size={16} aria-hidden="true" />} disabled={uploading}>
        Pagar com Mercado Pago
      </Button>
    </form>
  );
}
