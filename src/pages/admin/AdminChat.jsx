import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Circle, CheckCheck, Search, X, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import useAuthStore from '../../store/authStore';
import { requestPermission, showNotification, playNotifSound } from '../../services/notifications';

const STATUS_CONFIG = {
  open:    { cls: 'adm-badge adm-badge-green',  label: 'Ouvert' },
  closed:  { cls: 'adm-badge adm-badge-gray',   label: 'Fermé' },
  pending: { cls: 'adm-badge adm-badge-amber',  label: 'En attente' },
};

export default function AdminChat() {
  const { user }                  = useAuthStore();
  const [conversations, setConvs] = useState([]);
  const [activeConv, setActive]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [search, setSearch]       = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const messagesEndRef            = useRef(null);
  const typingTimeout             = useRef(null);
  const activeConvRef             = useRef(null);
  const socket                    = getSocket();

  useEffect(() => { requestPermission(); }, []);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  useEffect(() => {
    fetchConversations();

    const joinAdmin = () => {
      socket.emit('admin_join');
      if (activeConv) socket.emit('join_conversation', { conversationId: activeConv.id });
    };

    joinAdmin();
    socket.on('connect', joinAdmin);
    socket.on('new_conversation_message', ({ senderName, message }) => {
      fetchConversations();
      playNotifSound('message');
      showNotification(
        `💬 ${senderName || 'Client'}`,
        message?.content || 'Nouveau message',
        () => window.focus()
      );
    });
    socket.on('new_message', msg => {
      setMessages(prev => {
        const withoutTmp = prev.filter(m => !(String(m.id).startsWith('tmp_') && m.content === msg.content && m.sender_role === msg.sender_role));
        return withoutTmp.find(m => m.id === msg.id) ? withoutTmp : [...withoutTmp, msg];
      });
    });
    socket.on('user_typing', ({ isTyping: t, name }) => {
      if (name !== user?.full_name) setIsTyping(t);
    });

    return () => {
      socket.off('connect', joinAdmin);
      socket.off('new_conversation_message');
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [activeConv]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations/admin?limit=50');
      setConvs(res.data.data || []);
    } catch (e) { console.error('fetchConversations:', e); }
    setLoading(false);
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await api.get(`/conversations/${convId}/messages`);
      const incoming = res.data.data || [];
      setMessages(prev => {
        const realMsgs = incoming;
        const tmpMsgs = prev.filter(m => String(m.id).startsWith('tmp_'));
        const merged = [...realMsgs];
        tmpMsgs.forEach(t => { if (!merged.find(m => m.content === t.content && m.sender_role === t.sender_role)) merged.push(t); });
        return merged;
      });
    } catch (_) {}
  };

  // Polling — fallback garanti si socket ne fonctionne pas
  useEffect(() => {
    const id = setInterval(() => {
      fetchConversations();
      if (activeConvRef.current) fetchMessages(activeConvRef.current.id);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const openConversation = async conv => {
    setActive(conv);
    setMessages([]);
    socket.emit('join_conversation', { conversationId: conv.id });
    await fetchMessages(conv.id);
    fetchConversations();
  };

  const handleSend = () => {
    if (!input.trim() || !activeConv) return;
    const content = input.trim();
    const optimistic = {
      id: `tmp_${Date.now()}`,
      conversation_id: activeConv.id,
      sender_role: 'admin',
      sender_name: user?.full_name || 'Admin',
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    socket.emit('send_message', {
      conversationId: activeConv.id,
      content,
      senderName: user?.full_name || 'Admin',
      senderRole: 'admin',
    });
    setInput('');
  };

  const handleTyping = val => {
    setInput(val);
    if (activeConv) {
      socket.emit('typing', { conversationId: activeConv.id, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing', { conversationId: activeConv.id, isTyping: false });
      }, 1500);
    }
  };

  const closeConversation = async convId => {
    await api.patch(`/conversations/${convId}/status`, { status: 'closed' }).catch(() => {});
    fetchConversations();
    if (activeConv?.id === convId) setActive(prev => ({ ...prev, status: 'closed' }));
  };

  const filtered = conversations.filter(c =>
    !search ||
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border"
      style={{ border: '1px solid var(--adm-border)' }}>

      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        <div className="px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
          <h1 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
            Chat Support
          </h1>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text2)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..." className="adm-input pl-8 w-full text-sm py-2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-adm">
          {loading ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl skeleton-adm" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={28} className="mx-auto mb-3" style={{ color: 'var(--adm-text2)' }} />
              <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucune conversation</p>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive = activeConv?.id === conv.id;
              const sc = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open;
              return (
                <button key={conv.id} onClick={() => openConversation(conv)}
                  className="w-full text-left px-4 py-3.5 border-b transition-all"
                  style={{
                    borderColor: 'var(--adm-border)',
                    background: isActive ? 'var(--adm-surface2)' : '',
                    borderLeft: isActive ? '3px solid #D9A5A5' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold font-display truncate max-w-[140px]" style={{ color: 'var(--adm-text)' }}>
                      {conv.client_name}
                    </span>
                    <span className={sc.cls + ' text-[10px]'}>
                      <Circle size={5} fill="currentColor" className="inline mr-1" />
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-xs truncate mb-1.5" style={{ color: 'var(--adm-text2)' }}>{conv.subject || 'Sans sujet'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                      {format(new Date(conv.last_message_at), 'dd MMM HH:mm', { locale: fr })}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col" style={{ background: 'var(--adm-bg)' }}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
                <MessageCircle size={26} style={{ color: '#E8DCD5' }} />
              </div>
              <p className="font-display text-lg font-bold mb-2" style={{ color: 'var(--adm-text)' }}>Sélectionnez une conversation</p>
              <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>pour commencer à répondre</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
              <div>
                <p className="font-semibold font-display" style={{ color: 'var(--adm-text)' }}>{activeConv.client_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text2)' }}>
                  {activeConv.client_email} · {activeConv.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={(STATUS_CONFIG[activeConv.status] || STATUS_CONFIG.open).cls}>
                  {(STATUS_CONFIG[activeConv.status] || STATUS_CONFIG.open).label}
                </span>
                {activeConv.status !== 'closed' && (
                  <button onClick={() => closeConversation(activeConv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-display transition-all border"
                    style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <X size={11} /> Clore
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-adm">
              {messages.map(msg => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isAdmin && (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold"
                        style={{ background: 'var(--adm-surface2)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}>
                        {msg.sender_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-sm flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                      {!isAdmin && (
                        <span className="text-xs px-1 font-display" style={{ color: 'var(--adm-text2)' }}>{msg.sender_name}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isAdmin
                          ? 'rounded-tr-sm text-white'
                          : 'rounded-tl-sm'
                      }`}
                        style={isAdmin
                          ? { background: 'linear-gradient(135deg,#D9A5A5,#F43F5E)' }
                          : { background: 'var(--adm-surface)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }
                        }>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 px-1" style={{ color: 'var(--adm-text2)' }}>
                        <span className="text-xs">{format(new Date(msg.created_at), 'HH:mm')}</span>
                        {isAdmin && <CheckCheck size={11} className={msg.is_read ? 'text-primary-400' : ''} />}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: 'linear-gradient(135deg,#D9A5A5,#E8DCD5)' }}>
                        <Zap size={13} className="text-white" fill="currentColor" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--adm-surface2)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}>
                    {activeConv.client_name?.[0]}
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5"
                    style={{ background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}>
                    {[0, 0.2, 0.4].map(d => (
                      <motion.div key={d} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--adm-text2)' }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {activeConv.status !== 'closed' ? (
              <div className="px-6 py-4 border-t flex-shrink-0"
                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="flex gap-3 items-end">
                  <textarea value={input} onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Répondre au client..." rows={1}
                    className="flex-1 adm-input resize-none py-3 text-sm min-h-[44px] max-h-28"
                    aria-label="Réponse" />
                  <button onClick={handleSend} disabled={!input.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#D9A5A5,#F43F5E)' }}
                    aria-label="Envoyer">
                    <Send size={15} className="text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 border-t text-center text-sm"
                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text2)' }}>
                Cette conversation est clôturée
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
