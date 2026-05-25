import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(persist(
  (set, get) => ({
    cart: [],
    addProvider:    (provider) => {
      if (!get().cart.some(p => p.id === provider.id))
        set(s => ({ cart: [...s.cart, provider] }));
    },
    removeProvider: (id) => set(s => ({ cart: s.cart.filter(p => p.id !== id) })),
    clearCart:      ()   => set({ cart: [] }),
    isInCart:       (id) => get().cart.some(p => p.id === id),
  }),
  { name: 'mywedding-cart' }
));

export default useCartStore;
