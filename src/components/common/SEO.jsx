import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, canonical, image, type = 'website' }) => {
  const siteName = 'MyWedding';
  const defaultDesc = 'Trouvez les meilleurs prestataires en Tunisie : photographes, traiteurs, décorateurs, animateurs et plus encore. Qualité premium garantie.';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} — Vos prestataires d'excellence en Tunisie`;
  const metaDesc = description || defaultDesc;
  const ogImage = image || '/og-image.jpg';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#1a1a2e" />
      <link rel="canonical" href={canonical || window.location.href} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="fr_TN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: 'https://mywedding.tn',
        description: metaDesc,
        inLanguage: 'fr-TN',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://mywedding.tn/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      })}</script>
    </Helmet>
  );
};

export default SEO;
