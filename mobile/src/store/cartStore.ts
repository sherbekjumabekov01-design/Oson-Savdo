import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItemsCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product: Product, quantity = 1) => {
    set(state => {
      const existingIndex = state.items.findIndex(it => it.product.id === product.id);

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return { items: updated };
      }

      return {
        items: [...state.items, { product, quantity }]
      };
    });
  },

  updateQuantity: (productId: number, quantity: number) => {
    set(state => {
      if (quantity <= 0) {
        return {
          items: state.items.filter(it => it.product.id !== productId)
        };
      }

      return {
        items: state.items.map(it =>
          it.product.id === productId ? { ...it, quantity } : it
        )
      };
    });
  },

  removeItem: (productId: number) => {
    set(state => ({
      items: state.items.filter(it => it.product.id !== productId)
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalAmount: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0
    );
  },

  getTotalItemsCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  }
}));
