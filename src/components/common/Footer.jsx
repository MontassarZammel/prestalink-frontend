import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

export default function Footer() {
  const { dark } = useThemeStore();
  return (
    <footer style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)' }} role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-12">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex mb-5" aria-label="MyWedding">
              <img
                src="/logo-dark.png"
                alt="My Wedding"
                className="h-10 w-auto object-contain"
                style={{ filter: dark ? 'invert(1) brightness(2)' : 'brightness(0)' }}
              />
            </Link>
            <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: 'var(--text-2)' }}>
              La plateforme de référence pour vos prestataires événementiels en Tunisie.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Disponible 24h/24</span>
            </div>
          </div>

          {/* Catégories */}
          <div>
            <p className="font-display font-bold text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-3)' }}>
              Catégories
            </p>
            <ul className="space-y-2.5">
              {[
                ['📸 Photographes', '/prestataires/photographes'],
                ['🍽️ Traiteurs', '/prestataires/traiteurs'],
                ['💐 Décorateurs', '/prestataires/decorateurs'],
                ['🎵 Animateurs', '/prestataires/animateurs'],
                ['🌸 Fleuristes', '/prestataires/fleuristes'],
                ['🏛️ Salles', '/prestataires/locations-salles'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to}
                    className="text-sm flex items-center gap-1 group transition-colors"
                    style={{ color: 'var(--text-2)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                    {label}
                    <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Plateforme */}
          <div>
            <p className="font-display font-bold text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-3)' }}>
              Plateforme
            </p>
            <ul className="space-y-2.5">
              {[
                ['Accueil', '/'],
                ['Tous les prestataires', '/prestataires'],
                ['Chat Support', '/chat'],
                ['Mes Devis', '/mes-devis'],
                ['À propos', '/a-propos'],
                ['Connexion', '/login'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to}
                    className="text-sm flex items-center gap-1 group transition-colors"
                    style={{ color: 'var(--text-2)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                    {label}
                    <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-display font-bold text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-3)' }}>
              Contact
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
                <MapPin size={14} style={{ color: 'var(--primary)' }} className="flex-shrink-0 mt-0.5" />
                Tunis, Tunisie
              </li>
              <li>
                <a href="mailto:contact@mywedding.tn"
                  className="flex items-center gap-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  <Mail size={14} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
                  contact@mywedding.tn
                </a>
              </li>
              <li>
                <a href="tel:+21600000000"
                  className="flex items-center gap-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
                  +216 XX XXX XXX
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            © {new Date().getFullYear()} MyWedding — Tous droits réservés
          </p>
          <div className="flex gap-5">
            {[['À propos', '/a-propos'], ['CGU', '/cgu'], ['Mentions légales', '/mentions-legales']].map(([label, to]) => (
              <Link key={to} to={to}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
