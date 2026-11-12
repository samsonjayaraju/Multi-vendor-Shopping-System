export type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Vendor {
  vendorId: number;
  userId: number;
  name: string;
  email: string;
  contactNumber: string;
  description: string;
  location: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  productId: number;
  vendorId: number;
  vendorName: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  createdAt: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  vendorId: number;
  vendorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemStatus: OrderStatus;
}

export interface Order {
  orderId: number;
  userId: number;
  customerName: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

const API_BASE = '';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).join(', ') : null) ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export const api = {
  // Auth & Users
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: ( payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: (token: string) => request<User>('/api/users/me', {}, token),

  // Vendors
  getVendors: () => request<Vendor[]>('/api/vendors'),

  getVendorById: (id: number) => request<Vendor>(`/api/vendors/${id}`),

  getMyVendor: (token: string) => request<Vendor>('/api/vendors/me', {}, token),

  registerVendor: (
    payload: {
      name: string;
      email: string;
      contactNumber: string;
      description: string;
      location: string;
    },
    token: string
  ) =>
    request<Vendor>(
      '/api/vendors',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    ),

  updateVendor: (
    vendorId: number,
    payload: {
      name: string;
      email: string;
      contactNumber: string;
      description: string;
      location: string;
    },
    token: string
  ) =>
    request<Vendor>(
      `/api/vendors/${vendorId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      token
    ),

  // Products
  getProducts: (params?: {
    vendorId?: number | null;
    category?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.vendorId) qs.set('vendorId', String(params.vendorId));
    if (params?.category && params.category !== 'All')
      qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return request<Product[]>(`/api/products${query ? `?${query}` : ''}`);
  },

  getProductsByVendor: (vendorId: number) =>
    request<Product[]>(`/api/products/vendor/${vendorId}`),

  createProduct: (
    payload: {
      vendorId?: number;
      name: string;
      tagline: string;
      description: string;
      category: string;
      price: number;
      stockQuantity: number;
    },
    token: string
  ) =>
    request<Product>(
      '/api/products',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    ),

  updateProduct: (
    productId: number,
    payload: {
      vendorId?: number;
      name: string;
      tagline: string;
      description: string;
      category: string;
      price: number;
      stockQuantity: number;
    },
    token: string
  ) =>
    request<Product>(
      `/api/products/${productId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      token
    ),

  deleteProduct: (productId: number, token: string) =>
    request<void>(
      `/api/products/${productId}`,
      {
        method: 'DELETE',
      },
      token
    ),

  // Orders
  placeOrder: (
    payload: {
      shippingAddress: string;
      items: { productId: number; quantity: number }[];
    },
    token: string
  ) =>
    request<Order>(
      '/api/orders',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    ),

  getMyOrders: (token: string) => request<Order[]>('/api/orders/my', {}, token),

  getOrderById: (orderId: number, token: string) =>
    request<Order>(`/api/orders/${orderId}`, {}, token),

  getVendorOrders: (vendorId: number, token: string) =>
    request<Order[]>(`/api/orders/vendor/${vendorId}`, {}, token),

  updateOrderStatus: (orderId: number, status: OrderStatus, token: string) =>
    request<Order>(
      `/api/orders/${orderId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      },
      token
    ),
};
