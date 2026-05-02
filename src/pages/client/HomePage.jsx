import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import SEO from '../../components/common/SEO';
import api from '../../services/api';

const EMOJI_MAP = {
  photographes: '📸', traiteurs: '🍽️', decorateurs: '💐',
  animateurs: '🎵', fleuristes: '🌸', 'locations-salles': '🏛️',
};

const SLIDES = [
  {
    photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&auto=format&fit=crop',
    tag: 'Mariages & Fiançailles',
    title: 'Votre mariage\nde rêve',
    cta: 'Voir les prestataires',
    to: '/prestataires',
  },
  {
    photo: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&q=85&auto=format&fit=crop',
    tag: 'Décoration & Fleurs',
    title: 'Un décor\nà couper\nle souffle',
    cta: 'Décorateurs & Fleuristes',
    to: '/prestataires/decorateurs',
  },
  {
    photo: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1920&q=85&auto=format&fit=crop',
    tag: 'Gastronomie & Traiteurs',
    title: 'Des saveurs\ninoubliables',
    cta: 'Voir les traiteurs',
    to: '/prestataires/traiteurs',
  },
  {
    photo: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1920&q=85&auto=format&fit=crop',
    tag: 'Photographie',
    title: 'Immortalisez\nchaque instant',
    cta: 'Voir les photographes',
    to: '/prestataires/photographes',
  },
];

const TESTIMONIALS = [
  { text: 'Notre mariage était parfait. Tous nos prestataires trouvés sur une seule plateforme, un gain de temps incroyable.', name: 'Yasmine & Karim', event: 'Mariage · Tunis', initials: 'YK', stars: 5 },
  { text: 'La remise exclusive nous a fait économiser 3 500 TND. Impossible de trouver ces prix ailleurs.', name: 'Sofia & Mehdi', event: 'Mariage · Sousse', initials: 'SM', stars: 5 },
  { text: 'Photographe, traiteur, DJ — tout sélectionné depuis un seul endroit. Incroyable.', name: 'Nadia & Amine', event: 'Mariage · Sfax', initials: 'NA', stars: 5 },
];

const IV = ({ children, delay = 0, className = '' }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
    {children}
  </motion.div>
);

/* ── CAROUSEL ──────────────────────────────────────────────────── */
function HeroCarousel() {
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, [paused]);

  const prev = useCallback(() => setIdx(i => (i - 1 + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() => setIdx(i => (i + 1) % SLIDES.length), []);

  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      style={{ height: '62vh', minHeight: '360px', maxHeight: '660px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Photos */}
      <AnimatePresence mode="sync">
        <motion.img
          key={idx}
          src={SLIDES[idx].photo}
          alt={SLIDES[idx].tag}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,18,8,0.55) 0%, rgba(26,18,8,0.15) 50%, rgba(26,18,8,0.05) 100%)', zIndex: 1 }} />

      {/* Bottom-left text */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 sm:px-14 pb-16 sm:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-5"
              style={{ background: 'rgba(217,165,165,0.22)', border: '1px solid rgba(217,165,165,0.4)', color: '#E8DCD5', backdropFilter: 'blur(8px)' }}>
              <Sparkles size={9} /> {SLIDES[idx].tag}
            </div>

            <h1 className="font-display font-extrabold text-white mb-7"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', letterSpacing: '-0.04em', lineHeight: '0.92', whiteSpace: 'pre-line', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
              {SLIDES[idx].title}
            </h1>

            <Link to={SLIDES[idx].to}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-display font-bold text-sm transition-all"
              style={{ background: 'rgba(217,165,165,0.85)', color: "var(--text)", border: '1px solid rgba(217,165,165,0.5)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(217,165,165,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(217,165,165,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.85)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,165,165,0.35)'; }}>
              {SLIDES[idx].cta} <ArrowRight size={15} />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button onClick={prev}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-all"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        aria-label="Précédent">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-all"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        aria-label="Suivant">
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 right-8 sm:right-14 z-10 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className="transition-all rounded-full"
            style={{ width: i === idx ? '28px' : '8px', height: '8px', background: i === idx ? '#D9A5A5' : 'rgba(217,165,165,0.3)' }}
            aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}

/* ── MAIN ──────────────────────────────────────────────────────── */
export default function HomePage() {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    api.get('/provider-types').then(r => setTypes(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <>
      <SEO title={null} description="Les meilleurs prestataires événementiels de Tunisie — photographes, traiteurs, décorateurs." />

      {/* ── CAROUSEL ─────────────────────────────────────────── */}
      <div className="px-4 sm:px-8" style={{ paddingTop: '90px' }}>
        <HeroCarousel />
      </div>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: 'var(--s1)' }} aria-labelledby="cat-h">
        <div className="max-w-6xl mx-auto">
          <IV className="mb-16">
            <span className="eyebrow mb-5 block justify-center text-center">Catégories</span>
            <h2 id="cat-h" className="section-title text-center text-4xl sm:text-5xl">
              Chaque expert,<br />
              <span className="grad-primary">à portée de clic</span>
            </h2>
          </IV>

          {types.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {types.map((t, i) => (
                <IV key={t.id} delay={i * 0.06}>
                  <Link to={`/prestataires/${t.slug}`}
                    className="group block p-6 rounded-2xl transition-all duration-300"
                    style={{ background: 'rgba(217,165,165,0.03)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.07)'; e.currentTarget.style.borderColor = 'rgba(217,165,165,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,165,165,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
                    <div className="text-4xl mb-4">{EMOJI_MAP[t.slug] || '✦'}</div>
                    <h3 className="font-display font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>{t.name}</h3>
                    {t.discount_percentage > 0 && (
                      <span className="badge badge-gold">−{t.discount_percentage}% remise</span>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-display" style={{ color: 'var(--primary-lt)' }}>
                      Voir les profils <ChevronRight size={10} />
                    </div>
                  </Link>
                </IV>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl skeleton" />)}
            </div>
          )}

          <IV className="text-center mt-10">
            <Link to="/prestataires" className="btn btn-outline gap-2">
              Tous les prestataires <ArrowRight size={14} />
            </Link>
          </IV>
        </div>
      </section>

      {/* ── POURQUOI PRESTALINK ───────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,165,165,0.08), transparent 70%)', filter: 'blur(50px)' }} />
        <div className="max-w-5xl mx-auto relative">
          <IV className="text-center mb-20">
            <span className="eyebrow mb-5 block justify-center">La différence</span>
            <h2 className="section-title text-4xl sm:text-5xl">
              Pourquoi <span className="grad-primary">MyWedding</span> ?
            </h2>
          </IV>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🏅',
                color: '#6EE7B7',
                bg: 'rgba(16,185,129,0.08)',
                bd: 'rgba(16,185,129,0.2)',
                title: 'Prestataires vérifiés',
                desc: 'Chaque profil est validé par notre équipe avant d\'être publié sur la plateforme.',
              },
              {
                icon: '🎯',
                color: '#E8DCD5',
                bg: 'rgba(217,165,165,0.08)',
                bd: 'rgba(217,165,165,0.2)',
                title: 'Remises exclusives',
                desc: 'Des tarifs négociés sur chaque catégorie, uniquement disponibles sur MyWedding.',
              },
              {
                icon: '💬',
                color: '#F0D888',
                bg: 'rgba(217,165,165,0.06)',
                bd: 'rgba(217,165,165,0.15)',
                title: 'Conseil personnalisé',
                desc: 'Notre équipe vous accompagne via le chat pour composer votre événement idéal.',
              },
            ].map(({ icon, color, bg, bd, title, desc }, i) => (
              <IV key={title} delay={i * 0.1}>
                <div className="p-8 rounded-2xl h-full transition-all"
                  style={{ background: 'rgba(217,165,165,0.03)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                    style={{ background: bg, border: `1px solid ${bd}` }}>
                    {icon}
                  </div>
                  <h3 className="font-display font-bold text-base mb-3" style={{ color: 'var(--text)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
                </div>
              </IV>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVIS ─────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: 'var(--s2)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(rgba(217,165,165,1) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,165,165,0.08), transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-5xl mx-auto">
          <IV className="text-center mb-14">
            <span className="eyebrow mb-5 block justify-center">Avis clients</span>
            <h2 className="section-title text-4xl sm:text-5xl">
              Ils ont célébré<br />
              <span className="grad-primary">avec nous</span>
            </h2>
          </IV>

          {/* Featured quote */}
          <IV className="mb-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="font-display font-extrabold leading-none mb-6 grad-primary select-none"
                style={{ fontSize: '6rem', lineHeight: 0.8, opacity: 0.35 }}>"</div>
              <p className="text-xl sm:text-2xl font-display font-medium leading-snug mb-6"
                style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {TESTIMONIALS[0].text}
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #C48C8C, #D9A5A5)', color: "var(--text)" }}>
                  {TESTIMONIALS[0].initials}
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{TESTIMONIALS[0].name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>{TESTIMONIALS[0].event}</p>
                </div>
              </div>
            </div>
          </IV>

          <div className="grid md:grid-cols-2 gap-4">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <IV key={i} delay={i * 0.1}>
                <div className="p-7 rounded-2xl h-full"
                  style={{ background: 'rgba(217,165,165,0.04)', border: '1px solid var(--border)' }}>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} size={12} style={{ color: 'var(--primary)' }} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 italic" style={{ color: 'var(--text-2)' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #C48C8C, #D9A5A5)', color: "var(--text)" }}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-2)' }}>{t.event}</p>
                    </div>
                  </div>
                </div>
              </IV>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto">
          <IV>
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center"
              style={{ background: 'linear-gradient(135deg, #5A3A00 0%, #C48C8C 40%, #D9A5A5 70%, #F0D888 100%)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative">
                <h2 className="font-display font-extrabold text-3xl sm:text-5xl mb-5"
                  style={{ letterSpacing: '-0.03em', color: "var(--text)" }}>
                  Prêt à célébrer<br />en grand ?
                </h2>
                <p className="mb-10 max-w-md mx-auto text-base leading-relaxed" style={{ color: 'rgba(12,9,7,0.65)' }}>
                  Des centaines de prestataires vérifiés, des remises exclusives, un accompagnement personnalisé.
                </p>
                <Link to="/prestataires"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-display font-bold text-sm transition-all"
                  style={{ background: "var(--bg)", color: '#D9A5A5', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#161009'; e.currentTarget.style.color = '#E8DCD5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0C0907'; e.currentTarget.style.color = '#D9A5A5'; }}>
                  Trouver mes prestataires <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </IV>
        </div>
      </section>
    </>
  );
}
