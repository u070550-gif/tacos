export type UserRole = 'admin' | 'principal' | 'usuario';

export interface MenuItem {
  id: string;
  name: string;
  category: 'taco' | 'bebida';
  price: number;
  description: string;
  image?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number; // in grams or units
  unit: string; // 'g', 'kg', 'pza', 'L'
  minLimit: number; // for alerts
}

export interface AuthorizedUser {
  email: string;
  name: string;
  registeredAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  category: 'taco' | 'bebida';
}

export interface Order {
  id: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  delivery: boolean;
  address: string;
  paymentMethod?: string;
  status: 'pending' | 'preparing' | 'in_route' | 'delivered' | 'cancelled';
  createdAt: string;
  cancelledBy?: 'usuario' | 'principal' | 'admin';
  notes?: string;
}

export interface AuthRequest {
  id: string;
  requestedBy: 'principal';
  type: 'price_change' | 'inventory_restock' | 'menu_add';
  description: string;
  payload: any; // data to apply if approved
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
