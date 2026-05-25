import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, FileText, MessageCircle, TrendingUp, ArrowRight, DollarSign, Bell, UserCheck, Star, Target } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_BADGE = {
  draft:    'adm-badge adm-badge-gray',
  sent:     'adm-badge adm-badge-blue',
  accepted: 'adm-badge adm-badge-green',
  rejected: 'adm-badge adm-badge-red',
  expired:  'adm-badge adm-badge-amber',
};
const STATUS_LABEL = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré' };

const StatCard = ({ icon: Icon, label, value, sub, gradient, delay = 0, to }) => {
  const content = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="relative overflow-hidden rounded-2xl p-5 border transition-all"
      style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2"
        style={{ background: gradient }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${gradient}20`, border: `1px solid ${gradient}30` }}>
          <Icon size={18} style={{ color: gradient }} />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1 font-display" style={{ color: 'var(--adm-text2)' }}>{label}</p>
      <p className="font-display text-3xl font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--adm-text2)' }}>{sub}</p>}
    </motion.div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm border"
      style={{ background: 'var(--adm-surface2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'montant' ? `${Number(p.value).toLocaleString('fr-TN')} TND` : `${p.value} devis`}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Build full 12-month array padded with zeros
  const chartData = MONTH_NAMES.map((month, i) => {
    const found = stats?.monthlyRevenue?.find(m => Number(m.month) === i + 1);
    return { month, devis: Number(found?.devis || 0), montant: Number(found?.montant || 0) };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin-slow" />
    </div>
  );

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--adm-text2)' }}>Tableau de bord MyWedding</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Prestataires"       value={stats?.providers || 0}    gradient="#D9A5A5" delay={0}    />
        <StatCard icon={FileText}   label="Devis total"        value={stats?.quotes || 0}       gradient="#F43F5E" delay={0.05} />
        <StatCard icon={DollarSign} label="Chiffre d'affaires" value={`${(Number(stats?.revenue || 0) / 1000).toFixed(1)}k TND`} gradient="#10B981" delay={0.1} />
        <StatCard icon={UserCheck}  label="Clients"            value={stats?.clients || 0}      gradient="#8B5CF6" delay={0.15} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target}       label="Taux conversion"  value={`${stats?.conversionRate || 0}%`} gradient="#F59E0B" delay={0.18} />
        <StatCard icon={MessageCircle} label="Conversations"   value={stats?.openConversations || 0} sub={`${stats?.unreadMessages || 0} non lus`} gradient="#D9A5A5" delay={0.2} />
        <StatCard icon={Star}         label="Avis en attente"  value={stats?.pendingReviews || 0} gradient="#F59E0B" delay={0.22} to="/admin/avis" />
        <StatCard icon={Bell}         label="Messages non lus" value={stats?.unreadMessages || 0} gradient="#D9A5A5" delay={0.24} to="/admin/chat" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Monthly revenue chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="lg:col-span-2 rounded-2xl p-6 border"
          style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
              Évolution mensuelle — {new Date().getFullYear()}
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D9A5A5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D9A5A5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="devis" name="devis" stroke="#D9A5A5" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
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
              { label: 'Avis à modérer',          to: '/admin/avis',         icon: Star,           color: '#F59E0B', badge: stats?.pendingReviews },
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

      {/* Top providers + recent quotes */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top providers */}
        {stats?.topProviders?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            className="rounded-2xl p-6 border"
            style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
            <h2 className="font-display text-lg font-bold mb-5" style={{ color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
              Top prestataires
            </h2>
            <div className="space-y-3">
              {stats.topProviders.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-display flex-shrink-0"
                    style={{ background: i === 0 ? '#F59E0B20' : 'var(--adm-surface2)', color: i === 0 ? '#F59E0B' : 'var(--adm-text2)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-display truncate" style={{ color: 'var(--adm-text)' }}>{p.name}</p>
                    <div className="mt-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--adm-surface2)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${(p.total / (stats.topProviders[0]?.total || 1)) * 100}%`,
                        background: 'linear-gradient(90deg, #D9A5A5, #C48C8C)',
                      }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold font-display" style={{ color: 'var(--adm-text2)' }}>{p.total} devis</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Quotes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
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
            <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
              {stats.recentQuotes.map(q => (
                <div key={q.id} className="flex items-center justify-between px-5 py-3.5 gap-3 transition-colors"
                  style={{ cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--adm-text)' }}>{q.client_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--adm-text2)' }}>{q.provider_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={STATUS_BADGE[q.status] || 'adm-badge adm-badge-gray'}>
                      {STATUS_LABEL[q.status] || q.status}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-display">
                      {Number(q.price_after_discount).toLocaleString('fr-TN')} TND
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
