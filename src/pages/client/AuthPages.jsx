import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';

const AuthInput = ({ icon: Icon, type, placeholder, value, onChange, name, required, disabled }) => {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }}>
        <Icon size={15} />
      </div>
      <input
        type={isPwd && show ? 'text' : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        disabled={disabled}
        autoComplete={name}
        className="input pl-11 py-3 w-full"
      />
      {isPwd && (
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
};

const AuthLayout = ({ children }) => {
  const { promoVisible } = useUiStore();
  const pt = 64 + (promoVisible ? 36 : 0) + 24;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-16 relative"
      style={{ background: 'var(--bg)', paddingTop: pt }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.12), transparent 65%)', filter: 'blur(60px)' }} />
      </div>
      <div className="relative w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

const LogoBlock = () => {
  const { dark } = useThemeStore();
  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex mb-2" aria-label="MyWedding">
        <img
          src="/logo-dark.png"
          alt="My Wedding"
          className="h-16 w-auto object-contain"
          style={{ filter: dark ? 'invert(1) brightness(2)' : 'brightness(0)' }}
        />
      </Link>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 font-display" style={{ color: 'var(--text-2)' }}>{label}</label>
    {children}
  </div>
);

const GOOGLE_ENABLED = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const GoogleButton = ({ label = 'Continuer avec Google' }) => {
  const [loading, setLoading] = useState(false);
  const { googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      setLoading(true);
      try {
        const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
        const profile = await res.json();
        const user = await googleLogin(tokenResponse.access_token, profile);
        toast.success(`Bienvenue ${user.full_name.split(' ')[0]} !`);
        const from = location.state?.from || '/';
        navigate(user.role === 'admin' ? '/admin' : from);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Erreur Google');
      }
      setLoading(false);
    },
    onError: () => toast.error('Connexion Google annulée'),
  });

  return (
    <button type="button" onClick={() => login()} disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border transition-all font-semibold text-sm font-display"
      style={{ background: 'var(--bg)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.06)'; e.currentTarget.style.borderColor = 'rgba(217,165,165,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}>
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
        : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
      }
      {label}
    </button>
  );
};

const Divider = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    <span className="text-xs font-semibold font-display" style={{ color: 'var(--text-3)' }}>OU</span>
    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
  </div>
);

export function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuthStore();
  const navigate              = useNavigate();
  const location              = useLocation();
  const from                  = location.state?.from || '/';

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Bienvenue ${user.full_name.split(' ')[0]} !`);
      navigate(user.role === 'admin' ? '/admin' : from);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects');
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <SEO title="Connexion" description="Connectez-vous à votre compte MyWedding" />
      <LogoBlock />

      <div className="rounded-3xl p-8"
        style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border-2)' }}>
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Connexion</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Bienvenue de retour</p>

        {GOOGLE_ENABLED && <><GoogleButton label="Se connecter avec Google" /><Divider /></>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Adresse email">
            <AuthInput icon={Mail} type="email" placeholder="email@exemple.com" name="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </Field>
          <Field label="Mot de passe">
            <AuthInput icon={Lock} type="password" placeholder="••••••••" name="password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </Field>
          <button type="submit" disabled={loading}
            className="btn btn-primary w-full btn-lg mt-2 gap-2">
            {loading
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              : <><Lock size={15} /> Se connecter</>}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-2)' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-bold transition-colors" style={{ color: "var(--primary-lt)" }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = "var(--primary-lt)"}>
            S'inscrire <ArrowRight size={12} className="inline" />
          </Link>
        </p>
      </div>

      <div className="mt-3 p-4 rounded-2xl text-center"
        style={{ background: 'rgba(255,220,150,0.03)', border: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
          Compte démo :{' '}
          <span className="font-mono font-bold" style={{ color: "var(--primary-lt)" }}>admin@mywedding.tn</span>
          {' / '}
          <span className="font-mono font-bold" style={{ color: "var(--primary-lt)" }}>Admin@2024</span>
        </p>
      </div>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [form, setForm]       = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register }          = useAuthStore();
  const navigate              = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (form.password.length < 6) { toast.error('Min. 6 caractères'); return; }
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password });
      toast.success('Compte créé !');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création de compte');
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <SEO title="Inscription" description="Créez votre compte MyWedding" />
      <LogoBlock />

      <div className="rounded-3xl p-8"
        style={{ background: 'rgba(255,220,150,0.04)', border: '1px solid var(--border-2)' }}>
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Créer un compte</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Rejoignez la plateforme N°1</p>

        {GOOGLE_ENABLED && <><GoogleButton label="S'inscrire avec Google" /><Divider /></>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom complet *">
            <AuthInput icon={User} type="text" placeholder="Votre nom complet" name="full_name"
              value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
          </Field>
          <Field label="Email *">
            <AuthInput icon={Mail} type="email" placeholder="email@exemple.com" name="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </Field>
          <Field label="Téléphone">
            <AuthInput icon={Phone} type="tel" placeholder="+216 XX XXX XXX" name="phone"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Mot de passe *">
              <AuthInput icon={Lock} type="password" placeholder="••••••" name="new-password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </Field>
            <Field label="Confirmer *">
              <AuthInput icon={Lock} type="password" placeholder="••••••" name="confirm-password"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
            </Field>
          </div>

          <button type="submit" disabled={loading}
            className="btn btn-primary w-full btn-lg mt-2 gap-2">
            {loading
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              : <><ArrowRight size={15} /> Créer mon compte</>}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-2)' }}>
          Déjà un compte ?{' '}
          <Link to="/login" className="font-bold" style={{ color: "var(--primary-lt)" }}>Se connecter</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
