import { describe, expect, it } from 'vitest';
import { applyOrderResult, applyPreviewResult, handleMessage } from './flow';
import { initialState } from './types';
import type { Catalog } from '../catalog';
import type { SessionState } from './types';

const CATALOG: Catalog = {
  restaurantId: 'rest-1',
  name: 'Pizzaria Teste',
  deliveryFee: 5,
  minOrderValue: 0,
  manualPixKey: 'pix@teste.com',
  isOpenNow: true,
  categories: [
    {
      name: 'Pizzas',
      items: [
        { id: 'item-1', name: 'Calabresa', description: '', price: 35, category: 'Pizzas', optionGroups: [] },
        { id: 'item-2', name: 'Margherita', description: '', price: 40, category: 'Pizzas', optionGroups: [] },
      ],
    },
    {
      name: 'Bebidas',
      items: [{ id: 'item-3', name: 'Refrigerante', description: '', price: 8, category: 'Bebidas', optionGroups: [] }],
    },
  ],
};

const WEBSITE_URL = 'https://sizzle.example/restaurants/rest-1';

function send(state: SessionState, text: string) {
  return handleMessage(state, CATALOG, WEBSITE_URL, text);
}

describe('fluxo completo de pedido', () => {
  it('leva do início até o resumo e cria o pedido', () => {
    let state = initialState();

    let result = send(state, '1'); // fazer pedido
    expect(result.state.step).toBe('name');
    state = result.state;

    result = send(state, 'Maria');
    expect(result.state.step).toBe('category');
    expect(result.replies[0]).toContain('Pizzas');
    state = result.state;

    result = send(state, '1'); // categoria Pizzas
    expect(result.state.step).toBe('item');
    expect(result.replies[0]).toContain('Calabresa');
    state = result.state;

    result = send(state, '1'); // item Calabresa
    expect(result.state.step).toBe('quantity');
    state = result.state;

    result = send(state, '2'); // quantidade
    expect(result.state.step).toBe('note');
    expect(result.state.pendingQuantity).toBe(2);
    state = result.state;

    result = send(state, 'pular'); // sem observação
    expect(result.state.step).toBe('cart_menu');
    expect(result.state.cart).toEqual([{ menuItemId: 'item-1', name: 'Calabresa', quantity: 2, note: null }]);
    state = result.state;

    result = send(state, '2'); // finalizar pedido
    expect(result.state.step).toBe('address');
    state = result.state;

    result = send(state, 'Rua das Flores, 123, Centro, São Paulo');
    expect(result.state.step).toBe('payment');
    expect(result.state.address).toEqual({
      street: 'Rua das Flores',
      streetNumber: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      complement: null,
    });
    state = result.state;

    result = send(state, '1'); // pix
    expect(result.state.step).toBe('confirm');
    expect(result.effect).toEqual({ type: 'request_preview' });
    state = result.state;

    // Adapter chamaria /api/orders/preview aqui; simulamos o retorno.
    result = applyPreviewResult(state, { ok: true, subtotal: 70, deliveryFee: 5, discountAmount: 0, total: 75 });
    expect(result.replies[0]).toContain('Total: R$ 75,00');
    expect(result.state.lastPreview).toEqual({ subtotal: 70, deliveryFee: 5, discountAmount: 0, total: 75 });
    state = result.state;

    result = send(state, 'S'); // confirma
    expect(result.state.step).toBe('awaiting_order');
    expect(result.effect).toEqual({ type: 'create_order' });
    state = result.state;

    // Adapter chamaria POST /api/orders aqui; simulamos o retorno.
    result = applyOrderResult(state, CATALOG, WEBSITE_URL, { ok: true, orderCode: 'PED-ABC123', pixKey: 'pix@teste.com' });
    expect(result.replies[0]).toContain('PED-ABC123');
    expect(result.replies[0]).toContain('pix@teste.com');
    expect(result.state.step).toBe('done');
    // Nome do cliente é preservado entre pedidos na mesma sessão.
    expect(result.state.receiverName).toBe('Maria');
    expect(result.state.cart).toEqual([]);
  });

  it('pagamento em dinheiro pergunta o troco antes do resumo', () => {
    let state: SessionState = { ...initialState(), step: 'address', receiverName: 'João', cart: [] };
    let result = send(state, 'Rua A, 10, Bairro, Cidade');
    state = result.state;

    result = send(state, '2'); // dinheiro
    expect(result.state.step).toBe('change_for');
    state = result.state;

    result = send(state, '50');
    expect(result.state.step).toBe('confirm');
    expect(result.state.changeFor).toBe(50);
    expect(result.effect).toEqual({ type: 'request_preview' });
  });

  it('"pular" no troco segue sem precisar de troco', () => {
    const state: SessionState = { ...initialState(), step: 'change_for' };
    const result = send(state, 'pular');
    expect(result.state.step).toBe('confirm');
    expect(result.state.changeFor).toBeNull();
    expect(result.effect).toEqual({ type: 'request_preview' });
  });
});

describe('voltar ao menu e cancelar', () => {
  it('"menu" a partir de qualquer etapa volta pro início preservando o nome', () => {
    const state: SessionState = { ...initialState(), step: 'item', categoryName: 'Pizzas', receiverName: 'Ana' };
    const result = send(state, 'menu');
    expect(result.state.step).toBe('greeting');
    expect(result.state.receiverName).toBe('Ana');
    expect(result.replies[0]).toContain('Bem-vindo');
  });

  it('"0" durante a escolha de categoria volta pro início', () => {
    const state: SessionState = { ...initialState(), step: 'category' };
    const result = send(state, '0');
    expect(result.state.step).toBe('greeting');
  });

  it('"cancelar" esvazia o carrinho e some com o endereço já preenchido', () => {
    const state: SessionState = {
      ...initialState(),
      step: 'payment',
      cart: [{ menuItemId: 'item-1', name: 'Calabresa', quantity: 1, note: null }],
      address: { street: 'Rua A', streetNumber: '1', neighborhood: 'B', city: 'C', complement: null },
    };
    const result = send(state, 'cancelar');
    expect(result.state.step).toBe('greeting');
    expect(result.state.cart).toEqual([]);
    expect(result.state.address).toBeNull();
  });

  it('"atendente" pausa o bot em qualquer etapa', () => {
    const state: SessionState = { ...initialState(), step: 'category' };
    const result = send(state, 'atendente');
    expect(result.effect).toEqual({ type: 'pause_for_agent' });
    // O estado da conversa não é alterado — só o flag de pausa (fora do estado) é setado pelo adapter.
    expect(result.state.step).toBe('category');
  });
});

describe('entradas inválidas', () => {
  it('categoria fora da faixa numerada repete a lista', () => {
    const state: SessionState = { ...initialState(), step: 'category' };
    const result = send(state, '99');
    expect(result.state.step).toBe('category');
    expect(result.replies[0]).toContain('Opção inválida');
  });

  it('texto não numérico na escolha de item repete a lista', () => {
    const state: SessionState = { ...initialState(), step: 'item', categoryName: 'Pizzas' };
    const result = send(state, 'abacate');
    expect(result.state.step).toBe('item');
    expect(result.replies[0]).toContain('Opção inválida');
  });

  it('"0" na quantidade é tratado como comando global (volta ao início)', () => {
    const state: SessionState = { ...initialState(), step: 'quantity', categoryName: 'Pizzas', pendingItemId: 'item-1' };
    expect(send(state, '0').state.step).toBe('greeting');
  });

  it('quantidade negativa, não numérica ou acima do limite é rejeitada', () => {
    const state: SessionState = { ...initialState(), step: 'quantity', categoryName: 'Pizzas', pendingItemId: 'item-1' };
    expect(send(state, '-1').state.step).toBe('quantity');
    expect(send(state, '51').state.step).toBe('quantity');
    expect(send(state, 'abc').state.step).toBe('quantity');
    expect(send(state, '5').state.step).toBe('note');
  });

  it('endereço sem os campos obrigatórios pede de novo', () => {
    const state: SessionState = { ...initialState(), step: 'address' };
    const result = send(state, 'só a rua');
    expect(result.state.step).toBe('address');
    expect(result.replies[0]).toContain('Não entendi o endereço');
  });

  it('opção de pagamento inválida repete a pergunta', () => {
    const state: SessionState = { ...initialState(), step: 'payment' };
    const result = send(state, '9');
    expect(result.state.step).toBe('payment');
    expect(result.replies[0]).toContain('Opção inválida');
  });

  it('resposta que não é S/N na confirmação pede de novo', () => {
    const state: SessionState = { ...initialState(), step: 'confirm' };
    const result = send(state, 'talvez');
    expect(result.state.step).toBe('confirm');
  });

  it('preview com erro do servidor volta pra escolha de pagamento', () => {
    const state: SessionState = { ...initialState(), step: 'confirm', paymentMethod: 'pix_manual' };
    const result = applyPreviewResult(state, { ok: false, error: 'Restaurante fechado.' });
    expect(result.state.step).toBe('payment');
    expect(result.replies[0]).toContain('Restaurante fechado.');
  });
});
