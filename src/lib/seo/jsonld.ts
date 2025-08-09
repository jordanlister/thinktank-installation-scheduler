/**
 * JSON-LD Structured Data Builders
 * 
 * Type-safe builders for generating Schema.org structured data
 * optimized for field service management software SEO.
 */

import { SITE_CONFIG, STRUCTURED_DATA_DEFAULTS } from './constants';

// Core Schema Types
export interface SchemaOrgBase {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: any;
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone?: string;
  email?: string;
  contactType?: string;
  availableLanguage?: string[];
  areaServed?: string;
}

export interface Review {
  '@type': 'Review';
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewBody: string;
  datePublished?: string;
}

export interface Offer {
  '@type': 'Offer';
  name: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
  billingIncrement?: string;
  url?: string;
  availability?: string;
  validFrom?: string;
  validThrough?: string;
}

// Organization Schema Builder
export interface OrganizationSchema extends SchemaOrgBase {
  '@type': 'Organization';
  name: string;
  legalName?: string;
  url: string;
  logo?: string;
  description?: string;
  foundingDate?: string;
  email?: string;
  telephone?: string;
  address?: PostalAddress;
  sameAs?: string[];
  contactPoint?: ContactPoint[];
}

export const buildOrganizationSchema = (
  overrides: Partial<OrganizationSchema> = {}
): OrganizationSchema => ({
  ...STRUCTURED_DATA_DEFAULTS.organization,
  ...overrides
});

// WebSite Schema Builder
export interface WebSiteSchema extends SchemaOrgBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  copyrightYear?: number;
  copyrightHolder?: {
    '@type': 'Organization';
    name: string;
  };
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export const buildWebSiteSchema = (
  overrides: Partial<WebSiteSchema> = {}
): WebSiteSchema => ({
  ...STRUCTURED_DATA_DEFAULTS.website,
  ...overrides
});

// WebPage Schema Builder
export interface WebPageSchema extends SchemaOrgBase {
  '@type': 'WebPage';
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  isPartOf?: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
  about?: {
    '@type': 'Thing';
    name: string;
    description?: string;
  };
  breadcrumb?: BreadcrumbListSchema;
}

export const buildWebPageSchema = (params: {
  name: string;
  url: string;
  description?: string;
  about?: { name: string; description?: string };
}): WebPageSchema => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: params.name,
  url: params.url,
  description: params.description,
  inLanguage: 'en-US',
  isPartOf: {
    '@type': 'WebSite',
    name: SITE_CONFIG.siteName,
    url: SITE_CONFIG.siteUrl
  },
  about: params.about ? {
    '@type': 'Thing',
    name: params.about.name,
    description: params.about.description
  } : undefined
});

// SoftwareApplication Schema Builder
export interface SoftwareApplicationSchema extends SchemaOrgBase {
  '@type': 'SoftwareApplication';
  name: string;
  applicationCategory: string;
  applicationSubCategory?: string;
  operatingSystem?: string;
  description: string;
  url: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  offers?: Offer[];
  featureList?: string[];
  screenshot?: string[];
  video?: string[];
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
}

export const buildSoftwareApplicationSchema = (
  overrides: Partial<SoftwareApplicationSchema> = {}
): SoftwareApplicationSchema => ({
  ...STRUCTURED_DATA_DEFAULTS.softwareApplication,
  ...overrides
});

// Product Schema Builder (for Pricing Page)
export interface ProductSchema extends SchemaOrgBase {
  '@type': 'Product';
  name: string;
  description: string;
  category?: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: Offer[];
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: Review[];
}

export const buildProductSchema = (params: {
  name: string;
  description: string;
  category?: string;
  offers: Offer[];
  rating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  reviews?: Review[];
}): ProductSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: params.name,
  description: params.description,
  category: params.category || 'Software',
  brand: {
    '@type': 'Brand',
    name: SITE_CONFIG.company.name
  },
  offers: params.offers,
  aggregateRating: params.rating ? {
    '@type': 'AggregateRating',
    ...params.rating
  } : undefined,
  review: params.reviews
});

// BreadcrumbList Schema Builder
export interface BreadcrumbListSchema extends SchemaOrgBase {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

export const buildBreadcrumbListSchema = (breadcrumbs: {
  name: string;
  url?: string;
}[]): BreadcrumbListSchema => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((breadcrumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: breadcrumb.name,
    item: breadcrumb.url
  }))
});

// FAQPage Schema Builder
export interface FAQPageSchema extends SchemaOrgBase {
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

export const buildFAQPageSchema = (faqs: {
  question: string;
  answer: string;
}[]): FAQPageSchema => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

// Article Schema Builder (for Resources/Blog)
export interface ArticleSchema extends SchemaOrgBase {
  '@type': 'Article';
  headline: string;
  description?: string;
  image?: string[];
  author: {
    '@type': 'Organization' | 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished?: string;
  dateModified?: string;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export const buildArticleSchema = (params: {
  headline: string;
  description?: string;
  image?: string[];
  author?: { name: string; url?: string };
  datePublished?: string;
  dateModified?: string;
  url?: string;
}): ArticleSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: params.headline,
  description: params.description,
  image: params.image,
  author: params.author ? {
    '@type': 'Organization',
    name: params.author.name,
    url: params.author.url
  } : {
    '@type': 'Organization',
    name: SITE_CONFIG.company.name,
    url: SITE_CONFIG.siteUrl
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_CONFIG.company.name,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.logoUrl}`
    }
  },
  datePublished: params.datePublished,
  dateModified: params.dateModified || params.datePublished,
  mainEntityOfPage: params.url ? {
    '@type': 'WebPage',
    '@id': params.url
  } : undefined
});

// LocalBusiness Schema Builder (for Contact Page)
export interface LocalBusinessSchema extends SchemaOrgBase {
  '@type': 'LocalBusiness';
  name: string;
  description?: string;
  url: string;
  telephone?: string;
  email?: string;
  address: PostalAddress;
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  areaServed?: string[];
  contactPoint?: ContactPoint[];
}

export const buildLocalBusinessSchema = (params: {
  geo?: { latitude: number; longitude: number };
  openingHours?: string[];
  priceRange?: string;
  areaServed?: string[];
  contactPoint?: ContactPoint[];
}): LocalBusinessSchema => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_CONFIG.company.name,
  description: SITE_CONFIG.company.description,
  url: SITE_CONFIG.siteUrl,
  telephone: SITE_CONFIG.company.phone,
  email: SITE_CONFIG.company.email,
  address: {
    '@type': 'PostalAddress',
    ...SITE_CONFIG.company.address
  },
  geo: params.geo ? {
    '@type': 'GeoCoordinates',
    ...params.geo
  } : undefined,
  openingHours: params.openingHours,
  priceRange: params.priceRange,
  areaServed: params.areaServed,
  contactPoint: params.contactPoint
});

// Service Schema Builder
export interface ServiceSchema extends SchemaOrgBase {
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  areaServed?: string[];
  category?: string;
  offers?: Offer[];
  hasOfferCatalog?: {
    '@type': 'OfferCatalog';
    name: string;
    itemListElement: {
      '@type': 'Offer';
      itemOffered: {
        '@type': 'Service';
        name: string;
        description: string;
      };
    }[];
  };
}

export const buildServiceSchema = (params: {
  name: string;
  description: string;
  areaServed?: string[];
  category?: string;
  services?: { name: string; description: string }[];
}): ServiceSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: params.name,
  description: params.description,
  provider: {
    '@type': 'Organization',
    name: SITE_CONFIG.company.name,
    url: SITE_CONFIG.siteUrl
  },
  areaServed: params.areaServed,
  category: params.category,
  hasOfferCatalog: params.services ? {
    '@type': 'OfferCatalog',
    name: `${params.name} Services`,
    itemListElement: params.services.map(service => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.description
      }
    }))
  } : undefined
});

// Utility to combine multiple schemas
export const combineSchemas = (...schemas: SchemaOrgBase[]): SchemaOrgBase[] => {
  return schemas.filter(Boolean);
};

// Utility to serialize schema for JSON-LD script tag
export const serializeSchema = (schema: SchemaOrgBase | SchemaOrgBase[]): string => {
  return JSON.stringify(Array.isArray(schema) ? schema : [schema], null, 0);
};

// Common schema combinations for different page types
export const getHomePageSchemas = (): SchemaOrgBase[] => [
  buildOrganizationSchema(),
  buildWebSiteSchema(),
  buildSoftwareApplicationSchema()
];

export const getFeaturesPageSchemas = (): SchemaOrgBase[] => [
  buildWebPageSchema({
    name: 'Features - Field Service Management Software',
    url: `${SITE_CONFIG.siteUrl}/features`,
    description: 'Advanced features for field service management including AI scheduling, route optimization, and team management.',
    about: {
      name: 'Field Service Management Features',
      description: 'Comprehensive feature set for optimizing field service operations'
    }
  }),
  buildSoftwareApplicationSchema()
];

export const getPricingPageSchemas = (): SchemaOrgBase[] => [
  buildProductSchema({
    name: 'Lead Route Installation Scheduler',
    description: 'Field service management software with AI-powered scheduling and optimization',
    category: 'Business Software',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter Plan',
        price: '99',
        priceCurrency: 'USD',
        billingIncrement: 'Month',
        description: 'Perfect for small teams getting started',
        availability: 'InStock'
      },
      {
        '@type': 'Offer',
        name: 'Professional Plan',
        price: '299',
        priceCurrency: 'USD',
        billingIncrement: 'Month',
        description: 'Advanced features for growing companies',
        availability: 'InStock'
      }
    ],
    rating: {
      ratingValue: 4.8,
      reviewCount: 127,
      bestRating: 5,
      worstRating: 1
    }
  })
];

export const getContactPageSchemas = (): SchemaOrgBase[] => [
  buildLocalBusinessSchema({
    geo: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    openingHours: [
      'Mo-Fr 09:00-18:00'
    ],
    areaServed: ['United States', 'Canada'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.company.phone,
        email: SITE_CONFIG.company.email,
        contactType: 'customer service',
        availableLanguage: ['English'],
        areaServed: 'US'
      }
    ]
  })
];