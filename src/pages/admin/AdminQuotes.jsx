import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, CreditCard, Eye, ChevronDown, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUS_BADGE = {
  draft:    'adm-badge adm-badge-gray',
  sent:     'adm-badge adm-badge-blue',
  accepted: 'adm-badge adm-badge-green',
  rejected: 'adm-badge adm-badge-red',
  expired:  'adm-badge adm-badge-amber',
};
const STATUS_LABELS = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré' };
const PAY_BADGE = { pending: 'adm-badge adm-badge-gray', partial: 'adm-badge adm-badge-amber', paid: 'adm-badge adm-badge-green' };
const PAY_LABELS = { pending: 'En attente', partial: 'Acompte payé', paid: 'Soldé' };

export default function AdminQuotes() {
  const [quotes, setQuotes]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [expandedId, setExpanded]   = useState(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', pagination.page);
      params.set('limit', '20');
      const res = await api.get(`/quotes/admin?${params}`);
      setQuotes(res.data.data || []);
      setPagination(p => ({ ...p, ...res.data.pagination }));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchQuotes(); }, [statusFilter, pagination.page]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/quotes/${id}/status`, { status });
      toast.success('Statut mis à jour');
      fetchQuotes();
    } catch (_) { toast.error('Erreur'); }
  };

  const enablePayment = async (id, enabled) => {
    try {
      await api.patch(`/quotes/${id}/status`, { payment_enabled: enabled ? 1 : 0 });
      toast.success(enabled ? 'Paiement activé ✓' : 'Paiement désactivé');
      fetchQuotes();
    } catch (_) { toast.error('Erreur'); }
  };

  const filtered = quotes.filter(q =>
    !search ||
    q.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.provider_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>Devis</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--adm-text2)' }}>{pagination.total} devis au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text2)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Client, numéro, prestataire..." className="adm-input pl-9 w-full text-sm" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="adm-input text-sm pr-8 appearance-none min-w-[160px]"
            style={{ background: 'var(--adm-surface2)' }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text2)' }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface2)' }}>
                {['Numéro', 'Client', 'Prestataire', 'Montant', 'Statut', 'Paiement', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3.5 px-5 text-xs font-bold uppercase tracking-wider font-display"
                    style={{ color: 'var(--adm-text2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-4 px-5"><div className="h-4 rounded skeleton-adm" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm" style={{ color: 'var(--adm-text2)' }}>
                    Aucun devis trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(q => (
                  <React.Fragment key={q.id}>
                    <tr className="border-b transition-colors"
                      style={{ borderColor: 'var(--adm-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td className="py-4 px-5 font-mono text-primary-400 text-xs font-bold">{q.quote_number}</td>
                      <td className="py-4 px-5">
                        <p className="font-semibold font-display" style={{ color: 'var(--adm-text)' }}>{q.client_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text2)' }}>{q.client_email}</p>
                      </td>
                      <td className="py-4 px-5 text-sm" style={{ color: 'var(--adm-text2)' }}>{q.provider_name}</td>
                      <td className="py-4 px-5">
                        <p className="text-emerald-400 font-semibold font-display">{Number(q.price_after_discount).toLocaleString('fr-TN')} TND</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text2)' }}>Acompte: {Number(q.advance_payment).toLocaleString('fr-TN')} TND</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="relative">
                          <select value={q.status} onChange={e => updateStatus(q.id, e.target.value)}
                            className={`${STATUS_BADGE[q.status]} cursor-pointer appearance-none pr-5 focus:outline-none`}
                            style={{ background: 'transparent', border: 'none' }}>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                              <option key={v} value={v} style={{ background: 'var(--adm-surface2)', color: 'var(--adm-text)' }}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={PAY_BADGE[q.payment_status] || 'adm-badge adm-badge-gray'}>
                          {PAY_LABELS[q.payment_status] || q.payment_status}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpanded(expandedId === q.id ? null : q.id)}
                            title="Détails"
                            className="p-2 rounded-xl border transition-all"
                            style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#E8DCD5'; e.currentTarget.style.background = 'rgba(217,165,165,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.background = ''; }}>
                            <Eye size={13} />
                          </button>
                          <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noopener noreferrer"
                            title="Télécharger PDF"
                            className="p-2 rounded-xl border transition-all"
                            style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#34D399'; e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.background = ''; }}>
                            <Download size={13} />
                          </a>
                          <button
                            onClick={() => enablePayment(q.id, !q.payment_enabled)}
                            title={q.payment_enabled ? 'Désactiver paiement' : 'Activer paiement'}
                            className="p-2 rounded-xl border transition-all"
                            style={{
                              color: q.payment_enabled ? '#34D399' : 'var(--adm-text2)',
                              borderColor: q.payment_enabled ? 'rgba(52,211,153,0.3)' : 'var(--adm-border)',
                              background: q.payment_enabled ? 'rgba(16,185,129,0.08)' : '',
                            }}
                            onMouseEnter={e => { if (!q.payment_enabled) { e.currentTarget.style.color = '#34D399'; e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; } }}
                            onMouseLeave={e => { if (!q.payment_enabled) { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.background = ''; } }}>
                            <CreditCard size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedId === q.id && (
                        <tr key={`${q.id}-exp`}>
                          <td colSpan={7} className="px-5 py-0" style={{ borderBottom: `1px solid var(--adm-border)` }}>
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden">
                              <div className="py-4 rounded-xl my-2 px-4 grid grid-cols-2 md:grid-cols-4 gap-4"
                                style={{ background: 'var(--adm-surface2)', border: `1px solid var(--adm-border)` }}>
                                <div>
                                  <p className="text-xs mb-1 font-display font-semibold" style={{ color: 'var(--adm-text2)' }}>Prix avant remise</p>
                                  <p className="text-sm font-semibold font-display" style={{ color: 'var(--adm-text)' }}>{Number(q.price_before_discount).toLocaleString('fr-TN')} TND</p>
                                </div>
                                <div>
                                  <p className="text-xs mb-1 font-display font-semibold" style={{ color: 'var(--adm-text2)' }}>Remise ({q.discount_percentage}%)</p>
                                  <p className="text-sm font-semibold text-emerald-400 font-display">−{Number(q.discount_amount).toLocaleString('fr-TN')} TND</p>
                                </div>
                                <div>
                                  <p className="text-xs mb-1 font-display font-semibold" style={{ color: 'var(--adm-text2)' }}>Prix final</p>
                                  <p className="text-sm font-bold text-primary-400 font-display">{Number(q.price_after_discount).toLocaleString('fr-TN')} TND</p>
                                </div>
                                <div>
                                  <p className="text-xs mb-1 font-display font-semibold" style={{ color: 'var(--adm-text2)' }}>Paiement activé</p>
                                  <p className={`text-sm font-semibold ${q.payment_enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {q.payment_enabled ? '✓ Oui' : '✗ Non'}
                                  </p>
                                </div>
                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-xs mb-1 font-display font-semibold" style={{ color: 'var(--adm-text2)' }}>Description</p>
                                  <p className="text-xs leading-relaxed" style={{ color: 'var(--adm-text)' }}>{q.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
              className="w-10 h-10 rounded-xl text-sm font-semibold font-display transition-all border"
              style={{
                background: pagination.page === i + 1 ? 'linear-gradient(135deg,#D9A5A5,#F43F5E)' : 'var(--adm-surface2)',
                color: pagination.page === i + 1 ? 'white' : 'var(--adm-text2)',
                borderColor: pagination.page === i + 1 ? 'transparent' : 'var(--adm-border)',
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
