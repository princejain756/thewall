export type CartItem = {
  productId: string;
  variantId: string;
  title: string;
  slug: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
  customImage?: string;
  format?: string;
  color?: string;
  customText?: string;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  comboLabel: string | null;
  freeShipping: boolean;
};

export const COMBO_TIERS = [
  { minQty: 36, payFor: 10, label: 'Buy 10 Get 26 Free' },
  { minQty: 18, payFor: 6, label: 'Buy 6 Get 12 Free' },
  { minQty: 10, payFor: 5, label: 'Buy 5 Get 5 Free' },
  { minQty: 7, payFor: 4, label: 'Buy 4 Get 3 Free' },
] as const;

export const SHIPPING_COD = 4900;
export const FREE_SHIPPING_PREPAID = true;

export function calculateCartTotals(
  items: CartItem[],
  paymentMethod: 'prepaid' | 'cod' = 'prepaid',
): CartTotals {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let discount = 0;
  let comboLabel: string | null = null;

  for (const tier of COMBO_TIERS) {
    if (itemCount >= tier.minQty) {
      const payRatio = tier.payFor / tier.minQty;
      discount = Math.round(subtotal * (1 - payRatio));
      comboLabel = tier.label;
      break;
    }
  }

  const afterDiscount = subtotal - discount;
  const freeShipping = paymentMethod === 'prepaid' && FREE_SHIPPING_PREPAID;
  const shipping = freeShipping ? 0 : SHIPPING_COD;
  const total = afterDiscount + shipping;

  return { subtotal, discount, shipping, total, itemCount, comboLabel, freeShipping };
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID || null;
}
