import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Globe, Star, X, FileText,
  ExternalLink, ChevronLeft, ChevronRight, Check, ArrowLeft,
  Users, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useUiStore from '../../store/uiStore';

const TYPE_ICONS = {
  photographes: '📸', traiteurs: '🍽️', decorateurs: '💐',
  animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️',
};

/* ─── STAR DISPLAY ───────────────────────────────────────────── */
const StarRow = ({ rating, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={size} fill={n <= rating ? '#F59E0B' : 'none'}
        stroke={n <= rating ? '#F59E0B' : 'rgba(255,255,255,0.2)'} />
    ))}
  </div>
);

/* ─── OPTION DETAIL MODAL ────────────────────────────────────── */
function OptionDetailModal({ option, selected, onToggle, onClose }) {
  const isForfait = option.category === 'Forfait';
  const includes = (() => {
    if (!option.includes_items) return [];
    try { return JSON.parse(option.includes_items); } catch { return []; }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(10,6,4,0.75)' }} onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-dark-lg flex flex-col"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)', maxHeight: '90vh' }}>

        {/* Image header */}
        {option.image_url ? (
          <div className="relative h-52 flex-shrink-0 overflow-hidden">
            <img src={option.image_url} alt={option.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,6,4,0.8) 0%, transparent 60%)' }} />
            <button onClick={onClose} aria-label="Fermer"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
              <X size={15} />
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  {isForfait && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold mb-1 inline-block"
                      style={{ background: 'rgba(16,185,129,0.85)', color: 'white' }}>Forfait</span>
                  )}
                  <h3 className="font-display font-bold text-xl text-white leading-tight">{option.name}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-2xl text-white leading-tight">
                    {Number(option.price).toLocaleString('fr-TN')}
                    <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.7)' }}>TND</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-2 flex items-start justify-between flex-shrink-0">
            <div>
              {isForfait && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold mb-2 inline-block"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>Forfait</span>
              )}
              <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>{option.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>
                {Number(option.price).toLocaleString('fr-TN')}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-3)' }}>TND</span>
              </p>
              <button onClick={onClose} aria-label="Fermer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--s3)', color: 'var(--text-2)' }}>
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 scroll-thin">
          {option.category && (
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(147,197,253,0.1)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.2)' }}>
              {option.category}
            </span>
          )}

          {option.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{option.description}</p>
          )}

          {includes.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
                style={{ color: 'var(--text-3)' }}>
                <Check size={11} style={{ color: '#34D399' }} />
                Inclus dans ce forfait ({includes.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {includes.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--text-2)' }}>
                    <span style={{ color: '#34D399', fontSize: '9px' }}>✓</span>{item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-display font-semibold transition-all"
            style={{ background: 'var(--s3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            Fermer
          </button>
          <button onClick={() => { onToggle(); onClose(); }}
            className="flex-1 py-3 rounded-xl text-sm font-display font-bold text-white transition-all flex items-center justify-center gap-2"
            style={selected
              ? { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }
              : { background: 'linear-gradient(135deg,#60A5FA,#93C5FD)', boxShadow: '0 4px 16px rgba(147,197,253,0.3)' }}>
            {selected ? <><X size={14} /> Retirer</> : <><Check size={14} /> Ajouter</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── OPTION CARD (photographe à la carte) ──────────────────── */
function OptionCard({ option, selected, onViewDetail }) {
  const isForfait = option.category === 'Forfait';
  const includes = (() => {
    if (!option.includes_items) return [];
    try { return JSON.parse(option.includes_items); } catch { return []; }
  })();

  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
      onClick={onViewDetail}
      className="rounded-xl cursor-pointer transition-all"
      style={{
        background: selected ? 'rgba(147,197,253,0.06)' : 'var(--s3)',
        border: `1.5px solid ${selected ? '#93C5FD' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 3px rgba(147,197,253,0.08)' : 'none',
      }}>
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox / image */}
        {option.image_url ? (
          <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
            <img src={option.image_url} alt={option.name} className="w-full h-full object-cover" />
            {selected && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(147,197,253,0.55)' }}>
                <Check size={18} color="white" strokeWidth={3} />
              </div>
            )}
          </div>
        ) : (
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: selected ? '#93C5FD' : 'transparent', border: `2px solid ${selected ? '#93C5FD' : 'var(--border-2)'}` }}>
            {selected && <Check size={11} color="white" strokeWidth={3} />}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{option.name}</p>
            {isForfait && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
                Forfait
              </span>
            )}
          </div>
          {option.description && (
            <p className="text-xs mt-0.5 leading-relaxed truncate" style={{ color: 'var(--text-2)' }}>{option.description}</p>
          )}
        </div>

        {/* Price + arrow */}
        <div className="flex-shrink-0 text-right">
          <p className="font-display font-bold text-sm" style={{ color: selected ? '#93C5FD' : 'var(--text)' }}>
            {Number(option.price).toLocaleString('fr-TN')}
            <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-2)' }}> TND</span>
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>Voir détails →</p>
        </div>
      </div>
    </motion.div>
  );
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

/* ─── AVAILABILITY CALENDAR ────────────────────────────────────── */
function AvailabilityCalendar({ providerId, refreshKey = 0 }) {
  const today = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth() + 1);
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    api.get(`/providers/${providerId}/availability?month=${month}&year=${year}`)
      .then(r => setBlocked(r.data.data || []))
      .catch(() => {});
  }, [providerId, month, year, refreshKey]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay    = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
  const blockedMap  = {};
  blocked.forEach(b => { blockedMap[String(b.date).slice(0, 10)] = b.status; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = d => new Date(year, month - 1, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStr = d => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
          <ChevronLeft size={14} style={{ color: 'var(--text-2)' }} />
        </button>
        <span className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>
          {MONTHS_FR[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
          <ChevronRight size={14} style={{ color: 'var(--text-2)' }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center text-xs font-bold py-1" style={{ color: 'var(--text-3)' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const past    = isPast(d);
          const status  = blockedMap[dateStr(d)];
          const taken   = status === 'reserved' || status === 'blocked';
          const pending = status === 'pending';
          return (
            <div key={d} title={pending ? 'En cours de vérification' : taken ? 'Réservé' : ''}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium"
              style={{
                background: taken ? 'rgba(239,68,68,0.12)' : pending ? 'rgba(245,158,11,0.12)' : past ? 'transparent' : 'rgba(52,211,153,0.06)',
                color: taken ? '#EF4444' : pending ? '#F59E0B' : past ? 'var(--text-3)' : '#34D399',
                border: taken ? '1px solid rgba(239,68,68,0.2)' : pending ? '1px solid rgba(245,158,11,0.3)' : past ? '1px solid transparent' : '1px solid rgba(52,211,153,0.15)',
                opacity: past ? 0.4 : 1,
                textDecoration: past ? 'line-through' : 'none',
              }}>
              {d}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs flex-wrap" style={{ color: 'var(--text-3)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }} />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }} />
          En vérification
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }} />
          Réservé
        </span>
      </div>
    </div>
  );
}

/* ─── PACKAGE DETAIL MODAL ───────────────────────────────────────── */
function PackageDetailModal({ pkg, selected, onSelect, onClose }) {
  const originalPrice  = Number(pkg.price_per_person);
  const hasDiscount    = Number(pkg.discount_percentage) > 0;
  const effectivePrice = hasDiscount
    ? Math.round(originalPrice * (1 - Number(pkg.discount_percentage) / 100))
    : originalPrice;

  const fixedItems = (() => {
    if (Array.isArray(pkg.fixed_items)) return pkg.fixed_items;
    if (typeof pkg.fixed_items === 'string' && pkg.fixed_items.trim()) {
      try { return JSON.parse(pkg.fixed_items); } catch { return []; }
    }
    return [];
  })();

  const includes = (() => {
    if (Array.isArray(pkg.includes)) return pkg.includes;
    if (typeof pkg.includes === 'string' && pkg.includes.trim()) {
      try { return JSON.parse(pkg.includes); } catch { return []; }
    }
    return [];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(10,6,4,0.8)' }} onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)', maxHeight: '88vh' }}>

        {/* Top bar */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🍽️</span>
              <h3 className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text)' }}>
                {pkg.name}
              </h3>
            </div>
            {(pkg.pieces_count > 0) && (
              <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(196,140,140,0.12)', color: '#C48C8C', border: '1px solid rgba(196,140,140,0.25)' }}>
                {pkg.pieces_count} pièces / personne
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 transition-colors flex-shrink-0"
            style={{ background: 'var(--s3)', color: 'var(--text-2)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Price */}
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Prix par personne</p>
              {hasDiscount && (
                <p className="text-xs line-through" style={{ color: 'var(--text-3)' }}>
                  {originalPrice.toLocaleString('fr-TN')} TND
                </p>
              )}
              <p className="font-display font-bold text-2xl" style={{ color: hasDiscount ? '#34D399' : 'var(--text)' }}>
                {effectivePrice.toLocaleString('fr-TN')}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-2)' }}>TND</span>
              </p>
            </div>
            {hasDiscount && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' }}>
                -{pkg.discount_percentage}%
              </span>
            )}
          </div>

          {/* Guest range */}
          {(pkg.min_persons > 0 || pkg.max_persons > 0) && (
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                {pkg.min_persons > 0 && `À partir de ${pkg.min_persons} personnes`}
                {pkg.min_persons > 0 && pkg.max_persons > 0 && ' — '}
                {pkg.max_persons > 0 && `max. ${pkg.max_persons} personnes`}
              </p>
            </div>
          )}

          {/* Description */}
          {pkg.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {pkg.description}
            </p>
          )}

          {/* Pièces fixes */}
          {fixedItems.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--text-3)' }}>
                <span>🍽️</span>
                Pièces fixes incluses
              </p>
              <div className="space-y-2">
                {fixedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: 'rgba(196,140,140,0.15)', color: '#C48C8C' }}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Includes */}
          {includes.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--text-3)' }}>
                <Check size={12} style={{ color: '#34D399' }} />
                Inclus dans ce pack
              </p>
              <div className="flex flex-wrap gap-1.5">
                {includes.map((item, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--text-2)' }}>
                    <span style={{ color: '#34D399', fontSize: '9px' }}>✓</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { onSelect(pkg); onClose(); }}
            className="w-full py-3.5 rounded-xl font-display font-bold text-sm transition-all"
            style={{
              background: selected ? 'rgba(196,140,140,0.15)' : 'linear-gradient(135deg,#C48C8C,#B07070)',
              color: selected ? '#C48C8C' : 'white',
              border: selected ? '1.5px solid #C48C8C' : 'none',
            }}>
            {selected ? '✓ Pack sélectionné' : 'Sélectionner ce pack'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── PACKAGE CARD ──────────────────────────────────────────────── */
function PackageCard({ pkg, selected, onSelect }) {
  const [showDetail, setShowDetail] = useState(false);

  const originalPrice  = Number(pkg.price_per_person);
  const hasDiscount    = Number(pkg.discount_percentage) > 0;
  const effectivePrice = hasDiscount
    ? Math.round(originalPrice * (1 - Number(pkg.discount_percentage) / 100))
    : originalPrice;

  const fixedItems = (() => {
    if (Array.isArray(pkg.fixed_items)) return pkg.fixed_items;
    if (typeof pkg.fixed_items === 'string' && pkg.fixed_items.trim()) {
      try { return JSON.parse(pkg.fixed_items); } catch { return []; }
    }
    return [];
  })();

  return (
    <>
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
        onClick={() => setShowDetail(true)}
        className="rounded-2xl cursor-pointer transition-all overflow-hidden"
        style={{
          background: selected ? 'rgba(196,140,140,0.08)' : 'var(--s3)',
          border: `1.5px solid ${selected ? '#C48C8C' : 'var(--border)'}`,
          boxShadow: selected ? '0 0 0 3px rgba(196,140,140,0.12)' : 'none',
        }}>

        {/* Header band */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Radio */}
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{ borderColor: selected ? '#C48C8C' : 'var(--border-2)' }}>
              {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#C48C8C' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{pkg.name}</p>
              {(pkg.min_persons > 0 || pkg.max_persons > 0) && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {pkg.min_persons > 0 && `À partir de ${pkg.min_persons} pers.`}
                  {pkg.min_persons > 0 && pkg.max_persons > 0 && ' — '}
                  {pkg.max_persons > 0 && `max. ${pkg.max_persons} pers.`}
                </p>
              )}
            </div>
          </div>

          {/* Price block */}
          <div className="text-right flex-shrink-0">
            {hasDiscount && (
              <p className="text-xs line-through" style={{ color: 'var(--text-3)' }}>
                {originalPrice.toLocaleString('fr-TN')} TND
              </p>
            )}
            <p className="font-display font-bold text-lg leading-tight" style={{ color: hasDiscount ? '#34D399' : 'var(--text)' }}>
              {effectivePrice.toLocaleString('fr-TN')}
              <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-2)' }}> TND/pers</span>
            </p>
          </div>
        </div>

        {/* Pièces fixes preview */}
        {fixedItems.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {fixedItems.map((item, i) => (
              <span key={i}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(196,140,140,0.1)', border: '1px solid rgba(196,140,140,0.2)', color: 'var(--text-2)' }}>
                <span style={{ fontSize: '9px' }}>🍽️</span>
                {item}
              </span>
            ))}
          </div>
        )}

        {/* "Voir les détails" hint */}
        <div className="px-5 pb-3.5 flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {pkg.pieces_count > 0 ? `${pkg.pieces_count} pièces / personne` : ''}
          </span>
          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#C48C8C' }}>
            Voir les détails →
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <PackageDetailModal
            pkg={pkg}
            selected={selected}
            onSelect={onSelect}
            onClose={() => setShowDetail(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── QUOTE REQUEST MODAL (Traiteur) ────────────────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>{label}</label>
    {children}
  </div>
);

function QuoteRequestModal({ provider, packages, selectedOptions = [], onClose }) {
  const { user } = useAuthStore();
  const isPhotographe = provider?.type_slug === 'photographes';
  const [step, setStep]         = useState(isPhotographe || packages.length === 0 ? 'form' : 'package');
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [form, setForm] = useState({
    client_name:  user?.full_name || '',
    client_email: user?.email || '',
    client_phone: '',
    event_date:   '',
    guest_count:  '',
    notes:        '',
  });
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [availability, setAvailability] = useState([]);

  const loadAvailability = useCallback((dateStr) => {
    if (!dateStr) return;
    const [y, m] = dateStr.split('-');
    api.get(`/providers/${provider.id}/availability?month=${m}&year=${y}`)
      .then(r => setAvailability(r.data.data || []))
      .catch(() => {});
  }, [provider.id]);

  const isDateTaken   = (dateStr) => availability.some(a => String(a.date).slice(0,10) === dateStr && (a.status === 'reserved' || a.status === 'blocked'));
  const isDatePending = (dateStr) => availability.some(a => String(a.date).slice(0,10) === dateStr && a.status === 'pending');

  const effectivePkgPrice = selectedPkg ? Number(selectedPkg.price_per_person) : 0;

  const estimatedTotal = isPhotographe
    ? (selectedOptions.length > 0
        ? selectedOptions.reduce((s, o) => s + Number(o.price), 0) + Number(provider?.standard_fee || 0)
        : null)
    : (selectedPkg && form.guest_count ? effectivePkgPrice * Number(form.guest_count) : null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (isPhotographe && selectedOptions.length === 0) {
      toast.error('Veuillez sélectionner au moins une option avant de générer un devis'); return;
    }
    if (!isPhotographe && packages.length > 0 && !selectedPkg) {
      toast.error('Veuillez sélectionner un pack avant de générer un devis'); return;
    }
    if (!form.client_name || !form.client_email || !form.event_date || (!isPhotographe && !form.guest_count)) {
      toast.error('Veuillez remplir tous les champs requis'); return;
    }
    if (isDateTaken(form.event_date)) {
      toast.error('Cette date est déjà réservée, choisissez une autre date'); return;
    }
    if (isDatePending(form.event_date)) {
      toast.error('Cette date est en cours de vérification pour un autre client'); return;
    }
    setLoading(true);
    try {
      let description = form.notes || null;
      if (isPhotographe && selectedOptions.length > 0) {
        const lines = selectedOptions.map(o => `- ${o.name} : ${Number(o.price).toLocaleString('fr-TN')} TND`);
        description = `Options sélectionnées :\n${lines.join('\n')}\nTotal estimé : ${estimatedTotal?.toLocaleString('fr-TN')} TND`;
        if (form.notes) description += `\n\nNotes : ${form.notes}`;
      }
      await api.post('/quote-requests', {
        provider_id:  provider.id,
        package_id:   isPhotographe ? null : (selectedPkg?.id || null),
        ...form,
        guest_count:  isPhotographe ? null : (form.guest_count ? Number(form.guest_count) : null),
        description,
        type_slug:    provider.type_slug,
      });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(10,6,4,0.75)' }} onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="relative w-full max-w-lg rounded-3xl shadow-dark-lg overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>

        {/* Header */}
        <div className="relative px-7 py-5 overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C48C8C 0%, #D9A5A5 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <button onClick={onClose} aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
            <X size={15} />
          </button>
          <h2 className="font-display font-bold text-white text-xl">Demande de devis</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-white/70 text-sm">{provider.name}</p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
              🏷️ –15%
            </span>
          </div>

          {/* Steps */}
          {packages.length > 0 && !done && (
            <div className="flex items-center gap-2 mt-3">
              {['package', 'form'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: step === s ? 'white' : 'rgba(255,255,255,0.3)', color: step === s ? '#C48C8C' : 'white' }}>
                    {i + 1}
                  </div>
                  <span className="text-xs text-white/70">{s === 'package' ? 'Pack' : 'Informations'}</span>
                  {i < 1 && <ChevronRight size={12} className="text-white/40" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-6 scroll-thin">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
                  <Check size={36} style={{ color: '#34D399' }} strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Demande envoyée !</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
                  Votre demande a bien été transmise à notre équipe.
                </p>
                {form.event_date && (
                  <div className="rounded-xl p-3 mb-4 flex items-start gap-2.5 text-left"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <span className="text-base flex-shrink-0">⏳</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>Date en cours de vérification</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        Notre équipe va confirmer la disponibilité de votre date avec le prestataire et vous répondra sous 24h.
                      </p>
                    </div>
                  </div>
                )}
                {(selectedPkg || (isPhotographe && selectedOptions.length > 0)) && (
                  <div className="rounded-2xl p-4 mb-5 text-left"
                    style={{ background: 'rgba(217,165,165,0.06)', border: '1px solid rgba(217,165,165,0.15)' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-3)' }}>RÉCAPITULATIF</p>
                    {isPhotographe ? (
                      <div className="space-y-1">
                        {selectedOptions.map(o => (
                          <div key={o.id} className="flex justify-between text-sm">
                            <span style={{ color: 'var(--text-2)' }}>{o.name}</span>
                            <span className="font-semibold" style={{ color: 'var(--text)' }}>{Number(o.price).toLocaleString('fr-TN')} TND</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: 'var(--text-2)' }}>Pack choisi</span>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>{selectedPkg?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-2)' }}>Nombre de personnes</span>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>{form.guest_count}</span>
                        </div>
                      </>
                    )}
                    {form.event_date && (
                      <div className="flex justify-between text-sm mt-1">
                        <span style={{ color: 'var(--text-2)' }}>Date</span>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>
                          {new Date(form.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {estimatedTotal != null && (
                      <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: '1px solid rgba(217,165,165,0.2)' }}>
                        <span style={{ color: 'var(--text)' }}>Total estimé</span>
                        <span style={{ color: 'var(--text)' }}>{estimatedTotal.toLocaleString('fr-TN')} TND</span>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={onClose} className="btn btn-primary w-full">Fermer</button>
              </motion.div>

            ) : step === 'package' ? (
              <motion.div key="package" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
                  Choisissez le pack qui correspond à votre événement :
                </p>
                <div className="space-y-3">
                  {packages.map(pkg => (
                    <PackageCard key={pkg.id} pkg={pkg}
                      selected={selectedPkg?.id === pkg.id}
                      onSelect={setSelectedPkg} />
                  ))}
                </div>
                <button onClick={() => setStep('form')}
                  disabled={!selectedPkg}
                  className="btn btn-primary w-full mt-5 gap-2">
                  Continuer <ChevronRight size={15} />
                </button>
              </motion.div>

            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                {packages.length > 0 && selectedPkg && (
                  <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
                    style={{ background: 'rgba(196,140,140,0.08)', border: '1px solid rgba(196,140,140,0.2)' }}>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>Pack sélectionné</p>
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{selectedPkg.name}</p>
                    </div>
                    <button onClick={() => setStep('package')}
                      className="text-xs font-semibold" style={{ color: '#C48C8C' }}>Changer</button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nom complet *">
                      <input value={form.client_name}
                        onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                        className="input text-sm w-full" placeholder="Votre nom" required />
                    </Field>
                    <Field label="Email *">
                      <input type="email" value={form.client_email}
                        onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                        className="input text-sm w-full" placeholder="email@exemple.com" required />
                    </Field>
                  </div>

                  <div className={`grid gap-3 ${isPhotographe ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <Field label="Téléphone">
                      <input type="tel" value={form.client_phone}
                        onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                        className="input text-sm w-full" placeholder="+216 XX XXX XXX" />
                    </Field>
                    {!isPhotographe && (
                      <Field label="Nb. de personnes *">
                        <div className="relative">
                          <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--text-3)' }} />
                          <input type="number" value={form.guest_count}
                            onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))}
                            className="input text-sm w-full pl-8"
                            placeholder={selectedPkg?.min_persons || '100'}
                            min={selectedPkg?.min_persons || 1}
                            max={selectedPkg?.max_persons || undefined}
                            required />
                        </div>
                      </Field>
                    )}
                  </div>

                  <Field label="Date de l'événement *">
                    <div className="relative">
                      <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-3)' }} />
                      <input type="date" value={form.event_date}
                        onChange={e => {
                          setForm(f => ({ ...f, event_date: e.target.value }));
                          loadAvailability(e.target.value);
                        }}
                        className="input text-sm w-full pl-8"
                        min={new Date().toISOString().split('T')[0]}
                        style={{ colorScheme: 'light' }}
                        required />
                    </div>
                    {form.event_date && isDateTaken(form.event_date) && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#EF4444' }}>
                        ✕ Cette date est déjà réservée — veuillez choisir une autre date.
                      </p>
                    )}
                    {form.event_date && isDatePending(form.event_date) && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#F59E0B' }}>
                        ⏳ Cette date est en cours de vérification pour un autre client.
                      </p>
                    )}
                    {form.event_date && !isDateTaken(form.event_date) && !isDatePending(form.event_date) && (
                      <p className="text-xs mt-1.5 font-semibold" style={{ color: '#34D399' }}>
                        ✓ Cette date est disponible
                      </p>
                    )}
                  </Field>

                  <Field label="Notes / Précisions">
                    <textarea value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className="textarea text-sm w-full" rows={2}
                      placeholder="Allergies, préférences, détails particuliers..." />
                  </Field>

                  {estimatedTotal != null && estimatedTotal > 0 && (
                    <div className="rounded-xl p-3 flex justify-between items-center"
                      style={{ background: 'rgba(217,165,165,0.06)', border: '1px solid rgba(217,165,165,0.15)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                        {isPhotographe
                          ? `${selectedOptions.length} option${selectedOptions.length > 1 ? 's' : ''} sélectionnée${selectedOptions.length > 1 ? 's' : ''}`
                          : `${form.guest_count} pers. × ${effectivePkgPrice.toLocaleString('fr-TN')} TND`}
                      </span>
                      <span className="font-display font-bold" style={{ color: 'var(--text)' }}>
                        ~{estimatedTotal.toLocaleString('fr-TN')} TND
                      </span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || (form.event_date && (isDateTaken(form.event_date) || isDatePending(form.event_date)))}
                    className="btn btn-primary w-full btn-lg gap-2 mt-1">
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                      : <><FileText size={16} /> Envoyer ma demande</>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── DETAIL PAGE ─────────────────────────────────────────────── */
export default function ProviderDetailPage() {
  const { typeSlug, providerSlug }          = useParams();
  const [provider, setProvider]             = useState(null);
  const [packages, setPackages]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [lightboxIndex, setLightboxIndex]   = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [calRefresh, setCalRefresh]         = useState(0);

  const isTraiteur    = typeSlug === 'traiteurs';
  const isPhotographe = typeSlug === 'photographes';
  const { promoVisible } = useUiStore();
  const HEADER_H = 64 + (promoVisible ? 36 : 0);
  const { isAuthenticated } = useAuthStore();
  const { cart, addProvider, removeProvider } = useCartStore();
  const [options, setOptions]               = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [detailOption, setDetailOption]     = useState(null);
  const [reviews, setReviews]               = useState([]);
  const [reviewsMeta, setReviewsMeta]       = useState({ avg: '0.0', total: 0 });
  const [reviewForm, setReviewForm]         = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading]   = useState(false);
  const [reviewDone, setReviewDone]         = useState(false);
  const [userQuoteId, setUserQuoteId]       = useState(null);
  const inCart = provider ? cart.some(p => p.id === provider.id) : false;

  useEffect(() => {
    setLoading(true);
    api.get(`/providers/${providerSlug}`)
      .then(r => {
        const p = r.data.data;
        setProvider(p);
        if (p?.type_slug === 'traiteurs' || typeSlug === 'traiteurs') {
          api.get(`/providers/${p.id}/packages`).then(rp => setPackages(rp.data.data || [])).catch(() => {});
        }
        if (p?.type_slug === 'photographes' || typeSlug === 'photographes') {
          api.get(`/providers/${p.id}/options`).then(ro => setOptions(ro.data.data || [])).catch(() => {});
        }
        api.get(`/providers/${p.id}/reviews`).then(rr => {
          setReviews(rr.data.data || []);
          setReviewsMeta({ avg: rr.data.avg, total: rr.data.total });
        }).catch(() => {});
        // Find if logged-in user has an eligible quote for this provider
        api.get('/quotes/my').then(rq => {
          const eligible = (rq.data.data || []).find(
            q => q.provider_id === p.id && ['sent','accepted'].includes(q.status)
          );
          if (eligible) setUserQuoteId(eligible.id);
        }).catch(() => {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [providerSlug, typeSlug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20" style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin-slow"
        style={{ borderColor: '#D9A5A5', borderTopColor: 'transparent' }} />
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

  const allImages    = [provider.cover_image, ...(provider.images?.map(i => i.image_url) || [])].filter(Boolean);
  const prevImg = () => setLightboxIndex(i => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setLightboxIndex(i => (i + 1) % allImages.length);

  return (
    <>
      <SEO
        title={provider.meta_title || provider.name}
        description={provider.meta_description || provider.short_description || provider.description?.slice(0, 160)}
      />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ marginTop: HEADER_H, height: '52vh', minHeight: '360px', maxHeight: '520px', background: 'var(--s3)' }}>
        {provider.cover_image
          ? <img src={provider.cover_image} alt={provider.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl sm:text-7xl md:text-8xl">{TYPE_ICONS[typeSlug] || '✦'}</div>
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,9,9,0.85) 0%, rgba(13,9,9,0.3) 50%, rgba(13,9,9,0.1) 100%)' }} />

        <Link to={`/prestataires/${typeSlug}`}
          className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={15} /> Retour
        </Link>

        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-10 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(217,165,165,0.25)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.4)', backdropFilter: 'blur(8px)' }}>
                {TYPE_ICONS[typeSlug]} {provider.type_name}
              </span>
              {provider.is_featured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.25)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.4)' }}>
                  ⭐ Recommandé
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

      {/* ── PHOTO CAROUSEL ────────────────────────────────────── */}
      {allImages.length > 0 && (
        <div style={{ background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <div className="overflow-x-auto scroll-thin">
            <div className="flex gap-2 p-3 max-w-7xl mx-auto" style={{ width: 'max-content', minWidth: '100%' }}>
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)}
                  className="flex-shrink-0 rounded-xl overflow-hidden group focus:outline-none"
                  style={{ width: 128, height: 80 }}>
                  <img src={img} alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK FACTS BAR ───────────────────────────────────── */}
      <div style={{ background: 'var(--s2)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-5 sm:gap-8 overflow-x-auto scroll-thin">
          {provider.rating > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill={i < Math.round(provider.rating) ? '#D9A5A5' : 'none'}
                    style={{ color: i < Math.round(provider.rating) ? '#D9A5A5' : 'var(--text-3)' }} />
                ))}
              </div>
              <span className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{Number(provider.rating).toFixed(1)}</span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>/5</span>
            </div>
          )}
          {provider.city && (
            <><div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: 'var(--text-2)' }}>
              <MapPin size={13} style={{ color: '#D9A5A5' }} />
              <span>{provider.city}{provider.governorate ? `, ${provider.governorate}` : ''}</span>
            </div></>
          )}
          {packages.length > 0 && (
            <><div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: 'var(--text-2)' }}>
              <span>🍽️</span><span>{packages.length} pack{packages.length > 1 ? 's' : ''} disponible{packages.length > 1 ? 's' : ''}</span>
            </div></>
          )}
          {allImages.length > 0 && (
            <><div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-2)' }} />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: 'var(--text-2)' }}>
              <span>📸</span><span>{allImages.length} photo{allImages.length > 1 ? 's' : ''}</span>
            </div></>
          )}
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 lg:pb-16" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── MAIN COLUMN ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* À propos */}
            {provider.description && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
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

            {/* Options à la carte — Photographe */}
            {isPhotographe && options.length > 0 && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(147,197,253,0.12)', border: '1px solid rgba(147,197,253,0.2)' }}>
                    <span className="text-sm">📸</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
                      Configurez votre prestation
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Sélectionnez les options souhaitées — le prix s'incrémente automatiquement
                    </p>
                  </div>
                  {selectedOptions.length > 0 && (
                    <button onClick={() => setSelectedOptions([])}
                      className="text-xs px-2.5 py-1 rounded-lg" style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                      Tout effacer
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-5" style={{ background: 'var(--s2)' }}>

                  {/* Frais de base — ligne fixe toujours incluse */}
                  {Number(provider.standard_fee) > 0 && (
                    <div className="flex items-center gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(147,197,253,0.06)', border: '1px solid rgba(147,197,253,0.2)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(147,197,253,0.12)', border: '1px solid rgba(147,197,253,0.2)' }}>
                        <span className="text-base">🔒</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>Frais de base</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(147,197,253,0.15)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.3)' }}>
                            Toujours inclus
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          Frais fixes de la prestation photographe
                        </p>
                      </div>
                      <p className="font-display font-bold text-sm flex-shrink-0" style={{ color: '#93C5FD' }}>
                        {Number(provider.standard_fee).toLocaleString('fr-TN')}
                        <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-3)' }}> TND</span>
                      </p>
                    </div>
                  )}

                  {/* Group options by category */}
                  {Object.entries(
                    options.reduce((acc, o) => {
                      const cat = o.category || 'Standard';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(o);
                      return acc;
                    }, {})
                  ).map(([cat, catOptions]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-3 mb-3 mt-1">
                        <div className="h-px flex-1" style={{ background: 'rgba(147,197,253,0.15)' }} />
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-display"
                          style={{ background: 'rgba(147,197,253,0.12)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.25)' }}>
                          {cat}
                        </span>
                        <div className="h-px flex-1" style={{ background: 'rgba(147,197,253,0.15)' }} />
                      </div>
                      <div className="space-y-2">
                        {catOptions.map(opt => (
                          <OptionCard
                            key={opt.id}
                            option={opt}
                            selected={selectedOptions.some(o => o.id === opt.id)}
                            onViewDetail={() => setDetailOption(opt)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Devis bar — always visible */}
                  {(() => {
                    const baseFee = Number(provider.standard_fee || 0);
                    const optSum  = selectedOptions.reduce((s, o) => s + Number(o.price), 0);
                    const total   = optSum + baseFee;
                    const hasOpts = selectedOptions.length > 0;
                    return (
                      <div className="rounded-xl p-4 sticky bottom-4"
                        style={{ background: 'var(--s1)', border: `1.5px solid ${hasOpts ? 'rgba(147,197,253,0.4)' : 'rgba(147,197,253,0.15)'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            {hasOpts ? (
                              <>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                                  {selectedOptions.length} option{selectedOptions.length > 1 ? 's' : ''}
                                  {baseFee > 0 && ' + frais de base'}
                                </p>
                                <p className="font-display font-bold text-xl" style={{ color: '#93C5FD' }}>
                                  {total.toLocaleString('fr-TN')}
                                  <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-3)' }}>TND</span>
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
                                {baseFee > 0
                                  ? <>Frais de base : <span style={{ color: '#93C5FD' }}>{baseFee.toLocaleString('fr-TN')} TND</span></>
                                  : 'Demandez un devis personnalisé'}
                              </p>
                            )}
                          </div>
                          <button onClick={() => setShowQuoteModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#60A5FA,#93C5FD)', boxShadow: '0 4px 16px rgba(147,197,253,0.3)' }}>
                            <FileText size={14} /> Demander un devis
                          </button>
                        </div>
                        {hasOpts && baseFee > 0 && (
                          <div className="flex items-center gap-4 mt-2 pt-2 text-xs" style={{ borderTop: '1px solid rgba(147,197,253,0.15)', color: 'var(--text-3)' }}>
                            <span>Options : {optSum.toLocaleString('fr-TN')} TND</span>
                            <span>+</span>
                            <span>Frais de base : {baseFee.toLocaleString('fr-TN')} TND</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </section>
            )}

            {/* Packs (Traiteur) */}
            {isTraiteur && packages.length > 0 && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(217,165,165,0.12)', border: '1px solid rgba(217,165,165,0.2)' }}>
                    <span className="text-sm">🍽️</span>
                  </div>
                  <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
                    Nos packs traiteur
                    <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-3)' }}>({packages.length} formules)</span>
                  </h2>
                </div>
                <div className="p-4 space-y-3" style={{ background: 'var(--s2)' }}>
                  {packages.map(pkg => (
                    <PackageCard key={pkg.id} pkg={pkg} selected={false} onSelect={() => {
                      setShowQuoteModal(true);
                    }} />
                  ))}
                  <p className="text-xs text-center pt-1" style={{ color: 'var(--text-3)' }}>
                    Cliquez sur un pack pour démarrer votre demande de devis
                  </p>
                </div>
              </section>
            )}


            {/* Services */}
            {provider.services?.length > 0 && (
              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
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

            {/* Reviews */}
            <section>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>Commentaires</h2>
                  {reviewsMeta.total > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                      {reviewsMeta.total}
                    </span>
                  )}
                </div>
                {reviewsMeta.total > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={Math.round(Number(reviewsMeta.avg))} size={13} />
                    <span className="font-bold text-sm" style={{ color: '#F59E0B' }}>{reviewsMeta.avg}/5</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-2xl py-10 px-6 text-center" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl mb-2">💬</p>
                  <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Aucun commentaire pour l'instant</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>Soyez le premier à partager votre expérience.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl p-5"
                      style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                      {/* Comment first */}
                      {r.comment ? (
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
                          "{r.comment}"
                        </p>
                      ) : (
                        <p className="text-sm italic mb-4" style={{ color: 'var(--text-3)' }}>Aucun commentaire écrit.</p>
                      )}
                      {/* Footer: name + stars + date */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', color: '#fff' }}>
                            {(r.full_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold font-display" style={{ color: 'var(--text-2)' }}>
                            {r.full_name || 'Client'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StarRow rating={r.rating} size={11} />
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                            {new Date(r.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Review form */}
            <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Star size={14} style={{ color: '#F59E0B' }} fill="#F59E0B" />
                </div>
                <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Donner votre avis</h2>
              </div>
              <div className="p-5" style={{ background: 'var(--s2)' }}>
                {!isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Connectez-vous pour laisser un avis sur ce prestataire</p>
                    <Link to="/login" className="btn btn-primary btn-sm gap-2">Se connecter</Link>
                  </div>
                ) : reviewDone ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(52,211,153,0.12)' }}>
                      <Check size={22} style={{ color: '#34D399' }} />
                    </div>
                    <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Merci pour votre avis !</p>
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>Votre avis est maintenant visible sur la page du prestataire.</p>
                  </div>
                ) : !userQuoteId ? (
                  <div className="text-center py-4">
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                      Vous pouvez laisser un avis une fois que vous avez un devis avec ce prestataire.
                    </p>
                    <button onClick={() => setShowQuoteModal(true)} className="btn btn-primary btn-sm gap-2 mt-3">
                      <FileText size={13} /> Demander un devis
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Star picker */}
                    <div>
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-2)' }}>Votre note</p>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                            className="transition-transform hover:scale-110 active:scale-95">
                            <Star size={28} fill={n <= reviewForm.rating ? '#F59E0B' : 'none'}
                              stroke={n <= reviewForm.rating ? '#F59E0B' : 'rgba(156,163,175,0.5)'} />
                          </button>
                        ))}
                        <span className="ml-2 text-sm font-bold self-center" style={{ color: '#F59E0B' }}>
                          {['','Mauvais','Passable','Bien','Très bien','Excellent !'][reviewForm.rating]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-2)' }}>Votre commentaire <span style={{ color: 'var(--text-3)' }}>(optionnel)</span></p>
                      <textarea rows={3} placeholder="Partagez votre expérience avec ce prestataire..."
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={{ background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    </div>
                    <button disabled={reviewLoading}
                      onClick={async () => {
                        setReviewLoading(true);
                        try {
                          await api.post(`/providers/${provider.id}/reviews`, {
                            rating: reviewForm.rating, comment: reviewForm.comment, quote_id: userQuoteId,
                          });
                          setReviewDone(true);
                          // Refresh reviews list so new review appears immediately
                          api.get(`/providers/${provider.id}/reviews`).then(rr => {
                            setReviews(rr.data.data || []);
                            setReviewsMeta({ avg: rr.data.avg, total: rr.data.total });
                          }).catch(() => {});
                        } catch (err) {
                          toast.error(err?.response?.data?.message || 'Erreur lors de la soumission');
                        } finally { setReviewLoading(false); }
                      }}
                      className="btn btn-primary gap-2">
                      {reviewLoading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Star size={14} /> Publier mon avis</>}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="rounded-2xl p-6"
              style={{ background: 'linear-gradient(135deg, rgba(196,140,140,0.1), rgba(217,165,165,0.04))', border: '1px solid rgba(217,165,165,0.18)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text)' }}>
                    Intéressé par {provider.name} ?
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                    Obtenez une offre sur mesure, gratuite et sans engagement.
                  </p>
                </div>
                <button onClick={() => setShowQuoteModal(true)} className="flex-shrink-0 btn btn-primary gap-2">
                  <FileText size={14} /> Demander un devis
                </button>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ─────────────────────────────────────── */}
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
                        {isTraiteur && packages.length > 0 ? `${packages.length} formules disponibles` : 'Tarification sur devis'}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        {isTraiteur ? 'Choisissez votre pack et recevez un devis personnalisé.' : 'Recevez une offre personnalisée en quelques minutes, gratuitement.'}
                      </p>
                    </div>
                  </div>
                  {/* Discount badge */}
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span className="text-base">🏷️</span>
                    <p className="text-xs leading-snug" style={{ color: '#34D399' }}>
                      <strong>–15% de remise</strong> sur votre prestation en réservant via MyWedding
                    </p>
                  </div>

                  <button onClick={() => setShowQuoteModal(true)}
                    className="btn btn-primary w-full gap-2 py-3 hidden lg:flex">
                    <FileText size={15} /> Obtenir un devis gratuit
                  </button>
                  <button
                    onClick={() => inCart ? removeProvider(provider.id) : addProvider(provider)}
                    className="w-full hidden lg:flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-display font-semibold transition-all border"
                    style={inCart
                      ? { background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.3)', color: '#34D399' }
                      : { background: 'transparent', borderColor: 'var(--border-2)', color: 'var(--text-2)' }}>
                    <Check size={14} className={inCart ? '' : 'hidden'} />
                    {inCart ? 'Ajouté à ma sélection' : '+ Ajouter à ma sélection'}
                  </button>
                </div>
                <div className="px-5 py-3 space-y-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
                  {['Devis 100% gratuit & sans engagement', 'Réponse sous 24h', 'Prestataire vérifié PrestaLink'].map(text => (
                    <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                      <span className="font-bold" style={{ color: '#34D399' }}>✓</span>{text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendrier disponibilité — tous les types */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
                  <CalendarDays size={13} /> Disponibilités
                </h3>
                <AvailabilityCalendar providerId={provider.id} refreshKey={calRefresh} />
              </div>

              {/* Contact */}
              {(provider.phone || provider.email || provider.website || provider.address) && (
                <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>Contact</h3>
                  <div className="space-y-3">
                    {provider.phone && (
                      <a href={`tel:${provider.phone}`} className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,211,153,0.12)' }}>
                          <Phone size={13} style={{ color: '#34D399' }} />
                        </div>
                        <span className="group-hover:text-[#34D399] transition-colors">{provider.phone}</span>
                      </a>
                    )}
                    {provider.email && (
                      <a href={`mailto:${provider.email}`} className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.12)' }}>
                          <Mail size={13} style={{ color: '#60A5FA' }} />
                        </div>
                        <span className="truncate group-hover:text-[#60A5FA] transition-colors">{provider.email}</span>
                      </a>
                    )}
                    {provider.website && (
                      <a href={provider.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(217,165,165,0.1)' }}>
                          <Globe size={13} style={{ color: '#E8DCD5' }} />
                        </div>
                        <span className="flex items-center gap-1 group-hover:text-[#E8DCD5] transition-colors">
                          Site web <ExternalLink size={10} />
                        </span>
                      </a>
                    )}
                    {provider.address && (
                      <div className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-2)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(217,165,165,0.1)' }}>
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
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
              {isTraiteur && packages.length > 0 ? `${packages.length} packs disponibles` : 'Tarif disponible sur devis'}
            </p>
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
        {showQuoteModal && (
          <QuoteRequestModal provider={provider} packages={packages} selectedOptions={selectedOptions} onClose={() => { setShowQuoteModal(false); setCalRefresh(v => v + 1); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailOption && (
          <OptionDetailModal
            option={detailOption}
            selected={selectedOptions.some(o => o.id === detailOption.id)}
            onToggle={() => setSelectedOptions(prev =>
              prev.some(o => o.id === detailOption.id)
                ? prev.filter(o => o.id !== detailOption.id)
                : [...prev, detailOption]
            )}
            onClose={() => setDetailOption(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
