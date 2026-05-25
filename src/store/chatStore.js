import { create } from 'zustand';

const useChatStore = create(set => ({
  open:   false,
  unread: 0,
  setOpen:   (v)  => set({ open: typeof v === 'function' ? v : v }),
  setUnread: (v)  => set({ unread: v }),
}));

export default useChatStore;
