import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Percent, X, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ICONS_LIST = ['camera', 'chef-hat', 'palette', 'music', 'flower', 'building', 'star', 'heart', 'zap', 'gift'];
const EMOJI_MAP  = { camera: '📸', 'chef-hat': '🍽️', palette: '💐', music: '🎵', flower: '🌸', building: '🏛️', star: '⭐', heart: '💝', zap: '⚡', gift: '🎁' };

const Field = ({ label, children, note }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 font-display" style={{ color: 'var(--adm-text2)' }}>{label}</label>
    {children}
    {note && <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>{note}</p>}
  </div>
);

const TypeForm = ({ type, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: type?.name || '',
    description: type?.description || '',
    icon: type?.icon || 'camera',
    image: type?.image || '',
    discount_percentage: type?.discount_percentage ?? 10,
    display_order: type?.display_order ?? 0,
    is_active: type?.is_active !== undefined ? Boolean(type.is_active) : true,
    meta_title: type?.meta_title || '',
    meta_description: type?.meta_description || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    setLoading(true);
    try {
      if (type) { await api.put(`/provider-types/${type.id}`, form); toast.success('Catégorie mise à jour'); }
      else       { await api.post('/provider-types', form);          toast.success('Catégorie créée'); }
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tf-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border shadow-dark-lg"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>

        <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
          <h2 id="tf-title" className="font-display text-xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
            {type ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl transition-all" style={{ color: 'var(--adm-text2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-7 py-5 space-y-5 scroll-adm">
          <Field label="Nom *">
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="adm-input w-full" placeholder="Ex: Photographes" required />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="adm-input w-full resize-none" rows={3} placeholder="Description de la catégorie..." />
          </Field>

          <Field label="Icône">
            <div className="grid grid-cols-5 gap-2">
              {ICONS_LIST.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`p-3 rounded-xl text-2xl transition-all border ${
                    form.icon === icon ? 'border-primary-500' : ''
                  }`}
                  style={{
                    background: form.icon === icon ? 'rgba(217,165,165,0.15)' : 'var(--adm-surface2)',
                    borderColor: form.icon === icon ? '#D9A5A5' : 'var(--adm-border)',
                  }}>
                  {EMOJI_MAP[icon]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Image de couverture (URL)">
            <input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              className="adm-input w-full" placeholder="https://..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Remise (%)" note="Appliquée automatiquement aux devis">
              <div className="relative">
                <input type="number" value={form.discount_percentage}
                  onChange={e => setForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))}
                  className="adm-input w-full pr-8" min="0" max="100" step="0.5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--adm-text2)' }}>%</span>
              </div>
            </Field>
            <Field label="Ordre d'affichage">
              <input type="number" value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                className="adm-input w-full" min="0" />
            </Field>
          </div>

          <Field label="Meta titre (SEO)">
            <input type="text" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
              className="adm-input w-full" placeholder="Titre SEO optimisé" maxLength={255} />
          </Field>

          <Field label="Meta description (SEO)">
            <textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
              className="adm-input w-full resize-none" rows={2} placeholder="Description SEO (max 160 car.)" />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              style={{ color: form.is_active ? '#10B981' : 'var(--adm-text2)' }}>
              {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
            <span className="text-sm font-display" style={{ color: 'var(--adm-text)' }}>Catégorie active</span>
          </label>
        </form>

        <div className="px-7 py-5 border-t flex gap-3 flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
          <button type="button" onClick={onClose} className="adm-btn-ghost flex-1">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="adm-btn-primary flex-1">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />}
            {type ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminProviderTypes() {
  const [types, setTypes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(undefined);

  const fetchTypes = async () => {
    setLoading(true);
    try { const res = await api.get('/provider-types'); setTypes(res.data.data || []); }
    catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Supprimer cette catégorie ? Tous les prestataires associés seront supprimés.')) return;
    try { await api.delete(`/provider-types/${id}`); toast.success('Supprimée'); fetchTypes(); }
    catch (_) { toast.error('Erreur suppression'); }
  };

  const handleDiscountQuick = async (id, current) => {
    const val = prompt('Nouvelle remise pour cette catégorie (%) :', current);
    if (val === null) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) { toast.error('Valeur invalide (0-100)'); return; }
    try { await api.patch(`/provider-types/${id}/discount`, { discount_percentage: num }); toast.success('Remise mise à jour'); fetchTypes(); }
    catch (_) { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>Catégories</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--adm-text2)' }}>{types.length} catégorie(s)</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="adm-btn-primary gap-2">
          <Plus size={16} /> Nouvelle catégorie
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl h-48 skeleton-adm" />)}
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucune catégorie. Créez-en une !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type, i) => (
            <motion.div key={type.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5 border group transition-all"
              style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(217,165,165,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--adm-border)'}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                    style={{ background: 'var(--adm-surface2)', borderColor: 'var(--adm-border)' }}>
                    {EMOJI_MAP[type.icon] || '✦'}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base" style={{ color: 'var(--adm-text)' }}>{type.name}</h3>
                    <span className={`text-xs ${type.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {type.is_active ? '● Actif' : '● Inactif'}
                    </span>
                  </div>
                </div>
                <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>#{type.display_order}</span>
              </div>

              <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--adm-text2)' }}>{type.description}</p>

              <button onClick={() => handleDiscountQuick(type.id, type.discount_percentage)}
                className="flex items-center gap-2 mb-4 group/disc">
                <span className="adm-badge adm-badge-amber cursor-pointer">
                  <Percent size={10} /> {type.discount_percentage}% remise
                </span>
                <span className="text-xs opacity-0 group-hover/disc:opacity-70 transition-opacity" style={{ color: 'var(--adm-text2)' }}>
                  modifier
                </span>
              </button>

              <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <button onClick={() => { setEditing(type); setShowForm(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border font-display"
                  style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#E8DCD5'; e.currentTarget.style.borderColor = '#D9A5A580'; e.currentTarget.style.background = 'rgba(217,165,165,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.borderColor = 'var(--adm-border)'; e.currentTarget.style.background = ''; }}>
                  <Edit size={13} /> Modifier
                </button>
                <button onClick={() => handleDelete(type.id)}
                  className="p-2 rounded-xl transition-all border font-display"
                  style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = '#F8717140'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.borderColor = 'var(--adm-border)'; e.currentTarget.style.background = ''; }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <TypeForm
            type={editing}
            onSave={() => { setShowForm(false); fetchTypes(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
