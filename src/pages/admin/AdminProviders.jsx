import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, MapPin, X, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPE_ICONS = { photographes: '📸', traiteurs: '🍽️', decorateurs: '💐', animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️' };
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
    price_min: provider?.price_min || '',
    price_max: provider?.price_max || '',
    is_featured: provider?.is_featured || false,
    is_active: provider?.is_active !== undefined ? provider.is_active : true,
    meta_title: provider?.meta_title || '',
    meta_description: provider?.meta_description || '',
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState('info');

  const TABS = [
    { id: 'info', label: 'Infos générales' },
    { id: 'contact', label: 'Contact & Lieu' },
    { id: 'media', label: 'Médias & Prix' },
    { id: 'seo', label: 'SEO' },
  ];

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.type_id || !form.name) { toast.error('Type et nom requis'); return; }
    setLoading(true);
    try {
      if (provider) {
        await api.put(`/providers/${provider.id}`, form);
        toast.success('Prestataire mis à jour');
      } else {
        await api.post('/providers', form);
        toast.success('Prestataire ajouté');
      }
      onSave();
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
              <Field label="URL Logo">
                <input type="url" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                  className="adm-input w-full" placeholder="https://..." />
                {form.logo && <img src={form.logo} alt="logo preview" className="mt-2 h-12 rounded-xl object-contain p-1 border" style={{ background: 'var(--adm-surface2)', borderColor: 'var(--adm-border)' }} />}
              </Field>
              <Field label="Image de couverture (URL)">
                <input type="url" value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                  className="adm-input w-full" placeholder="https://..." />
                {form.cover_image && <img src={form.cover_image} alt="cover preview" className="mt-2 h-28 w-full rounded-xl object-cover" />}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix minimum (TND)">
                  <input type="number" value={form.price_min} onChange={e => setForm(f => ({ ...f, price_min: e.target.value }))}
                    className="adm-input w-full" placeholder="Ex: 1500" min="0" step="100" />
                </Field>
                <Field label="Prix maximum (TND)">
                  <input type="number" value={form.price_max} onChange={e => setForm(f => ({ ...f, price_max: e.target.value }))}
                    className="adm-input w-full" placeholder="Ex: 10000" min="0" step="100" />
                </Field>
              </div>
              <p className="text-xs italic" style={{ color: 'var(--adm-text2)' }}>Laissez vide pour afficher "Prix sur devis"</p>
            </div>
          )}

          {tab === 'seo' && (
            <div className="space-y-4">
              <Field label="Meta titre (SEO)">
                <input type="text" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  className="adm-input w-full" placeholder="Titre pour les moteurs de recherche" maxLength={255} />
                <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>{form.meta_title.length}/255</p>
              </Field>
              <Field label="Meta description (SEO)">
                <textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  className="adm-input w-full resize-none" rows={4} placeholder="Description SEO (160 caractères recommandés)" />
                <p className={`text-xs mt-1 ${form.meta_description.length > 160 ? 'text-amber-400' : ''}`}
                  style={{ color: form.meta_description.length <= 160 ? 'var(--adm-text2)' : undefined }}>
                  {form.meta_description.length}/160
                </p>
              </Field>
            </div>
          )}
        </div>

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
                        <Link to={`/prestataires/${p.type_slug}/${p.slug}`} target="_blank"
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
