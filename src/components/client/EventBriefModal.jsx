import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>
      {label}
      {hint && <span className="font-normal ml-1.5" style={{ color: 'var(--text-3)' }}>({hint})</span>}
    </label>
    {children}
  </div>
);

const Stepper = ({ label, value, onChange, min = 0, max = 20 }) => (
  <div className="flex items-center gap-3">
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors"
      style={{ background: 'var(--s3)', color: 'var(--text-2)' }}>−</button>
    <span className="w-8 text-center font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{value}</span>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors"
      style={{ background: 'var(--s3)', color: 'var(--text-2)' }}>+</button>
  </div>
);

export default function EventBriefModal({ quoteId, quoteName, onClose }) {
  const [form, setForm] = useState({
    prohibited_items: '',
    not_to_bring: '',
    juice_rounds: 0,
    tea_rounds: 0,
    alcohol_included: false,
    savory_rounds: 0,
    comments: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/quotes/${quoteId}/brief`).then(r => {
      if (r.data.data) {
        const d = r.data.data;
        setForm({
          prohibited_items: d.prohibited_items || '',
          not_to_bring:     d.not_to_bring || '',
          juice_rounds:     d.juice_rounds || 0,
          tea_rounds:       d.tea_rounds || 0,
          alcohol_included: !!d.alcohol_included,
          savory_rounds:    d.savory_rounds || 0,
          comments:         d.comments || '',
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [quoteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/quotes/${quoteId}/brief`, form);
      setSaved(true);
      toast.success('Ordre de mission sauvegardé');
      setTimeout(() => onClose(), 1200);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
          style={{ background: 'var(--s1)', border: '1px solid var(--border-2)' }}>

          {/* Header */}
          <div className="sticky top-0 z-10 px-6 pt-6 pb-4 flex items-start justify-between"
            style={{ background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(217,165,165,0.12)', border: '1px solid rgba(217,165,165,0.25)' }}>
                <FileText size={18} style={{ color: '#D9A5A5' }} />
              </div>
              <div>
                <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Ordre de mission</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{quoteName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-6 space-y-6">

              {/* Restrictions */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--text-3)' }}>
                  Restrictions & interdictions
                </p>
                <Field label="Ce qui est interdit" hint="ex: fumée, animaux, feux d'artifice...">
                  <textarea
                    value={form.prohibited_items}
                    onChange={e => setForm(f => ({ ...f, prohibited_items: e.target.value }))}
                    className="input w-full resize-none text-sm" rows={2}
                    placeholder="Décrivez ce qui est strictement interdit..." />
                </Field>
                <Field label="À ne pas apporter" hint="ex: propres boissons, matériel externe...">
                  <textarea
                    value={form.not_to_bring}
                    onChange={e => setForm(f => ({ ...f, not_to_bring: e.target.value }))}
                    className="input w-full resize-none text-sm" rows={2}
                    placeholder="Ce que les invités ne doivent pas apporter..." />
                </Field>
              </div>

              {/* Boissons */}
              <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--text-3)' }}>
                  Service boissons (nombre de tournées)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mb-3 font-display" style={{ color: 'var(--text-2)' }}>🧃 Jus de fruits</p>
                    <Stepper value={form.juice_rounds} onChange={v => setForm(f => ({ ...f, juice_rounds: v }))} />
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mb-3 font-display" style={{ color: 'var(--text-2)' }}>🍵 Thé / café</p>
                    <Stepper value={form.tea_rounds} onChange={v => setForm(f => ({ ...f, tea_rounds: v }))} />
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mb-3 font-display" style={{ color: 'var(--text-2)' }}>🥨 Salé (amuse-bouches)</p>
                    <Stepper value={form.savory_rounds} onChange={v => setForm(f => ({ ...f, savory_rounds: v }))} />
                  </div>
                  <div className="p-4 rounded-2xl flex flex-col items-start gap-3" style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold font-display" style={{ color: 'var(--text-2)' }}>🍾 Alcool</p>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, alcohol_included: !f.alcohol_included }))}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all"
                      style={{
                        background: form.alcohol_included ? 'rgba(217,165,165,0.15)' : 'var(--s3)',
                        border: form.alcohol_included ? '1px solid rgba(217,165,165,0.4)' : '1px solid var(--border)',
                        color: form.alcohol_included ? '#D9A5A5' : 'var(--text-3)',
                      }}>
                      {form.alcohol_included ? '✓ Inclus' : 'Non inclus'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Commentaires */}
              <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Field label="Commentaires supplémentaires" hint="optionnel">
                  <textarea
                    value={form.comments}
                    onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                    className="input w-full resize-none text-sm" rows={3}
                    placeholder="Demandes spéciales, préférences, informations importantes..." />
                </Field>
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn btn-outline flex-1">Annuler</button>
                <button onClick={handleSave} disabled={saving || saved} className="btn btn-primary flex-1 gap-2">
                  {saved
                    ? <><CheckCircle size={14} /> Sauvegardé</>
                    : saving
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Save size={14} /> Sauvegarder</>
                  }
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
