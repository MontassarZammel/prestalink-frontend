import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Shield, ArrowRight, CheckCircle, XCircle, Zap, Lock, FileText } from 'lucide-react';
import EventBriefModal from '../../components/client/EventBriefModal';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const GATEWAY_INFO = {
  clictopay: {
    name: 'Payer par carte bancaire',
    desc: 'Visa · Mastercard · Cartes bancaires tunisiennes',
    icon: '💳',
    color: '#D9A5A5',
    bg: 'rgba(217,165,165,0.08)',
    border: 'rgba(217,165,165,0.3)',
  },
  ...(IS_DEV ? {
    test: {
      name: 'Paiement test (dev)',
      desc: 'Simule un paiement réussi instantanément',
      icon: '🧪',
      color: '#34D399',
      bg: 'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.2)',
    },
  } : {}),
};

export function PaymentPage() {
  const { promoVisible } = useUiStore();
  const pt = 64 + (promoVisible ? 36 : 0) + 32;
  const { quoteId }  = useParams();
  const [quote, setQuote]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get(`/quotes/${quoteId}/summary`)
      .then(r => setQuote(r.data.data))
      .catch(() => setError('Devis introuvable ou paiement non activé pour ce devis.'))
      .finally(() => setLoading(false));
  }, [quoteId]);

  const initiatePayment = async gateway => {
    setPaying(gateway);
    try {
      const res = await api.post(`/payments/${gateway}/initiate`, { quote_id: quoteId });
      const payUrl = res.data.data?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        toast.error("Impossible d'initialiser le paiement");
        setPaying(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du paiement');
      setPaying(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-slow"
        style={{ borderColor: '#D9A5A5', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-sm">
        <XCircle size={48} className="mx-auto mb-4" style={{ color: '#E8DCD5' }} />
        <h1 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>Paiement indisponible</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>{error}</p>
        <Link to="/mes-devis" className="btn btn-primary">Voir mes devis</Link>
      </div>
    </div>
  );

  const alreadyPaid = quote?.payment_status === 'completed';

  return (
    <>
      <SEO title="Paiement sécurisé — PrestaLink" description="Finalisez votre acompte de manière sécurisée." />
      <div className="min-h-screen pb-16 px-4 relative" style={{ background: 'var(--bg)', paddingTop: pt }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,165,165,0.08), transparent 65%)', filter: 'blur(60px)' }} />
        </div>

        <div className="relative max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Header */}
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
                <CreditCard size={28} style={{ color: '#E8DCD5' }} />
              </div>
              <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
                Paiement sécurisé
              </h1>
              {quote?.provider_name && (
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>{quote.provider_name}</p>
              )}
            </div>

            {/* Quote summary */}
            {quote && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Devis N°</p>
                    <p className="font-mono font-bold text-sm" style={{ color: '#E8DCD5' }}>{quote.quote_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Acompte à régler</p>
                    <p className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>
                      {Number(quote.advance_payment).toLocaleString('fr-TN')}
                      <span className="text-sm ml-1 font-normal" style={{ color: 'var(--text-2)' }}>TND</span>
                    </p>
                  </div>
                </div>
                {alreadyPaid && (
                  <div className="mt-3 flex items-center gap-2 text-sm rounded-xl px-3 py-2"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                    <CheckCircle size={14} />
                    Acompte déjà réglé
                  </div>
                )}
              </div>
            )}

            {/* Gateways */}
            {!alreadyPaid && (
              <div className="space-y-3">
                <p className="text-xs font-bold px-1" style={{ color: 'var(--text-3)' }}>CHOISISSEZ VOTRE MODE DE PAIEMENT</p>
                {Object.entries(GATEWAY_INFO).map(([key, info]) => (
                  <motion.button key={key} onClick={() => initiatePayment(key)}
                    disabled={!!paying}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full rounded-2xl p-5 text-left transition-all disabled:opacity-60 flex items-center justify-between"
                    style={{
                      background: paying === key ? info.bg : 'var(--s2)',
                      border: `1px solid ${paying === key ? info.border : 'var(--border-2)'}`,
                    }}
                    onMouseEnter={e => {
                      if (!paying) {
                        e.currentTarget.style.background = info.bg;
                        e.currentTarget.style.borderColor = info.border;
                      }
                    }}
                    onMouseLeave={e => {
                      if (paying !== key) {
                        e.currentTarget.style.background = 'var(--s2)';
                        e.currentTarget.style.borderColor = 'var(--border-2)';
                      }
                    }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: info.bg, border: `1px solid ${info.border}` }}>
                        {info.icon}
                      </div>
                      <div>
                        <p className="font-display font-bold" style={{ color: 'var(--text)' }}>{info.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{info.desc}</p>
                      </div>
                    </div>
                    {paying === key ? (
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin-slow flex-shrink-0"
                        style={{ borderColor: info.color, borderTopColor: 'transparent' }} />
                    ) : (
                      <ArrowRight size={18} className="flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {alreadyPaid && (
              <Link to="/mes-devis" className="btn btn-primary w-full justify-center gap-2">
                Voir mes devis
              </Link>
            )}

            {/* Security footer */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                <Shield size={12} style={{ color: '#E8DCD5' }} />
                Paiement 100% sécurisé
              </div>
              <span style={{ color: 'var(--border)' }}>·</span>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                <Lock size={12} style={{ color: '#E8DCD5' }} />
                Données chiffrées
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
}

export function PaymentSuccessPage() {
  const search  = new URLSearchParams(window.location.search);
  const quoteId = search.get('quote');
  const [showBrief, setShowBrief] = useState(false);

  return (
    <>
      <SEO title="Paiement réussi — PrestaLink" />
      <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'var(--bg)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08), transparent 65%)', filter: 'blur(60px)' }} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative text-center max-w-md w-full">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
            <CheckCircle size={44} style={{ color: '#34D399' }} />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>Paiement réussi !</h1>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Votre acompte a bien été reçu. Une confirmation vous sera envoyée par email.
          </p>

          {quoteId && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mb-6 p-4 rounded-2xl text-left"
              style={{ background: 'rgba(217,165,165,0.06)', border: '1px solid rgba(217,165,165,0.2)' }}>
              <div className="flex items-center gap-3 mb-2">
                <FileText size={16} style={{ color: '#D9A5A5' }} />
                <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>Ordre de mission</p>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                Remplissez le formulaire de votre événement pour que le prestataire soit parfaitement préparé.
              </p>
              <button onClick={() => setShowBrief(true)}
                className="w-full btn btn-primary gap-2 text-sm py-2.5">
                <FileText size={14} /> Remplir l'ordre de mission
              </button>
            </motion.div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            {quoteId && (
              <Link to="/mes-devis" className="btn btn-outline gap-2">Voir mes devis</Link>
            )}
            <Link to="/" className="btn btn-primary gap-2">
              <Zap size={14} /> Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>

      {showBrief && quoteId && (
        <EventBriefModal quoteId={quoteId} quoteName="Votre événement" onClose={() => setShowBrief(false)} />
      )}
    </>
  );
}

export function PaymentFailedPage() {
  const search  = new URLSearchParams(window.location.search);
  const quoteId = search.get('quote');

  return (
    <>
      <SEO title="Paiement échoué — PrestaLink" />
      <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'var(--bg)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,165,165,0.08), transparent 65%)', filter: 'blur(60px)' }} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative text-center max-w-md">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(217,165,165,0.1)', border: '2px solid rgba(217,165,165,0.25)' }}>
            <XCircle size={44} style={{ color: '#E8DCD5' }} />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>Paiement échoué</h1>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Une erreur est survenue lors du paiement. Veuillez réessayer ou contacter le support.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {quoteId && (
              <Link to={`/payment/${quoteId}`} className="btn btn-primary gap-2">Réessayer</Link>
            )}
            <Link to="/chat" className="btn btn-outline gap-2">Contacter le support</Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
