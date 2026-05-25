import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Search, ChevronDown, Camera, UtensilsCrossed, Sparkles, Music2, Flower2, Building2, LayoutGrid } from 'lucide-react';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';

const TYPE_ICONS = {
  all:              <LayoutGrid size={14} />,
  photographes:     <Camera size={14} />,
  traiteurs:        <UtensilsCrossed size={14} />,
  decorateurs:      <Sparkles size={14} />,
  animateurs:       <Music2 size={14} />,
  fleuristes:       <Flower2 size={14} />,
  'locations-salles': <Building2 size={14} />,
};

const TYPE_ICONS_LG = {
  photographes:     <Camera size={28} />,
  traiteurs:        <UtensilsCrossed size={28} />,
  decorateurs:      <Sparkles size={28} />,
  animateurs:       <Music2 size={28} />,
  fleuristes:       <Flower2 size={28} />,
  'locations-salles': <Building2 size={28} />,
};

/* ─── PROVIDER CARD ───────────────────────────────────────────── */
function ProviderCard({ provider }) {
  return (
    <motion.article
      className="rounded-2xl overflow-hidden transition-all duration-300 relative group"
      style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border)' }}
      whileHover={{ y: -2 }}
    >
      <Link to={provider.type_slug ? `/prestataires/${provider.type_slug}/${provider.slug}` : '#'}
        className="absolute inset-0 z-[1]" aria-label={provider.name} />
      <div className="relative h-48 overflow-hidden" style={{ background: 'var(--s3)' }}>
        {provider.cover_image ? (
          <img src={provider.cover_image} alt={provider.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(217,165,165,0.12), rgba(232,220,213,0.06))' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(217,165,165,0.15)', border: '1px solid rgba(217,165,165,0.25)', color: '#D9A5A5' }}>
              {TYPE_ICONS_LG[provider.type_slug] || <LayoutGrid size={28} />}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {provider.is_featured && (
          <span className="absolute top-3 left-3 badge badge-amber">⭐ Recommandé</span>
        )}
      </div>

      <div className="p-5">
        <span className="badge badge-primary mb-2">{provider.type_name}</span>
        <p className="font-display font-bold text-base mb-1 leading-tight" style={{ color: 'var(--text)' }}>
          {provider.name}
        </p>
        {provider.city && (
          <p className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-3)' }}>
            <MapPin size={11} /> {provider.city}{provider.governorate ? `, ${provider.governorate}` : ''}
          </p>
        )}
        {provider.rating > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11}
                  style={{ color: i < Math.floor(provider.rating) ? '#D9A5A5' : 'var(--text-3)' }}
                  fill="currentColor" />
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{Number(provider.rating).toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span />
          <span className="text-xs font-semibold transition-colors" style={{ color: 'var(--text-3)' }}>
            Voir le détail →
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── MODULE-LEVEL CACHE (persists across navigations) ──────────── */
let _cachedProviders = [];

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function ProvidersPage() {
  const { typeSlug }      = useParams();
  const { promoVisible } = useUiStore();
  const HEADER_H = 64 + (promoVisible ? 36 : 0);

  const [providers, setProviders] = useState(_cachedProviders);
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(_cachedProviders.length === 0);
  const [initialLoad, setInitialLoad] = useState(_cachedProviders.length === 0);
  const [activeType, setActiveType] = useState(typeSlug || 'all');
  const [sortMode, setSortMode]   = useState('note');
  const [budget, setBudget]       = useState(100000);
  const [search, setSearch]       = useState('');
  const [region, setRegion]       = useState('');
  const [pagination, setPagination] = useState({ total: 0 });

  useEffect(() => {
    api.get('/provider-types').then(r => setTypes(r.data.data || [])).catch(() => {});
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (activeType && activeType !== 'all') p.set('type_slug', activeType);
      if (search) p.set('search', search);
      if (budget < 100000) p.set('price_max', budget);
      if (region) p.set('region', region);
      if (sortMode === 'note') { p.set('sort', 'rating'); p.set('order', 'DESC'); }
      if (sortMode === 'prix') { p.set('sort', 'price'); p.set('order', 'ASC'); }
      p.set('limit', '24');
      const res = await api.get(`/providers?${p}`);
      const data = res.data.data || [];
      _cachedProviders = data;
      setProviders(data);
      setPagination(res.data.pagination || { total: 0 });
    } catch (_) {}
    setLoading(false);
    setInitialLoad(false);
  }, [activeType, search, budget, sortMode, region]);

  const prevTypeSlug = useRef(typeSlug);
  useEffect(() => {
    const t = typeSlug || 'all';
    if (t !== prevTypeSlug.current) {
      prevTypeSlug.current = t;
      setActiveType(t);
    }
  }, [typeSlug]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const allTypes     = [{ id: 'all', slug: 'all', name: 'Tout voir' }, ...types];
  const currentType  = types.find(t => t.slug === activeType);

  return (
    <>
      <SEO
        title={currentType?.meta_title || (currentType ? currentType.name : 'Prestataires')}
        description={currentType?.meta_description || 'Trouvez les meilleurs prestataires événementiels en Tunisie'}
      />

      {/* ── STICKY FILTERS ─────────────────────────── */}
      <div style={{ height: HEADER_H }} /> {/* navbar offset */}
      <div className="sticky z-[90] backdrop-blur-xl" style={{ top: HEADER_H, background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 sm:flex-wrap">
            {/* Search */}
            <div className="relative sm:flex-1 sm:min-w-[160px] sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..." className="input pl-9 py-2 text-sm w-full" />
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 sm:flex-1 sm:min-w-[180px]">
              <span className="text-xs font-semibold font-display whitespace-nowrap" style={{ color: 'var(--text-2)' }}>Budget :</span>
              <input type="range" min={10000} max={100000} step={1000} value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="flex-1 accent-rose-600" aria-label="Budget maximum" />
              <span className="font-display font-bold text-xs whitespace-nowrap min-w-[90px] text-right" style={{ color: '#E8DCD5' }}>
                {budget < 100000 ? `≤ ${budget.toLocaleString('fr-TN')} TND` : 'Tous budgets'}
              </span>
            </div>

            {/* Sort + Region */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1" role="group" aria-label="Trier par">
                {[['note', '⭐ Note'], ['prix', '💰 Prix']].map(([id, label]) => (
                  <button key={id} onClick={() => setSortMode(id)}
                    className={`pill ${sortMode === id ? 'active' : ''} py-1.5 text-xs`}
                    aria-pressed={sortMode === id}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Region dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  aria-label="Filtrer par région"
                  className="input pl-8 pr-7 py-2 text-sm appearance-none cursor-pointer font-display font-semibold w-full sm:min-w-[160px]"
                  style={{
                    background: region ? 'rgba(217,165,165,0.08)' : 'var(--s2)',
                    border: region ? '1px solid rgba(217,165,165,0.35)' : undefined,
                    color: region ? '#E8DCD5' : 'var(--text-2)',
                  }}
                >

                <option value="">🇹🇳 Toute la Tunisie</option>
                <option value="grand-tunis">🏙️ Grand Tunis</option>
                <option value="Sfax">🏭 Sfax</option>
                <option value="Sousse">🌊 Sousse</option>
                <option value="Monastir">🕌 Monastir</option>
                <option value="Nabeul">🌿 Nabeul</option>
                <option value="Bizerte">⚓ Bizerte</option>
                <option value="Kairouan">🌙 Kairouan</option>
                <option value="Gafsa">🏔️ Gafsa</option>
                <option value="Gabès">🌴 Gabès</option>
                <option value="Médenine">🏜️ Médenine</option>
                <option value="Jendouba">🌲 Jendouba</option>
                <option value="Béja">🌾 Béja</option>
                <option value="Siliana">🏞️ Siliana</option>
                <option value="Zaghouan">💧 Zaghouan</option>
                <option value="Mahdia">🎣 Mahdia</option>
                <option value="Sidi Bouzid">🌻 Sidi Bouzid</option>
                <option value="Kasserine">⛰️ Kasserine</option>
                <option value="Tozeur">🌅 Tozeur</option>
                <option value="Kébili">🐪 Kébili</option>
                <option value="Tataouine">🏰 Tataouine</option>
              </select>
              </div>{/* end region dropdown */}
            </div>{/* end sort+region wrapper */}
          </div>{/* end outer filter row */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-28" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        {/* Type pills */}
        <div className="flex gap-2 flex-wrap mb-7">
          {allTypes.map(t => (
            <button key={t.slug} onClick={() => setActiveType(t.slug)}
              className={`pill ${activeType === t.slug ? 'active' : ''}`}
              aria-pressed={activeType === t.slug}>
              <span className="flex items-center">{TYPE_ICONS[t.slug] || <LayoutGrid size={14} />}</span>
              {t.name}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text)' }}>
              {currentType ? currentType.name : 'Tous les prestataires'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{pagination.total} résultat{pagination.total > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Promo strip */}
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3.5 mb-1"
          style={{ background: 'linear-gradient(135deg, rgba(196,140,140,0.1), rgba(217,165,165,0.05))', border: '1px solid rgba(217,165,165,0.22)' }}>
          <span className="text-xl flex-shrink-0">🏷️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              –15% de remise sur votre prestation
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              Réservez via MyWedding et bénéficiez d'une remise exclusive de 15% sur le tarif du prestataire.
            </p>
          </div>
          <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold hidden sm:block"
            style={{ background: 'rgba(217,165,165,0.15)', color: '#D9A5A5', border: '1px solid rgba(217,165,165,0.3)' }}>
            Offre exclusive
          </span>
        </div>

        {/* Grid */}
        {initialLoad && loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="h-48 skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-3 skeleton w-1/3" />
                  <div className="h-5 skeleton w-3/4" />
                  <div className="h-3 skeleton w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 && !loading ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: 'rgba(255,220,150,0.03)', border: '1px solid var(--border)' }}>
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>Aucun résultat</h2>
            <p style={{ color: 'var(--text-2)' }}>Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 0.2s' }}>
            {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        )}
      </div>

    </>
  );
}
