import { MenuItem, Ingredient, AuthorizedUser, Order } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 't-pastor',
    name: 'Taco al Pastor',
    category: 'taco',
    price: 15.00,
    description: 'Carne de cerdo marinada en adobo secreto, servida con cilantro, cebolla y un trozo piña dulce, en tortilla de maíz caliente.'
  },
  {
    id: 't-asada',
    name: 'Taco de Asada',
    category: 'taco',
    price: 18.00,
    description: 'Corte de res marinado, asado al carbón y picado finamente, servido con cilantro y cebolla en doble tortilla.'
  },
  {
    id: 't-cabeza',
    name: 'Taco de Cabeza',
    category: 'taco',
    price: 16.00,
    description: 'Carne de res al vapor de cocción lenta extremadamente suave y jugosa.'
  },
  {
    id: 't-campechano',
    name: 'Taco Campechano',
    category: 'taco',
    price: 17.50,
    description: 'La combinación perfecta de asada, chorizo y chicharrón crujiente picado al momento.'
  },
  {
    id: 't-tripa',
    name: 'Taco de Tripa',
    category: 'taco',
    price: 20.00,
    description: 'Tripa de res bien dorada al comal, crocante por fuera y suave por dentro.'
  },
  {
    id: 'b-coca',
    name: 'Coca-Cola Mexicana',
    category: 'bebida',
    price: 22.00,
    description: 'Botella de vidrio de 355ml bien fría, endulzada con azúcar de caña pura.'
  },
  {
    id: 'b-jarrito',
    name: 'Jarrito de Mandarina',
    category: 'bebida',
    price: 18.00,
    description: 'Refresco clásico mexicano sabor mandarina, refrescante y bien helado.'
  },
  {
    id: 'b-horchata',
    name: 'Agua de Horchata Grande',
    category: 'bebida',
    price: 25.00,
    description: 'Agua fresca artesanal de 1L hecha en casa con arroz molido, leche evaporada y canela.'
  },
  {
    id: 'b-jamaica',
    name: 'Agua de Jamaica Grande',
    category: 'bebida',
    price: 25.00,
    description: 'Agua fresca de 1L elaborada 100% de flores de jamaica naturales y un toque justo de azúcar.'
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i-pastor', name: 'Carne al Pastor adobada', quantity: 15200, unit: 'g', minLimit: 3000 },
  { id: 'i-asada', name: 'Bistec de Asada', quantity: 12500, unit: 'g', minLimit: 3000 },
  { id: 'i-tripa', name: 'Tripa de Res limpia', quantity: 6000, unit: 'g', minLimit: 1500 },
  { id: 'i-chorizo', name: 'Chorizo de la casa', quantity: 8000, unit: 'g', minLimit: 2000 },
  { id: 'i-chicharron', name: 'Chicharrón de cerdo', quantity: 3000, unit: 'g', minLimit: 500 },
  { id: 'i-tortilla', name: 'Tortillas de Maíz Taqueras', quantity: 850, unit: 'pza', minLimit: 150 },
  { id: 'i-cebolla', name: 'Cebolla picada fina', quantity: 9500, unit: 'g', minLimit: 2000 },
  { id: 'i-cilantro', name: 'Cilantro picado fresco', quantity: 7200, unit: 'g', minLimit: 1500 },
  { id: 'i-pina', name: 'Piña miel picada', quantity: 4500, unit: 'g', minLimit: 1000 },
  { id: 'i-limon', name: 'Limones partidos', quantity: 380, unit: 'pza', minLimit: 80 },
  { id: 'i-s-roja', name: 'Salsa Roja Especial', quantity: 12000, unit: 'ml', minLimit: 3000 },
  { id: 'i-s-verde', name: 'Salsa Verde de Aguacate', quantity: 14000, unit: 'ml', minLimit: 3000 },
  { id: 'i-b-coca', name: 'Coca-Cola de Vidrio (Stock)', quantity: 48, unit: 'pza', minLimit: 12 },
  { id: 'i-b-jarrito', name: 'Jarritos en bodega', quantity: 36, unit: 'pza', minLimit: 10 },
  { id: 'i-b-horchata', name: 'Concentrado natural de Horchata', quantity: 15, unit: 'L', minLimit: 4 },
  { id: 'i-b-jamaica', name: 'Concentrado destilado de Jamaica', quantity: 12, unit: 'L', minLimit: 3 }
];

export const INITIAL_USERS: AuthorizedUser[] = [
  { email: 'u070550@cetis7.edu.mx', name: 'Juan Pérez (Cetis 7)', registeredAt: '2026-05-18T14:30:00Z' },
  { email: 'cliente@buensabor.com', name: 'Eduardo Mendoza', registeredAt: '2026-05-19T09:12:00Z' },
  { email: 'maria@gmail.com', name: 'María Gómez Ramírez', registeredAt: '2026-05-20T10:00:00Z' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    customerEmail: 'u070550@cetis7.edu.mx',
    items: [
      { menuItemId: 't-pastor', name: 'Taco al Pastor', quantity: 5, price: 15.00, category: 'taco' },
      { menuItemId: 't-campechano', name: 'Taco Campechano', quantity: 3, price: 17.50, category: 'taco' },
      { menuItemId: 'b-horchata', name: 'Agua de Horchata Grande', quantity: 1, price: 25.00, category: 'bebida' }
    ],
    total: 152.50,
    delivery: true,
    address: 'Av. Hidalgo #120, Col. Centro, Villahermosa',
    paymentMethod: 'Efectivo',
    status: 'delivered',
    createdAt: '2026-05-19T20:15:00Z'
  },
  {
    id: 'ORD-102',
    customerEmail: 'cliente@buensabor.com',
    items: [
      { menuItemId: 't-asada', name: 'Taco de Asada', quantity: 4, price: 18.00, category: 'taco' },
      { menuItemId: 'b-coca', name: 'Coca-Cola Mexicana', quantity: 2, price: 22.00, category: 'bebida' }
    ],
    total: 116.00,
    delivery: false,
    address: '',
    paymentMethod: 'Tarjeta (Terminal)',
    status: 'preparing',
    createdAt: '2026-05-20T14:50:00Z'
  },
  {
    id: 'ORD-103',
    customerEmail: 'maria@gmail.com',
    items: [
      { menuItemId: 't-tripa', name: 'Taco de Tripa', quantity: 6, price: 20.00, category: 'taco' },
      { menuItemId: 'b-jamaica', name: 'Agua de Jamaica Grande', quantity: 2, price: 25.00, category: 'bebida' }
    ],
    total: 170.00,
    delivery: true,
    address: 'Calle Reforma #505, Int. 3B, Col. Del Carmen',
    paymentMethod: 'Transferencia Spei',
    status: 'pending',
    createdAt: '2026-05-20T15:05:00Z'
  }
];
