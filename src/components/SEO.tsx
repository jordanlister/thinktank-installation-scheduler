/**
 * SEO Component for Think Tank Technologies
 * 
 * Comprehensive SEO management with meta tags, Open Graph,
 * Twitter cards, and JSON-LD structured data.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  SITE_CONFIG, 
  PAGE_METADATA, 
  OPEN_GRAPH_DEFAULTS, 
  TWITTER_DEFAULTS,
  getCanonicalUrl,
  formatTitle,
  truncateDescription 
} from '../lib/seo/constants';
import { SchemaOrgBase, serializeSchema } from '../lib/seo/jsonld';

// SEO Component Props Interface
export interface SEOProps {
  // Page Information
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  ogUrl?: string;

  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterImageAlt?: string;

  // Structured Data
  jsonLd?: SchemaOrgBase | SchemaOrgBase[];

  // Additional Meta Tags
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  
  // Page-specific
  pageType?: keyof typeof PAGE_METADATA;
  
  // Custom meta tags
  customMeta?: { name?: string; property?: string; content: string }[];
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  noindex = false,
  nofollow = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  twitterImageAlt,
  jsonLd,
  author,
  publishDate,
  modifiedDate,
  pageType,
  customMeta = []
}) => {
  // Get page metadata if pageType is provided
  const pageMetadata = pageType ? PAGE_METADATA[pageType] : null;
  
  // Resolve final values with fallbacks
  const resolvedTitle = title || pageMetadata?.title || SITE_CONFIG.siteName;
  const resolvedDescription = description || pageMetadata?.description || SITE_CONFIG.siteDescription;
  const resolvedKeywords = keywords.length > 0 ? keywords : (pageMetadata?.keywords || []);
  const resolvedCanonicalUrl = canonicalUrl || (pageMetadata?.path ? getCanonicalUrl(pageMetadata.path) : SITE_CONFIG.siteUrl);
  const resolvedOgImage = ogImage || pageMetadata?.image || `${SITE_CONFIG.siteUrl}/images/og/default.jpg`;
  
  // Format title with site name
  const formattedTitle = formatTitle(resolvedTitle);
  
  // Truncate description to optimal length
  const truncatedDescription = truncateDescription(resolvedDescription);
  
  // Robots directive
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={truncatedDescription} />
      {resolvedKeywords.length > 0 && (
        <meta name="keywords" content={resolvedKeywords.join(', ')} />
      )}
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={resolvedCanonicalUrl} />
      
      {/* Author and Dates */}
      {author && <meta name="author" content={author} />}
      {publishDate && <meta name="article:published_time" content={publishDate} />}
      {modifiedDate && <meta name="article:modified_time" content={modifiedDate} />}
      
      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content={SITE_CONFIG.themeColor} />
      <meta name="msapplication-TileColor" content={SITE_CONFIG.themeColor} />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || resolvedTitle} />
      <meta property="og:description" content={ogDescription || truncatedDescription} />
      <meta property="og:url" content={ogUrl || resolvedCanonicalUrl} />
      <meta property="og:site_name" content={OPEN_GRAPH_DEFAULTS.siteName} />
      <meta property="og:locale" content={OPEN_GRAPH_DEFAULTS.locale} />
      
      {/* Open Graph Image */}
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:width" content={OPEN_GRAPH_DEFAULTS.imageWidth.toString()} />
      <meta property="og:image:height" content={OPEN_GRAPH_DEFAULTS.imageHeight.toString()} />
      <meta property="og:image:type" content={OPEN_GRAPH_DEFAULTS.imageType} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={TWITTER_DEFAULTS.site} />
      <meta name="twitter:creator" content={TWITTER_DEFAULTS.creator} />
      <meta name="twitter:title" content={twitterTitle || resolvedTitle} />
      <meta name="twitter:description" content={twitterDescription || truncatedDescription} />
      <meta name="twitter:image" content={twitterImage || resolvedOgImage} />
      {twitterImageAlt && <meta name="twitter:image:alt" content={twitterImageAlt} />}
      
      {/* Additional Meta Tags */}
      <meta name="application-name" content={SITE_CONFIG.siteName} />
      <meta name="apple-mobile-web-app-title" content={SITE_CONFIG.siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      
      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      
      {/* Preconnect for Critical Resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Custom Meta Tags */}
      {customMeta.map((meta, index) => {
        if (meta.name) {
          return <meta key={index} name={meta.name} content={meta.content} />;
        } else if (meta.property) {
          return <meta key={index} property={meta.property} content={meta.content} />;
        }
        return null;
      })}
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: serializeSchema(jsonLd)
          }}
        />
      )}
    </Helmet>
  );
};

export default SEO;

// Pre-configured SEO components for common pages
export const HomeSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="home"
    ogType="website"
    twitterCard="summary_large_image"
    {...props}
  />
);

export const FeaturesSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="features"
    ogType="website"
    twitterCard="summary_large_image"
    {...props}
  />
);

export const SolutionsSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="solutions"
    ogType="website"
    twitterCard="summary_large_image"
    {...props}
  />
);

export const PricingSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="pricing"
    ogType="product"
    twitterCard="summary_large_image"
    {...props}
  />
);

export const ResourcesSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="resources"
    ogType="website"
    twitterCard="summary_large_image"
    {...props}
  />
);

export const CompanySEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="company"
    ogType="website"
    twitterCard="summary_large_image"
    {...props}
  />
);

export const ContactSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEO
    pageType="contact"
    ogType="website"
    twitterCard="summary"
    {...props}
  />
);

// Article SEO for blog posts/resources
export const ArticleSEO: React.FC<SEOProps & {
  articleTitle: string;
  articleDescription: string;
  authorName?: string;
  publishedDate?: string;
  modifiedDate?: string;
  articleImage?: string;
}> = ({
  articleTitle,
  articleDescription,
  authorName,
  publishedDate,
  modifiedDate,
  articleImage,
  ...props
}) => (
  <SEO
    title={articleTitle}
    description={articleDescription}
    ogType="article"
    author={authorName}
    publishDate={publishedDate}
    modifiedDate={modifiedDate}
    ogImage={articleImage}
    twitterCard="summary_large_image"
    customMeta={[
      { name: 'article:author', content: authorName || SITE_CONFIG.company.name },
      ...(publishedDate ? [{ name: 'article:published_time', content: publishedDate }] : []),
      ...(modifiedDate ? [{ name: 'article:modified_time', content: modifiedDate }] : [])
    ]}
    {...props}
  />
);