import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, Ban, Download, Send, Percent, Calendar, Users, Layers, Eye, FileText, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPE_ICONS = {
  traiteurs: '🍽️', photographes: '📸', decorateurs: '💐',
  animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️',
};

const STATUS_CFG = {
  pending:          { label: 'En attente',          color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  Icon: Clock },
  quoted:           { label: 'Devis envoyé',         color: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  Icon: Check },
  cancelled:        { label: 'Annulée',              color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   Icon: Ban },
  date_unavailable: { label: 'Date non disponible', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', Icon: Ban },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      <c.Icon size={11} /> {c.label}
    </span>
  );
}

const fmtMoney = n => Math.round(n).toLocaleString('fr-TN') + ' TND';
const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
const fmtShort = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

const autoPrice = r => {
  if (r.price_per_person && r.guest_count)
    return Math.round(Number(r.price_per_person) * Number(r.guest_count));
  if (r.type_slug === 'photographes' && r.standard_fee && Number(r.standard_fee) > 0)
    return Number(r.standard_fee);
  if (r.price_min && Number(r.price_min) > 0)
    return Number(r.price_min);
  return '';
};

/* ── SHARED MODAL SHELL ─────────────────────────────────────────── */
function ModalShell({ title, subtitle, badge, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(6,3,2,0.8)' }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden max-h-[94vh] flex flex-col shadow-2xl"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>

        {/* Gradient header */}
        <div className="px-7 pt-6 pb-5 flex-shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#2A1010 0%,#1A0A0A 100%)', borderBottom: '1px solid rgba(217,165,165,0.15)' }}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(rgba(217,165,165,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-start justify-between">
            <div>
              {badge && <div className="mb-2">{badge}</div>}
              <h2 className="font-display text-xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</p>}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <X size={14} />
            </button>
          </div>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

/* ── SUCCESS STATE ──────────────────────────────────────────────── */
function SuccessState({ quoteNumber, email, pdfUrl, onClose }) {
  return (
    <div className="p-8 text-center space-y-5">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
        style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
        <Check size={36} style={{ color: '#34D399' }} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Devis envoyé !</h3>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          <span className="font-mono font-bold" style={{ color: '#E8DCD5' }}>{quoteNumber}</span> — envoyé à <strong>{email}</strong>
        </p>
      </div>
      <div className="flex gap-3">
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn btn-primary gap-2 justify-center">
          <Download size={15} /> Voir le PDF
        </a>
        <button onClick={onClose} className="flex-1 btn btn-outline">Fermer</button>
      </div>
    </div>
  );
}

/* ── SINGLE REQUEST MODAL ─────────────────────────────────────────── */
function RequestModal({ request, onClose, onUpdate }) {
  const estimate = autoPrice(request);

  const [generated, setGenerated] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [cancelLoad, setCancelLoad] = useState(false);
  const [declineLoad, setDeclineLoad] = useState(false);
  const [price, setPrice]         = useState(estimate);
  const [discPct, setDiscPct]     = useState(15);
  const [advPct, setAdvPct]       = useState(30);
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes]         = useState('');

  const base     = Number(price) || 0;
  const discAmt  = Math.round((base * Number(discPct)) / 100);
  const net      = base - discAmt;
  const advance  = Math.round(net * Number(advPct) / 100);
  const solde    = net - advance;

  const handleCancel = async () => {
    setCancelLoad(true);
    try {
      await api.patch(`/quote-requests/${request.id}/status`, { status: 'cancelled' });
      onUpdate(); toast.success('Demande annulée'); onClose();
    } catch { toast.error('Erreur'); }
    setCancelLoad(false);
  };

  const handleDeclineDate = async () => {
    if (!window.confirm('Confirmer que la date n\'est pas disponible ? Le client sera notifié par email.')) return;
    setDeclineLoad(true);
    try {
      await api.post(`/quote-requests/${request.id}/decline-date`);
      onUpdate(); toast.success('Client notifié — date libérée'); onClose();
    } catch { toast.error('Erreur'); }
    setDeclineLoad(false);
  };

  const handleGenerate = async e => {
    e.preventDefault();
    if (!price || base <= 0) { toast.error('Entrez le prix de base'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/quote-requests/${request.id}/generate-quote`, {
        base_price: base, discount_percentage: discPct,
        advance_percentage: advPct, valid_until_days: validDays, notes,
      });
      setGenerated(res.data.data);
      onUpdate();
      toast.success('Devis généré et envoyé !');
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setLoading(false);
  };

  if (generated) {
    return (
      <ModalShell title={request.client_name} subtitle={request.client_email} onClose={onClose}>
        <SuccessState quoteNumber={generated.quote_number} email={request.client_email} pdfUrl={generated.pdf_url} onClose={onClose} />
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={request.client_name}
      subtitle={`${request.client_email}${request.client_phone ? ' · ' + request.client_phone : ''}`}
      badge={<StatusBadge status={request.status} />}
      onClose={onClose}>

      <form onSubmit={handleGenerate} className="overflow-y-auto flex-1 p-6 space-y-5 scroll-thin">

        {/* Provider card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'var(--s3)' }}>
            <span className="text-2xl">{TYPE_ICONS[request.type_slug] || '✦'}</span>
            <div>
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{request.provider_name}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {request.package_name && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(217,165,165,0.12)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.25)' }}>
                    {request.package_name}
                  </span>
                )}
                {request.event_date && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                    <Calendar size={10} /> {fmtDate(request.event_date)}
                  </span>
                )}
                {request.guest_count && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                    <Users size={10} /> {request.guest_count} personnes
                  </span>
                )}
              </div>
            </div>
          </div>

          {request.notes && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Notes client : <span style={{ color: 'var(--text-2)' }}>{request.notes}</span></p>
            </div>
          )}
          {request.description && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Projet : <span style={{ color: 'var(--text-2)' }}>{request.description}</span></p>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Tarification</p>

          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-3">
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Prix de base (TND) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="input w-full" min="0" step="100" placeholder="0" required />
              {estimate > 0 && Number(price) !== estimate && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Estimation : ~{estimate.toLocaleString('fr-TN')} TND</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Remise (%)</label>
              <div className="relative">
                <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input type="number" value={discPct} onChange={e => setDiscPct(e.target.value)}
                  className="input w-full pl-7" min="0" max="100" />
              </div>
            </div>
          </div>

          {base > 0 && (
            <div className="space-y-2 pt-1">
              {discAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-2)' }}>Remise ({discPct}%)</span>
                  <span style={{ color: '#34D399' }}>−{fmtMoney(discAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text)' }}>Total TTC</span>
                <span style={{ color: '#E8DCD5' }}>{fmtMoney(net)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Acompte + validité */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-bold" style={{ color: 'var(--text-2)' }}>Acompte (%)</label>
            <div className="relative">
              <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input type="number" value={advPct} onChange={e => setAdvPct(Number(e.target.value))}
                className="input w-full pl-7 text-sm" min="10" max="100" />
            </div>
            {net > 0 && <p className="text-xs font-bold" style={{ color: '#C48C8C' }}>{fmtMoney(advance)}</p>}
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-bold" style={{ color: 'var(--text-2)' }}>Validité (jours)</label>
            <input type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))}
              className="input w-full text-sm" min="7" max="90" />
            {net > 0 && <p className="text-xs" style={{ color: 'var(--text-3)' }}>Solde : {fmtMoney(solde)}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Notes internes (optionnel)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="textarea w-full text-sm" rows={2} placeholder="Conditions particulières..." />
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--s3)' }}>
        {request.status === 'pending' && (
          <>
            {request.event_date && (
              <div className="rounded-lg px-3 py-2 mb-3 flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <span className="text-sm">⏳</span>
                <p className="text-xs" style={{ color: '#F59E0B' }}>
                  <span className="font-bold">Date en vérification :</span>{' '}
                  {new Date(request.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' '}— Confirmez avec le prestataire avant de générer le devis.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={handleCancel} disabled={cancelLoad}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                Annuler
              </button>
              {request.event_date && (
                <button type="button" onClick={handleDeclineDate} disabled={declineLoad}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171' }}>
                  {declineLoad
                    ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin-slow" />
                    : <Ban size={13} />}
                  Date non dispo
                </button>
              )}
              <button onClick={handleGenerate} disabled={loading || !price}
                className="flex-1 btn btn-primary gap-2 py-3">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                  : <><Send size={15} /> Générer & envoyer</>}
              </button>
            </div>
          </>
        )}
        {request.status === 'quoted' && request.quote_id && (
          <a href={`/api/quotes/${request.quote_id}/pdf`} target="_blank" rel="noopener noreferrer"
            className="flex-1 btn btn-primary gap-2 justify-center">
            <Download size={15} /> Voir le devis PDF
          </a>
        )}
        {request.status === 'date_unavailable' && (
          <div className="flex items-center gap-2 py-2">
            <Ban size={14} style={{ color: '#F87171' }} />
            <p className="text-sm font-semibold" style={{ color: '#F87171' }}>Date non disponible — client notifié par email</p>
          </div>
        )}
        {request.status === 'cancelled' && (
          <p className="flex-1 text-center text-sm py-3" style={{ color: '#EF4444' }}>Demande annulée</p>
        )}
      </div>
    </ModalShell>
  );
}

/* ── GROUP MODAL ──────────────────────────────────────────────────── */
function GroupModal({ requests, onClose, onUpdate }) {
  const first     = requests[0];
  const groupId   = first.group_id;
  const allQuoted = requests.every(r => r.status === 'quoted');

  const [generated,  setGenerated]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [cancelLoad, setCancelLoad] = useState(false);
  const [advPct,     setAdvPct]     = useState(30);
  const [validDays,  setValidDays]  = useState(30);
  const [notes,      setNotes]      = useState('');

  // Per-provider pricing state
  const [items, setItems] = useState(() =>
    requests.map(r => ({
      request_id:          r.id,
      base_price:          autoPrice(r),
      discount_percentage: 15,
    }))
  );

  const updateItem = (id, field, value) =>
    setItems(prev => prev.map(i => i.request_id === id ? { ...i, [field]: value } : i));

  const computed = useMemo(() => {
    let totalBase = 0, totalNet = 0;
    const rows = items.map(item => {
      const r      = requests.find(r => r.id === item.request_id);
      const base   = Number(item.base_price) || 0;
      const disc   = Number(item.discount_percentage) || 0;
      const discAmt = Math.round((base * disc) / 100);
      const net    = base - discAmt;
      totalBase += base;
      totalNet  += net;
      return { ...item, r, base, disc, discAmt, net };
    });
    return { rows, totalBase, totalNet, totalDiscount: totalBase - totalNet };
  }, [items, requests]);

  const advance = Math.round(computed.totalNet * Number(advPct) / 100);
  const solde   = computed.totalNet - advance;

  const handleGenerate = async e => {
    e.preventDefault();
    const empty = computed.rows.find(row => row.base <= 0);
    if (empty) {
      toast.error(`Entrez le prix pour ${empty.r?.provider_name}`);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/quote-requests/group/${groupId}/generate-quote`, {
        items: items.map(i => ({ request_id: i.request_id, base_price: Number(i.base_price), discount_percentage: Number(i.discount_percentage) })),
        advance_percentage: advPct, valid_until_days: validDays, notes,
      });
      setGenerated(res.data.data);
      onUpdate();
      toast.success('Devis groupé généré et envoyé !');
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setLoading(false);
  };

  const handleCancelAll = async () => {
    setCancelLoad(true);
    try {
      await Promise.all(requests.map(r => api.patch(`/quote-requests/${r.id}/status`, { status: 'cancelled' })));
      onUpdate(); toast.success('Groupe annulé'); onClose();
    } catch { toast.error('Erreur'); }
    setCancelLoad(false);
  };

  if (generated) {
    return (
      <ModalShell
        title={first.client_name} subtitle={first.client_email}
        badge={<span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,165,165,0.15)', color: '#D9A5A5', border: '1px solid rgba(217,165,165,0.3)' }}><Layers size={10} /> {requests.length} prestataires</span>}
        onClose={onClose}>
        <SuccessState quoteNumber={generated.quote_number} email={first.client_email} pdfUrl={generated.pdf_url} onClose={onClose} />
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={first.client_name}
      subtitle={`${first.client_email}${first.client_phone ? ' · ' + first.client_phone : ''}`}
      badge={
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(217,165,165,0.15)', color: '#D9A5A5', border: '1px solid rgba(217,165,165,0.3)' }}>
          <Layers size={10} /> {requests.length} prestataires sélectionnés
        </span>
      }
      onClose={onClose}>

      <form onSubmit={handleGenerate} className="overflow-y-auto flex-1 scroll-thin">
        <div className="p-6 space-y-4">

          {/* Per-provider pricing cards */}
          {computed.rows.map(({ request_id, r, base, disc, discAmt, net }) => {
            const req = r;
            const estimatedPrice = autoPrice(req);
            return (
              <div key={request_id} className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}>

                {/* Provider header */}
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ background: 'var(--s3)', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{TYPE_ICONS[req.type_slug] || '✦'}</span>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{req.provider_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {req.package_name && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(217,165,165,0.1)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.2)' }}>
                            {req.package_name}
                          </span>
                        )}
                        {req.guest_count && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                            <Users size={9} /> {req.guest_count} pers.
                          </span>
                        )}
                        {req.event_date && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                            <Calendar size={9} /> {fmtDate(req.event_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {disc > 0 && base > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                      −{disc}%
                    </span>
                  )}
                </div>

                {/* Price inputs */}
                <div className="p-4">
                  <div className="grid grid-cols-5 gap-3 items-end">
                    <div className="col-span-3">
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                        Prix de base (TND) *
                      </label>
                      <input type="number"
                        value={items.find(i => i.request_id === request_id)?.base_price}
                        onChange={e => updateItem(request_id, 'base_price', e.target.value)}
                        className="input w-full text-sm" min="0" step="100" placeholder="0" />
                      {estimatedPrice > 0 && Number(items.find(i => i.request_id === request_id)?.base_price) !== estimatedPrice && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                          Estimation : ~{estimatedPrice.toLocaleString('fr-TN')} TND
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                        Remise (%)
                      </label>
                      <div className="relative">
                        <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                        <input type="number"
                          value={items.find(i => i.request_id === request_id)?.discount_percentage}
                          onChange={e => updateItem(request_id, 'discount_percentage', e.target.value)}
                          className="input w-full pl-7 text-sm" min="0" max="100" />
                      </div>
                    </div>
                  </div>

                  {/* Per-provider net */}
                  {base > 0 && (
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {discAmt > 0 ? (
                        <>
                          <span className="text-xs" style={{ color: '#34D399' }}>
                            Remise : −{discAmt.toLocaleString('fr-TN')} TND
                          </span>
                          <span className="font-display font-bold text-sm" style={{ color: '#E8DCD5' }}>
                            Net : {net.toLocaleString('fr-TN')} TND
                          </span>
                        </>
                      ) : (
                        <>
                          <span />
                          <span className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>
                            {base.toLocaleString('fr-TN')} TND
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          {computed.totalBase > 0 && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Récapitulatif</p>

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-2)' }}>Sous-total brut</span>
                  <span style={{ color: 'var(--text)' }}>{fmtMoney(computed.totalBase)}</span>
                </div>
                {computed.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#34D399' }}>Remises cumulées</span>
                    <span style={{ color: '#34D399' }}>−{fmtMoney(computed.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text)' }}>Total net</span>
                  <span style={{ color: '#E8DCD5' }}>{fmtMoney(computed.totalNet)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Acompte (%)</label>
                  <div className="relative">
                    <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input type="number" value={advPct} onChange={e => setAdvPct(Number(e.target.value))}
                      className="input w-full pl-7 text-sm" min="10" max="100" />
                  </div>
                  <p className="text-xs mt-1.5 font-bold" style={{ color: '#C48C8C' }}>{fmtMoney(advance)}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Validité (jours)</label>
                  <input type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))}
                    className="input w-full text-sm" min="7" max="90" />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>Solde : {fmtMoney(solde)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
              Notes / Conditions particulières
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="textarea w-full text-sm" rows={2}
              placeholder="Conditions de paiement, remarques..." />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--s3)' }}>
          {!allQuoted ? (
            <>
              <button type="button" onClick={handleCancelAll} disabled={cancelLoad}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                Annuler tout
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 btn btn-primary gap-2 py-3">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                  : <><Send size={15} /> Générer & envoyer le devis groupé</>}
              </button>
            </>
          ) : (
            first.quote_id && (
              <a href={`/api/quotes/${first.quote_id}/pdf`} target="_blank" rel="noopener noreferrer"
                className="flex-1 btn btn-primary gap-2 justify-center">
                <Download size={15} /> Voir le devis groupé PDF
              </a>
            )
          )}
        </div>
      </form>
    </ModalShell>
  );
}

/* ── MAIN PAGE ────────────────────────────────────────────────────── */
export default function AdminQuoteRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('all');

  const load = () => {
    setLoading(true);
    api.get('/quote-requests/admin')
      .then(r => { setRequests(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const displayGroups = useMemo(() => {
    const map = {};
    requests.forEach(r => {
      const key = r.group_id || `_${r.id}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.values(map);
  }, [requests]);

  const getStatus = g => {
    if (g.every(r => r.status === 'quoted'))    return 'quoted';
    if (g.every(r => r.status === 'cancelled')) return 'cancelled';
    return 'pending';
  };

  const filtered = filter === 'all' ? displayGroups : displayGroups.filter(g => getStatus(g) === filter);
  const counts = { all: displayGroups.length, pending: displayGroups.filter(g => getStatus(g) === 'pending').length, quoted: displayGroups.filter(g => getStatus(g) === 'quoted').length, cancelled: displayGroups.filter(g => getStatus(g) === 'cancelled').length };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-slow"
        style={{ borderColor: '#D9A5A5', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Demandes de devis</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{displayGroups.length} demande{displayGroups.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[['all','Toutes'],['pending','En attente'],['quoted','Devis envoyé'],['cancelled','Annulées']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: filter === key ? 'rgba(217,165,165,0.15)' : 'var(--s2)',
              border: `1px solid ${filter === key ? '#D9A5A5' : 'var(--border)'}`,
              color: filter === key ? '#E8DCD5' : 'var(--text-2)',
            }}>
            {label}
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: filter === key ? 'rgba(217,165,165,0.2)' : 'var(--s3)', color: 'inherit' }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ background: 'var(--s2)' }}>
            <p className="text-3xl mb-3">📭</p>
            <p className="font-display font-bold" style={{ color: 'var(--text)' }}>Aucune demande</p>
          </div>
        ) : (
          <table className="w-full" style={{ background: 'var(--s2)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Prestataire(s)', 'Date', 'Pers.', 'Statut', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((group, i) => {
                const isGroup = group.length > 1;
                const first   = group[0];
                const status  = getStatus(group);
                return (
                  <motion.tr key={first.group_id || first.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelected(isGroup ? { type: 'group', data: group } : { type: 'single', data: first })}>

                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{first.client_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{first.client_email}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      {isGroup ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(217,165,165,0.12)', color: '#D9A5A5', border: '1px solid rgba(217,165,165,0.25)' }}>
                            <Layers size={10} /> {group.length} prestataires
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {group.map(r => (
                              <span key={r.id} className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--s3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                                {TYPE_ICONS[r.type_slug] || '✦'} {r.provider_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{first.provider_name}</p>
                          {first.package_name && (
                            <span className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
                              style={{ background: 'rgba(217,165,165,0.08)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.18)' }}>
                              {first.package_name}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-2)' }}>{fmtShort(first.event_date)}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-2)' }}>{first.guest_count || '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                    <td className="px-5 py-3.5">
                      <button className="p-2 rounded-lg transition-all" style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
                        <Eye size={14} style={{ color: 'var(--text-2)' }} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selected?.type === 'single' && (
          <RequestModal request={selected.data} onClose={() => setSelected(null)} onUpdate={load} />
        )}
        {selected?.type === 'group' && (
          <GroupModal requests={selected.data} onClose={() => setSelected(null)} onUpdate={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
