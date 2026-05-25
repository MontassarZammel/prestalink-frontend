import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Download, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, ClipboardList, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import EventBriefModal from '../../components/client/EventBriefModal';
import useUiStore from '../../store/uiStore';

const STATUS_CONFIG = {
  draft:    { label: 'Brouillon',  Icon: Clock,         cls: 'badge badge-gray' },
  sent:     { label: 'Envoyé',     Icon: AlertCircle,   cls: 'badge badge-blue' },
  accepted: { label: 'Accepté',    Icon: CheckCircle,   cls: 'badge badge-green' },
  rejected: { label: 'Refusé',     Icon: XCircle,       cls: 'badge badge-red' },
  expired:  { label: 'Expiré',     Icon: Clock,         cls: 'badge badge-gray' },
};

export default function MyQuotesPage() {
  const { promoVisible } = useUiStore();
  const pt = 64 + (promoVisible ? 36 : 0) + 32;
  const [quotes, setQuotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [briefQuote, setBriefQuote] = useState(null);
  const [reviewQuote, setReviewQuote] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('lastQuotesVisit', String(Date.now()));
    api.get('/quotes/my')
      .then(r => { setQuotes(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title="Mes Devis" description="Consultez et gérez vos devis sur MyWedding" />

      <div className="min-h-screen pb-20 px-4 sm:px-6 relative" style={{ background: 'var(--bg)', paddingTop: pt }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 65%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.04em' }}>
                Mes Devis
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{quotes.length} devis au total</p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl h-44 skeleton" />)}
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-24 rounded-3xl" style={{ background: 'rgba(255,220,150,0.03)', border: '1px solid var(--border)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
                  <FileText size={28} style={{ color: '#E8DCD5' }} />
                </div>
                <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>Aucun devis pour le moment</h2>
                <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>Demandez votre premier devis auprès d'un prestataire</p>
                <Link to="/prestataires" className="btn btn-primary gap-2">
                  Trouver un prestataire <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote, i) => {
                  const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                  const StatusIcon = cfg.Icon;
                  return (
                    <motion.div key={quote.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border)' }}>
                      <div className="p-6">
                        {/* Top row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                          <div>
                            <div className="flex items-center flex-wrap gap-2.5 mb-2">
                              <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg"
                                style={{ background: 'rgba(217,165,165,0.1)', color: '#E8DCD5' }}>
                                {quote.quote_number}
                              </span>
                              <span className={cfg.cls}>
                                <StatusIcon size={10} /> {cfg.label}
                              </span>
                            </div>
                            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>{quote.provider_name}</h2>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{quote.type_name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs mb-1" style={{ color: 'var(--text-2)' }}>Prix final</p>
                            <p className="font-display text-2xl font-bold" style={{ color: '#E8DCD5' }}>
                              {Number(quote.price_after_discount).toLocaleString('fr-TN')}
                              <span className="text-sm ml-1 font-normal" style={{ color: 'var(--text-2)' }}>TND</span>
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                              Avant : <span className="line-through">{Number(quote.price_before_discount).toLocaleString('fr-TN')} TND</span>
                            </p>
                          </div>
                        </div>

                        {/* Price grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 rounded-xl"
                          style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border)' }}>
                          {[
                            { label: 'Remise', val: `−${quote.discount_percentage}%`, color: '#34D399' },
                            { label: 'Économie', val: `${Number(quote.discount_amount).toLocaleString('fr-TN')} TND`, color: '#34D399' },
                            { label: `Acompte (${quote.advance_percentage}%)`, val: `${Number(quote.advance_payment).toLocaleString('fr-TN')} TND`, color: '#E8DCD5' },
                            {
                              label: 'Paiement',
                              val: quote.payment_status === 'paid' ? '✓ Soldé' : quote.payment_status === 'partial' ? '✓ Acompte' : 'En attente',
                              color: quote.payment_status === 'paid' ? '#34D399' : quote.payment_status === 'partial' ? '#FBBF24' : 'var(--text-2)',
                            },
                          ].map(({ label, val, color }) => (
                            <div key={label}>
                              <p className="text-xs mb-1" style={{ color: 'var(--text-2)' }}>{label}</p>
                              <p className="text-sm font-bold font-display" style={{ color }}>{val}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: 'var(--text-2)' }}>{quote.description}</p>

                        {/* Avis prompt — visible pour tout devis envoyé ou accepté */}
                        {(quote.status === 'sent' || quote.status === 'accepted' || quote.payment_status === 'partial' || quote.payment_status === 'paid') && (
                          <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 mb-4"
                            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(245,158,11,0.12)' }}>
                                <Star size={14} style={{ color: '#F59E0B' }} fill="#F59E0B" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold font-display" style={{ color: 'var(--text)' }}>
                                  Votre avis sur {quote.provider_name}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                                  Partagez votre expérience pour aider les autres couples
                                </p>
                              </div>
                            </div>
                            <button onClick={() => { setReviewQuote(quote); setReviewForm({ rating: 5, comment: '' }); }}
                              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                              <Star size={12} /> Donner mon avis
                            </button>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4"
                          style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-2)' }}>
                            <span>Créé le {new Date(quote.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span style={{ color: 'var(--text-3)' }}>·</span>
                            <span>Valide jusqu'au {new Date(quote.valid_until).toLocaleDateString('fr-TN', { day: 'numeric', month: 'long' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer"
                              className="btn btn-outline btn-sm gap-1.5">
                              <Download size={13} /> PDF
                            </a>
                            {quote.payment_enabled && quote.payment_status === 'pending' && (
                              <Link to={`/payment/${quote.id}`} className="btn btn-primary btn-sm gap-1.5">
                                <CreditCard size={13} /> Payer l'acompte
                              </Link>
                            )}
                            {(quote.payment_status === 'partial' || quote.payment_status === 'paid') && (
                              <button onClick={() => setBriefQuote(quote)}
                                className="btn btn-outline btn-sm gap-1.5"
                                style={{ borderColor: 'rgba(217,165,165,0.35)', color: '#D9A5A5' }}>
                                <ClipboardList size={13} /> Ordre de mission
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {briefQuote && (
        <EventBriefModal
          quoteId={briefQuote.id}
          quoteName={briefQuote.provider_name || briefQuote.description}
          onClose={() => setBriefQuote(null)}
        />
      )}

      {reviewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/60" onClick={() => setReviewQuote(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>
            <button onClick={() => setReviewQuote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}>
              <XCircle size={18} />
            </button>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Laissez un avis</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{reviewQuote.provider_name || reviewQuote.description}</p>

            {/* Star picker */}
            <div className="flex gap-2 mb-5">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                  className="transition-transform hover:scale-110">
                  <Star size={28} fill={n <= reviewForm.rating ? '#F59E0B' : 'none'}
                    stroke={n <= reviewForm.rating ? '#F59E0B' : 'rgba(255,255,255,0.3)'} />
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              placeholder="Partagez votre expérience... (optionnel)"
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all mb-5"
              style={{ background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />

            <div className="flex gap-3">
              <button onClick={() => setReviewQuote(null)}
                className="flex-1 btn btn-outline">
                Annuler
              </button>
              <button disabled={reviewLoading}
                onClick={async () => {
                  setReviewLoading(true);
                  try {
                    await api.post(`/providers/${reviewQuote.provider_id}/reviews`, {
                      rating: reviewForm.rating,
                      comment: reviewForm.comment,
                      quote_id: reviewQuote.id,
                    });
                    toast.success('Avis soumis ! Il sera publié après modération.');
                    setReviewQuote(null);
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Erreur lors de la soumission');
                  } finally {
                    setReviewLoading(false);
                  }
                }}
                className="flex-1 btn btn-primary gap-2">
                {reviewLoading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Star size={14} /> Soumettre</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
