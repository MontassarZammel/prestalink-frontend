import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>{label}</label>
    {children}
  </div>
);

export default function ChatPage() {
  const { promoVisible } = useUiStore();
  const pt = 64 + (promoVisible ? 36 : 0) + 16;
  const { user, isAuthenticated }   = useAuthStore();
  const [step, setStep]             = useState('form');
  const [conversation, setConv]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({
    client_name: user?.full_name || '',
    client_email: user?.email || '',
    subject: '',
  });
  const endRef        = useRef(null);
  const typingTimeout = useRef(null);
  const socket        = getSocket();

  const getSessionId = () => {
    let sid = localStorage.getItem('mywedding-session');
    if (!sid) { sid = uuidv4(); localStorage.setItem('mywedding-session', sid); }
    return sid;
  };

  useEffect(() => {
    const fn = isAuthenticated
      ? () => api.get('/conversations').then(r => { if (r.data.data?.length > 0) openConv(r.data.data[0]); })
      : () => api.get(`/conversations?session_id=${getSessionId()}`).then(r => { if (r.data.data?.length > 0) openConv(r.data.data[0]); });
    fn().catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    socket.on('new_message', msg => setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    socket.on('user_typing', ({ isTyping: t, name }) => { if (name !== (user?.full_name || 'Vous')) setIsTyping(t); });
    return () => { socket.off('new_message'); socket.off('user_typing'); };
  }, [socket, user]);

  const openConv = async conv => {
    setConv(conv);
    setStep('chat');
    const res = await api.get(`/conversations/${conv.id}/messages`).catch(() => ({ data: { data: [] } }));
    setMessages(res.data.data || []);
    socket.emit('join_conversation', { conversationId: conv.id, sessionId: getSessionId() });
  };

  const handleStartChat = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/conversations', { ...form, visitor_session_id: isAuthenticated ? null : getSessionId() });
      await openConv(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim() || !conversation) return;
    socket.emit('send_message', {
      conversationId: conversation.id,
      content: input.trim(),
      senderName: isAuthenticated ? user?.full_name : form.client_name,
      senderRole: isAuthenticated ? (user?.role || 'client') : 'visitor',
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
    <>
      <SEO title="Chat Support" description="Contactez notre équipe via le chat en direct." />

      <div className="min-h-screen pb-10 px-4 flex items-center justify-center relative"
        style={{ background: 'var(--bg)', paddingTop: pt }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,165,165,0.1), transparent 65%)', filter: 'blur(60px)' }} />
        </div>

        <div className="relative w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
              <MessageCircle size={24} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Chat Support</h1>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Notre équipe vous répond rapidement</p>
          </div>

          {/* Container */}
          <div className="rounded-3xl overflow-hidden" style={{ height: '560px', background: 'var(--s2)', border: '1px solid var(--border-2)' }}>
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col justify-center p-8">
                  <h2 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Démarrer une conversation</h2>
                  <form onSubmit={handleStartChat} className="space-y-4">
                    <Field label="Nom complet *">
                      <input type="text" value={form.client_name}
                        onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                        className="input w-full" placeholder="Votre nom" required disabled={isAuthenticated} />
                    </Field>
                    <Field label="Email *">
                      <input type="email" value={form.client_email}
                        onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                        className="input w-full" placeholder="email@exemple.com" required disabled={isAuthenticated} />
                    </Field>
                    <Field label="Sujet">
                      <input type="text" value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="input w-full" placeholder="Question sur un prestataire..." />
                    </Field>
                    <button type="submit" disabled={loading}
                      className="btn btn-primary w-full btn-lg gap-2 mt-2">
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                        : <><MessageCircle size={15} /> Démarrer le chat</>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                        <Zap size={16} fill="currentColor" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ background: '#10B981', borderColor: 'var(--s2)' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold font-display" style={{ color: 'var(--text)' }}>Support MyWedding</p>
                      <p className="text-xs" style={{ color: '#34D399' }}>En ligne</p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,220,150,0.06)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                      #{conversation?.id}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-thin">
                    {messages.length === 0 && (
                      <div className="text-center py-10">
                        <MessageCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Envoyez votre premier message !</p>
                      </div>
                    )}
                    {messages.map(msg => {
                      const isMe = msg.sender_role !== 'admin';
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1"
                              style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                              <Zap size={11} fill="currentColor" />
                            </div>
                          )}
                          <div className={`max-w-xs md:max-w-sm flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                              style={isMe
                                ? { background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 4px 16px' }
                                : { background: 'rgba(255,220,150,0.07)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px' }}>
                              {msg.content}
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {new Date(msg.created_at).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                          <Zap size={11} className="text-white" fill="currentColor" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl flex gap-1.5" style={{ background: 'rgba(255,220,150,0.07)', border: '1px solid var(--border)' }}>
                          {[0, 0.2, 0.4].map(d => (
                            <motion.div key={d} animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-2)' }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex gap-2 items-end">
                      <textarea value={input} onChange={e => handleTyping(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Écrivez votre message..." rows={1}
                        className="flex-1 input resize-none py-3 text-sm min-h-[44px] max-h-28"
                        aria-label="Message" />
                      <button onClick={handleSend} disabled={!input.trim()}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                        <Send size={15} className="text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
