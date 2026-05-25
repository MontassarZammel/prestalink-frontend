import { create } from 'zustand';

const useUiStore = create(set => ({
  promoVisible: localStorage.getItem('promo_dismissed') !== '1',
  setPromoVisible: v => set({ promoVisible: v }),
}));

export default useUiStore;
