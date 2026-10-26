export type Step =
  | 'greeting'
  | 'name'
  | 'category'
  | 'item'
  | 'quantity'
  | 'note'
  | 'cart_menu'
  | 'address'
  | 'payment'
  | 'change_for'
  | 'confirm'
  | 'awaiting_order'
  | 'done';

export interface CartLine {
  menuItemId: string;
  name: string;
  quantity: number;
  note: string | null;
}

export interface ParsedAddress {
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  complement: string | null;
}

export type PaymentChoice = 'pix_manual' | 'cash' | 'card';

export interface PreviewSummary {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
}

export interface SessionState {
  step: Step;
  cart: CartLine[];
  categoryName: string | null;
  pendingItemId: string | null;
  pendingQuantity: number | null;
  receiverName: string | null;
  address: ParsedAddress | null;
  paymentMethod: PaymentChoice | null;
  changeFor: number | null;
  lastPreview: PreviewSummary | null;
}

export function initialState(): SessionState {
  return {
    step: 'greeting',
    cart: [],
    categoryName: null,
    pendingItemId: null,
    pendingQuantity: null,
    receiverName: null,
    address: null,
    paymentMethod: null,
    changeFor: null,
    lastPreview: null,
  };
}

// O que a camada de conversa (pura) pede pra camada de IO (adapter) fazer
// depois de processar uma mensagem. flow.ts nunca chama rede/banco
// diretamente — só descreve a intenção como dado, pra ficar 100% testável.
export type Effect =
  | { type: 'none' }
  | { type: 'request_preview' }
  | { type: 'create_order' }
  | { type: 'pause_for_agent' };

export interface HandleResult {
  state: SessionState;
  replies: string[];
  effect: Effect;
}
