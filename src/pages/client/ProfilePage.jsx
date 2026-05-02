import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Save, FileText, CreditCard, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab]           = useState('infos');
  const [loading, setLoading]   = useState(false);
  const [stats, setStats]       = useState({ quotes: 0, payments: 0 });
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew]   = useState(false);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    api.get('/quotes/my').then(r => {
      const quotes = r.data.data || [];
      const paid   = quotes.filter(q => q.payment_status !== 'pending').length;
      setStats({ quotes: quotes.length, payments: paid });
    }).catch(() => {});
  }, []);

  const saveInfos = async e => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Le nom est requis'); return; }
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { full_name: form.full_name, phone: form.phone });
      if (res.data.user) {
        useAuthStore.setState(s => ({ ...s, user: { ...s.user, ...res.data.user } }));
        toast.success('Profil mis à jour ✓');
      }
    } catch (_) { toast.error('Erreur lors de la mise à jour'); }
    setLoading(false);
  };

  const savePassword = async e => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Minimum 6 caractères'); return; }
    setLoading(true);
    try {
      await api.put('/auth/profile', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Mot de passe modifié ✓');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const initial = user?.full_name?.[0]?.toUpperCase() || '?';

  return (
    <>
      <SEO title="Mon profil — MyWedding" description="Gérez votre profil MyWedding" />
      <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto">

          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>

            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-3xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#C48C8C,#D9A5A5)', color: 'white' }}>
              {initial}
            </div>

            {/* Info + stats */}
            <div className="flex-1 w-full">
              <h1 className="font-display font-bold text-xl mb-0.5" style={{ color: 'var(--text)' }}>{user?.full_name}</h1>
              <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{user?.email}</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: FileText, label: 'Devis créés', value: stats.quotes, color: '#E8DCD5', to: '/mes-devis' },
                  { icon: CreditCard, label: 'Paiements', value: stats.payments, color: '#34D399', to: '/mes-devis' },
                ].map(s => (
                  <Link key={s.label} to={s.to}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--s3)', border: '1px solid var(--border)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}18` }}>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {[['infos', User, 'Mes informations'], ['password', Lock, 'Mot de passe']].map(([id, Icon, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-display transition-all"
                style={{
                  background: tab === id ? 'linear-gradient(135deg,#C48C8C,#D9A5A5)' : 'var(--s2)',
                  color: tab === id ? 'white' : 'var(--text-2)',
                  border: '1px solid var(--border-2)',
                }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 sm:p-8"
            style={{ background: 'var(--s2)', border: '1px solid var(--border-2)' }}>

            {tab === 'infos' && (
              <form onSubmit={saveInfos} className="space-y-5">
                <h2 className="font-display font-bold text-base mb-6" style={{ color: 'var(--text)' }}>Informations personnelles</h2>

                <div>
                  <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>Nom complet</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                    <input className="input w-full pl-10" value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Votre nom complet" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                    <input className="input w-full pl-10 opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>L'email ne peut pas être modifié</p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>Téléphone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                    <input type="tel" className="input w-full pl-10" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+216 XX XXX XXX" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="btn btn-primary gap-2 mt-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : <Save size={14} />}
                  Sauvegarder
                </button>
              </form>
            )}

            {tab === 'password' && (
              <form onSubmit={savePassword} className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(217,165,165,0.1)', border: '1px solid rgba(217,165,165,0.2)' }}>
                    <ShieldCheck size={18} style={{ color: '#E8DCD5' }} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Changer le mot de passe</h2>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Minimum 6 caractères</p>
                  </div>
                </div>

                {[
                  { key: 'current_password', label: 'Mot de passe actuel', show: showCurr, toggle: () => setShowCurr(v => !v) },
                  { key: 'new_password',     label: 'Nouveau mot de passe', show: showNew,  toggle: () => setShowNew(v => !v) },
                  { key: 'confirm_password', label: 'Confirmer le nouveau mot de passe', show: showNew, toggle: () => setShowNew(v => !v) },
                ].map(({ key, label, show, toggle }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>{label}</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                      <input
                        type={show ? 'text' : 'password'}
                        className="input w-full pl-10 pr-10"
                        value={pwForm[key]}
                        onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-3)' }}>
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}

                <button type="submit" disabled={loading} className="btn btn-primary gap-2 mt-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" /> : <Lock size={14} />}
                  Modifier le mot de passe
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
