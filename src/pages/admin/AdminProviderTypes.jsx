import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Percent, X, ToggleLeft, ToggleRight,
  Package, ChevronDown, ChevronUp, Save, AlertCircle, Camera, Tag, Upload,
} from 'lucide-react';
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

const uploadImage = async file => {
  const fd = new FormData();
  fd.append('image', file);
  const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data.url;
};

const ImagePicker = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch { toast.error('Erreur upload image'); }
    setUploading(false);
  };
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{ border: '1px dashed rgba(147,197,253,0.4)', color: '#93C5FD', background: 'rgba(147,197,253,0.06)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,197,253,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(147,197,253,0.06)'}>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {uploading
          ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          : <Upload size={12} />}
        {value ? 'Changer la photo' : 'Choisir une photo'}
      </label>
      {value && (
        <div className="relative mt-2 w-24">
          <img src={value} alt="preview" className="h-16 w-24 object-cover rounded-lg" onError={e => { e.target.style.display='none'; }} />
          <button type="button" onClick={() => onChange('')}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
            style={{ background: '#EF4444', fontSize: 9 }}>✕</button>
        </div>
      )}
    </div>
  );
};

const parseIncludes = v => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

/* ─── PACK ROW ────────────────────────────────────────────────── */
function PackRow({ pack, providerId, onRefresh, onDelete }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:               pack.name || '',
    price_per_person:   pack.price_per_person || '',
    discount_percentage: Number(pack.discount_percentage) || 0,
    description:        pack.description || '',
    min_persons:        pack.min_persons || 1,
    max_persons:        pack.max_persons || '',
    is_active:          Boolean(pack.is_active),
    sort_order:         pack.sort_order || 0,
    includes:           parseIncludes(pack.includes),
  });
  const [newItem, setNewItem] = useState('');

  const net = form.discount_percentage > 0
    ? Math.round(Number(form.price_per_person) * (1 - Number(form.discount_percentage) / 100))
    : Number(form.price_per_person);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/providers/${providerId}/packages/${pack.id}`, {
        name:               form.name,
        description:        form.description || null,
        price_per_person:   Number(form.price_per_person),
        min_persons:        Number(form.min_persons) || 1,
        max_persons:        form.max_persons ? Number(form.max_persons) : null,
        includes:           form.includes,
        is_active:          form.is_active,
        sort_order:         Number(form.sort_order) || 0,
      });
      toast.success('Pack mis à jour');
      onRefresh();
    } catch { toast.error('Erreur sauvegarde'); }
    setSaving(false);
  };

  const quickToggle = async () => {
    const next = !form.is_active;
    setForm(f => ({ ...f, is_active: next }));
    try {
      await api.put(`/providers/${providerId}/packages/${pack.id}`, {
        name: form.name, description: form.description || null,
        price_per_person: Number(form.price_per_person),
        min_persons: Number(form.min_persons) || 1,
        max_persons: form.max_persons ? Number(form.max_persons) : null,
        includes: form.includes, is_active: next,
        sort_order: Number(form.sort_order) || 0,
      });
      toast.success(next ? 'Pack activé' : 'Pack désactivé');
    } catch {
      setForm(f => ({ ...f, is_active: !next }));
      toast.error('Erreur');
    }
  };

  const addItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setForm(f => ({ ...f, includes: [...f.includes, t] }));
    setNewItem('');
  };

  const removeItem = idx =>
    setForm(f => ({ ...f, includes: f.includes.filter((_, i) => i !== idx) }));

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${form.is_active ? 'rgba(52,211,153,0.2)' : 'var(--adm-border)'}`,
        opacity: form.is_active ? 1 : 0.6,
      }}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--adm-surface2)' }}>
        {/* Toggle */}
        <button type="button" onClick={quickToggle} style={{ color: form.is_active ? '#10B981' : 'var(--adm-text2)' }}
          className="flex-shrink-0 transition-colors">
          {form.is_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--adm-text)' }}>
            {form.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {Number(form.price_per_person) > 0 && (
              <span className="text-xs font-semibold" style={{ color: '#E8DCD5' }}>
                {net.toLocaleString('fr-TN')} TND<span className="font-normal" style={{ color: 'var(--adm-text2)' }}>/pers</span>
              </span>
            )}
            {form.discount_percentage > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                −{form.discount_percentage}%
              </span>
            )}
            {form.includes.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                · {form.includes.length} plat{form.includes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Expand + delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => onDelete(pack.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--adm-text2)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.background = ''; }}>
            <Trash2 size={13} />
          </button>
          <button type="button" onClick={() => setOpen(o => !o)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--adm-text2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', background: 'var(--adm-surface)' }}>
            <div className="p-4 space-y-4">

              {/* Name + pieces */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Nom du pack</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="adm-input w-full text-sm" placeholder="Ex: 7 pièces/personne" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Ordre</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    className="adm-input w-full text-sm" min="0" />
                </div>
              </div>

              {/* Price + discount */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix/pers. (TND)</label>
                  <input type="number" value={form.price_per_person}
                    onChange={e => setForm(f => ({ ...f, price_per_person: e.target.value }))}
                    className="adm-input w-full text-sm" min="0" step="0.5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Remise (%)</label>
                  <div className="relative">
                    <Percent size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-text2)' }} />
                    <input type="number" value={form.discount_percentage}
                      onChange={e => setForm(f => ({ ...f, discount_percentage: e.target.value }))}
                      className="adm-input w-full text-sm pl-7" min="0" max="100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix net</label>
                  <div className="adm-input text-sm font-bold flex items-center" style={{ color: '#34D399', cursor: 'default' }}>
                    {net > 0 ? `${net.toLocaleString('fr-TN')} TND` : '—'}
                  </div>
                </div>
              </div>

              {/* Min/max persons */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Min personnes</label>
                  <input type="number" value={form.min_persons}
                    onChange={e => setForm(f => ({ ...f, min_persons: e.target.value }))}
                    className="adm-input w-full text-sm" min="1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Max personnes</label>
                  <input type="number" value={form.max_persons}
                    onChange={e => setForm(f => ({ ...f, max_persons: e.target.value }))}
                    className="adm-input w-full text-sm" min="1" placeholder="Illimité" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="adm-input w-full resize-none text-sm" rows={2}
                  placeholder="Décrivez le pack..." />
              </div>

              {/* Food details — includes */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--adm-text2)' }}>
                  Plats inclus
                  <span className="ml-2 font-normal" style={{ color: 'var(--adm-text2)' }}>({form.includes.length})</span>
                </label>

                {/* Tags */}
                {form.includes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.includes.map((item, idx) => (
                      <span key={idx}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(217,165,165,0.1)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.2)' }}>
                        {item}
                        <button type="button" onClick={() => removeItem(idx)}
                          className="transition-colors hover:text-rose-400 flex items-center">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add item input */}
                <div className="flex gap-2">
                  <input value={newItem} onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                    className="adm-input flex-1 text-sm"
                    placeholder="Ex: Chorba, Brick au thon, Méchoui…" />
                  <button type="button" onClick={addItem}
                    className="adm-btn-primary px-3 py-1.5 text-xs gap-1.5">
                    <Plus size={13} /> Ajouter
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>
                  Appuyez sur Entrée ou cliquez Ajouter
                </p>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-1">
                <button type="button" onClick={save} disabled={saving}
                  className="adm-btn-primary gap-2 text-sm px-5">
                  {saving
                    ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                    : <Save size={14} />}
                  Sauvegarder
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── ADD PACK FORM ───────────────────────────────────────────── */
function AddPackForm({ providerId, onAdded, onCancel }) {
  const [form, setForm] = useState({
    name: '', price_per_person: '', discount_percentage: 0,
    min_persons: 1, description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.price_per_person) { toast.error('Nom et prix requis'); return; }
    setSaving(true);
    try {
      await api.post(`/providers/${providerId}/packages`, {
        name:               form.name.trim(),
        description:        form.description || null,
        price_per_person:   Number(form.price_per_person),
        min_persons:        Number(form.min_persons) || 1,
        discount_percentage: Number(form.discount_percentage) || 0,
        sort_order:         99,
      });
      toast.success('Pack ajouté');
      onAdded();
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(217,165,165,0.05)', border: '1px dashed rgba(217,165,165,0.3)' }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#D9A5A5' }}>Nouveau pack</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Nom *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="adm-input w-full text-sm" placeholder="Ex: Pack Royal 10 pièces" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix/pers. (TND) *</label>
          <input type="number" value={form.price_per_person}
            onChange={e => setForm(f => ({ ...f, price_per_person: e.target.value }))}
            className="adm-input w-full text-sm" min="0" step="0.5" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Remise (%)</label>
          <input type="number" value={form.discount_percentage}
            onChange={e => setForm(f => ({ ...f, discount_percentage: e.target.value }))}
            className="adm-input w-full text-sm" min="0" max="100" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Min pers.</label>
          <input type="number" value={form.min_persons}
            onChange={e => setForm(f => ({ ...f, min_persons: e.target.value }))}
            className="adm-input w-full text-sm" min="1" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="adm-input w-full resize-none text-sm" rows={2} placeholder="Description optionnelle..." />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="adm-btn-ghost text-sm px-4">Annuler</button>
        <button type="button" onClick={handleSubmit} disabled={saving} className="adm-btn-primary text-sm gap-2 px-5">
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : <Plus size={14} />}
          Créer le pack
        </button>
      </div>
    </motion.div>
  );
}

/* ─── PACKS MANAGER MODAL ─────────────────────────────────────── */
function PacksManagerModal({ type, onClose }) {
  const [providers, setProviders]           = useState([]);
  const [selectedId, setSelectedId]         = useState(null);
  const [packs, setPacks]                   = useState([]);
  const [loadingProv, setLoadingProv]       = useState(true);
  const [loadingPacks, setLoadingPacks]     = useState(false);
  const [showAdd, setShowAdd]               = useState(false);

  // Load providers for this category
  useEffect(() => {
    setLoadingProv(true);
    api.get(`/providers?type_slug=${type.slug}&limit=100`)
      .then(r => {
        const list = r.data.data || [];
        setProviders(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingProv(false));
  }, [type.slug]);

  // Load packs for selected provider
  const loadPacks = () => {
    if (!selectedId) return;
    setLoadingPacks(true);
    api.get(`/providers/${selectedId}/packages/admin`)
      .then(r => setPacks(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingPacks(false));
  };

  useEffect(() => { loadPacks(); }, [selectedId]);

  const handleDelete = async packId => {
    if (!window.confirm('Supprimer ce pack ?')) return;
    try {
      await api.delete(`/providers/${selectedId}/packages/${packId}`);
      toast.success('Pack supprimé');
      loadPacks();
    } catch { toast.error('Erreur suppression'); }
  };

  const currentProvider = providers.find(p => p.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
        style={{ background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}>

        {/* Header */}
        <div className="px-7 py-5 flex items-center justify-between flex-shrink-0"
          style={{ background: 'var(--adm-surface2)', borderBottom: '1px solid var(--adm-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
              {EMOJI_MAP[type.icon] || '✦'}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
                Packs — {type.name}
              </h2>
              <p className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                {packs.length} pack{packs.length !== 1 ? 's' : ''} · {providers.length} prestataire{providers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--adm-text2)', border: '1px solid var(--adm-border)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5 scroll-adm">

          {/* Provider selector */}
          {loadingProv ? (
            <div className="h-10 skeleton-adm rounded-xl" />
          ) : providers.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ border: '1px dashed var(--adm-border)' }}>
              <AlertCircle size={28} className="mx-auto mb-2" style={{ color: 'var(--adm-text2)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Aucun prestataire</p>
              <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>
                Créez d'abord des prestataires de type {type.name}
              </p>
            </div>
          ) : (
            <>
              {/* Provider dropdown */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-text2)' }}>
                  Prestataire
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {providers.map(p => (
                    <button key={p.id} type="button" onClick={() => { setSelectedId(p.id); setShowAdd(false); }}
                      className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all truncate"
                      style={{
                        background: selectedId === p.id ? 'rgba(217,165,165,0.12)' : 'var(--adm-surface2)',
                        border: `1px solid ${selectedId === p.id ? '#D9A5A5' : 'var(--adm-border)'}`,
                        color: selectedId === p.id ? '#E8DCD5' : 'var(--adm-text2)',
                      }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--adm-border)' }} />

              {/* Packs list */}
              {loadingPacks ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 skeleton-adm rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text2)' }}>
                      Packs de {currentProvider?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                        {packs.filter(p => p.is_active).length} actif{packs.filter(p => p.is_active).length !== 1 ? 's' : ''}
                        {' / '}{packs.length} total
                      </span>
                    </div>
                  </div>

                  {packs.length === 0 && !showAdd && (
                    <div className="text-center py-8 rounded-xl" style={{ border: '1px dashed var(--adm-border)' }}>
                      <Package size={24} className="mx-auto mb-2" style={{ color: 'var(--adm-text2)' }} />
                      <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucun pack configuré</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {packs.map(pack => (
                      <motion.div key={pack.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}>
                        <PackRow
                          pack={pack}
                          providerId={selectedId}
                          onRefresh={loadPacks}
                          onDelete={handleDelete}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add pack form */}
                  <AnimatePresence>
                    {showAdd && (
                      <AddPackForm
                        providerId={selectedId}
                        onAdded={() => { setShowAdd(false); loadPacks(); }}
                        onCancel={() => setShowAdd(false)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Add button */}
                  {!showAdd && (
                    <button type="button" onClick={() => setShowAdd(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{ border: '1px dashed rgba(217,165,165,0.35)', color: '#D9A5A5' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,165,165,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <Plus size={14} /> Ajouter un pack
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── OPTION ROW ──────────────────────────────────────────────── */
function OptionRow({ opt, providerId, onRefresh, onDelete }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:               opt.name || '',
    description:        opt.description || '',
    price:              opt.price || '',
    category:           opt.category || 'Standard',
    sort_order:         opt.sort_order || 0,
    is_active:          Boolean(opt.is_active),
    image_url:          opt.image_url || '',
    includes_standard:  Boolean(opt.includes_standard),
  });

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/providers/${providerId}/options/${opt.id}`, {
        name: form.name, description: form.description || null,
        price: Number(form.price) || 0, category: form.category,
        sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
        image_url: form.image_url || null, includes_standard: form.includes_standard,
      });
      toast.success('Option mise à jour');
      onRefresh();
    } catch { toast.error('Erreur sauvegarde'); }
    setSaving(false);
  };

  const quickToggle = async () => {
    const next = !form.is_active;
    setForm(f => ({ ...f, is_active: next }));
    try {
      await api.put(`/providers/${providerId}/options/${opt.id}`, {
        ...form, price: Number(form.price) || 0, is_active: next,
        image_url: form.image_url || null, includes_standard: form.includes_standard,
      });
      toast.success(next ? 'Activée' : 'Désactivée');
    } catch { setForm(f => ({ ...f, is_active: !next })); toast.error('Erreur'); }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--adm-border)', background: 'var(--adm-surface2)' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={quickToggle} className="flex-shrink-0">
          {form.is_active
            ? <ToggleRight size={20} style={{ color: '#34D399' }} />
            : <ToggleLeft size={20} style={{ color: 'var(--adm-text2)' }} />}
        </button>
        {form.image_url && (
          <img src={form.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--adm-text)' }}>{form.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: 'var(--adm-text2)' }}>{form.category}</p>
            {form.includes_standard && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(147,197,253,0.15)', color: '#93C5FD' }}>forfait</span>
            )}
          </div>
        </div>
        <span className="text-sm font-bold flex-shrink-0 font-display" style={{ color: '#E8DCD5' }}>
          {Number(form.price).toLocaleString('fr-TN')} TND
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--adm-text2)' }}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={() => onDelete(opt.id)} className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--adm-text2)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-text2)'}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="adm-input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Catégorie</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="adm-input w-full text-sm" placeholder="Ex: Équipement, Forfait..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix (TND) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="adm-input w-full text-sm" min="0" step="10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Ordre</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    className="adm-input w-full text-sm" min="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Photo</label>
                  <ImagePicker value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="adm-input w-full resize-none text-sm" rows={2}
                  placeholder="Description de l'option..." />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.includes_standard}
                  onChange={e => setForm(f => ({ ...f, includes_standard: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>
                    Ce forfait inclut le frais de base
                  </span>
                  <p className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                    Le frais standard du photographe est déjà compris dans le prix de ce forfait
                  </p>
                </div>
              </label>
              <div className="flex justify-end">
                <button onClick={save} disabled={saving}
                  className="adm-btn-primary text-sm px-5 gap-2">
                  {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : <Save size={13} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── OPTIONS MANAGER MODAL ───────────────────────────────────── */
function OptionsManagerModal({ type, onClose }) {
  const [providers, setProviders]         = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [options, setOptions]             = useState([]);
  const [loadingProv, setLoadingProv]     = useState(true);
  const [loadingOpts, setLoadingOpts]     = useState(false);
  const [showAdd, setShowAdd]             = useState(false);
  const [addForm, setAddForm] = useState({ name: '', price: '', category: 'Équipement', description: '', image_url: '', includes_standard: false });
  const [addSaving, setAddSaving]         = useState(false);
  const [standardFee, setStandardFee]     = useState('');
  const [editingFee, setEditingFee]       = useState(false);
  const [savingFee, setSavingFee]         = useState(false);

  useEffect(() => {
    setLoadingProv(true);
    api.get(`/providers?type_slug=${type.slug}&limit=100`)
      .then(r => {
        const list = r.data.data || [];
        setProviders(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingProv(false));
  }, [type.slug]);

  const loadOptions = () => {
    if (!selectedId) return;
    setLoadingOpts(true);
    api.get(`/providers/${selectedId}/options/admin`)
      .then(r => setOptions(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingOpts(false));
  };

  useEffect(() => {
    loadOptions();
    const prov = providers.find(p => p.id === selectedId);
    if (prov) setStandardFee(prov.standard_fee ?? '');
  }, [selectedId]);

  const handleDelete = async id => {
    if (!window.confirm('Supprimer cette option ?')) return;
    try {
      await api.delete(`/providers/${selectedId}/options/${id}`);
      toast.success('Option supprimée');
      loadOptions();
    } catch { toast.error('Erreur'); }
  };

  const saveFee = async () => {
    setSavingFee(true);
    try {
      await api.put(`/providers/${selectedId}`, { standard_fee: Number(standardFee) || 0 });
      toast.success('Frais de base mis à jour');
      setEditingFee(false);
    } catch { toast.error('Erreur'); }
    setSavingFee(false);
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.price) { toast.error('Nom et prix requis'); return; }
    setAddSaving(true);
    try {
      await api.post(`/providers/${selectedId}/options`, {
        name: addForm.name.trim(), price: Number(addForm.price),
        category: addForm.category || 'Équipement',
        description: addForm.description || null,
        image_url: addForm.image_url || null,
        includes_standard: addForm.includes_standard,
        sort_order: 99,
      });
      toast.success('Option ajoutée');
      setAddForm({ name: '', price: '', category: 'Équipement', description: '', image_url: '', includes_standard: false });
      setShowAdd(false);
      loadOptions();
    } catch { toast.error('Erreur'); }
    setAddSaving(false);
  };

  const CATEGORIES = ['Équipement', 'Forfait', 'Accessoire', 'Studio', 'Autre'];
  const currentProvider = providers.find(p => p.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl"
        style={{ background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}>

        <div className="px-7 py-5 flex items-center justify-between flex-shrink-0"
          style={{ background: 'var(--adm-surface2)', borderBottom: '1px solid var(--adm-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
              <Camera size={20} style={{ color: '#D9A5A5' }} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
                Options — {type.name}
              </h2>
              <p className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                {options.length} option{options.length !== 1 ? 's' : ''} · {providers.length} prestataire{providers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--adm-text2)', border: '1px solid var(--adm-border)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5 scroll-adm">
          {loadingProv ? (
            <div className="h-10 skeleton-adm rounded-xl" />
          ) : providers.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ border: '1px dashed var(--adm-border)' }}>
              <AlertCircle size={28} className="mx-auto mb-2" style={{ color: 'var(--adm-text2)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Aucun prestataire</p>
              <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>Créez d'abord des {type.name}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--adm-text2)' }}>Prestataire</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {providers.map(p => (
                    <button key={p.id} type="button" onClick={() => { setSelectedId(p.id); setShowAdd(false); }}
                      className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all truncate"
                      style={{
                        background: selectedId === p.id ? 'rgba(217,165,165,0.12)' : 'var(--adm-surface2)',
                        border: `1px solid ${selectedId === p.id ? '#D9A5A5' : 'var(--adm-border)'}`,
                        color: selectedId === p.id ? '#E8DCD5' : 'var(--adm-text2)',
                      }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--adm-border)' }} />

              {/* Standard fee */}
              {selectedId && (
                <div className="rounded-xl p-3 flex items-center justify-between gap-3"
                  style={{ background: 'rgba(147,197,253,0.05)', border: '1px solid rgba(147,197,253,0.2)' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#93C5FD' }}>Frais de base</p>
                    <p className="text-[10px]" style={{ color: 'var(--adm-text2)' }}>ajouté auto à la 1ère sélection · les forfaits l'incluent déjà</p>
                  </div>
                  {editingFee ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input type="number" value={standardFee} onChange={e => setStandardFee(e.target.value)}
                        className="adm-input text-sm w-24 text-right" placeholder="2000" min="0" step="100" />
                      <button onClick={saveFee} disabled={savingFee}
                        className="adm-btn-primary text-xs px-3 py-1.5">
                        {savingFee ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : 'OK'}
                      </button>
                      <button onClick={() => setEditingFee(false)} className="adm-btn-ghost text-xs px-2 py-1.5">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingFee(true)}
                      className="flex items-center gap-1.5 flex-shrink-0 text-sm font-bold rounded-lg px-3 py-1.5 transition-all"
                      style={{ color: '#93C5FD', background: 'rgba(147,197,253,0.1)', border: '1px solid rgba(147,197,253,0.3)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,197,253,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(147,197,253,0.1)'}>
                      {standardFee ? `${Number(standardFee).toLocaleString()} TND` : 'Définir'}
                      <Edit size={12} />
                    </button>
                  )}
                </div>
              )}

              {loadingOpts ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 skeleton-adm rounded-xl" />)}</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text2)' }}>
                      Options de {currentProvider?.name}
                    </p>
                    <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>
                      {options.filter(o => o.is_active).length} actif / {options.length} total
                    </span>
                  </div>

                  {options.length === 0 && !showAdd && (
                    <div className="text-center py-8 rounded-xl" style={{ border: '1px dashed var(--adm-border)' }}>
                      <Camera size={24} className="mx-auto mb-2" style={{ color: 'var(--adm-text2)' }} />
                      <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucune option configurée</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {options.map(opt => (
                      <motion.div key={opt.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                        <OptionRow opt={opt} providerId={selectedId} onRefresh={loadOptions} onDelete={handleDelete} />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showAdd && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: 'rgba(217,165,165,0.05)', border: '1px dashed rgba(217,165,165,0.3)' }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#D9A5A5' }}>Nouvelle option</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Nom *</label>
                            <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                              className="adm-input w-full text-sm" placeholder="Ex: Drone, Mirror Booth, Girafe..." />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix (TND) *</label>
                            <input type="number" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                              className="adm-input w-full text-sm" min="0" step="10" placeholder="900" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Catégorie</label>
                            <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                              className="adm-input w-full text-sm">
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Description</label>
                            <textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                              className="adm-input w-full resize-none text-sm" rows={2} placeholder="Description optionnelle..." />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Photo</label>
                            <ImagePicker value={addForm.image_url} onChange={url => setAddForm(f => ({ ...f, image_url: url }))} />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--adm-text2)' }}>
                          <input type="checkbox" checked={addForm.includes_standard}
                            onChange={e => setAddForm(f => ({ ...f, includes_standard: e.target.checked }))}
                            className="w-4 h-4 rounded accent-blue-400" />
                          <span>Forfait — inclut le frais de base</span>
                        </label>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowAdd(false)} className="adm-btn-ghost text-sm px-4">Annuler</button>
                          <button onClick={handleAdd} disabled={addSaving} className="adm-btn-primary text-sm gap-2 px-5">
                            {addSaving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : <Plus size={14} />}
                            Ajouter
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showAdd && (
                    <button type="button" onClick={() => setShowAdd(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{ border: '1px dashed rgba(217,165,165,0.35)', color: '#D9A5A5' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,165,165,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <Plus size={14} /> Ajouter une option
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── CATEGORY FORM ───────────────────────────────────────────── */
const TypeForm = ({ type, onSave, onClose }) => {
  const [form, setForm] = useState({
    name:               type?.name || '',
    description:        type?.description || '',
    icon:               type?.icon || 'camera',
    image:              type?.image || '',
    discount_percentage: type?.discount_percentage ?? 10,
    display_order:      type?.display_order ?? 0,
    is_active:          type?.is_active !== undefined ? Boolean(type.is_active) : true,
    meta_title:         type?.meta_title || '',
    meta_description:   type?.meta_description || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border shadow-dark-lg"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>

        <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
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
                  className="p-3 rounded-xl text-2xl transition-all border"
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

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function AdminProviderTypes() {
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(undefined);
  const [packsType, setPacksType]     = useState(null);
  const [optionsType, setOptionsType] = useState(null);

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
          {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl h-56 skeleton-adm" />)}
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucune catégorie. Créez-en une !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type, i) => (
            <motion.div key={type.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5 border group transition-all flex flex-col"
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

              <p className="text-xs leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: 'var(--adm-text2)' }}>
                {type.description}
              </p>

              <button onClick={() => handleDiscountQuick(type.id, type.discount_percentage)}
                className="flex items-center gap-2 mb-4 group/disc">
                <span className="adm-badge adm-badge-amber cursor-pointer">
                  <Percent size={10} /> {type.discount_percentage}% remise
                </span>
                <span className="text-xs opacity-0 group-hover/disc:opacity-70 transition-opacity" style={{ color: 'var(--adm-text2)' }}>
                  modifier
                </span>
              </button>

              <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                {type.slug === 'photographes' ? (
                  <button onClick={() => setOptionsType(type)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border"
                    style={{ color: '#93C5FD', borderColor: 'rgba(147,197,253,0.25)', background: 'rgba(147,197,253,0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(147,197,253,0.1)'; e.currentTarget.style.borderColor = 'rgba(147,197,253,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(147,197,253,0.04)'; e.currentTarget.style.borderColor = 'rgba(147,197,253,0.25)'; }}>
                    <Tag size={13} /> Gérer les options à la carte
                  </button>
                ) : (
                  <button onClick={() => setPacksType(type)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border"
                    style={{ color: '#D9A5A5', borderColor: 'rgba(217,165,165,0.25)', background: 'rgba(217,165,165,0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.1)'; e.currentTarget.style.borderColor = 'rgba(217,165,165,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.04)'; e.currentTarget.style.borderColor = 'rgba(217,165,165,0.25)'; }}>
                    <Package size={13} /> Gérer les packs / forfaits
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(type); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border font-display"
                    style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#E8DCD5'; e.currentTarget.style.borderColor = '#D9A5A580'; e.currentTarget.style.background = 'rgba(217,165,165,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.borderColor = 'var(--adm-border)'; e.currentTarget.style.background = ''; }}>
                    <Edit size={13} /> Modifier
                  </button>
                  <button onClick={() => handleDelete(type.id)}
                    className="p-2 rounded-xl transition-all border"
                    style={{ color: 'var(--adm-text2)', borderColor: 'var(--adm-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = '#F8717140'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-text2)'; e.currentTarget.style.borderColor = 'var(--adm-border)'; e.currentTarget.style.background = ''; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <TypeForm type={editing} onSave={() => { setShowForm(false); fetchTypes(); }} onClose={() => setShowForm(false)} />
        )}
        {packsType && (
          <PacksManagerModal type={packsType} onClose={() => setPacksType(null)} />
        )}
        {optionsType && (
          <OptionsManagerModal type={optionsType} onClose={() => setOptionsType(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
