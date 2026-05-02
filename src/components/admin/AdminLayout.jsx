import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, FileText, MessageCircle, Settings, LogOut, Menu, X, ExternalLink, Bell, Tag, Zap } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { requestPermission, showNotification, playNotifSound } from '../../services/notifications';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/admin',             exact: true },
  { icon: Users,           label: 'Prestataires', to: '/admin/prestataires' },
  { icon: Tag,             label: 'Catégories',   to: '/admin/categories' },
  { icon: FileText,        label: 'Devis',        to: '/admin/devis' },
  { icon: MessageCircle,   label: 'Chat',         to: '/admin/chat',        badge: true },
  { icon: Settings,        label: 'Paramètres',   to: '/admin/parametres' },
];

export default function AdminLayout() {
  const { user, logout }            = useAuthStore();
  const location                    = useLocation();
  const navigate                    = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread]         = useState(0);
  const prevUnread                  = useRef(0);

  useEffect(() => { requestPermission(); }, []);

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/conversations/unread').then(r => {
        const count = r.data.count || 0;
        if (count > prevUnread.current) {
          playNotifSound('message');
          showNotification(
            '💬 Nouveau message client',
            `${count - prevUnread.current} nouveau${count - prevUnread.current > 1 ? 'x' : ''} message${count - prevUnread.current > 1 ? 's' : ''} non lu${count - prevUnread.current > 1 ? 's' : ''}`,
            () => navigate('/admin/chat')
          );
        }
        prevUnread.current = count;
        setUnread(count);
      }).catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 5000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = item =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  const currentLabel = NAV_ITEMS.find(n => isActive(n))?.label || 'Admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--adm-border)' }}>
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="MyWedding">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #C48C8C, #D9A5A5)' }}>
            <Zap size={14} className="text-white" fill="currentColor" />
          </div>
          <div>
            <span className="font-display font-bold text-base" style={{ color: 'var(--adm-text)' }}>
              My<span className="text-primary-400">Wedding</span>
            </span>
            <p className="text-xs" style={{ color: 'var(--adm-text2)', marginTop: -2 }}>Administration</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Navigation administration">
        {NAV_ITEMS.map(item => {
          const active = isActive(item);
          return (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all font-display ${
                active
                  ? 'text-white shadow-primary'
                  : 'hover:bg-white/5'
              }`}
              style={{
                background: active ? 'linear-gradient(135deg, #C48C8C, #D9A5A5)' : '',
                color: active ? 'white' : 'var(--adm-text2)',
              }}
              aria-current={active ? 'page' : undefined}
            >
              <span className="flex items-center gap-3">
                <item.icon size={17} />
                {item.label}
              </span>
              {item.badge && unread > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  active ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: 'var(--adm-border)' }}>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: 'var(--adm-surface2)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate font-display" style={{ color: 'var(--adm-text)' }}>{user?.full_name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--adm-text2)' }}>{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/" target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border font-display"
            style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--adm-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-text2)'}>
            <ExternalLink size={11} /> Site
          </Link>
          <button onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all border font-display"
            style={{ borderColor: 'var(--adm-border)' }}>
            <LogOut size={11} /> Sortir
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--adm-bg)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 border-r"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-60 z-50 lg:hidden flex flex-col border-r"
              style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                <span className="font-display font-bold text-sm text-primary-400">Menu</span>
                <button onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                  style={{ color: 'var(--adm-text2)' }}>
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-5 flex-shrink-0 border-b"
          style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl transition-all"
              style={{ color: 'var(--adm-text2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-surface2)'; e.currentTarget.style.color = 'var(--adm-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--adm-text2)'; }}>
              <Menu size={19} />
            </button>
            <p className="text-sm font-semibold font-display hidden lg:block" style={{ color: 'var(--adm-text2)' }}>
              {currentLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Link to="/admin/chat"
                className="relative p-2 rounded-xl transition-all"
                style={{ color: 'var(--adm-text2)' }}
                aria-label={`${unread} messages non lus`}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-surface2)'; e.currentTarget.style.color = 'var(--adm-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--adm-text2)'; }}>
                <Bell size={18} />
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              </Link>
            )}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 scroll-adm" style={{ background: 'var(--adm-bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
