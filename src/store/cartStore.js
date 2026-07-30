import { create } from "zustand";

const CART_KEY = "cm_cart";

const loadCart = () => {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY)) || []; } catch { return []; }
};

const saveCart = (items) => {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const useCartStore = create((set, get) => ({
  items: loadCart(),

  // item shape: { product_id, variant_id, name, price, image, vendor_id, vendor_name, quantity }
  addItem: (item) => {
    const items = get().items;
    const key = `${item.product_id}_${item.variant_id || ""}`;
    const existing = items.find(
      (i) => `${i.product_id}_${i.variant_id || ""}` === key
    );
    const next = existing
      ? items.map((i) =>
          `${i.product_id}_${i.variant_id || ""}` === key
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      : [...items, { ...item, quantity: item.quantity || 1 }];
    saveCart(next);
    set({ items: next });
  },

  removeItem: (product_id, variant_id) => {
    const key = `${product_id}_${variant_id || ""}`;
    const next = get().items.filter(
      (i) => `${i.product_id}_${i.variant_id || ""}` !== key
    );
    saveCart(next);
    set({ items: next });
  },

  updateQuantity: (product_id, variant_id, quantity) => {
    const key = `${product_id}_${variant_id || ""}`;
    if (quantity <= 0) { get().removeItem(product_id, variant_id); return; }
    const next = get().items.map((i) =>
      `${i.product_id}_${i.variant_id || ""}` === key ? { ...i, quantity } : i
    );
    saveCart(next);
    set({ items: next });
  },

  clearCart: () => {
    sessionStorage.removeItem(CART_KEY);
    set({ items: [] });
  },

  // Derived
  totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),

  // Group items by vendor for sub-order creation
  itemsByVendor: () => {
    const groups = {};
    for (const item of get().items) {
      if (!groups[item.vendor_id]) {
        groups[item.vendor_id] = { vendor_id: item.vendor_id, vendor_name: item.vendor_name, items: [] };
      }
      groups[item.vendor_id].items.push(item);
    }
    return Object.values(groups);
  },

  // Format for POST /api/sub-orders/create
  toOrderPayload: () =>
    get().items.map(({ product_id, variant_id, quantity }) => ({
      product_id,
      ...(variant_id ? { variant_id } : {}),
      quantity,
    })),
}));
