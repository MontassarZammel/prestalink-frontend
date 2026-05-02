import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Globe, Star, X, Download, FileText,
  ExternalLink, ChevronLeft, ChevronRight, Check, ArrowLeft, GalleryHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const TYPE_ICONS = {
  photographes: '📸', traiteurs: '🍽️', decorateurs: '💐',
  animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️',
};

/* ─── QUOTE MODAL ─────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>{label}</label>
    {children}
  </div>
);

const QuoteModal = ({ provider, onClose }) => {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    client_name: user?.full_name || '',
    client_email: user?.email || '',
    client_phone: '',
    description: '',
    event_date: '',
    base_price: provider.price_min || '',
    advance_percentage: 30,
  });
  const [loading, setLoading] = useState(false);
  const [quote, setQuote]     = useState(null);

  const discountPct = provider.discount_percentage || 0;
  const basePrice   = Number(form.base_price) || 0;
  const discountAmt = (basePrice * discountPct) / 100;
  const priceAfter  = basePrice - discountAmt;
  const advance     = (priceAfter * form.advance_percentage) / 100;
  const fmt         = n => Math.round(n).toLocaleString('fr-TN') + ' TND';

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.client_name || !form.client_email || !form.description || !form.base_price) {
      toast.error('Veuillez remplir tous les champs requis'); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/quotes', { ...form, provider_id: provider.id });
      setQuote(res.data.data);
      toast.success('Devis créé !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création du devis');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(10,6,4,0.7)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="relative w-full max-w-lg rounded-3xl shadow-dark-lg overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}
      >
        <div className="relative px-7 py-6 overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C48C8C 0%, #D9A5A5 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <button onClick={onClose} aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
            <X size={15} />
          </button>
          <h2 className="font-display font-bold text-white text-xl">Demande de Devis</h2>
          <p className="text-white/65 text-sm mt-0.5">{provider.name}</p>
        </div>

        <div className="overflow-y-auto flex-1 p-7 scroll-thin">
          {!quote ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nom complet *">
                  <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    className="input text-sm w-full" placeholder="Votre nom" required />
                </Field>
                <Field label="Email *">
                  <input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                    className="input text-sm w-full" placeholder="email@exemple.com" required />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Téléphone">
                  <input type="tel" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                    className="input text-sm w-full" placeholder="+216 XX XXX XXX" />
                </Field>
                <Field label="Date de l'événement">
                  <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="input text-sm w-full" min={new Date().toISOString().split('T')[0]} style={{ colorScheme: 'light' }} />
                </Field>
              </div>
              <Field label="Description *">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="textarea text-sm w-full" rows={3}
                  placeholder="Décrivez votre événement : type, nombre de personnes, besoins..." required />
              </Field>
              <Field label="Budget estimé (TND) *">
                <input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                  className="input text-sm w-full" placeholder="Ex: 5000" min="100" step="100" required />
              </Field>

              {basePrice > 0 && (
                <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(217,165,165,0.06)', border: '1px solid rgba(217,165,165,0.18)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-2)' }}>Prix de base</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{fmt(basePrice)}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-2)' }}>Remise MyWedding ({discountPct}%)</span>
                      <span className="font-semibold" style={{ color: '#34D399' }}>−{fmt(discountAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid rgba(217,165,165,0.2)' }}>
                    <span style={{ color: 'var(--text)' }}>Prix après remise</span>
                    <span style={{ color: '#E8DCD5' }}>{fmt(priceAfter)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
                    <span>Acompte (30%)</span>
                    <span className="font-semibold">{fmt(advance)}</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg mt-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                  : <><FileText size={16} /> Générer mon devis</>}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
                <Check size={36} style={{ color: '#34D399' }} strokeWidth={2.5} />
              </motion.div>
              <h3 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Devis créé !</h3>
              <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
                N° <span className="font-mono font-bold" style={{ color: '#E8DCD5' }}>{quote.quote_number}</span>
              </p>
              <p className="text-sm mb-7" style={{ color: 'var(--text-2)' }}>
                L'admin examinera votre demande et vous contactera pour activer le paiement.
              </p>
              <div className="rounded-2xl p-4 mb-5 text-left space-y-2" style={{ background: 'rgba(217,165,165,0.05)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-2)' }}>Prix avant remise</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{Number(quote.price_before_discount).toLocaleString('fr-TN')} TND</span>
                </div>
                {quote.discount_percentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-2)' }}>Remise ({quote.discount_percentage}%)</span>
                    <span className="font-semibold" style={{ color: '#34D399' }}>−{Number(quote.discount_amount).toLocaleString('fr-TN')} TND</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text)' }}>Prix final</span>
                  <span style={{ color: '#E8DCD5' }}>{Number(quote.price_after_discount).toLocaleString('fr-TN')} TND</span>
                </div>
              </div>
              <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer"
                className="btn btn-primary w-full btn-lg mb-3 gap-2">
                <Download size={16} /> Télécharger le PDF
              </a>
              <button onClick={onClose} className="w-full text-sm py-2 transition-colors" style={{ color: 'var(--text-3)' }}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ─── DETAIL PAGE ─────────────────────────────────────────────── */
export default function ProviderDetailPage() {
  const { typeSlug, providerSlug }        = useParams();
  const [provider, setProvider]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/providers/${providerSlug}`)
      .then(r => { setProvider(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [providerSlug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20" style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin-slow" style={{ borderColor: '#D9A5A5', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!provider) return (
    <div className="min-h-screen flex items-center justify-center pt-20 text-center px-4" style={{ background: 'var(--bg)' }}>
      <div>
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>Prestataire introuvable</h1>
        <Link to="/prestataires" className="btn btn-primary mt-4 inline-flex gap-2">
          <ChevronLeft size={16} /> Retour
        </Link>
      </div>
    </div>
  );

  const allImages = [provider.cover_image, ...(provider.images?.map(i => i.image_url) || [])].filter(Boolean);
  const previewImages = showAllPhotos ? allImages : allImages.slice(0, 5);

  const prevImg = () => setLightboxIndex(i => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setLightboxIndex(i => (i + 1) % allImages.length);

  const fmt = n => Math.round(Number(n)).toLocaleString('fr-TN') + ' TND';

  return (
    <>
      <SEO
        title={provider.meta_title || provider.name}
        description={provider.meta_description || provider.short_description || provider.description?.slice(0, 160)}
      />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="relative mt-16 overflow-hidden" style={{ height: '52vh', minHeight: '360px', maxHeight: '520px', background: 'var(--s3)' }}>
        {provider.cover_image ? (
          <img src={provider.cover_image} alt={provider.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            {TYPE_ICONS[typeSlug] || '✦'}
          </div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,9,9,0.85) 0%, rgba(13,9,9,0.3) 50%, rgba(13,9,9,0.1) 100%)' }} />

        {/* Back button */}
        <Link to={`/prestataires/${typeSlug}`}
          className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={15} /> Retour
        </Link>

        {/* Name + meta overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-10 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(217,165,165,0.25)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.4)', backdropFilter: 'blur(8px)' }}>
                {TYPE_ICONS[typeSlug]} {provider.type_name}
              </span>
              {provider.is_featured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.25)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.4)' }}>
                  ⭐ Recommandé
                </span>
              )}
              {provider.discount_percentage > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.25)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.4)' }}>
                  −{provider.discount_percentage}% remise exclusive
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-white mb-2"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.03em', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
              {provider.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              {provider.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: '#E8DCD5' }} />
                  {provider.city}{provider.governorate ? `, ${provider.governorate}` : ''}
                </span>
              )}
              {provider.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill={i < Math.floor(provider.rating) ? '#D9A5A5' : 'none'}
                      style={{ color: i < Math.floor(provider.rating) ? '#D9A5A5' : 'rgba(255,255,255,0.4)' }} />
                  ))}
                  <span className="ml-1">{Number(provider.rating).toFixed(1)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK FACTS BAR ───────────────────────────────────── */}
      <div style={{ background: 'var(--s2)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-5 sm:gap-8 overflow-x-auto scroll-thin">
          {provider.rating > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13}
                    fill={i < Math.round(provider.rating) ? '#D9A5A5' : 'none'}
                    style={{ color: i < Math.round(provider.rating) ? '#D9A5A5' : 'var(--text-3)' }} />
                ))}
              </div>
              <span className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{Number(provider.rating).toFixed(1)}</span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>/5</span>
            </div>
          )}
          {provider.city && <>
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: 'var(--text-2)' }}>
              <MapPin size={13} style={{ color: '#D9A5A5' }} />
              <span>{provider.city}{provider.governorate ? `, ${provider.governorate}` : ''}</span>
            </div>
          </>}
          {allImages.length > 0 && <>
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: 'var(--text-2)' }}>
              <span>📸</span><span>{allImages.length} photo{allImages.length > 1 ? 's' : ''}</span>
            </div>
          </>}
          {provider.services?.length > 0 && <>
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: 'var(--text-2)' }}>
              <span>🎯</span><span>{provider.services.length} service{provider.services.length > 1 ? 's' : ''}</span>
            </div>
          </>}
          {provider.is_featured && <>
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <span className="badge badge-amber flex-shrink-0">⭐ Recommandé</span>
          </>}
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 lg:pb-24" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── MAIN COLUMN ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* About */}
            {provider.description && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center gap-3"
                  style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(217,165,165,0.12)', border: '1px solid rgba(217,165,165,0.2)' }}>
                    <span className="text-sm">✦</span>
                  </div>
                  <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>À propos</h2>
                </div>
                <div className="p-6" style={{ background: 'var(--s2)' }}>
                  {provider.short_description && (
                    <p className="font-display text-base font-medium leading-relaxed mb-5 pb-5 italic"
                      style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                      « {provider.short_description} »
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-2)', lineHeight: '1.9' }}>
                    {provider.description}
                  </p>
                </div>
              </section>
            )}

            {/* Photo gallery */}
            {allImages.length > 0 && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(217,165,165,0.12)', border: '1px solid rgba(217,165,165,0.2)' }}>
                      <span className="text-sm">📸</span>
                    </div>
                    <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
                      Photos
                      <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-3)' }}>({allImages.length})</span>
                    </h2>
                  </div>
                  {allImages.length > 5 && !showAllPhotos && (
                    <button onClick={() => setShowAllPhotos(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ color: '#D9A5A5', background: 'rgba(217,165,165,0.08)', border: '1px solid rgba(217,165,165,0.2)' }}>
                      <GalleryHorizontal size={13} /> Voir toutes ({allImages.length})
                    </button>
                  )}
                </div>
                <div className="p-4" style={{ background: 'var(--s2)' }}>
                  <div className={`grid gap-2 ${allImages.length === 1 ? 'grid-cols-1' : allImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                    {previewImages.map((img, i) => {
                      const isHero = i === 0 && allImages.length >= 3;
                      return (
                        <button key={i} onClick={() => setLightboxIndex(i)}
                          className={`overflow-hidden rounded-xl group aspect-[4/3] ${isHero ? 'md:row-span-2 md:aspect-[1/2]' : ''}`}
                          style={{ background: 'var(--s3)' }}>
                          <img src={img} alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </button>
                      );
                    })}
                  </div>
                  {allImages.length > 5 && showAllPhotos && (
                    <button onClick={() => setShowAllPhotos(false)}
                      className="mt-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                      Voir moins
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Services */}
            {provider.services?.length > 0 && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center gap-3"
                  style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(217,165,165,0.12)', border: '1px solid rgba(217,165,165,0.2)' }}>
                    <span className="text-sm">🎯</span>
                  </div>
                  <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
                    Services proposés
                    <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-3)' }}>({provider.services.length})</span>
                  </h2>
                </div>
                <div className="p-4" style={{ background: 'var(--s2)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {provider.services.map(s => (
                      <div key={s.id} className="flex items-start gap-3 rounded-xl p-4"
                        style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(217,165,165,0.12)', border: '1px solid rgba(217,165,165,0.2)' }}>
                          <Check size={13} style={{ color: '#D9A5A5' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>{s.service_name}</p>
                            {s.price && (
                              <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(217,165,165,0.15)', color: '#E8DCD5' }}>
                                {Number(s.price).toLocaleString('fr-TN')} TND
                              </span>
                            )}
                          </div>
                          {s.description && (
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-3)' }}>{s.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Bottom CTA band */}
            <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(196,140,140,0.1), rgba(217,165,165,0.04))', border: '1px solid rgba(217,165,165,0.18)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text)' }}>
                    Intéressé par {provider.name} ?
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                    Obtenez une offre sur mesure, gratuite et sans engagement.
                  </p>
                </div>
                <button onClick={() => setShowQuoteModal(true)}
                  className="flex-shrink-0 btn btn-primary gap-2">
                  <FileText size={14} /> Demander un devis
                </button>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ─────────────────────────────────── */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">

              {/* CTA card */}
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-2)' }}>
                <div className="p-5 space-y-4" style={{ background: 'linear-gradient(135deg, rgba(196,140,140,0.12), rgba(217,165,165,0.06))' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(217,165,165,0.15)', border: '1px solid rgba(217,165,165,0.25)' }}>
                      <FileText size={15} style={{ color: '#E8DCD5' }} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm leading-snug mb-1" style={{ color: 'var(--text)' }}>
                        Tarification sur devis
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        Chaque prestation est unique. Recevez une offre personnalisée en quelques minutes, gratuitement.
                      </p>
                    </div>
                  </div>

                  {provider.discount_percentage > 0 && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <Check size={13} style={{ color: '#34D399' }} className="flex-shrink-0" />
                      <p className="text-xs font-semibold" style={{ color: '#34D399' }}>
                        Remise exclusive de {provider.discount_percentage}% via MyWedding incluse
                      </p>
                    </div>
                  )}

                  <button onClick={() => setShowQuoteModal(true)}
                    className="btn btn-primary w-full gap-2 py-3 hidden lg:flex">
                    <FileText size={15} /> Obtenir un devis gratuit
                  </button>
                </div>

                {/* Trust signals */}
                <div className="px-5 py-3 space-y-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
                  {[
                    'Devis 100% gratuit & sans engagement',
                    'Réponse sous 24h',
                    'Prestataire vérifié MyWedding',
                  ].map(text => (
                    <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                      <span className="font-bold" style={{ color: '#34D399' }}>✓</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact card */}
              {(provider.phone || provider.email || provider.website || provider.address) && (
                <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>Contact</h3>
                  <div className="space-y-3">
                    {provider.phone && (
                      <a href={`tel:${provider.phone}`} className="flex items-center gap-3 text-sm group"
                        style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(217,165,165,0.1)' }}>
                          <Phone size={13} style={{ color: '#E8DCD5' }} />
                        </div>
                        <span className="group-hover:text-[#E8DCD5] transition-colors">{provider.phone}</span>
                      </a>
                    )}
                    {provider.email && (
                      <a href={`mailto:${provider.email}`} className="flex items-center gap-3 text-sm group"
                        style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(217,165,165,0.1)' }}>
                          <Mail size={13} style={{ color: '#E8DCD5' }} />
                        </div>
                        <span className="truncate group-hover:text-[#E8DCD5] transition-colors">{provider.email}</span>
                      </a>
                    )}
                    {provider.website && (
                      <a href={provider.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(217,165,165,0.1)' }}>
                          <Globe size={13} style={{ color: '#E8DCD5' }} />
                        </div>
                        <span className="flex items-center gap-1 group-hover:text-[#E8DCD5] transition-colors">
                          Site web <ExternalLink size={10} />
                        </span>
                      </a>
                    )}
                    {provider.address && (
                      <div className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(217,165,165,0.1)' }}>
                          <MapPin size={13} style={{ color: '#E8DCD5' }} />
                        </div>
                        <span>{provider.address}{provider.city ? `, ${provider.city}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── MOBILE STICKY CTA ─────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3"
        style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{provider.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>Tarif disponible sur devis</p>
          </div>
          <button onClick={() => setShowQuoteModal(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', boxShadow: '0 4px 16px rgba(217,165,165,0.35)' }}>
            <FileText size={14} /> Devis gratuit
          </button>
        </div>
      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxIndex(null)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
              <X size={20} />
            </button>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </p>
            {allImages.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prevImg(); }}
                  className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                  <ChevronLeft size={22} />
                </button>
                <button onClick={e => { e.stopPropagation(); nextImg(); }}
                  className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                  <ChevronRight size={22} />
                </button>
              </>
            )}
            <img src={allImages[lightboxIndex]} alt="Vue agrandie"
              className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuoteModal && <QuoteModal provider={provider} onClose={() => setShowQuoteModal(false)} />}
      </AnimatePresence>
    </>
  );
}
