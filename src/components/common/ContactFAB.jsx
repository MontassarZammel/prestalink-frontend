import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ChevronRight, Zap } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import api from '../../services/api';

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ContactFAB() {
  const { isAuthenticated, user } = useAuthStore();
  const { open: chatOpen, setOpen: setChatOpen, unread } = useChatStore();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(null);

  useEffect(() => {
    api.get('/settings').then(r => {
      const num = r.data.data?.whatsapp_number;
      if (num) setPhone(num.replace(/\D/g, ''));
    }).catch(() => {});
  }, []);

  if (!isAuthenticated || user?.role === 'admin') return null;

  const firstName = user?.full_name?.split(' ')[0] || '';

  const openWhatsApp = () => {
    setOpen(false);
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent("Bonjour, j'ai une question concernant MyWedding.")}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const openChat = () => {
    setOpen(false);
    setChatOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[502]">

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[-1]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="absolute bottom-20 right-0 w-80 rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>

              {/* Header gradient */}
              <div className="px-5 pt-5 pb-6"
                style={{ background: 'linear-gradient(135deg, #C48C8C 0%, #D9A5A5 100%)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <Zap size={18} fill="white" color="white" />
                  </div>
                  <button onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                    style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <X size={14} />
                  </button>
                </div>
                <p className="font-display font-bold text-lg leading-tight" style={{ color: '#1a1208' }}>
                  Bonjour {firstName} 👋
                </p>
                <p className="text-sm mt-1 opacity-70" style={{ color: '#1a1208' }}>
                  Comment pouvons-nous vous aider ?
                </p>
              </div>

              {/* Options */}
              <div className="p-3 space-y-2">

                {/* Chat */}
                <motion.button
                  onClick={openChat}
                  whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors group"
                  style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(217,165,165,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C48C8C, #D9A5A5)' }}>
                    <MessageCircle size={18} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      Chat en direct
                    </p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Réponse en quelques minutes
                    </p>
                  </div>
                  {unread > 0 ? (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: '#10B981' }}>{unread}</span>
                  ) : (
                    <ChevronRight size={16} className="flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text)' }} />
                  )}
                </motion.button>

                {/* WhatsApp */}
                {phone && (
                  <motion.button
                    onClick={openWhatsApp}
                    whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors group"
                    style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(37,211,102,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#25D366' }}>
                      <WaIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>
                        WhatsApp
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        Discutez directement avec nous
                      </p>
                    </div>
                    <ChevronRight size={16} className="flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text)' }} />
                  </motion.button>
                )}
              </div>

              <p className="text-center text-[10px] pb-3" style={{ color: 'var(--text-3)' }}>
                MyWedding · Support
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-dark-lg"
        style={{
          background: open ? 'var(--s3)' : 'linear-gradient(135deg, #C48C8C, #D9A5A5)',
          border: '1px solid var(--border-2)',
          boxShadow: open ? undefined : '0 8px 32px rgba(217,165,165,0.45)',
        }}>
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={22} style={{ color: 'var(--text-2)' }} />
              </motion.span>
            : <motion.span key="msg"  initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle size={22} style={{ color: 'var(--text)' }} />
              </motion.span>
          }
        </AnimatePresence>

        <AnimatePresence>
          {unread > 0 && !chatOpen && !open && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: '#10B981' }}>
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
