import type { Catalog, CatalogCategory, CatalogItem } from '../catalog';
import type { CartLine, Effect, HandleResult, PaymentChoice, SessionState } from './types';
import { initialState } from './types';

function money(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function reply(state: SessionState, replies: string[], effect: Effect = { type: 'none' }): HandleResult {
  return { state, replies, effect };
}

function findCategory(catalog: Catalog, name: string): CatalogCategory | undefined {
  return catalog.categories.find((category) => category.name === name);
}

function findItem(catalog: Catalog, categoryName: string | null, itemId: string): CatalogItem | undefined {
  const category = categoryName ? findCategory(catalog, categoryName) : undefined;
  return category?.items.find((item) => item.id === itemId);
}

function parseListChoice(text: string, max: number): number | null {
  const n = Number(text.trim());
  if (!Number.isInteger(n) || n < 1 || n > max) return null;
  return n;
}

export function greetingMessage(catalog: Catalog): string {
  return (
    `Olá! Bem-vindo(a) ao *${catalog.name}* 👋\n\n` +
    `1 - Fazer pedido\n` +
    `2 - Ver cardápio no site\n` +
    `3 - Falar com atendente\n\n` +
    `Digite o número da opção.`
  );
}

function categoryListMessage(catalog: Catalog): string {
  const lines = catalog.categories.map((category, index) => `${index + 1} - ${category.name}`);
  return `Escolha uma categoria:\n\n${lines.join('\n')}\n\n0 - Voltar ao início`;
}

function itemListMessage(category: CatalogCategory): string {
  const lines = category.items.map((item, index) => `${index + 1} - ${item.name} (${money(item.price)})`);
  return `*${category.name}*\n\n${lines.join('\n')}\n\n0 - Voltar ao início`;
}

function cartSummaryLines(cart: CartLine[]): string {
  return cart.map((line) => `• ${line.quantity}x ${line.name}${line.note ? ` (obs: ${line.note})` : ''}`).join('\n');
}

const PAYMENT_LABEL: Record<PaymentChoice, string> = {
  pix_manual: 'Pix',
  cash: 'Dinheiro',
  card: 'Cartão na entrega',
};

// Processa UMA mensagem do cliente. Nunca faz rede/banco — o resultado pode
// pedir um "efeito" (preview ou criação do pedido) que quem chama (o
// adapter) executa e devolve pra flow.ts via applyPreviewResult/applyOrderResult.
export function handleMessage(state: SessionState, catalog: Catalog, websiteUrl: string, rawText: string): HandleResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  if (lower === 'atendente') {
    return reply(state, ['Ok! Um atendente vai te chamar por aqui em breve. O robô vai parar de responder até lá.'], {
      type: 'pause_for_agent',
    });
  }

  // "cancelar" sempre limpa o carrinho e manda pro início, de qualquer etapa
  // (inclusive pra sair de um pedido travado em awaiting_order, se algo der
  // errado e a pessoa quiser desistir).
  if (lower === 'cancelar') {
    return reply(initialState(), ['Pedido cancelado e carrinho esvaziado. ' + greetingMessage(catalog)]);
  }

  if ((lower === '0' || lower === 'menu') && state.step !== 'greeting' && state.step !== 'awaiting_order') {
    const next = { ...initialState(), receiverName: state.receiverName };
    return reply(next, [greetingMessage(catalog)]);
  }

  switch (state.step) {
    case 'greeting':
      return handleGreeting(state, catalog, websiteUrl, text);
    case 'name':
      return handleName(state, catalog, text);
    case 'category':
      return handleCategory(state, catalog, text);
    case 'item':
      return handleItem(state, catalog, text);
    case 'quantity':
      return handleQuantity(state, catalog, text);
    case 'note':
      return handleNote(state, catalog, text);
    case 'cart_menu':
      return handleCartMenu(state, catalog, text);
    case 'address':
      return handleAddress(state, catalog, text);
    case 'payment':
      return handlePayment(state, catalog, text);
    case 'change_for':
      return handleChangeFor(state, catalog, text);
    case 'confirm':
      return handleConfirm(state, catalog, text);
    case 'awaiting_order':
      return reply(state, ['Só um momento, ainda estamos processando seu pedido anterior...']);
    case 'done':
      return reply({ ...initialState(), receiverName: state.receiverName }, [greetingMessage(catalog)]);
    default:
      return reply(state, ['Digite *0* para voltar ao início.']);
  }
}

function handleGreeting(state: SessionState, catalog: Catalog, websiteUrl: string, text: string): HandleResult {
  if (text === '1') {
    if (state.receiverName) {
      return reply({ ...state, step: 'category' }, [categoryListMessage(catalog)]);
    }
    return reply({ ...state, step: 'name' }, ['Antes de começar, qual é o seu nome?']);
  }
  if (text === '2') {
    return reply(state, [`Claro! Dá uma olhada no cardápio completo aqui: ${websiteUrl}`, greetingMessage(catalog)]);
  }
  if (text === '3') {
    return reply(state, ['Ok! Um atendente vai te chamar por aqui em breve.'], { type: 'pause_for_agent' });
  }
  return reply(state, ['Não entendi. ' + greetingMessage(catalog)]);
}

function handleName(state: SessionState, catalog: Catalog, text: string): HandleResult {
  if (!text || text.length > 80) {
    return reply(state, ['Pode me dizer seu nome (até 80 caracteres)?']);
  }
  return reply({ ...state, receiverName: text, step: 'category' }, [`Prazer, ${text}! ${categoryListMessage(catalog)}`]);
}

function handleCategory(state: SessionState, catalog: Catalog, text: string): HandleResult {
  const choice = parseListChoice(text, catalog.categories.length);
  if (choice === null) {
    return reply(state, ['Opção inválida.\n\n' + categoryListMessage(catalog)]);
  }
  const category = catalog.categories[choice - 1];
  return reply({ ...state, step: 'item', categoryName: category.name }, [itemListMessage(category)]);
}

function handleItem(state: SessionState, catalog: Catalog, text: string): HandleResult {
  const category = state.categoryName ? findCategory(catalog, state.categoryName) : undefined;
  if (!category) {
    return reply({ ...state, step: 'category' }, [categoryListMessage(catalog)]);
  }
  const choice = parseListChoice(text, category.items.length);
  if (choice === null) {
    return reply(state, ['Opção inválida.\n\n' + itemListMessage(category)]);
  }
  const item = category.items[choice - 1];
  return reply({ ...state, step: 'quantity', pendingItemId: item.id }, [`Quantas unidades de *${item.name}* você quer?`]);
}

function handleQuantity(state: SessionState, catalog: Catalog, text: string): HandleResult {
  const quantity = Number(text.trim());
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
    return reply(state, ['Quantidade inválida. Digite um número entre 1 e 50.']);
  }
  const item = state.pendingItemId ? findItem(catalog, state.categoryName, state.pendingItemId) : undefined;
  if (!item) {
    return reply({ ...state, step: 'category' }, ['Esse item não existe mais. ' + categoryListMessage(catalog)]);
  }
  return reply({ ...state, step: 'note', pendingQuantity: quantity }, [
    `Alguma observação pra esse item (ex: "sem cebola")? Se não quiser nada, digite *pular*.`,
  ]);
}

function handleNote(state: SessionState, catalog: Catalog, text: string): HandleResult {
  const item = state.pendingItemId ? findItem(catalog, state.categoryName, state.pendingItemId) : undefined;
  if (!item) {
    return reply({ ...state, step: 'category' }, ['Esse item não existe mais. ' + categoryListMessage(catalog)]);
  }
  // "0"/"menu" já foram tratados como comando global antes de chegar aqui
  // (spec: "0 ou menu volta ao início em qualquer etapa") — por isso pular
  // a observação usa uma palavra diferente, sem ambiguidade com esse comando.
  const note = text.trim().toLowerCase() === 'pular' ? null : text.slice(0, 200);
  const quantity = state.pendingQuantity ?? 1;
  const newLine: CartLine = { menuItemId: item.id, name: item.name, quantity, note };
  const cart = [...state.cart, newLine];
  return reply({ ...state, step: 'cart_menu', cart, pendingItemId: null, pendingQuantity: null }, [
    `Adicionado: ${quantity}x ${item.name}.\n\nSeu carrinho:\n${cartSummaryLines(cart)}\n\n1 - Continuar comprando\n2 - Finalizar pedido\n\n0 - Voltar ao início`,
  ]);
}

function handleCartMenu(state: SessionState, catalog: Catalog, text: string): HandleResult {
  if (text === '1') {
    return reply({ ...state, step: 'category' }, [categoryListMessage(catalog)]);
  }
  if (text === '2') {
    if (state.cart.length === 0) {
      return reply({ ...state, step: 'category' }, ['Seu carrinho está vazio. ' + categoryListMessage(catalog)]);
    }
    return reply({ ...state, step: 'address' }, [
      'Qual o endereço de entrega? Envie assim, separado por vírgula:\nRua, Número, Bairro, Cidade, Complemento (opcional)',
    ]);
  }
  return reply(state, ['Opção inválida.\n\n1 - Continuar comprando\n2 - Finalizar pedido']);
}

function handleAddress(state: SessionState, catalog: Catalog, text: string): HandleResult {
  const parts = text.split(',').map((part) => part.trim());
  const [street, streetNumber, neighborhood, city, complement] = parts;
  if (!street || !streetNumber || !neighborhood || !city) {
    return reply(state, [
      'Não entendi o endereço. Envie assim, separado por vírgula:\nRua, Número, Bairro, Cidade, Complemento (opcional)',
    ]);
  }
  return reply(
    {
      ...state,
      step: 'payment',
      address: { street, streetNumber, neighborhood, city, complement: complement || null },
    },
    ['Como você quer pagar?\n\n1 - Pix\n2 - Dinheiro\n3 - Cartão na entrega']
  );
}

function handlePayment(state: SessionState, catalog: Catalog, text: string): HandleResult {
  if (text === '1') {
    return reply({ ...state, paymentMethod: 'pix_manual', step: 'confirm' }, [], { type: 'request_preview' });
  }
  if (text === '2') {
    return reply({ ...state, paymentMethod: 'cash', step: 'change_for' }, [
      'Precisa de troco? Se sim, diga o valor com que vai pagar (ex: 50). Se não precisar, digite *pular*.',
    ]);
  }
  if (text === '3') {
    return reply({ ...state, paymentMethod: 'card', step: 'confirm' }, [], { type: 'request_preview' });
  }
  return reply(state, ['Opção inválida.\n\n1 - Pix\n2 - Dinheiro\n3 - Cartão na entrega']);
}

function handleChangeFor(state: SessionState, catalog: Catalog, text: string): HandleResult {
  if (text.trim().toLowerCase() === 'pular') {
    return reply({ ...state, changeFor: null, step: 'confirm' }, [], { type: 'request_preview' });
  }
  const value = Number(text.replace(',', '.').trim());
  if (!Number.isFinite(value) || value <= 0) {
    return reply(state, ['Valor inválido. Diga o valor com que vai pagar (ex: 50) ou *pular* se não precisar de troco.']);
  }
  return reply({ ...state, changeFor: value, step: 'confirm' }, [], { type: 'request_preview' });
}

function handleConfirm(state: SessionState, catalog: Catalog, text: string): HandleResult {
  const lower = text.trim().toLowerCase();
  if (lower === 's' || lower === 'sim') {
    return reply({ ...state, step: 'awaiting_order' }, ['Confirmando seu pedido...'], { type: 'create_order' });
  }
  if (lower === 'n' || lower === 'não' || lower === 'nao') {
    return reply(initialState(), ['Pedido cancelado. Digite *1* se quiser começar de novo.']);
  }
  return reply(state, ['Responda *S* pra confirmar ou *N* pra cancelar o pedido.']);
}

// Chamado pelo adapter depois que o efeito 'request_preview' volta da API
// (/api/orders/preview). Nunca é o bot quem calcula o total.
export function applyPreviewResult(
  state: SessionState,
  result: { ok: true; subtotal: number; deliveryFee: number; discountAmount: number; total: number } | { ok: false; error: string }
): HandleResult {
  if (!result.ok) {
    return reply({ ...state, step: 'payment' }, [`Não foi possível calcular o pedido: ${result.error}\n\nComo você quer pagar?\n\n1 - Pix\n2 - Dinheiro\n3 - Cartão na entrega`]);
  }

  const lines = cartSummaryLines(state.cart);
  const paymentLabel = state.paymentMethod ? PAYMENT_LABEL[state.paymentMethod] : '';
  const changeLine = state.changeFor ? `\nTroco para: ${money(state.changeFor)}` : '';

  const summary =
    `Resumo do seu pedido:\n\n${lines}\n\n` +
    `Subtotal: ${money(result.subtotal)}\n` +
    `Entrega: ${money(result.deliveryFee)}\n` +
    (result.discountAmount > 0 ? `Desconto: -${money(result.discountAmount)}\n` : '') +
    `*Total: ${money(result.total)}*\n\n` +
    `Pagamento: ${paymentLabel}${changeLine}\n\n` +
    `Confirma o pedido? Responda *S* ou *N*.`;

  return reply(
    {
      ...state,
      lastPreview: {
        subtotal: result.subtotal,
        deliveryFee: result.deliveryFee,
        discountAmount: result.discountAmount,
        total: result.total,
      },
    },
    [summary]
  );
}

// Chamado pelo adapter depois do efeito 'create_order' (POST /api/orders).
export function applyOrderResult(
  state: SessionState,
  catalog: Catalog,
  websiteUrl: string,
  result: { ok: true; orderCode: string; pixKey: string | null } | { ok: false; error: string }
): HandleResult {
  if (!result.ok) {
    return reply({ ...state, step: 'confirm' }, [
      `Não foi possível criar seu pedido: ${result.error}\n\nResponda *S* pra tentar de novo ou *N* pra cancelar.`,
    ]);
  }

  const pixLine =
    state.paymentMethod === 'pix_manual' && result.pixKey
      ? `\n\nChave Pix pra pagamento: *${result.pixKey}*\nDepois de pagar, é só aguardar a confirmação do restaurante.`
      : '';

  return reply({ ...initialState(), receiverName: state.receiverName, step: 'done' }, [
    `Pedido confirmado! 🎉\n\nSeu número de pedido é *${result.orderCode}*.${pixLine}\n\nVamos te avisando por aqui conforme o status mudar.`,
  ]);
}

export function buildOrderRequestItems(cart: CartLine[]): { menuItemId: string; quantity: number }[] {
  return cart.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity }));
}

export function formatStatusNotification(orderCode: string, status: string): string {
  const STATUS_MESSAGE: Record<string, string> = {
    'Em Preparação': `Seu pedido *${orderCode}* foi aceito e já está em preparo! 👨‍🍳`,
    'Saiu para entrega': `Seu pedido *${orderCode}* saiu para entrega! 🛵`,
    Entregue: `Seu pedido *${orderCode}* foi entregue. Bom apetite! 😋`,
    Recusado: `Seu pedido *${orderCode}* foi recusado pelo restaurante.`,
    Cancelado: `Seu pedido *${orderCode}* foi cancelado.`,
  };
  return STATUS_MESSAGE[status] ?? `Status do seu pedido *${orderCode}* atualizado: ${status}`;
}
