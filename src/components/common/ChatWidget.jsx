import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Zap, Minimize2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { requestPermission, showNotification, playNotifSound } from '../../services/notifications';
import useAuthStore from '../../store/authStore';
import { useLocation } from 'react-router-dom';

const getSessionId = () => {
  let sid = localStorage.getItem('mywedding-session');
  if (!sid) { sid = uuidv4(); localStorage.setItem('mywedding-session', sid); }
  return sid;
};

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState('form');
  const [conversation, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm]         = useState({ client_name: '', client_email: '', subject: '' });
  const [unread, setUnread]     = useState(0);

  const { user, isAuthenticated } = useAuthStore();
  const endRef         = useRef(null);
  const typingTimeout  = useRef(null);
  const prevUnread     = useRef(0);
  const socket         = getSocket();
  const location       = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  useEffect(() => { requestPermission(); }, []);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, client_name: user.full_name || '', client_email: user.email || '' }));
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      // Logged-in user: skip form, go straight to chat
      setStep('chat');
      // Try to load existing conversation (by client_id or session_id)
      api.get('/conversations').then(r => {
        if (r.data.data?.length > 0) openConv(r.data.data[0]);
      }).catch(() => {});
      // Also check visitor session in case conversation was created before login
      api.get(`/conversations?session_id=${getSessionId()}`).then(r => {
        if (r.data.data?.length > 0) openConv(r.data.data[0]);
      }).catch(() => {});
    } else {
      api.get(`/conversations?session_id=${getSessionId()}`).then(r => {
        if (r.data.data?.length > 0) openConv(r.data.data[0]);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const onMsg = msg => {
      setMessages(prev => {
        const withoutTmp = prev.filter(m => !(String(m.id).startsWith('tmp_') && m.content === msg.content && m.sender_role === msg.sender_role));
        return withoutTmp.find(m => m.id === msg.id) ? withoutTmp : [...withoutTmp, msg];
      });
      if (msg.sender_role === 'admin') {
        playNotifSound('reply');
        if (!open) {
          setUnread(n => n + 1);
          showNotification('💬 MyWedding', msg.content || 'Nouvelle réponse du support');
        }
      }
    };
    const onTyping = ({ isTyping: t, name }) => {
      if (name !== (user?.full_name || 'Vous')) setIsTyping(t);
    };
    const onConnect = () => {
      // Re-join room after reconnect
      setConv(prev => {
        if (prev) socket.emit('join_conversation', { conversationId: prev.id, sessionId: getSessionId() });
        return prev;
      });
    };
    socket.on('connect', onConnect);
    socket.on('new_message', onMsg);
    socket.on('user_typing', onTyping);
    return () => {
      socket.off('connect', onConnect);
      socket.off('new_message', onMsg);
      socket.off('user_typing', onTyping);
    };
  }, [socket, user, open]);

  // Poll server for unread admin messages (reliable badge, works even when socket misses events)
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = () => {
      if (open) return; // widget is open, no badge needed
      api.get('/conversations/client-unread').then(r => {
        const count = r.data.count || 0;
        if (count > prevUnread.current) {
          playNotifSound('reply');
          showNotification('💬 MyWedding Support', 'Vous avez une nouvelle réponse du support', () => setOpen(true));
        }
        prevUnread.current = count;
        setUnread(count);
      }).catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 5000);
    return () => clearInterval(id);
  }, [isAuthenticated, open]);

  useEffect(() => {
    if (open) { setUnread(0); prevUnread.current = 0; }
  }, [open]);

  const openConv = async conv => {
    setConv(conv);
    setStep('chat');
    const res = await api.get(`/conversations/${conv.id}/messages`).catch(() => ({ data: { data: [] } }));
    setMessages(res.data.data || []);
    socket.emit('join_conversation', { conversationId: conv.id, sessionId: getSessionId() });
  };

  const handleStart = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/conversations', {
        ...form,
        visitor_session_id: isAuthenticated ? null : getSessionId(),
      });
      await openConv(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    const senderName = isAuthenticated ? user?.full_name : form.client_name;
    const senderRole = isAuthenticated ? (user?.role || 'client') : 'visitor';

    let conv = conversation;

    // Create conversation automatically if none exists (authenticated user)
    if (!conv && isAuthenticated) {
      try {
        const res = await api.post('/conversations', {
          client_name: user.full_name,
          client_email: user.email,
          subject: 'Nouvelle conversation',
          visitor_session_id: null,
        });
        conv = res.data.data;
        setConv(conv);
        socket.emit('join_conversation', { conversationId: conv.id, sessionId: getSessionId() });
      } catch (_) { return; }
    }

    if (!conv) return;

    const optimistic = {
      id: `tmp_${Date.now()}`,
      conversation_id: conv.id,
      sender_role: senderRole,
      sender_name: senderName,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    socket.emit('send_message', {
      conversationId: conv.id,
      content,
      senderName,
      senderRole,
    });
    setInput('');
  };

  const handleTyping = val => {
    setInput(val);
    if (conversation) {
      socket.emit('typing', { conversationId: conversation.id, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => socket.emit('typing', { conversationId: conversation.id, isTyping: false }), 1500);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[340px] sm:w-[360px] rounded-3xl overflow-hidden shadow-dark-lg flex flex-col"
            style={{ height: '520px', background: 'var(--s2)', border: '1px solid var(--border-2)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C48C8C, #D9A5A5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(196,140,140,0.12)' }}>
                  <Zap size={16} style={{ color: 'var(--text)' }} fill="currentColor" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#10B981', border: '2px solid #C48C8C' }} />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>Support MyWedding</p>
                <p className="text-xs" style={{ color: 'rgba(26,18,8,0.45)' }}>En ligne — répond rapidement</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-black/10"
                style={{ color: 'rgba(26,18,8,0.45)' }}>
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {!isAuthenticated ? (
                <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
                    <LogIn size={24} style={{ color: '#E8DCD5' }} />
                  </div>
                  <p className="font-display font-bold text-base mb-2" style={{ color: 'var(--text)' }}>
                    Connexion requise
                  </p>
                  <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
                    Connectez-vous à votre compte pour discuter avec notre équipe support.
                  </p>
                  <Link to="/login" onClick={() => setOpen(false)}
                    className="btn btn-primary w-full gap-2">
                    <LogIn size={14} /> Se connecter
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}
                    className="btn btn-outline w-full gap-2 mt-2 text-xs">
                    Créer un compte
                  </Link>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col min-h-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-thin">
                    {messages.length === 0 && (
                      <div className="text-center py-8 px-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                          style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
                          <Zap size={16} style={{ color: '#E8DCD5' }} fill="currentColor" />
                        </div>
                        <p className="text-xs font-semibold mb-1 font-display" style={{ color: 'var(--text)' }}>Bonjour {user?.full_name?.split(' ')[0] || ''} 👋</p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Écrivez-nous, on répond rapidement !</p>
                      </div>
                    )}
                    {messages.map(msg => {
                      const isMe = msg.sender_role !== 'admin';
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                          {!isMe && (
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                              style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                              <Zap size={10} style={{ color: 'var(--text)' }} fill="currentColor" />
                            </div>
                          )}
                          <div className={`max-w-[220px] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="px-3 py-2 rounded-xl text-xs leading-relaxed"
                              style={isMe
                                ? { background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', color: 'var(--text)', fontWeight: 600, borderRadius: '12px 12px 3px 12px' }
                                : { background: 'rgba(217,165,165,0.07)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '3px 12px 12px 12px' }}>
                              {msg.content}
                            </div>
                            <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                              {new Date(msg.created_at).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                          <Zap size={10} style={{ color: 'var(--text)' }} fill="currentColor" />
                        </div>
                        <div className="px-3 py-2 rounded-xl flex gap-1"
                          style={{ background: 'rgba(217,165,165,0.07)', border: '1px solid var(--border)' }}>
                          {[0, 0.2, 0.4].map(d => (
                            <motion.div key={d} animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 0.7, delay: d, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-2)' }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Input */}
                  <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex gap-2 items-end">
                      <textarea value={input} onChange={e => handleTyping(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Écrivez un message..." rows={1}
                        className="flex-1 input resize-none py-2.5 text-xs min-h-[38px] max-h-24"
                        aria-label="Message" />
                      <button onClick={handleSend} disabled={!input.trim()}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                        <Send size={13} style={{ color: 'var(--text)' }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-dark-lg transition-all"
        style={{
          background: open ? 'var(--s3)' : 'linear-gradient(135deg, #C48C8C, #D9A5A5)',
          border: '1px solid var(--border-2)',
          boxShadow: open ? undefined : '0 8px 32px rgba(217,165,165,0.45)',
        }}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}>
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={20} style={{ color: 'var(--text-2)' }} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} style={{ color: 'var(--text)' }} />
            </motion.span>
          )}
        </AnimatePresence>
        {unread > 0 && !open && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: '#10B981' }}>
            {unread}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
