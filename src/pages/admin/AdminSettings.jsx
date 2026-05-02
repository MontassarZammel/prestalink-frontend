import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Percent, Settings2, CreditCard } from 'lucide-react';
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

      {/* Discounts per type */}
      <SectionCard icon={Percent} title="Remises par catégorie"
        subtitle="Cette remise est appliquée automatiquement aux devis générés" delay={0.1}>
        <div className="space-y-3">
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
      </SectionCard>
    </div>
  );
}
