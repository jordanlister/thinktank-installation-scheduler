/**
 * SEO Constants for Lead Route
 * 
 * Site-wide SEO configuration, metadata, and structured data constants
 * optimized for field service management software keywords.
 */

// Base Site Configuration
export const SITE_CONFIG = {
  siteName: 'Lead Route',
  siteUrl: process.env.VITE_SITE_URL || 'https://thinktanktechnologies.com',
  siteDescription: 'Advanced field service management software with AI-powered scheduling, route optimization, and team management for HVAC, solar, telecom, and security installation companies.',
  logoUrl: '/thinktanklogo.png',
  
  // Company Information
  company: {
    name: 'Lead Route',
    legalName: 'Lead Route LLC',
    foundingDate: '2020-01-15',
    description: 'Leading provider of AI-powered field service management software for installation and maintenance companies.',
    
    // Contact Information
    email: 'contact@leadroute.com',
    phone: '+1-555-TTT-TECH',
    address: {
      streetAddress: '123 Innovation Drive',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94107',
      addressCountry: 'US'
    },
    
    // Social Media
    socialProfiles: [
      'https://linkedin.com/company/think-tank-technologies',
      'https://twitter.com/thinktanktech',
      'https://facebook.com/thinktanktechnologies'
    ]
  },

  // Theme Colors for Meta Tags
  themeColor: '#10b981',
  backgroundColor: '#0a0a0a'
} as const;

// Primary Keywords (Target Keywords)
export const PRIMARY_KEYWORDS = [
  'field service management software',
  'installation scheduling software',
  'route optimization software',
  'AI scheduling platform',
  'field service automation'
] as const;

// Secondary Keywords (Supporting Keywords)
export const SECONDARY_KEYWORDS = [
  'HVAC scheduling software',
  'technician management platform',
  'service dispatch software',
  'field service optimization',
  'installation management system',
  'team scheduling platform',
  'mobile field service app'
] as const;

// Long-tail Keywords (Specific Search Intent)
export const LONG_TAIL_KEYWORDS = [
  'AI-powered field service scheduling',
  'automated installation management system',
  'field service optimization platform',
  'intelligent route planning software',
  'HVAC technician scheduling software',
  'solar installation management platform',
  'telecom field service automation',
  'enterprise field service solution'
] as const;

// Industry-Specific Keywords
export const INDUSTRY_KEYWORDS = {
  hvac: [
    'HVAC installation scheduling',
    'heating cooling service management',
    'HVAC technician dispatch software',
    'air conditioning service scheduling',
    'HVAC maintenance management'
  ],
  solar: [
    'solar installation scheduling',
    'solar panel installation management',
    'renewable energy field service',
    'solar technician scheduling',
    'photovoltaic installation software'
  ],
  telecom: [
    'telecommunications installation',
    'telecom field service management',
    'network installation scheduling',
    'cable technician scheduling',
    'telecommunications service dispatch'
  ],
  security: [
    'security system installation',
    'alarm system installation software',
    'security technician scheduling',
    'home security installation management',
    'commercial security system deployment'
  ],
  enterprise: [
    'enterprise field service solution',
    'large scale installation management',
    'multi-region field service platform',
    'enterprise scheduling software',
    'corporate field service automation'
  ]
} as const;

// Page-Specific Metadata
export const PAGE_METADATA = {
  home: {
    title: 'Lead Route - AI-Powered Field Service Management Software',
    description: 'Transform your field service operations with intelligent scheduling, route optimization, and team management. Reduce costs by 25% while improving customer satisfaction. Start your free trial today.',
    keywords: [
      ...PRIMARY_KEYWORDS,
      'field service management platform',
      'automated scheduling software',
      'installation optimization platform'
    ],
    path: '/',
    image: '/images/og/homepage.jpg'
  },

  features: {
    title: 'Advanced Features - Field Service Management Software | Lead Route',
    description: 'Discover powerful features including AI scheduling, route optimization, team management, real-time analytics, and seamless integrations. Built for modern field service teams.',
    keywords: [
      'AI scheduling features',
      'route optimization tools',
      'team management software',
      'field service analytics',
      'installation software features'
    ],
    path: '/features',
    image: '/images/og/features.jpg'
  },

  solutions: {
    title: 'Industry Solutions - HVAC, Solar, Telecom & Security | Lead Route',
    description: 'Tailored field service solutions for HVAC, solar installation, telecommunications, and security system companies. Industry-specific features and optimizations.',
    keywords: [
      ...INDUSTRY_KEYWORDS.hvac.slice(0, 3),
      ...INDUSTRY_KEYWORDS.solar.slice(0, 2),
      ...INDUSTRY_KEYWORDS.telecom.slice(0, 2),
      'industry specific field service'
    ],
    path: '/solutions',
    image: '/images/og/solutions.jpg'
  },

  pricing: {
    title: 'Pricing Plans - Field Service Management Software | Lead Route',
    description: 'Simple, transparent pricing for field service teams of all sizes. Starter, Professional, and Enterprise plans with 14-day free trial. No hidden fees.',
    keywords: [
      'field service software pricing',
      'installation scheduling cost',
      'route optimization pricing',
      'field service management plans',
      'enterprise scheduling software cost'
    ],
    path: '/pricing',
    image: '/images/og/pricing.jpg'
  },

  resources: {
    title: 'Resources - Case Studies, Guides & Documentation | Lead Route',
    description: 'Comprehensive resources including customer success stories, implementation guides, API documentation, and industry insights for field service optimization.',
    keywords: [
      'field service case studies',
      'installation management guides',
      'field service best practices',
      'API documentation',
      'implementation resources'
    ],
    path: '/resources',
    image: '/images/og/resources.jpg'
  },

  company: {
    title: 'About Lead Route - Field Service Management Leaders',
    description: 'Learn about Lead Route, the team behind the leading AI-powered field service management platform. Our mission, values, and commitment to innovation.',
    keywords: [
      'lead route team',
      'field service software company',
      'installation management leaders',
      'about field service platform',
      'technology company mission'
    ],
    path: '/company',
    image: '/images/og/company.jpg'
  },

  contact: {
    title: 'Contact Us - Get Started with Field Service Management | Lead Route',
    description: 'Ready to transform your field operations? Contact our team for a personalized demo, pricing information, or technical support. Multiple ways to reach us.',
    keywords: [
      'field service software demo',
      'installation scheduling consultation',
      'contact field service experts',
      'get started field service management',
      'schedule software demo'
    ],
    path: '/contact',
    image: '/images/og/contact.jpg'
  }
} as const;

// OpenGraph Default Settings
export const OPEN_GRAPH_DEFAULTS = {
  type: 'website',
  locale: 'en_US',
  siteName: SITE_CONFIG.siteName,
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/jpeg'
} as const;

// Twitter Card Default Settings  
export const TWITTER_DEFAULTS = {
  card: 'summary_large_image',
  site: '@leadroute',
  creator: '@leadroute'
} as const;

// Structured Data Templates
export const STRUCTURED_DATA_DEFAULTS = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.company.name,
    legalName: SITE_CONFIG.company.legalName,
    url: SITE_CONFIG.siteUrl,
    logo: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.logoUrl}`,
    description: SITE_CONFIG.company.description,
    foundingDate: SITE_CONFIG.company.foundingDate,
    email: SITE_CONFIG.company.email,
    telephone: SITE_CONFIG.company.phone,
    address: {
      '@type': 'PostalAddress',
      ...SITE_CONFIG.company.address
    },
    sameAs: SITE_CONFIG.company.socialProfiles
  },

  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.siteName,
    url: SITE_CONFIG.siteUrl,
    description: SITE_CONFIG.siteDescription,
    inLanguage: 'en-US',
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      name: SITE_CONFIG.company.name
    }
  },

  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lead Route Installation Scheduler',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Field Service Management',
    operatingSystem: 'Web Browser, iOS, Android',
    description: SITE_CONFIG.siteDescription,
    url: SITE_CONFIG.siteUrl,
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.company.name,
      url: SITE_CONFIG.siteUrl
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter Plan',
        price: '99',
        priceCurrency: 'USD',
        billingIncrement: 'Month',
        description: 'Perfect for small teams getting started'
      },
      {
        '@type': 'Offer', 
        name: 'Professional Plan',
        price: '299',
        priceCurrency: 'USD',
        billingIncrement: 'Month',
        description: 'Advanced features for growing companies'
      },
      {
        '@type': 'Offer',
        name: 'Enterprise Plan',
        description: 'Full-featured solution for large operations',
        url: `${SITE_CONFIG.siteUrl}/contact`
      }
    ],
    featureList: [
      'AI-Powered Scheduling',
      'Route Optimization',
      'Team Management',
      'Real-time Analytics',
      'Smart Data Processing',
      'Seamless Integrations'
    ]
  }
} as const;

// Canonical URL Utilities
export const getCanonicalUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SITE_CONFIG.siteUrl}/${cleanPath}`.replace(/\/$/, '') || SITE_CONFIG.siteUrl;
};

// Meta Title Utilities
export const formatTitle = (pageTitle?: string): string => {
  if (!pageTitle) return SITE_CONFIG.siteName;
  return `${pageTitle} | ${SITE_CONFIG.siteName}`;
};

// Meta Description Truncation
export const truncateDescription = (description: string, maxLength: number = 160): string => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + '...';
};

// Breadcrumb Data for Navigation
export const BREADCRUMB_PATHS = {
  '/': { label: 'Home', parent: null },
  '/features': { label: 'Features', parent: '/' },
  '/solutions': { label: 'Solutions', parent: '/' },
  '/pricing': { label: 'Pricing', parent: '/' },
  '/resources': { label: 'Resources', parent: '/' },
  '/company': { label: 'Company', parent: '/' },
  '/contact': { label: 'Contact', parent: '/' }
} as const;