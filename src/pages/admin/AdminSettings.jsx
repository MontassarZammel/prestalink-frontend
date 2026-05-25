import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Percent, Settings2, CreditCard, Image, ToggleLeft, ToggleRight, Upload, X, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EMOJI_MAP = { camera: '📸', 'chef-hat': '🍽️', palette: '💐', music: '🎵', flower: '🌸', building: '🏛️', star: '⭐', heart: '💝', zap: '⚡', gift: '🎁' };

const SectionCard = ({ icon: Icon, title, subtitle, children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="rounded-2xl p-6 border" style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
        <Icon size={18} style={{ color: '#E8DCD5' }} />
      </div>
      <div>
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text2)' }}>{subtitle}</p>}
      </div>
    </div>
    {children}
  </motion.div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 font-display" style={{ color: 'var(--adm-text2)' }}>{label}</label>
    {children}
  </div>
);

export default function AdminSettings() {
  const [settings, setSettings]   = useState({});
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [savingSettings, setSaving] = useState(false);
  const [savingType, setSavingType] = useState(null);
  const [uploadingSlide, setUploadingSlide] = useState(null);
  const fileRefs = useRef([null, null, null, null]);

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/provider-types')])
      .then(([sRes, tRes]) => {
        setSettings(sRes.data.data || {});
        setTypes(tRes.data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { settings });
      toast.success('Paramètres sauvegardés');
    } catch (_) { toast.error('Erreur sauvegarde'); }
    setSaving(false);
  };

  const uploadSlideImage = async (n, file) => {
    if (!file) return;
    setUploadingSlide(n);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url;
      setSettings(s => ({ ...s, [`homepage_slide_${n}`]: url }));
      toast.success(`Slide ${n} uploadée`);
    } catch (_) { toast.error('Erreur upload'); }
    setUploadingSlide(null);
  };

  const updateTypeDiscount = async (typeId, discount) => {
    setSavingType(typeId);
    try {
      await api.patch(`/provider-types/${typeId}/discount`, { discount_percentage: Number(discount) });
      toast.success('Remise mise à jour');
      setTypes(prev => prev.map(t => t.id === typeId ? { ...t, discount_percentage: Number(discount) } : t));
    } catch (_) { toast.error('Erreur'); }
    setSavingType(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin-slow" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>Paramètres</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--adm-text2)' }}>Configuration de la plateforme</p>
      </div>

      {/* General Settings */}
      <SectionCard icon={Settings2} title="Paramètres généraux" delay={0}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'site_name',                  label: 'Nom du site',            type: 'text' },
            { key: 'site_tagline',               label: 'Slogan',                 type: 'text' },
            { key: 'contact_email',              label: 'Email de contact',       type: 'email' },
            { key: 'contact_phone',              label: 'Téléphone',              type: 'tel' },
            { key: 'advance_payment_percentage', label: 'Acompte par défaut (%)', type: 'number' },
            { key: 'whatsapp_number',            label: 'Numéro WhatsApp (ex: 21612345678)', type: 'tel' },
          ].map(({ key, label, type }) => (
            <Field key={key} label={label}>
              <input type={type} value={settings[key] || ''}
                onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                className="adm-input w-full text-sm" />
            </Field>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} style={{ color: '#E8DCD5' }} />
            <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--adm-text2)' }}>
              Passerelles de paiement (clés API)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'konnect_api_key',   label: 'Konnect API Key' },
              { key: 'paymee_api_key',    label: 'Paymee API Key' },
              { key: 'd17_merchant_id',   label: 'D17 Merchant ID' },
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <input type="password" value={settings[key] || ''}
                  onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                  className="adm-input w-full text-sm" placeholder="••••••••" autoComplete="off" />
              </Field>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button onClick={saveSettings} disabled={savingSettings} className="adm-btn-primary gap-2">
            {savingSettings
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              : <Save size={14} />
            }
            Sauvegarder les paramètres
          </button>
        </div>
      </SectionCard>

      {/* Homepage slides */}
      <SectionCard icon={Image} title="Photos du carrousel" subtitle="Les 4 photos de la page d'accueil — upload ou URL" delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n, i) => {
            const url = settings[`homepage_slide_${n}`] || '';
            const isUploading = uploadingSlide === n;
            const isLocal = url.startsWith('/uploads/');
            return (
              <div key={n} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface2)' }}>
                {/* Preview */}
                <div className="relative w-full h-36 bg-black/20 flex items-center justify-center overflow-hidden">
                  {url ? (
                    <>
                      <img
                        src={isLocal ? `${import.meta.env.VITE_API_URL || ''}${url}` : url}
                        alt={`Slide ${n}`}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <button
                        onClick={() => setSettings(s => ({ ...s, [`homepage_slide_${n}`]: '' }))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white transition-all"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        title="Supprimer">
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Image size={28} style={{ color: 'var(--adm-text2)' }} />
                      <span className="text-xs font-display" style={{ color: 'var(--adm-text2)' }}>Slide {n}</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                      <span className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="p-3 space-y-2">
                  {/* Upload button */}
                  <input
                    ref={el => fileRefs.current[i] = el}
                    type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files[0]) uploadSlideImage(n, e.target.files[0]); e.target.value = ''; }}
                  />
                  <button
                    onClick={() => fileRefs.current[i]?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold font-display transition-all"
                    style={{ background: 'rgba(217,165,165,0.1)', color: '#E8DCD5', border: '1px solid rgba(217,165,165,0.25)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,165,165,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(217,165,165,0.1)'}>
                    <Upload size={13} />
                    {isUploading ? 'Envoi...' : 'Uploader une photo'}
                  </button>

                  {/* Or URL */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--adm-border)' }} />
                    <span className="text-xs" style={{ color: 'var(--adm-text3, var(--adm-text2))' }}>ou URL</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--adm-border)' }} />
                  </div>
                  <div className="relative">
                    <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text2)' }} />
                    <input
                      type="url"
                      value={url}
                      onChange={e => setSettings(s => ({ ...s, [`homepage_slide_${n}`]: e.target.value }))}
                      className="adm-input w-full text-xs pl-8"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <button onClick={saveSettings} disabled={savingSettings} className="adm-btn-primary gap-2">
            {savingSettings
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              : <Save size={14} />}
            Sauvegarder
          </button>
        </div>
      </SectionCard>

      {/* Discounts per type */}
      <SectionCard icon={Percent} title="Remises par catégorie"
        subtitle="Configurez et activez/désactivez les remises par catégorie de prestataire" delay={0.1}>

        {/* Global toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl mb-4"
          style={{ background: settings.category_discount_enabled === '1' ? 'rgba(52,211,153,0.06)' : 'var(--adm-surface2)',
                   border: `1px solid ${settings.category_discount_enabled === '1' ? 'rgba(52,211,153,0.25)' : 'var(--adm-border)'}` }}>
          <div>
            <p className="text-sm font-semibold font-display" style={{ color: 'var(--adm-text)' }}>
              Remises catégorie actives
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text2)' }}>
              {settings.category_discount_enabled === '1'
                ? 'Les remises ci-dessous sont appliquées sur les devis générés'
                : 'Désactivé — aucune remise catégorie ne sera appliquée'}
            </p>
          </div>
          <button
            onClick={() => {
              const newVal = settings.category_discount_enabled === '1' ? '0' : '1';
              setSettings(s => ({ ...s, category_discount_enabled: newVal }));
            }}
            style={{ color: settings.category_discount_enabled === '1' ? '#34D399' : 'var(--adm-text2)' }}>
            {settings.category_discount_enabled === '1'
              ? <ToggleRight size={36} />
              : <ToggleLeft size={36} />
            }
          </button>
        </div>

        <div className="space-y-3" style={{ opacity: settings.category_discount_enabled === '1' ? 1 : 0.4, pointerEvents: settings.category_discount_enabled === '1' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          {types.map(type => (
            <div key={type.id} className="flex items-center gap-4 p-4 rounded-xl border transition-all"
              style={{ background: 'var(--adm-surface2)', borderColor: 'var(--adm-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(217,165,165,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--adm-border)'}>
              <span className="text-2xl w-8 text-center flex-shrink-0">{EMOJI_MAP[type.icon] || '✦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-display truncate" style={{ color: 'var(--adm-text)' }}>{type.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--adm-text2)' }}>{type.slug}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative w-28">
                  <input type="number" min="0" max="100" step="0.5"
                    value={type.discount_percentage}
                    onChange={e => setTypes(prev => prev.map(t => t.id === type.id ? { ...t, discount_percentage: e.target.value } : t))}
                    className="adm-input text-sm pr-7 text-center w-full" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--adm-text2)' }}>%</span>
                </div>
                <button onClick={() => updateTypeDiscount(type.id, type.discount_percentage)}
                  disabled={savingType === type.id}
                  className="adm-btn-primary py-2 px-4 text-xs gap-1.5">
                  {savingType === type.id
                    ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                    : <Save size={11} />
                  }
                  Appliquer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <button onClick={saveSettings} disabled={savingSettings} className="adm-btn-primary gap-2">
            {savingSettings
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              : <Save size={14} />}
            Sauvegarder
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
