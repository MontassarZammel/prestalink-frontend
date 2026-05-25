import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, MapPin, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Camera, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPE_ICONS = { photographes: '📸', traiteurs: '🍽️', decorateurs: '💐', animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️' };

const OPT_CATEGORIES = ['Équipement', 'Forfait', 'Accessoire', 'Studio', 'Autre'];

const uploadImage = async file => {
  const fd = new FormData(); fd.append('image', file);
  const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data.url;
};

const ImagePicker = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const handleFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { onChange(await uploadImage(file)); } catch { toast.error('Erreur upload image'); }
    setUploading(false);
  };
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{ border: '1px dashed rgba(147,197,253,0.4)', color: '#93C5FD', background: 'rgba(147,197,253,0.06)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,197,253,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(147,197,253,0.06)'}>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {uploading ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
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

function OptionRow({ opt, providerId, onRefresh, onDelete }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemInput, setItemInput] = useState('');
  const parseItems = v => { try { return JSON.parse(v || '[]'); } catch { return []; } };
  const [form, setForm] = useState({
    name: opt.name || '', description: opt.description || '', price: opt.price || '',
    category: opt.category || 'Standard', sort_order: opt.sort_order || 0,
    is_active: Boolean(opt.is_active), image_url: opt.image_url || '', includes_standard: Boolean(opt.includes_standard),
    includes_items: parseItems(opt.includes_items),
  });
  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/providers/${providerId}/options/${opt.id}`, {
        name: form.name, description: form.description || null, price: Number(form.price) || 0,
        category: form.category, sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
        image_url: form.image_url || null, includes_standard: form.includes_standard,
        includes_items: form.includes_items,
      });
      toast.success('Option mise à jour'); onRefresh();
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };
  const quickToggle = async () => {
    const next = !form.is_active; setForm(f => ({ ...f, is_active: next }));
    try {
      await api.put(`/providers/${providerId}/options/${opt.id}`, { ...form, price: Number(form.price)||0, is_active: next, image_url: form.image_url||null, includes_standard: form.includes_standard });
      toast.success(next ? 'Activée' : 'Désactivée');
    } catch { setForm(f => ({ ...f, is_active: !next })); toast.error('Erreur'); }
  };
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--adm-border)', background: 'var(--adm-surface2)' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={quickToggle} className="flex-shrink-0">
          {form.is_active ? <ToggleRight size={20} style={{ color: '#34D399' }} /> : <ToggleLeft size={20} style={{ color: 'var(--adm-text2)' }} />}
        </button>
        {form.image_url && <img src={form.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" onError={e => { e.currentTarget.style.display='none'; }} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--adm-text)' }}>{form.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: 'var(--adm-text2)' }}>{form.category}</p>
            {form.includes_standard && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(147,197,253,0.15)', color: '#93C5FD' }}>forfait</span>}
          </div>
        </div>
        <span className="text-sm font-bold flex-shrink-0 font-display" style={{ color: '#E8DCD5' }}>{Number(form.price).toLocaleString('fr-TN')} TND</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg" style={{ color: 'var(--adm-text2)' }}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={() => onDelete(opt.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--adm-text2)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'} onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-text2)'}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="adm-input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Catégorie</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="adm-input w-full text-sm">
                    {OPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix (TND) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="adm-input w-full text-sm" min="0" step="10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="adm-input w-full text-sm" placeholder="Optionnel..." />
                </div>
                {form.category === 'Forfait' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Éléments inclus</label>
                    <div className="flex gap-2 mb-2">
                      <input value={itemInput} onChange={e => setItemInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = itemInput.trim(); if (v) { setForm(f => ({ ...f, includes_items: [...f.includes_items, v] })); setItemInput(''); }}}}
                        className="adm-input flex-1 text-sm" placeholder="Ajouter un élément (Entrée)" />
                      <button type="button" onClick={() => { const v = itemInput.trim(); if (v) { setForm(f => ({ ...f, includes_items: [...f.includes_items, v] })); setItemInput(''); }}}
                        className="adm-btn-primary text-xs px-3"><Plus size={13} /></button>
                    </div>
                    {form.includes_items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.includes_items.map((item, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                            {item}
                            <button type="button" onClick={() => setForm(f => ({ ...f, includes_items: f.includes_items.filter((_, j) => j !== i) }))}
                              className="ml-0.5 hover:text-red-400">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Photo</label>
                  <ImagePicker value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--adm-text2)' }}>
                <input type="checkbox" checked={form.includes_standard} onChange={e => setForm(f => ({ ...f, includes_standard: e.target.checked }))} className="w-4 h-4 rounded accent-blue-400" />
                Forfait — inclut le frais de base
              </label>
              <div className="flex justify-end">
                <button onClick={save} disabled={saving} className="adm-btn-primary text-sm gap-2 px-5">
                  {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : null}
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
const GOUVERNORATS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Le Kef','Siliana','Kairouan','Kasserine','Sidi Bouzid','Sousse','Monastir','Mahdia','Sfax','Gafsa','Tozeur','Kebili','Gabès','Médenine','Tataouine'];

const FormSection = ({ title, children }) => (
  <div className="mb-6">
    <p className="text-xs font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--adm-text2)' }}>{title}</p>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 font-display" style={{ color: 'var(--adm-text2)' }}>{label}</label>
    {children}
  </div>
);

const FIXED_PIECES = [5, 7, 10];

const ProviderForm = ({ provider, types, onSave, onClose }) => {
  const [form, setForm] = useState({
    type_id: provider?.type_id || '',
    name: provider?.name || '',
    description: provider?.description || '',
    short_description: provider?.short_description || '',
    email: provider?.email || '',
    phone: provider?.phone || '',
    website: provider?.website || '',
    address: provider?.address || '',
    city: provider?.city || '',
    governorate: provider?.governorate || '',
    logo: provider?.logo || '',
    cover_image: provider?.cover_image || '',
    standard_fee: provider?.standard_fee || '',
    commission_percentage: provider?.commission_percentage ?? 15,
    is_featured: provider?.is_featured || false,
    is_active: provider?.is_active !== undefined ? provider.is_active : true,
    meta_title: provider?.meta_title || '',
    meta_description: provider?.meta_description || '',
  });
  const [loading, setLoading]       = useState(false);
  const [tab, setTab]               = useState('info');
  const [packs, setPacks]           = useState(FIXED_PIECES.map(pc => ({ pieces_count: pc, price_per_person: '', discount_percentage: '0', is_active: true, fixed_items: [] })));
  const [packItemInputs, setPackItemInputs] = useState({});
  const [packsLoading, setPacksLoading] = useState(false);
  const [packsSaving, setPacksSaving]   = useState(false);
  const [savedProvider, setSavedProvider] = useState(provider || null);
  const [options, setOptions]       = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [showAddOpt, setShowAddOpt] = useState(false);
  const [addOptForm, setAddOptForm] = useState({ name: '', price: '', category: 'Équipement', description: '', image_url: '', includes_standard: false, includes_items: [] });
  const [addOptItemInput, setAddOptItemInput] = useState('');
  const [addOptSaving, setAddOptSaving] = useState(false);

  const selectedType  = types.find(t => String(t.id) === String(form.type_id));
  const isTraiteur    = selectedType?.slug === 'traiteurs';
  const isPhotographe = selectedType?.slug === 'photographes';

  const TABS = [
    { id: 'info',    label: 'Infos générales' },
    { id: 'contact', label: 'Contact & Lieu' },
    { id: 'media',   label: 'Médias & Prix' },
    ...(isTraiteur    ? [{ id: 'packs',   label: '🍽️ Packs' }]   : []),
    ...(isPhotographe ? [{ id: 'options', label: '📸 Options' }]  : []),
  ];

  const newOption = () => ({ _key: Date.now(), id: null, name: '', description: '', price: '', category: 'Standard', includes_standard: false, is_active: true });

  const addOption    = () => setOptions(o => [...o, newOption()]);
  const removeOption = (key, id) => {
    setOptions(o => o.filter(op => op._key !== key));
    if (id) setDeletedOptionIds(d => [...d, id]);
  };
  const updateOption = (key, field, val) =>
    setOptions(o => o.map(op => op._key === key ? { ...op, [field]: val } : op));

  const activeProviderId = savedProvider?.id || provider?.id;

  const loadOptions = () => {
    if (!activeProviderId) return;
    setOptionsLoading(true);
    api.get(`/providers/${activeProviderId}/options/admin`)
      .then(r => setOptions(r.data.data || []))
      .catch(() => {})
      .finally(() => setOptionsLoading(false));
  };

  useEffect(() => {
    if (tab !== 'options' || !activeProviderId) return;
    loadOptions();
  }, [tab, activeProviderId]);

  const handleDeleteOpt = async id => {
    if (!window.confirm('Supprimer cette option ?')) return;
    try { await api.delete(`/providers/${activeProviderId}/options/${id}`); toast.success('Supprimée'); loadOptions(); }
    catch { toast.error('Erreur'); }
  };

  const handleAddOpt = async () => {
    if (!addOptForm.name.trim() || !addOptForm.price) { toast.error('Nom et prix requis'); return; }
    setAddOptSaving(true);
    try {
      await api.post(`/providers/${activeProviderId}/options`, {
        name: addOptForm.name.trim(), price: Number(addOptForm.price),
        category: addOptForm.category || 'Équipement', description: addOptForm.description || null,
        image_url: addOptForm.image_url || null, includes_standard: addOptForm.includes_standard,
        includes_items: addOptForm.includes_items, sort_order: 99,
      });
      toast.success('Option ajoutée');
      setAddOptForm({ name: '', price: '', category: 'Équipement', description: '', image_url: '', includes_standard: false, includes_items: [] });
      setAddOptItemInput('');
      setShowAddOpt(false);
      loadOptions();
    } catch { toast.error('Erreur'); }
    setAddOptSaving(false);
  };

  useEffect(() => {
    if (tab !== 'packs' || !provider?.id) return;
    setPacksLoading(true);
    api.get(`/providers/${provider.id}/packages/admin`)
      .then(r => {
        const existing = r.data.data || [];
        setPacks(FIXED_PIECES.map(pc => {
          const found = existing.find(p => Number(p.pieces_count) === pc);
          const parsedFixed = (() => {
            if (!found?.fixed_items) return [];
            if (Array.isArray(found.fixed_items)) return found.fixed_items;
            try { return JSON.parse(found.fixed_items); } catch { return []; }
          })();
          return {
            pieces_count: pc,
            price_per_person:    found ? String(found.price_per_person)          : '',
            discount_percentage: found ? String(found.discount_percentage || 0)  : '0',
            is_active:           found ? Boolean(Number(found.is_active))         : true,
            fixed_items:         parsedFixed,
          };
        }));
      })
      .catch(() => {})
      .finally(() => setPacksLoading(false));
  }, [tab, provider?.id]);

  const handleSavePacks = async () => {
    if (!provider?.id) { toast.error('Sauvegardez d\'abord le prestataire'); return; }
    setPacksSaving(true);
    try {
      await api.post(`/providers/${provider.id}/packages/traiteur`, { packages: packs });
      toast.success('Packs mis à jour');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    setPacksSaving(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.type_id || !form.name) { toast.error('Type et nom requis'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        meta_title: form.name,
        meta_description: form.short_description || form.name,
      };
      if (provider || savedProvider) {
        await api.put(`/providers/${activeProviderId}`, payload);
        toast.success('Prestataire mis à jour');
        onSave();
      } else {
        const res = await api.post('/providers', payload);
        const newProv = res.data.data;
        toast.success('Prestataire ajouté');
        if (isPhotographe && newProv?.id) {
          setSavedProvider(newProv);
          setTab('options');
        } else {
          onSave();
        }
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="pf-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border shadow-dark-lg"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
          <h2 id="pf-title" className="font-display text-xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
            {provider ? 'Modifier le prestataire' : 'Nouveau prestataire'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl transition-all" style={{ color: 'var(--adm-text2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-surface2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all font-display ${
                tab === t.id ? 'text-white shadow-primary' : ''
              }`}
              style={{
                background: tab === t.id ? 'linear-gradient(135deg,#D9A5A5,#F43F5E)' : '',
                color: tab === t.id ? 'white' : 'var(--adm-text2)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="overflow-y-auto flex-1 px-7 py-5 scroll-adm">
          {tab === 'info' && (
            <div className="space-y-4">
              <Field label="Type de prestataire *">
                <div className="relative">
                  <select value={form.type_id} onChange={e => setForm(f => ({ ...f, type_id: e.target.value }))}
                    className="adm-input appearance-none pr-8 w-full" required>
                    <option value="">Sélectionner un type</option>
                    {types.map(t => <option key={t.id} value={t.id}>{TYPE_ICONS[t.slug]} {t.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text2)' }} />
                </div>
              </Field>
              <Field label="Nom *">
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="adm-input w-full" placeholder="Nom du prestataire" required />
              </Field>
              <Field label="Description courte">
                <input type="text" value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                  className="adm-input w-full" placeholder="Résumé en une ligne" maxLength={500} />
              </Field>
              <Field label="Description complète">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="adm-input w-full resize-none" rows={5} placeholder="Description détaillée..." />
              </Field>
              <div className="flex gap-6 pt-2">
                {[
                  { key: 'is_featured', label: 'Mis en avant', color: '#D9A5A5' },
                  { key: 'is_active',   label: 'Actif',        color: '#10B981' },
                ].map(({ key, label, color }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <button type="button" onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                      style={{ color: form[key] ? color : 'var(--adm-text2)' }}>
                      {form[key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                    <span className="text-sm font-display" style={{ color: 'var(--adm-text)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="adm-input w-full" placeholder="contact@prestataire.tn" />
                </Field>
                <Field label="Téléphone">
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="adm-input w-full" placeholder="+216 XX XXX XXX" />
                </Field>
              </div>
              <Field label="Site web">
                <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  className="adm-input w-full" placeholder="https://..." />
              </Field>
              <Field label="Adresse">
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="adm-input w-full" placeholder="Rue, quartier..." />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ville">
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="adm-input w-full" placeholder="Ex: Tunis" />
                </Field>
                <Field label="Gouvernorat">
                  <div className="relative">
                    <select value={form.governorate} onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))}
                      className="adm-input appearance-none pr-8 w-full">
                      <option value="">Sélectionner</option>
                      {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text2)' }} />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {tab === 'media' && (
            <div className="space-y-4">
              <Field label="Logo">
                <ImagePicker value={form.logo} onChange={url => setForm(f => ({ ...f, logo: url }))} />
              </Field>
              <Field label="Image de couverture">
                <ImagePicker value={form.cover_image} onChange={url => setForm(f => ({ ...f, cover_image: url }))} />
                {form.cover_image && <img src={form.cover_image} alt="cover preview" className="mt-2 h-28 w-full rounded-xl object-cover" />}
              </Field>
              <Field label="Frais de base (TND)">
                <input type="number" value={form.standard_fee || ''} onChange={e => setForm(f => ({ ...f, standard_fee: e.target.value }))}
                  className="adm-input w-full" placeholder="Ex: 150" min="0" step="10" />
              </Field>

              <div className="p-4 rounded-xl border" style={{ background: 'var(--adm-surface2)', borderColor: 'var(--adm-border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3 font-display" style={{ color: 'var(--adm-text2)' }}>
                  Commission plateforme
                </p>
                <Field label={`Commission totale (%) — défaut 15% → ${(Number(form.commission_percentage||15)/2).toFixed(1)}% remise client + ${(Number(form.commission_percentage||15)/2).toFixed(1)}% frais plateforme`}>
                  <div className="flex items-center gap-3">
                    <input type="number" value={form.commission_percentage} min="0" max="50" step="0.5"
                      onChange={e => setForm(f => ({ ...f, commission_percentage: e.target.value }))}
                      className="adm-input w-32 text-center" />
                    <span className="text-sm" style={{ color: 'var(--adm-text2)' }}>%</span>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
                      Client : −{(Number(form.commission_percentage||15)/2).toFixed(1)}%
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(217,165,165,0.1)', color: '#D9A5A5' }}>
                      Plateforme : +{(Number(form.commission_percentage||15)/2).toFixed(1)}%
                    </span>
                  </div>
                </Field>
              </div>
            </div>
          )}


          {tab === 'packs' && (
            <div>
              <p className="text-xs mb-4" style={{ color: 'var(--adm-text2)' }}>
                Configurez les 3 formules proposées par ce traiteur. Activez ou désactivez chaque option et définissez le prix et la remise.
              </p>
              {!provider?.id ? (
                <div className="rounded-xl p-6 text-center" style={{ background: 'var(--adm-surface2)', border: '1px dashed var(--adm-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Sauvegardez d'abord le prestataire pour configurer ses packs.</p>
                </div>
              ) : packsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl skeleton-adm" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {packs.map((pack, i) => (
                    <div key={pack.pieces_count} className="rounded-xl p-4 border"
                      style={{ background: 'var(--adm-surface2)', borderColor: pack.is_active ? 'rgba(196,140,140,0.3)' : 'var(--adm-border)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🍽️</span>
                          <span className="font-display font-bold text-sm" style={{ color: 'var(--adm-text)' }}>
                            {pack.pieces_count} pièces/personne
                          </span>
                          {!pack.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(244,63,94,0.1)', color: '#F87171' }}>Inactif</span>
                          )}
                        </div>
                        <button type="button"
                          onClick={() => setPacks(p => p.map((pk, j) => j === i ? { ...pk, is_active: !pk.is_active } : pk))}
                          style={{ color: pack.is_active ? '#10B981' : 'var(--adm-text2)' }}>
                          {pack.is_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 font-display" style={{ color: 'var(--adm-text2)' }}>
                            Prix / personne (TND)
                          </label>
                          <input type="number"
                            value={pack.price_per_person}
                            onChange={e => setPacks(p => p.map((pk, j) => j === i ? { ...pk, price_per_person: e.target.value } : pk))}
                            className="adm-input w-full" placeholder="Ex: 45" min="0" step="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 font-display" style={{ color: 'var(--adm-text2)' }}>
                            Remise (%)
                          </label>
                          <input type="number"
                            value={pack.discount_percentage}
                            onChange={e => setPacks(p => p.map((pk, j) => j === i ? { ...pk, discount_percentage: e.target.value } : pk))}
                            className="adm-input w-full" placeholder="0" min="0" max="100" step="1" />
                        </div>
                      </div>
                      {pack.price_per_person && Number(pack.discount_percentage) > 0 && (
                        <p className="text-xs mt-2 font-semibold" style={{ color: '#34D399' }}>
                          Prix après remise : {Math.round(Number(pack.price_per_person) * (1 - Number(pack.discount_percentage) / 100))} TND/pers.
                        </p>
                      )}

                      {/* Pièces fixes */}
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--adm-border)' }}>
                        <label className="block text-xs font-semibold mb-2 font-display" style={{ color: 'var(--adm-text2)' }}>
                          🍽️ Pièces fixes incluses
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(pack.fixed_items || []).map((item, fi) => (
                            <span key={fi} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(196,140,140,0.12)', border: '1px solid rgba(196,140,140,0.3)', color: 'var(--adm-text)' }}>
                              {item}
                              <button type="button" className="ml-0.5 opacity-60 hover:opacity-100"
                                onClick={() => setPacks(p => p.map((pk, j) => j === i
                                  ? { ...pk, fixed_items: pk.fixed_items.filter((_, k) => k !== fi) }
                                  : pk))}>
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={packItemInputs[i] || ''}
                            onChange={e => setPackItemInputs(p => ({ ...p, [i]: e.target.value }))}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && (packItemInputs[i] || '').trim()) {
                                e.preventDefault();
                                const val = packItemInputs[i].trim().replace(/,$/, '');
                                if (val && !(pack.fixed_items || []).includes(val)) {
                                  setPacks(p => p.map((pk, j) => j === i
                                    ? { ...pk, fixed_items: [...(pk.fixed_items || []), val] }
                                    : pk));
                                }
                                setPackItemInputs(p => ({ ...p, [i]: '' }));
                              }
                            }}
                            className="adm-input flex-1 text-xs"
                            placeholder="Ex: Méchoui, Couscous... (Entrée pour ajouter)" />
                          <button type="button"
                            onClick={() => {
                              const val = (packItemInputs[i] || '').trim();
                              if (val && !(pack.fixed_items || []).includes(val)) {
                                setPacks(p => p.map((pk, j) => j === i
                                  ? { ...pk, fixed_items: [...(pk.fixed_items || []), val] }
                                  : pk));
                              }
                              setPackItemInputs(p => ({ ...p, [i]: '' }));
                            }}
                            className="adm-btn-secondary text-xs px-3">
                            + Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={handleSavePacks} disabled={packsSaving}
                    className="adm-btn-primary w-full mt-2 gap-2">
                    {packsSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />}
                    Sauvegarder les packs
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

          {tab === 'options' && (
            <div className="space-y-4">
              {!activeProviderId ? (
                <div className="rounded-xl p-6 text-center" style={{ background: 'var(--adm-surface2)', border: '1px dashed var(--adm-border)' }}>
                  <Camera size={24} className="mx-auto mb-2" style={{ color: 'var(--adm-text2)' }} />
                  <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Sauvegardez d'abord le prestataire pour configurer ses options.</p>
                </div>
              ) : (
                <>
                  {/* Options list */}
                  {optionsLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 skeleton-adm rounded-xl" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text2)' }}>Options</p>
                        <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>{options.filter(o => o.is_active).length} actif / {options.length} total</span>
                      </div>

                      {options.length === 0 && !showAddOpt && (
                        <div className="text-center py-8 rounded-xl" style={{ border: '1px dashed var(--adm-border)' }}>
                          <Camera size={24} className="mx-auto mb-2" style={{ color: 'var(--adm-text2)' }} />
                          <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Aucune option configurée</p>
                        </div>
                      )}

                      <AnimatePresence>
                        {options.map(opt => (
                          <motion.div key={opt.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                            <OptionRow opt={opt} providerId={activeProviderId} onRefresh={loadOptions} onDelete={handleDeleteOpt} />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <AnimatePresence>
                        {showAddOpt && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-4 space-y-3"
                            style={{ background: 'rgba(217,165,165,0.05)', border: '1px dashed rgba(217,165,165,0.3)' }}>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#D9A5A5' }}>Nouvelle option</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Nom *</label>
                                <input value={addOptForm.name} onChange={e => setAddOptForm(f => ({ ...f, name: e.target.value }))}
                                  className="adm-input w-full text-sm" placeholder="Ex: Drone, Mirror Booth, Girafe..." />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Prix (TND) *</label>
                                <input type="number" value={addOptForm.price} onChange={e => setAddOptForm(f => ({ ...f, price: e.target.value }))}
                                  className="adm-input w-full text-sm" min="0" step="10" placeholder="900" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Catégorie</label>
                                <select value={addOptForm.category} onChange={e => setAddOptForm(f => ({ ...f, category: e.target.value }))} className="adm-input w-full text-sm">
                                  {OPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Description</label>
                                <textarea value={addOptForm.description} onChange={e => setAddOptForm(f => ({ ...f, description: e.target.value }))}
                                  className="adm-input w-full resize-none text-sm" rows={2} placeholder="Description optionnelle..." />
                              </div>
                              {addOptForm.category === 'Forfait' && (
                                <div className="col-span-2">
                                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Éléments inclus dans le forfait</label>
                                  <div className="flex gap-2 mb-2">
                                    <input value={addOptItemInput} onChange={e => setAddOptItemInput(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = addOptItemInput.trim(); if (v) { setAddOptForm(f => ({ ...f, includes_items: [...f.includes_items, v] })); setAddOptItemInput(''); } }}}
                                      className="adm-input flex-1 text-sm" placeholder="Ex: Séance 4h, Album photo... (Entrée pour ajouter)" />
                                    <button type="button" onClick={() => { const v = addOptItemInput.trim(); if (v) { setAddOptForm(f => ({ ...f, includes_items: [...f.includes_items, v] })); setAddOptItemInput(''); }}}
                                      className="adm-btn-primary text-xs px-3"><Plus size={13} /></button>
                                  </div>
                                  {addOptForm.includes_items.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {addOptForm.includes_items.map((item, i) => (
                                        <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                                          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                                          {item}
                                          <button type="button" onClick={() => setAddOptForm(f => ({ ...f, includes_items: f.includes_items.filter((_, j) => j !== i) }))}
                                            className="ml-0.5 hover:text-red-400">✕</button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text2)' }}>Photo</label>
                                <ImagePicker value={addOptForm.image_url} onChange={url => setAddOptForm(f => ({ ...f, image_url: url }))} />
                              </div>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--adm-text2)' }}>
                              <input type="checkbox" checked={addOptForm.includes_standard}
                                onChange={e => setAddOptForm(f => ({ ...f, includes_standard: e.target.checked }))}
                                className="w-4 h-4 rounded accent-blue-400" />
                              Forfait — inclut le frais de base
                            </label>
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => setShowAddOpt(false)} className="adm-btn-ghost text-sm px-4">Annuler</button>
                              <button type="button" onClick={handleAddOpt} disabled={addOptSaving} className="adm-btn-primary text-sm gap-2 px-5">
                                {addOptSaving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : <Plus size={14} />}
                                Ajouter
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!showAddOpt && (
                        <button type="button" onClick={() => setShowAddOpt(true)}
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
          )}

        {/* Footer */}
        <div className="px-7 py-5 border-t flex gap-3 flex-shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
          <button type="button" onClick={onClose} className="adm-btn-ghost flex-1">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="adm-btn-primary flex-1">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />}
            {provider ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editing, setEditing]     = useState(undefined);
  const [showForm, setShowForm]   = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [provRes, typeRes] = await Promise.all([
        api.get(`/providers/admin/all?search=${search}&page=${pagination.page}&limit=20`),
        api.get('/provider-types'),
      ]);
      setProviders(provRes.data.data || []);
      setPagination(p => ({ ...p, ...provRes.data.pagination }));
      setTypes(typeRes.data.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [search, pagination.page]);

  const handleDelete = async id => {
    if (!window.confirm('Supprimer ce prestataire ?')) return;
    try { await api.delete(`/providers/${id}`); toast.success('Supprimé'); fetchAll(); }
    catch (_) { toast.error('Erreur suppression'); }
  };

  const handleToggleActive = async p => {
    try {
      await api.put(`/providers/${p.id}`, { is_active: !p.is_active });
      toast.success(`Prestataire ${p.is_active ? 'désactivé' : 'activé'}`);
      fetchAll();
    } catch (_) { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>Prestataires</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--adm-text2)' }}>{pagination.total} prestataire(s)</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="adm-btn-primary gap-2">
          <Plus size={16} /> Nouveau prestataire
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-text2)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..." className="adm-input pl-9 w-full" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Liste des prestataires">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface2)' }}>
                {['Prestataire', 'Type', 'Ville', 'Prix', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3.5 px-5 text-xs font-bold uppercase tracking-wider font-display"
                    style={{ color: 'var(--adm-text2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-5"><div className="h-4 rounded skeleton-adm" /></td>
                    ))}
                  </tr>
                ))
              ) : providers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-sm" style={{ color: 'var(--adm-text2)' }}>Aucun prestataire trouvé</td></tr>
              ) : (
                providers.map(p => (
                  <tr key={p.id} className="border-b transition-colors"
                    style={{ borderColor: 'var(--adm-border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'var(--adm-surface2)', border: '1px solid var(--adm-border)' }}>
                          {p.logo
                            ? <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
                            : <span className="text-base">{TYPE_ICONS[p.type_slug] || '✦'}</span>}
                        </div>
                        <div>
                          <p className="font-semibold font-display" style={{ color: 'var(--adm-text)' }}>{p.name}</p>
                          {p.is_featured && <span className="text-amber-400 text-xs">⭐ Recommandé</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-sm" style={{ color: 'var(--adm-text2)' }}>{p.type_name}</td>
                    <td className="py-4 px-5">
                      {p.city && <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--adm-text2)' }}>
                        <MapPin size={11} />{p.city}
                      </span>}
                    </td>
                    <td className="py-4 px-5">
                      {p.price_min
                        ? <span className="adm-badge adm-badge-purple">{Number(p.price_min).toLocaleString('fr-TN')} TND</span>
                        : <span className="text-xs" style={{ color: 'var(--adm-text2)' }}>Sur devis</span>}
                    </td>
                    <td className="py-4 px-5">
                      <button onClick={() => handleToggleActive(p)}
                        className={`adm-badge cursor-pointer ${p.is_active ? 'adm-badge-green' : 'adm-badge-red'}`}>
                        {p.is_active ? '● Actif' : '● Inactif'}
                      </button>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <Link to={p.type_slug ? `/prestataires/${p.type_slug}/${p.slug}` : '#'} target="_blank"
                          className="p-2 rounded-lg transition-all" style={{ color: 'var(--adm-text2)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-bg)'; e.currentTarget.style.color = 'var(--adm-text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--adm-text2)'; }}
                          aria-label="Voir"><Eye size={15} /></Link>
                        <button onClick={() => { setEditing(p); setShowForm(true); }}
                          className="p-2 rounded-lg transition-all" style={{ color: 'var(--adm-text2)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.1)'; e.currentTarget.style.color = '#E8DCD5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--adm-text2)'; }}
                          aria-label="Modifier"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg transition-all" style={{ color: 'var(--adm-text2)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#F87171'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--adm-text2)'; }}
                          aria-label="Supprimer"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ProviderForm
            provider={editing}
            types={types}
            onSave={() => { setShowForm(false); fetchAll(); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
