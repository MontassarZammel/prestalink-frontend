import SEO from '../../components/common/SEO';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useUiStore from '../../store/uiStore';

const PageShell = ({ title, seoTitle, children }) => {
  const { promoVisible } = useUiStore();
  const pt = 64 + (promoVisible ? 36 : 0) + 32;
  return (
  <>
    <SEO title={seoTitle} description={title} />
    <div className="min-h-screen pb-20 px-4 sm:px-6" style={{ background: 'var(--bg)', paddingTop: pt }}>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-10"
            style={{ color: 'var(--text)', letterSpacing: '-0.04em' }}>
            {title}
          </h1>
          <div className="prose-custom space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  </>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>{title}</h2>
    <div className="space-y-2">{children}</div>
  </div>
);

export function AboutPage() {
  return (
    <PageShell title="À propos de MyWedding" seoTitle="À propos">
      <Section title="Notre mission">
        <p>
          MyWedding est la plateforme de référence pour les prestataires événementiels en Tunisie.
          Notre mission est de simplifier l'organisation de votre mariage en vous connectant avec
          les meilleurs photographes, traiteurs, décorateurs, animateurs et bien d'autres.
        </p>
      </Section>

      <Section title="Notre histoire">
        <p>
          Fondée à Tunis, MyWedding est née d'une vision simple : rendre la planification d'événements
          accessible, transparente et sans stress. Nous croyons que chaque couple mérite un mariage
          de rêve, quelle que soit leur budget.
        </p>
        <p>
          Notre équipe travaille chaque jour pour référencer les meilleurs prestataires, vérifier leurs
          portfolios et vous garantir une expérience de qualité.
        </p>
      </Section>

      <Section title="Ce que nous offrons">
        <ul className="space-y-1.5 list-none">
          {[
            '🔍 Recherche et comparaison de prestataires',
            '💬 Chat direct avec les prestataires',
            '📄 Devis en ligne transparents',
            '💳 Paiement sécurisé en ligne',
            '⭐ Avis et recommandations vérifiés',
            '📅 Gestion du calendrier et disponibilités',
          ].map(item => <li key={item}>{item}</li>)}
        </ul>
      </Section>

      <Section title="Contact">
        <p>Pour toute question, n'hésitez pas à nous contacter :</p>
        <p>
          Email :{' '}
          <a href="mailto:contact@mywedding.tn" className="underline" style={{ color: 'var(--primary)' }}>
            contact@mywedding.tn
          </a>
        </p>
      </Section>
    </PageShell>
  );
}

export function CGUPage() {
  return (
    <PageShell title="Conditions Générales d'Utilisation" seoTitle="CGU">
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>Dernière mise à jour : janvier 2025</p>

      <Section title="1. Objet">
        <p>
          Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de la
          plateforme MyWedding accessible à l'adresse mywedding.tn. En accédant à la plateforme,
          vous acceptez sans réserve les présentes CGU.
        </p>
      </Section>

      <Section title="2. Inscription et compte utilisateur">
        <p>
          L'accès à certaines fonctionnalités nécessite la création d'un compte. Vous êtes
          responsable de la confidentialité de vos identifiants et de toutes les activités effectuées
          sous votre compte.
        </p>
      </Section>

      <Section title="3. Utilisation de la plateforme">
        <p>Vous vous engagez à :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Fournir des informations exactes lors de votre inscription</li>
          <li>Ne pas utiliser la plateforme à des fins illicites</li>
          <li>Respecter les droits des autres utilisateurs et prestataires</li>
          <li>Ne pas publier de contenus offensants ou inappropriés</li>
        </ul>
      </Section>

      <Section title="4. Devis et réservations">
        <p>
          Les devis émis sur MyWedding constituent des propositions commerciales entre vous et les
          prestataires. MyWedding agit en tant qu'intermédiaire et ne peut être tenu responsable
          des engagements pris directement entre les parties.
        </p>
      </Section>

      <Section title="5. Paiements">
        <p>
          Les paiements effectués via la plateforme sont sécurisés. Les acomptes versés peuvent être
          soumis aux conditions d'annulation spécifiques à chaque prestataire.
        </p>
      </Section>

      <Section title="6. Propriété intellectuelle">
        <p>
          L'ensemble du contenu de la plateforme (textes, images, logos) est protégé par le droit
          de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.
        </p>
      </Section>

      <Section title="7. Modification des CGU">
        <p>
          MyWedding se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
          seront informés par email en cas de modification substantielle.
        </p>
      </Section>

      <Section title="8. Loi applicable">
        <p>
          Les présentes CGU sont soumises au droit tunisien. Tout litige sera soumis aux tribunaux
          compétents de Tunis.
        </p>
      </Section>
    </PageShell>
  );
}

export function MentionsPage() {
  return (
    <PageShell title="Mentions Légales" seoTitle="Mentions légales">
      <Section title="Éditeur de la plateforme">
        <div className="rounded-xl p-5 space-y-2" style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}>
          <p><strong style={{ color: 'var(--text)' }}>Dénomination :</strong> MyWedding</p>
          <p><strong style={{ color: 'var(--text)' }}>Siège social :</strong> Tunis, Tunisie</p>
          <p><strong style={{ color: 'var(--text)' }}>Contact :</strong>{' '}
            <a href="mailto:contact@mywedding.tn" className="underline" style={{ color: 'var(--primary)' }}>
              contact@mywedding.tn
            </a>
          </p>
        </div>
      </Section>

      <Section title="Hébergement">
        <p>
          La plateforme est hébergée par un prestataire tiers disposant des certifications de sécurité
          nécessaires pour garantir la protection des données.
        </p>
      </Section>

      <Section title="Données personnelles">
        <p>
          Conformément à la législation tunisienne sur la protection des données personnelles,
          vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
          Pour exercer ces droits, contactez-nous à{' '}
          <a href="mailto:contact@mywedding.tn" className="underline" style={{ color: 'var(--primary)' }}>
            contact@mywedding.tn
          </a>.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          La plateforme utilise des cookies techniques nécessaires à son bon fonctionnement.
          En utilisant MyWedding, vous acceptez l'utilisation de ces cookies.
        </p>
      </Section>

      <Section title="Responsabilité">
        <p>
          MyWedding met tout en œuvre pour assurer la disponibilité et la sécurité de la plateforme.
          Cependant, la plateforme ne peut être tenue responsable des interruptions de service
          ou des dommages indirects résultant de l'utilisation de la plateforme.
        </p>
      </Section>
    </PageShell>
  );
}
