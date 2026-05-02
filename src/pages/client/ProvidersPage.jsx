import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Plus, Check, Heart, FileText, X, Download, Search, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const TYPE_ICONS = {
  all: '🔮', photographes: '📸', traiteurs: '🍽️', decorateurs: '💐',
  animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️',
};

/* ─── DEVIS MODAL ─────────────────────────────────────────────── */
const DevisField = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>{label}</label>
    {children}
  </div>
);

function DevisModal({ cart, onClose }) {
  const { user } = useAuthStore();
  const [step, setStep]           = useState('preview');
  const [form, setForm]           = useState({
    client_name: user?.full_name || '',
    client_email: user?.email || '',
    client_phone: '',
    description: '',
    event_date: '',
    advance_percentage: 30,
  });
  const [loading, setLoading]         = useState(false);
  const [createdQuotes, setCreatedQuotes] = useState([]);

  const list = cart;
  const fmt  = n => Math.round(n).toLocaleString('fr-TN') + ' TND';

  const calcPrices = p => {
    const base = p.price_min || 0;
    const disc = p.discount_percentage || 0;
    const after = base ? Math.round(base - base * disc / 100) : 0;
    return { base, disc, after };
  };

  const totals = list.reduce((acc, p) => {
    const { base, after } = calcPrices(p);
    acc.std  += base;
    acc.pref += after;
    return acc;
  }, { std: 0, pref: 0 });

  const remise  = totals.std - totals.pref;
  const advance = Math.round(totals.pref * form.advance_percentage / 100);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.client_name || !form.client_email) { toast.error('Nom et email requis'); return; }
    setLoading(true);
    const results = [];
    for (const p of list) {
      const { base } = calcPrices(p);
      try {
        const res = await api.post('/quotes', {
          provider_id: p.id,
          client_name: form.client_name,
          client_email: form.client_email,
          client_phone: form.client_phone,
          description: form.description || `Devis pour ${p.name}`,
          event_date: form.event_date || null,
          base_price: base || 1000,
          advance_percentage: form.advance_percentage,
        });
        results.push(res.data.data);
      } catch (_) {}
    }
    setCreatedQuotes(results);
    setStep('done');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="devis-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(250,250,247,0.85)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin shadow-dark-lg"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}
      >
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-t-3xl px-8 py-8"
          style={{ background: 'linear-gradient(135deg, #C48C8C 0%, #D9A5A5 60%, #F43F5E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <button onClick={onClose} aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
            <X size={15} />
          </button>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 font-display">MyWedding</p>
          <h2 id="devis-title" className="font-display font-bold text-white text-2xl" style={{ letterSpacing: '-0.02em' }}>
            {step === 'done' ? '🎉 Devis généré !' : 'Votre Devis Personnalisé'}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {step === 'done'
              ? `${createdQuotes.length} devis créé${createdQuotes.length > 1 ? 's' : ''}`
              : `${list.length} prestataire${list.length > 1 ? 's' : ''} sélectionné${list.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="p-8">
          {/* PREVIEW */}
          {step === 'preview' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider font-display mb-1" style={{ color: '#34D399' }}>Économie</p>
                  <p className="font-display font-bold text-xl" style={{ color: '#34D399' }}>{fmt(remise)}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(217,165,165,0.08)', border: '1px solid rgba(217,165,165,0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider font-display mb-1" style={{ color: '#E8DCD5' }}>Acompte estimé (30%)</p>
                  <p className="font-display font-bold text-xl" style={{ color: '#E8DCD5' }}>{fmt(advance)}</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
                <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr style={{ background: 'var(--s3)' }}>
                      {['Prestataire', 'Catégorie', 'Prix standard', 'Avec remise'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider font-display"
                          style={{ color: 'var(--text-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p, i) => {
                      const { base, disc, after } = calcPrices(p);
                      return (
                        <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
                            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-3)' }}><MapPin size={10} />{p.city || 'Tunisie'}</p>
                          </td>
                          <td className="py-3.5 px-4"><span className="badge badge-primary">{p.type_name}</span></td>
                          <td className="py-3.5 px-4 text-sm font-display line-through" style={{ color: 'var(--text-3)' }}>{base ? fmt(base) : '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-display font-bold text-sm" style={{ color: '#E8DCD5' }}>{base ? fmt(after) : 'Sur devis'}</span>
                            {disc > 0 && <span className="badge badge-green ml-2">−{disc}%</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>{/* end overflow-x-auto */}
              </div>

              <div className="rounded-2xl p-5 mb-6 space-y-3" style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-2)' }}>Sous-total standard</span>
                  <span className="font-medium font-display" style={{ color: 'var(--text)' }}>{fmt(totals.std)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium" style={{ color: '#34D399' }}>Remise MyWedding</span>
                  <span className="font-bold font-display" style={{ color: '#34D399' }}>−{fmt(remise)}</span>
                </div>
                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="font-display font-bold" style={{ color: 'var(--text)' }}>Total préférentiel</span>
                  <span className="font-display font-bold text-xl" style={{ color: '#E8DCD5' }}>{fmt(totals.pref)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
                  <span>Acompte à verser (30%)</span>
                  <span className="font-semibold font-display">{fmt(advance)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('form')} className="btn btn-primary flex-1 btn-lg">Finaliser & Générer PDF</button>
                <button onClick={onClose} className="btn btn-outline btn-lg">Modifier</button>
              </div>
            </>
          )}

          {/* FORM */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Renseignez vos coordonnées pour générer vos devis officiels.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DevisField label="Nom complet *">
                  <input className="input w-full" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Votre nom" required />
                </DevisField>
                <DevisField label="Email *">
                  <input type="email" className="input w-full" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} placeholder="email@exemple.com" required />
                </DevisField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DevisField label="Téléphone">
                  <input type="tel" className="input w-full" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} placeholder="+216 XX XXX XXX" />
                </DevisField>
                <DevisField label="Date de l'événement">
                  <input type="date" className="input w-full" value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ colorScheme: 'light' }} />
                </DevisField>
              </div>
              <DevisField label="Description de l'événement">
                <textarea className="textarea w-full" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Type d'événement, nombre de personnes, besoins spécifiques..." />
              </DevisField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('preview')} className="btn btn-outline">← Retour</button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : '📥 Générer mes devis'}
                </button>
              </div>
            </form>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <Check size={32} style={{ color: '#34D399' }} strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>Devis créés avec succès !</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Téléchargez vos PDF ou attendez que l'admin active votre paiement.</p>
              <div className="space-y-3 mb-6">
                {createdQuotes.map(q => (
                  <div key={q.id} className="flex items-center justify-between rounded-xl p-4"
                    style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border)' }}>
                    <div className="text-left">
                      <span className="badge badge-primary mb-1 inline-block">{q.quote_number}</span>
                      <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>{q.provider?.name || '—'}</p>
                    </div>
                    <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary btn-sm gap-1.5">
                      <Download size={13} /> PDF
                    </a>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="btn btn-outline w-full">Fermer</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── PROVIDER CARD ───────────────────────────────────────────── */
function ProviderCard({ provider, selected, onToggle }) {
  const isSelected = selected.has(provider.id);
  const disc = provider.discount_percentage || 0;

  return (
    <motion.article
      className="rounded-2xl overflow-hidden transition-all duration-300 relative"
      style={{
        background: 'rgba(255,220,150,0.04)',
        border: isSelected ? '2px solid #D9A5A5' : '1px solid var(--border)',
        boxShadow: isSelected ? '0 0 0 4px rgba(217,165,165,0.08)' : undefined,
      }}
    >
      {/* Overlay link covering whole card */}
      <Link to={`/prestataires/${provider.type_slug}/${provider.slug}`}
        className="absolute inset-0 z-[1]" aria-label={provider.name} />
      {/* Image */}
      <div className="relative h-48 overflow-hidden" style={{ background: 'var(--s3)' }}>
        {provider.cover_image ? (
          <img src={provider.cover_image} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {TYPE_ICONS[provider.type_slug] || '✦'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {provider.is_featured && (
          <span className="absolute top-3 left-3 badge badge-amber">⭐ Recommandé</span>
        )}
        {disc > 0 && (
          <span className="absolute top-3 right-12 badge badge-green">−{disc}%</span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onToggle(provider.id, provider); }}
          className="absolute top-2.5 right-2.5 z-[2] w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isSelected ? '#D9A5A5' : 'rgba(26,18,8,0.45)',
            color: isSelected ? 'white' : 'rgba(237,230,220,0.6)',
            border: '1px solid rgba(255,220,150,0.15)',
          }}
          aria-label={isSelected ? 'Retirer' : 'Ajouter à la sélection'}
        >
          <Heart size={13} fill={isSelected ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Body */}
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

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {disc > 0 && (
            <span className="badge badge-green text-xs">−{disc}% remise</span>
          )}
          <div className="ml-auto relative z-[2]">
            <button
              onClick={() => onToggle(provider.id, provider)}
              className={`btn btn-sm gap-1.5 ${isSelected ? 'border-0' : 'btn-primary'}`}
              style={isSelected ? { background: '#059669', color: 'white' } : undefined}
            >
              {isSelected ? <><Check size={12} /> Sélectionné</> : <><Plus size={12} /> Sélectionner</>}
            </button>
          </div>
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
  const [providers, setProviders] = useState(_cachedProviders);
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(_cachedProviders.length === 0);
  const [initialLoad, setInitialLoad] = useState(_cachedProviders.length === 0);
  const [selected, setSelected]   = useState(new Set());
  const [cart, setCart]           = useState([]); // persists across category switches
  const [showDevis, setShowDevis] = useState(false);
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

  const toggleSelect = (id, providerObj) => {
    const removing = selected.has(id);
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    if (removing) {
      setCart(c => c.filter(p => p.id !== id));
    } else if (providerObj) {
      setCart(c => c.some(p => p.id === id) ? c : [...c, providerObj]);
    }
  };
  const allTypes     = [{ id: 'all', slug: 'all', name: 'Tout voir' }, ...types];
  const currentType  = types.find(t => t.slug === activeType);

  return (
    <>
      <SEO
        title={currentType?.meta_title || (currentType ? currentType.name : 'Prestataires')}
        description={currentType?.meta_description || 'Trouvez les meilleurs prestataires événementiels en Tunisie'}
      />

      {/* ── STICKY FILTERS ─────────────────────────── */}
      <div className="h-16" /> {/* navbar offset */}
      <div className="sticky top-16 z-[90] backdrop-blur-xl" style={{ background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
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
              <span>{TYPE_ICONS[t.slug] || '✦'}</span>
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
            {providers.map(p => <ProviderCard key={p.id} provider={p} selected={selected} onToggle={(id) => toggleSelect(id, p)} />)}
          </div>
        )}
      </div>

      {/* Selection bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]"
            style={{ width: 'min(540px, calc(100vw - 32px))' }}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl"
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--border-2)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(16px)',
              }}>
              {/* Left — count + names */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', color: 'white' }}>
                  {selected.size}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                    {selected.size} prestataire{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                    {cart.map(p => p.name).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Right — actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setSelected(new Set()); setCart([]); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FDA4AF'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  title="Vider la sélection"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={() => setShowDevis(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', boxShadow: '0 4px 16px rgba(217,165,165,0.35)' }}
                >
                  <FileText size={14} />
                  Générer le devis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDevis && (
          <DevisModal cart={cart} onClose={() => setShowDevis(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
