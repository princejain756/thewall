// Shared types for the admin panel.

export type Page =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'discounts'
  | 'content'
  | 'analytics';

export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'unfulfilled'
  | 'fulfilled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type DiscountType = 'percentage' | 'fixed' | 'bogo' | 'shipping';
export type ProductType = 'single' | 'bundle' | 'custom';

export type Variant = {
  id?: string;
  size: string;
  price: number; // rupees in the form, paise on the wire
  compareAtPrice?: number | null;
  inventory?: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: ProductStatus;
  images: string[];
  collectionId?: string | null;
  collectionName?: string | null;
  productType?: ProductType;
  tags?: string[];
  featured?: boolean;
  onSale?: boolean;
  variants: Variant[];
  minPrice?: number;
  maxPrice?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderItem = {
  id: string;
  title: string;
  size?: string;
  quantity: number;
  price: number;
  customImage?: string | null;
  customDetails?: {
    format?: string;
    color?: string;
    previewUrl?: string;
  };
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  status: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  items: OrderItem[];
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
};

export type Discount = {
  id: string;
  title: string;
  code?: string | null;
  type: DiscountType;
  value: number;
  minOrder?: number;
  usageLimit?: number | null;
  active?: boolean;
  automatic?: boolean;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  cover?: string;
};

export type DashboardStats = {
  today: {
    sessions: number;
    revenue: number;
    orders: number;
    conversionRate: number;
  };
  totals: {
    products: number;
    customers: number;
    activeDiscounts: number;
    pendingFulfillment: number;
  };
  chartData: Array<{
    date: string;
    sessions: number;
    pageViews: number;
    orders: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    fulfillmentStatus: FulfillmentStatus;
  }>;
};

export type SearchResults = {
  products: Array<{ id: string; title: string; slug: string; collectionName: string | null; status: string }>;
  orders: Array<{ id: string; orderNumber: string; customerName: string | null; total: number; fulfillmentStatus: string }>;
  customers: Array<{ id: string; name: string; email: string; ordersCount: number }>;
  discounts: Array<{ id: string; title: string; code: string | null; type: string; active: boolean }>;
};

export type SearchNavigateTarget = {
  page: Page;
  query?: string;
  orderId?: string;
  productId?: string;
};
