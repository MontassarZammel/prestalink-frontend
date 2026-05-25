import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, FileText, ChevronDown, LogOut, LayoutDashboard, Grid3X3, Sun, Moon, User, Aperture, CookingPot, Wand2, Mic2, Cherry, Hotel, Tag } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';

const TYPE_ICONS = {
  photographes:       <Aperture   size={15} />,
  traiteurs:          <CookingPot size={15} />,
  decorateurs:        <Wand2      size={15} />,
  animateurs:         <Mic2       size={15} />,
  fleuristes:         <Cherry     size={15} />,
  'locations-salles': <Hotel      size={15} />,
};

export default function Navbar() {
  const [scrolled, setScrolled]           = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const { promoVisible, setPromoVisible } = useUiStore();
  const [userOpen, setUserOpen]           = useState(false);
  const [prestOpen, setPrestOpen]         = useState(false);
  const [types, setTypes]                 = useState([]);
  const [newQuotes, setNewQuotes]         = useState(0);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const userRef   = useRef(null);
  const prestRef  = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserOpen(false); setPrestOpen(false); }, [location]);

  useEffect(() => {
    const fn = e => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (prestRef.current && !prestRef.current.contains(e.target)) setPrestOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    api.get('/provider-types').then(r => setTypes(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setNewQuotes(0); return; }
    const fetch = () => {
      const since = localStorage.getItem('lastQuotesVisit') || '0';
      api.get(`/quotes/my/new-count?since=${since}`)
        .then(r => setNewQuotes(r.data.count || 0))
        .catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  // Clear badge when visiting Mes Devis
  useEffect(() => {
    if (location.pathname === '/mes-devis') setNewQuotes(0);
  }, [location.pathname]);

  if (location.pathname.startsWith('/admin')) return null;

  const isPrestActive = location.pathname.startsWith('/prestataires');

  const navBg = scrolled ? 'backdrop-blur-xl border-b' : 'border-b border-transparent';
  const navStyle = scrolled
    ? { background: dark ? 'rgba(13,9,9,0.95)' : 'rgba(250,250,247,0.95)', borderColor: 'rgba(217,165,165,0.1)' }
    : { background: 'transparent' };

  const dismissPromo = () => {
    localStorage.setItem('promo_dismissed', '1');
    setPromoVisible(false);
  };

  const PROMO_H = promoVisible ? 36 : 0;
  const HEADER_H = 64 + PROMO_H;

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${navBg}`}
      style={navStyle} role="banner">

      {/* ── PROMO BAR ──────────────────────────────────────────── */}
      <AnimatePresence>
        {promoVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #b07a7a, #C48C8C, #D9A5A5, #C48C8C, #b07a7a)' }}>
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-2 text-white text-xs font-semibold flex-1 justify-center">
                <Tag size={11} className="opacity-90 flex-shrink-0" />
                <span>
                  <span className="font-bold">–15% de remise</span>
                  {' '}sur votre prestation en réservant via MyWedding
                </span>
                <Link to="/a-propos"
                  className="hidden sm:inline underline underline-offset-2 opacity-75 hover:opacity-100 transition-opacity">
                  En savoir plus
                </Link>
              </div>
              <button onClick={dismissPromo}
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-all text-white/60 hover:text-white hover:bg-white/15"
                aria-label="Fermer">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="max-w-7xl mx-auto px-5 lg:px-10 h-16 flex items-center justify-between gap-6"
        aria-label="Navigation principale">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0 group" aria-label="MyWedding">
          <img
            src="/logo-dark.png"
            alt="My Wedding"
            className="h-10 w-auto object-contain transition-all duration-200 group-hover:opacity-80"
            style={{ filter: dark ? 'invert(1) brightness(2)' : 'brightness(0)' }}
          />
        </Link>

        {/* Desktop center — single Prestataires dropdown */}
        <div className="hidden md:flex items-center gap-2 flex-1">
          <div className="relative" ref={prestRef}>
            <button
              onClick={() => setPrestOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-display transition-all"
              style={isPrestActive
                ? { background: 'rgba(217,165,165,0.12)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.2)' }
                : { color: 'var(--text-2)', border: '1px solid transparent' }}
              onMouseEnter={e => { if (!isPrestActive) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border)'; }}}
              onMouseLeave={e => { if (!isPrestActive) { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'transparent'; }}}
              aria-expanded={prestOpen}
            >
              <Grid3X3 size={14} />
              Prestataires
              <ChevronDown size={12} className={`transition-transform duration-200 ${prestOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {prestOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-56 sm:w-64 rounded-2xl shadow-dark-lg py-2 z-50"
                  style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}
                >
                  <Link to="/prestataires"
                    className="flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-xl text-sm font-semibold font-display transition-all"
                    style={{ color: 'var(--text-2)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.07)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)'; }}>
                    <span className="text-base">✦</span>
                    Tous les prestataires
                  </Link>
                  <div className="my-1.5 mx-3 h-px" style={{ background: 'var(--border)' }} />
                  {types.map(t => (
                    <Link key={t.id} to={`/prestataires/${t.slug}`}
                      className="flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-xl text-sm font-display transition-all"
                      style={location.pathname.includes(t.slug)
                        ? { background: 'rgba(217,165,165,0.1)', color: '#E8DCD5' }
                        : { color: 'var(--text-2)' }}
                      onMouseEnter={e => { if (!location.pathname.includes(t.slug)) { e.currentTarget.style.background = 'rgba(217,165,165,0.07)'; e.currentTarget.style.color = 'var(--text)'; }}}
                      onMouseLeave={e => { if (!location.pathname.includes(t.slug)) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)'; }}}>
                      <span className="text-base leading-none">{TYPE_ICONS[t.slug] || '✦'}</span>
                      {t.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            title={dark ? 'Mode clair' : 'Mode sombre'}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {isAuthenticated ? (
            <div className="relative" ref={userRef}>
              <button onClick={() => setUserOpen(v => !v)}
                className="relative flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl transition-all"
                style={{ background: 'rgba(217,165,165,0.07)', border: '1px solid var(--border)' }}
                aria-expanded={userOpen}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', color: 'var(--text)' }}>
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
                <span className="font-display font-semibold text-xs" style={{ color: 'var(--text)' }}>
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown size={11} style={{ color: 'var(--text-2)' }}
                  className={`transition-transform ${userOpen ? 'rotate-180' : ''}`} />
                {newQuotes > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ background: '#EF4444' }}>
                    {newQuotes > 9 ? '9+' : newQuotes}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {userOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-1rem)] rounded-2xl shadow-dark-lg py-1.5 z-50"
                    style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>
                    <div className="px-3 py-2.5 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-bold font-display" style={{ color: 'var(--text)' }}>{user?.full_name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{user?.email}</p>
                    </div>
                    {user?.role === 'admin' && (
                      <Link to="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold mx-1 rounded-xl transition-all font-display"
                        style={{ color: '#E8DCD5' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,165,165,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <LayoutDashboard size={13} /> Dashboard Admin
                      </Link>
                    )}
                    <Link to="/profil"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs mx-1 rounded-xl transition-all font-display"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(217,165,165,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = ''; }}>
                      <User size={13} /> Mon Profil
                    </Link>
                    <Link to="/mes-devis"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs mx-1 rounded-xl transition-all font-display"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(217,165,165,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = ''; }}>
                      <FileText size={13} /> Mes Devis
                      {newQuotes > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold leading-none"
                          style={{ background: '#EF4444' }}>
                          {newQuotes > 9 ? '9+' : newQuotes}
                        </span>
                      )}
                    </Link>
                    <div className="my-1 mx-2 h-px" style={{ background: 'var(--border)' }} />
                    <button onClick={() => { logout(); navigate('/login'); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs w-[calc(100%-8px)] mx-1 rounded-xl text-left transition-all font-display"
                      style={{ color: '#FDA4AF' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <LogOut size={13} /> Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link to="/register" className="btn btn-primary btn-sm">S'inscrire</Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(v => !v)}
          className="md:hidden p-2 rounded-xl transition-all"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}
          aria-label="Menu">
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden"
            style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
            <div className="px-4 py-4 max-h-[80vh] overflow-y-auto scroll-thin space-y-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1 font-display" style={{ color: 'var(--text-3)' }}>
                  Prestataires
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <Link to="/prestataires"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold font-display transition-all"
                    style={{ color: 'var(--text-2)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,165,165,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    ✦ Tous
                  </Link>
                  {types.map(t => (
                    <Link key={t.id} to={`/prestataires/${t.slug}`}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold font-display transition-all"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.08)'; e.currentTarget.style.color = '#E8DCD5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)'; }}>
                      <span>{TYPE_ICONS[t.slug] || '✦'}</span> {t.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ background: 'var(--border)' }} />

              <button onClick={toggle}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm w-full font-display transition-all"
                style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                {dark ? <Sun size={15} /> : <Moon size={15} />}
                {dark ? 'Mode clair' : 'Mode sombre'}
              </button>

              <div className="h-px" style={{ background: 'var(--border)' }} />

              <div className="space-y-1">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(217,165,165,0.05)', border: '1px solid var(--border)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', color: 'var(--text)' }}>
                        {user?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold font-display" style={{ color: 'var(--text)' }}>{user?.full_name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-2)' }}>{user?.email}</p>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl font-display" style={{ color: '#E8DCD5' }}>
                        <LayoutDashboard size={15} /> Dashboard Admin
                      </Link>
                    )}
                    <Link to="/profil" className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl font-display" style={{ color: 'var(--text-2)' }}>
                      <User size={15} /> Mon Profil
                    </Link>
                    <Link to="/mes-devis" className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl font-display" style={{ color: 'var(--text-2)' }}>
                      <FileText size={15} /> Mes Devis
                      {newQuotes > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold leading-none"
                          style={{ background: '#EF4444' }}>
                          {newQuotes > 9 ? '9+' : newQuotes}
                        </span>
                      )}
                    </Link>
                    <button onClick={() => { logout(); navigate('/login'); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl w-full text-left font-display"
                      style={{ color: '#FDA4AF' }}>
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link to="/login" className="btn btn-outline btn-sm flex-1 justify-center">Connexion</Link>
                    <Link to="/register" className="btn btn-primary btn-sm flex-1 justify-center">S'inscrire</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
