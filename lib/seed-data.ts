import type { Restaurant } from './types';

// Dados usados quando o Supabase ainda não foi configurado (ver README.md)
// ou quando a consulta ao banco falha, para o app continuar navegável.
export const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'seed-1',
    name: 'Pizzaria Nostra',
    category: 'pizza',
    rating: 4.9,
    deliveryTime: '20-30 min',
    deliveryFee: 5.0,
    image: '/unnamed.png',
    menu: [
      {
        id: 'seed-1-1',
        name: 'Pizza Calabresa',
        price: 35.0,
        description: 'Calabresa, cebola e azeitona.',
        image: '/1.png',
      },
      {
        id: 'seed-1-2',
        name: 'Pizza Margherita',
        price: 40.0,
        description: 'Tomate, mussarela e manjericão.',
        image: '/2.png',
      },
    ],
  },
  {
    id: 'seed-2',
    name: 'Lanchonete Express',
    category: 'lanches',
    rating: 4.7,
    deliveryTime: '15-25 min',
    deliveryFee: 0.0,
    image: '/express.png',
    menu: [
      {
        id: 'seed-2-1',
        name: 'X-Bacon',
        price: 20.0,
        description: 'Hambúrguer, bacon, queijo e salada.',
        image: '/express.png',
      },
      {
        id: 'seed-2-2',
        name: 'Cachorro-Quente',
        price: 15.0,
        description: 'Salsicha, pão e molho.',
        image: '/express.png',
      },
    ],
  },
  {
    id: 'seed-3',
    name: 'Comida Japonesa Kori',
    category: 'japonesa',
    rating: 4.6,
    deliveryTime: '35-45 min',
    deliveryFee: 8.0,
    image: '/kori.png',
    menu: [
      {
        id: 'seed-3-1',
        name: 'Combinado Sushi',
        price: 85.0,
        description: '20 peças de sushi e sashimi.',
        image: '/kori.png',
      },
      {
        id: 'seed-3-2',
        name: 'Temaki Salmão',
        price: 25.0,
        description: 'Cone de arroz com salmão e cream cheese.',
        image: '/kori.png',
      },
    ],
  },
  {
    id: 'seed-4',
    name: 'Bar do Dedé',
    category: 'brasileira',
    rating: 4.8,
    deliveryTime: '35-45 min',
    deliveryFee: 15.0,
    image: '/unnamed (1).png',
    menu: [
      {
        id: 'seed-4-1',
        name: 'Bisteca acompanhada',
        price: 15.0,
        description: 'Prato completo com bisteca.',
        image: '/unnamed (1).png',
      },
      {
        id: 'seed-4-2',
        name: 'Lasanha',
        price: 25.0,
        description: 'Prato acompanhado com lasanha.',
        image: '/unnamed (1).png',
      },
    ],
  },
];
