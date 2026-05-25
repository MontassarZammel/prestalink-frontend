import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Check, MapPin, ChevronDown, Users, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';

const TYPE_ICONS = {
  traiteurs: '🍽️', photographes: '📸', decorateurs: '💐',
  animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️',
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>
      {label}{required && <span style={{ color: '#F43F5E' }}> *</span>}
    </label>
    {children}
  </div>
);

/* ─── TRAITEUR SECTION ───────────────────────────────────────── */
function TraiteurSection({ provider, value, onChange }) {
  const [pkgs, setPkgs]   = useState([]);
  const [avail, setAvail] = useState([]);

  useEffect(() => {
    api.get(`/providers/${provider.id}/packages`).then(r => setPkgs(r.data.data || [])).catch(() => {});
  }, [provider.id]);

  const loadAvail = useCallback((dateStr) => {
    if (!dateStr) return;
    const [y, m] = dateStr.split('-');
    api.get(`/providers/${provider.id}/availability?month=${m}&year=${y}`)
      .then(r => setAvail(r.data.data || []))
      .catch(() => {});
  }, [provider.id]);

  const isTaken = (d) => avail.some(a => a.date === d && a.status !== 'available');

  const effectivePrice = (pkg) => pkg.discount_percentage > 0
    ? Math.round(Number(pkg.price_per_person) * (1 - Number(pkg.discount_percentage) / 100))
    : Number(pkg.price_per_person);

  return (
    <div className="space-y-3">
      {/* Pack selection */}
      {pkgs.length > 0 && (
        <Field label="Formule choisie" required>
          <div className="space-y-2">
            {pkgs.map(pkg => (
              <label key={pkg.id}
                className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: value.package_id === pkg.id ? 'rgba(196,140,140,0.1)' : 'var(--s3)',
                  border: `1.5px solid ${value.package_id === pkg.id ? '#C48C8C' : 'var(--border)'}`,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: value.package_id === pkg.id ? '#C48C8C' : 'var(--border-2)' }}>
                    {value.package_id === pkg.id && <div className="w-2 h-2 rounded-full" style={{ background: '#C48C8C' }} />}
                  </div>
                  <input type="radio" className="sr-only" checked={value.package_id === pkg.id}
                    onChange={() => onChange({ ...value, package_id: pkg.id })} />
                  <span className="text-sm font-display font-semibold" style={{ color: 'var(--text)' }}>{pkg.name}</span>
                  {pkg.discount_percentage > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                      -{pkg.discount_percentage}%
                    </span>
                  )}
                </div>
                <span className="font-display font-bold text-sm" style={{ color: '#E8DCD5' }}>
                  {effectivePrice(pkg).toLocaleString('fr-TN')} TND<span className="text-xs font-normal">/pers</span>
                </span>
              </label>
            ))}
          </div>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de l'événement" required>
          <div className="relative">
            <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input type="date" value={value.event_date}
              onChange={e => { onChange({ ...value, event_date: e.target.value }); loadAvail(e.target.value); }}
              className="input w-full pl-8 text-sm"
              min={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'light' }} required />
          </div>
          {value.event_date && isTaken(value.event_date) && (
            <p className="text-xs mt-1 font-semibold" style={{ color: '#EF4444' }}>⚠ Date déjà réservée</p>
          )}
          {value.event_date && !isTaken(value.event_date) && (
            <p className="text-xs mt-1 font-semibold" style={{ color: '#34D399' }}>✓ Date disponible</p>
          )}
        </Field>
        <Field label="Nombre de personnes" required>
          <div className="relative">
            <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input type="number" value={value.guest_count}
              onChange={e => onChange({ ...value, guest_count: e.target.value })}
              className="input w-full pl-8 text-sm" placeholder="Ex: 150" min="1" required />
          </div>
          {value.package_id && value.guest_count && (() => {
            const pkg = pkgs.find(p => p.id === value.package_id);
            if (!pkg) return null;
            const total = effectivePrice(pkg) * Number(value.guest_count);
            return <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Estimation : ~{total.toLocaleString('fr-TN')} TND</p>;
          })()}
        </Field>
      </div>

      <Field label="Notes / Précisions">
        <textarea value={value.notes} onChange={e => onChange({ ...value, notes: e.target.value })}
          className="textarea w-full text-sm" rows={2} placeholder="Allergies, préférences, détails..." />
      </Field>
    </div>
  );
}

/* ─── GENERIC SECTION (non-traiteur) ────────────────────────── */
function GenericSection({ provider, value, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="Date de l'événement">
        <div className="relative">
          <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input type="date" value={value.event_date}
            onChange={e => onChange({ ...value, event_date: e.target.value })}
            className="input w-full pl-8 text-sm"
            min={new Date().toISOString().split('T')[0]}
            style={{ colorScheme: 'light' }} />
        </div>
      </Field>
      <Field label="Description de votre projet">
        <textarea value={value.description} onChange={e => onChange({ ...value, description: e.target.value })}
          className="textarea w-full text-sm" rows={2}
          placeholder={`Décrivez votre besoin pour ${provider.name}...`} />
      </Field>
      <Field label="Notes / Précisions">
        <textarea value={value.notes} onChange={e => onChange({ ...value, notes: e.target.value })}
          className="textarea w-full text-sm" rows={2} placeholder="Détails particuliers..." />
      </Field>
    </div>
  );
}

/* ─── DEVIS MODAL ─────────────────────────────────────────────── */
function DevisModal({ onClose }) {
  const { user } = useAuthStore();
  const { cart, clearCart } = useCartStore();

  const [step, setStep] = useState('preview');
  const [common, setCommon] = useState({
    client_name:  user?.full_name || '',
    client_email: user?.email     || '',
    client_phone: '',
  });
  const [perProvider, setPerProvider] = useState(() =>
    Object.fromEntries(cart.map(p => [p.id, { package_id: null, event_date: '', guest_count: '', notes: '', description: '' }]))
  );
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState([]);
  const [openSections, setOpenSections] = useState(() => Object.fromEntries(cart.map(p => [p.id, true])));

  const fmt = n => Math.round(n).toLocaleString('fr-TN') + ' TND';
  const calcPrices = p => {
    const base  = p.price_min || 0;
    const disc  = p.discount_percentage || 0;
    const after = base ? Math.round(base - base * disc / 100) : 0;
    return { base, disc, after };
  };
  const totals = cart.reduce((acc, p) => {
    const { base, after } = calcPrices(p);
    acc.std  += base;
    acc.pref += after;
    return acc;
  }, { std: 0, pref: 0 });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!common.client_name || !common.client_email) { toast.error('Nom et email requis'); return; }

    // Validate traiteur sections
    for (const p of cart) {
      if (p.type_slug === 'traiteurs') {
        const f = perProvider[p.id];
        if (!f.event_date) { toast.error(`Date requise pour ${p.name}`); return; }
        if (!f.guest_count) { toast.error(`Nombre de personnes requis pour ${p.name}`); return; }
      }
    }

    setLoading(true);
    const done = [];

    // Generate a shared group_id when multiple providers are selected
    const groupId = cart.length > 1 ? crypto.randomUUID() : null;

    for (const p of cart) {
      const f = perProvider[p.id];
      try {
        await api.post('/quote-requests', {
          provider_id:  p.id,
          type_slug:    p.type_slug,
          group_id:     groupId,
          package_id:   p.type_slug === 'traiteurs' ? (f.package_id || null) : null,
          client_name:  common.client_name,
          client_email: common.client_email,
          client_phone: common.client_phone || null,
          event_date:   f.event_date || null,
          guest_count:  p.type_slug === 'traiteurs' && f.guest_count ? Number(f.guest_count) : null,
          description:  p.type_slug !== 'traiteurs' ? (f.description || `Devis pour ${p.name}`) : null,
          notes:        f.notes || null,
        });
        done.push({ provider: p, type: 'request' });
      } catch (_) {
        toast.error(`Erreur pour ${p.name}`);
      }
    }

    setResults(done);
    setStep('done');
    clearCart();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(10,6,4,0.75)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-dark-lg"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-3xl px-7 py-6 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C48C8C 0%, #D9A5A5 60%, #F43F5E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <button onClick={onClose} aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
            <X size={15} />
          </button>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1 font-display">MyWedding</p>
          <h2 className="font-display font-bold text-white text-xl">
            {step === 'done' ? '🎉 Demandes envoyées !' : 'Votre Devis Groupé'}
          </h2>
          <p className="text-white/60 text-sm mt-0.5">
            {cart.length} prestataire{cart.length > 1 ? 's' : ''} · {cart.map(p => TYPE_ICONS[p.type_slug] || '✦').join(' ')}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 scroll-thin">
          {/* PREVIEW */}
          {step === 'preview' && (
            <div className="p-7">
              <div className="rounded-2xl overflow-x-auto mb-5" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr style={{ background: 'var(--s3)' }}>
                      {['Prestataire', 'Type', 'Prix std.', 'Avec remise'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider font-display"
                          style={{ color: 'var(--text-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((p, i) => {
                      const { base, disc, after } = calcPrices(p);
                      return (
                        <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                          <td className="py-3 px-4">
                            <p className="font-semibold" style={{ color: 'var(--text)' }}>{p.name}</p>
                            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-3)' }}>
                              <MapPin size={10} />{p.city || 'Tunisie'}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span>{TYPE_ICONS[p.type_slug] || '✦'}</span>
                            <span className="text-xs ml-1" style={{ color: 'var(--text-2)' }}>{p.type_name}</span>
                          </td>
                          <td className="py-3 px-4 text-sm line-through" style={{ color: 'var(--text-3)' }}>{base ? fmt(base) : '—'}</td>
                          <td className="py-3 px-4">
                            <span className="font-display font-bold text-sm" style={{ color: '#E8DCD5' }}>{base ? fmt(after) : 'Sur devis'}</span>
                            {disc > 0 && <span className="badge badge-green ml-1.5">−{disc}%</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totals.std > 0 && (
                <div className="rounded-2xl p-4 mb-5 space-y-2" style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-2)' }}>Sous-total standard</span>
                    <span className="font-display font-medium" style={{ color: 'var(--text)' }}>{fmt(totals.std)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#34D399' }}>Remise MyWedding</span>
                    <span className="font-display font-bold" style={{ color: '#34D399' }}>−{fmt(totals.std - totals.pref)}</span>
                  </div>
                  <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="font-display font-bold" style={{ color: 'var(--text)' }}>Total estimé</span>
                    <span className="font-display font-bold text-lg" style={{ color: '#E8DCD5' }}>{fmt(totals.pref)}</span>
                  </div>
                </div>
              )}

              <button onClick={() => setStep('form')} className="btn btn-primary w-full btn-lg">
                Remplir les informations →
              </button>
            </div>
          )}

          {/* FORM */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              {/* Common fields */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>
                  Vos coordonnées
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nom complet" required>
                    <input className="input w-full text-sm" value={common.client_name}
                      onChange={e => setCommon(c => ({ ...c, client_name: e.target.value }))}
                      placeholder="Votre nom" required />
                  </Field>
                  <Field label="Email" required>
                    <input type="email" className="input w-full text-sm" value={common.client_email}
                      onChange={e => setCommon(c => ({ ...c, client_email: e.target.value }))}
                      placeholder="email@exemple.com" required />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Téléphone">
                    <input type="tel" className="input w-full text-sm" value={common.client_phone}
                      onChange={e => setCommon(c => ({ ...c, client_phone: e.target.value }))}
                      placeholder="+216 XX XXX XXX" />
                  </Field>
                </div>
              </div>

              {/* Per-provider sections */}
              {cart.map(p => (
                <div key={p.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {/* Section header */}
                  <button type="button"
                    onClick={() => setOpenSections(s => ({ ...s, [p.id]: !s[p.id] }))}
                    className="w-full flex items-center justify-between px-4 py-3 transition-all"
                    style={{ background: 'var(--s3)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TYPE_ICONS[p.type_slug] || '✦'}</span>
                      <div className="text-left">
                        <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{p.type_name}</p>
                      </div>
                    </div>
                    <ChevronDown size={15} style={{ color: 'var(--text-3)' }}
                      className={`transition-transform ${openSections[p.id] ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Section body */}
                  {openSections[p.id] && (
                    <div className="p-4" style={{ background: 'var(--s2)' }}>
                      {p.type_slug === 'traiteurs' ? (
                        <TraiteurSection
                          provider={p}
                          value={perProvider[p.id]}
                          onChange={val => setPerProvider(prev => ({ ...prev, [p.id]: val }))}
                        />
                      ) : (
                        <GenericSection
                          provider={p}
                          value={perProvider[p.id]}
                          onChange={val => setPerProvider(prev => ({ ...prev, [p.id]: val }))}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('preview')} className="btn btn-outline">← Retour</button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 gap-2">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                    : <><FileText size={15} /> Envoyer mes demandes</>}
                </button>
              </div>
            </form>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="p-7 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <Check size={32} style={{ color: '#34D399' }} strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
                {results.length} demande{results.length > 1 ? 's' : ''} envoyée{results.length > 1 ? 's' : ''} !
              </h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
                Notre équipe va analyser chaque demande et vous envoyer vos devis personnalisés sous 24h.
              </p>
              <div className="space-y-2 mb-5 text-left">
                {results.map(({ provider, type }, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                    <Check size={14} style={{ color: '#34D399' }} className="flex-shrink-0" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{provider.name}</span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--text-3)' }}>
                      {type === 'request' ? 'Demande de devis' : 'Devis créé'}
                    </span>
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

/* ─── FLOATING SELECTION BAR ──────────────────────────────────── */
export default function SelectionBar() {
  const location = useLocation();
  const { cart, removeProvider, clearCart } = useCartStore();
  const [showDevis, setShowDevis] = useState(false);

  if (location.pathname.startsWith('/admin')) return null;
  if (cart.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]"
          style={{ width: 'min(560px, calc(100vw - 32px))' }}>
          <div className="rounded-2xl shadow-dark-lg overflow-hidden"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-2)', backdropFilter: 'blur(16px)' }}>
            {cart.length > 1 && (
              <div className="px-4 pt-3 pb-1 flex gap-2 flex-wrap">
                {cart.map(p => (
                  <span key={p.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)', color: 'var(--text-2)' }}>
                    {TYPE_ICONS[p.type_slug] || '✦'} {p.name}
                    <button onClick={() => removeProvider(p.id)} className="ml-1 hover:text-rose-400 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)' }}>
                  {cart.length}
                </div>
                <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                  {cart.length === 1 ? cart[0].name : `${cart.length} prestataires sélectionnés`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => clearCart()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FDA4AF'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                  <X size={14} />
                </button>
                <button onClick={() => setShowDevis(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold text-sm text-white hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', boxShadow: '0 4px 16px rgba(217,165,165,0.35)' }}>
                  <FileText size={14} /> Générer le devis
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showDevis && <DevisModal onClose={() => setShowDevis(false)} />}
      </AnimatePresence>
    </>
  );
}
