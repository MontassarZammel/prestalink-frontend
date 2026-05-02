import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, FileText, MessageCircle, TrendingUp, ArrowRight, DollarSign, Bell } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const CHART_DATA = [
  { month: 'Jan', devis: 4, montant: 12000 },
  { month: 'Fév', devis: 7, montant: 23000 },
  { month: 'Mar', devis: 5, montant: 18000 },
  { month: 'Avr', devis: 11, montant: 35000 },
  { month: 'Mai', devis: 8, montant: 27000 },
  { month: 'Jun', devis: 14, montant: 48000 },
];

const STATUS_BADGE = {
  draft:    'adm-badge adm-badge-gray',
  sent:     'adm-badge adm-badge-blue',
  accepted: 'adm-badge adm-badge-green',
  rejected: 'adm-badge adm-badge-red',
  expired:  'adm-badge adm-badge-amber',
};
const STATUS_LABEL = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré' };

const StatCard = ({ icon: Icon, label, value, sub, gradient, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="relative overflow-hidden rounded-2xl p-6 border"
    style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2"
      style={{ background: gradient }} />
    <div className="flex items-start justify-between mb-5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${gradient}20`, border: `1px solid ${gradient}30` }}>
        <Icon size={20} style={{ color: gradient }} />
      </div>
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest mb-1 font-display" style={{ color: 'var(--adm-text2)' }}>{label}</p>
    <p className="font-display text-3xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>{value}</p>
    {sub && <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>{sub}</p>}
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin-slow" />
    </div>
  );

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>
          Bienvenue sur le tableau de bord MyWedding
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Prestataires"      value={stats?.providers || 0}      gradient="#D9A5A5" delay={0}    />
        <StatCard icon={FileText}      label="Devis Total"       value={stats?.quotes || 0}         gradient="#F43F5E" delay={0.05} />
        <StatCard icon={DollarSign}    label="Chiffre d'affaires" value={`${(Number(stats?.revenue || 0) / 1000).toFixed(0)}k TND`} gradient="#10B981" delay={0.1} />
        <StatCard icon={MessageCircle} label="Conversations"     value={stats?.openConversations || 0} sub={`${stats?.unreadMessages || 0} non lu${stats?.unreadMessages > 1 ? 's' : ''}`} gradient="#D9A5A5" delay={0.15} />
      </div>

      {/* Chart + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl p-6 border"
          style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
              Évolution des devis
            </h2>
            <span className="adm-badge adm-badge-green">En croissance</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D9A5A5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D9A5A5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8B949E', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B949E', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--adm-surface2)',
                  border: '1px solid var(--adm-border)',
                  borderRadius: 10,
                  color: 'var(--adm-text)',
                  fontSize: 13,
                }}
                labelStyle={{ color: '#E8DCD5', fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="devis" stroke="#D9A5A5" strokeWidth={2.5} fill="url(#primaryGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <h2 className="font-display text-lg font-bold mb-5" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
            Actions rapides
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Ajouter un prestataire', to: '/admin/prestataires', icon: Users,         color: '#D9A5A5' },
              { label: 'Voir les devis',          to: '/admin/devis',        icon: FileText,       color: '#F43F5E' },
              { label: 'Chat en attente',         to: '/admin/chat',         icon: Bell,           color: '#D9A5A5', badge: stats?.unreadMessages },
              { label: 'Paramètres',              to: '/admin/parametres',   icon: TrendingUp,     color: '#10B981' },
            ].map(({ label, to, icon: Icon, color, badge }) => (
              <Link key={to} to={to}
                className="flex items-center justify-between p-3.5 rounded-xl border transition-all group"
                style={{ background: 'var(--adm-surface2)', borderColor: 'var(--adm-border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--adm-border)'}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-sm font-display font-semibold" style={{ color: 'var(--adm-text)' }}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {badge > 0 && <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
                  <ArrowRight size={13} style={{ color: 'var(--adm-text2)' }} />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Quotes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
            Devis récents
          </h2>
          <Link to="/admin/devis" className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors font-display">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {!stats?.recentQuotes?.length ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--adm-text2)' }}>Aucun devis pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Devis récents">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface2)' }}>
                  {['Numéro', 'Client', 'Prestataire', 'Montant', 'Statut', 'Date'].map(h => (
                    <th key={h} className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider font-display"
                      style={{ color: 'var(--adm-text2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats.recentQuotes || []).map((q, i) => (
                  <tr key={q.id} className="border-b transition-colors"
                    style={{ borderColor: 'var(--adm-border)', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="py-3.5 px-5 font-mono text-primary-400 text-xs font-bold">{q.quote_number}</td>
                    <td className="py-3.5 px-5 font-semibold font-display" style={{ color: 'var(--adm-text)' }}>{q.client_name}</td>
                    <td className="py-3.5 px-5" style={{ color: 'var(--adm-text2)' }}>{q.provider_name}</td>
                    <td className="py-3.5 px-5 font-semibold text-emerald-400 font-display">{Number(q.price_after_discount).toLocaleString('fr-TN')} TND</td>
                    <td className="py-3.5 px-5">
                      <span className={STATUS_BADGE[q.status] || 'adm-badge adm-badge-gray'}>
                        {STATUS_LABEL[q.status] || q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs" style={{ color: 'var(--adm-text2)' }}>
                      {new Date(q.created_at).toLocaleDateString('fr-TN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
