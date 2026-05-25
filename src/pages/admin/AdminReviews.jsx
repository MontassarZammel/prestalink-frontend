import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Check, X, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={12} fill={n <= rating ? '#F59E0B' : 'none'} stroke={n <= rating ? '#F59E0B' : '#6B7280'} />
    ))}
  </div>
);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    api.get('/admin/reviews').then(r => { setReviews(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const approve = async (id, val) => {
    await api.patch(`/admin/reviews/${id}/approve`, { is_approved: val });
    toast.success(val ? 'Avis approuvé' : 'Avis rejeté');
    load();
  };
  const remove = async (id) => {
    if (!confirm('Supprimer cet avis ?')) return;
    await api.delete(`/admin/reviews/${id}`);
    toast.success('Avis supprimé');
    load();
  };

  const filtered = reviews.filter(r =>
    filter === 'pending' ? !r.is_approved : filter === 'approved' ? r.is_approved : true
  );

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>
          Avis clients
        </h1>
        <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Modérez les avis avant publication</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'pending', label: 'En attente', count: reviews.filter(r => !r.is_approved).length },
          { key: 'approved', label: 'Approuvés', count: reviews.filter(r => r.is_approved).length },
          { key: 'all', label: 'Tous', count: reviews.length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-display transition-all"
            style={{
              background: filter === key ? 'var(--adm-accent)' : 'var(--adm-surface)',
              color: filter === key ? '#fff' : 'var(--adm-text2)',
              border: '1px solid var(--adm-border)',
            }}>
            {label}
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: filter === key ? 'rgba(255,255,255,0.2)' : 'var(--adm-surface2)' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucun avis dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-5 border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Stars rating={r.rating} />
                    <span className="font-display font-bold text-sm" style={{ color: 'var(--adm-text)' }}>
                      {r.full_name || 'Anonyme'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>{r.email}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--adm-surface2)', color: 'var(--adm-text2)' }}>
                      {r.provider_name}
                    </span>
                    {r.is_approved ? (
                      <span className="adm-badge adm-badge-green flex items-center gap-1"><Check size={10} /> Publié</span>
                    ) : (
                      <span className="adm-badge adm-badge-amber flex items-center gap-1"><Clock size={10} /> En attente</span>
                    )}
                  </div>
                  {r.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--adm-text2)' }}>"{r.comment}"</p>
                  )}
                  <p className="text-xs mt-2" style={{ color: 'var(--adm-text3, #6B7280)' }}>
                    {new Date(r.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!r.is_approved && (
                    <button onClick={() => approve(r.id, true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' }}>
                      <Check size={13} /> Approuver
                    </button>
                  )}
                  {r.is_approved && (
                    <button onClick={() => approve(r.id, false)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <X size={13} /> Dépublier
                    </button>
                  )}
                  <button onClick={() => remove(r.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
