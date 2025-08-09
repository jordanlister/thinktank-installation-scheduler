// Think Tank Technologies - SEO Service
// Handles SEO optimization, structured data, and multi-tenant sitemap generation

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  robots?: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
    siteName: string;
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image?: string;
    site?: string;
    creator?: string;
  };
  jsonLd?: any[];
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternateUrls?: Array<{
    hreflang: string;
    url: string;
  }>;
}

export interface OrganizationSeoConfig {
  organizationId: string;
  domain?: string;
  brandName: string;
  description: string;
  keywords: string[];
  logo?: string;
  socialProfiles: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  businessHours?: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  customSchemaMarkup?: any[];
}

export class SeoService {

  /**
   * Generate SEO metadata for public pages
   */
  static generatePageMetadata(
    pageType: 'homepage' | 'features' | 'pricing' | 'about' | 'contact' | 'blog' | 'documentation',
    customData?: Partial<SeoMetadata>,
    organizationConfig?: OrganizationSeoConfig
  ): SeoMetadata {
    const baseUrl = 'https://thinktank-scheduler.com';
    const siteName = organizationConfig?.brandName || 'Think Tank Installation Scheduler';
    
    const defaultMetadata = this.getDefaultMetadata(pageType, baseUrl, siteName);
    
    // Merge custom data
    const metadata: SeoMetadata = {
      ...defaultMetadata,
      ...customData,
      openGraph: {
        ...defaultMetadata.openGraph,
        ...(customData?.openGraph || {}),
        siteName
      },
      twitter: {
        ...defaultMetadata.twitter,
        ...(customData?.twitter || {}),
        site: organizationConfig?.socialProfiles.twitter || defaultMetadata.twitter.site
      }
    };

    // Add organization-specific JSON-LD
    if (organizationConfig) {
      metadata.jsonLd = [
        ...(metadata.jsonLd || []),
        this.generateOrganizationSchema(organizationConfig),
        this.generateWebsiteSchema(baseUrl, siteName),
        ...(organizationConfig.customSchemaMarkup || [])
      ];
    }

    return metadata;
  }

  /**
   * Generate multi-tenant sitemap
   */
  static async generateSitemap(organizationConfigs?: OrganizationSeoConfig[]): Promise<string> {
    const baseUrl = 'https://thinktank-scheduler.com';
    const entries: SitemapEntry[] = [];

    // Main site pages
    const mainPages = [
      { path: '', priority: 1.0, changefreq: 'weekly' as const },
      { path: '/features', priority: 0.9, changefreq: 'monthly' as const },
      { path: '/pricing', priority: 0.9, changefreq: 'monthly' as const },
      { path: '/about', priority: 0.7, changefreq: 'monthly' as const },
      { path: '/contact', priority: 0.7, changefreq: 'monthly' as const },
      { path: '/documentation', priority: 0.8, changefreq: 'weekly' as const },
      { path: '/api-docs', priority: 0.6, changefreq: 'weekly' as const },
      { path: '/security', priority: 0.6, changefreq: 'monthly' as const },
      { path: '/privacy', priority: 0.5, changefreq: 'yearly' as const },
      { path: '/terms', priority: 0.5, changefreq: 'yearly' as const }
    ];

    mainPages.forEach(page => {
      entries.push({
        url: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // Add organization-specific pages if custom domains are used
    if (organizationConfigs) {
      organizationConfigs.forEach(config => {
        if (config.domain) {
          const orgBaseUrl = `https://${config.domain}`;
          
          // Organization landing pages
          entries.push({
            url: orgBaseUrl,
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 1.0
          });

          // Organization-specific pages
          ['about', 'services', 'contact'].forEach(page => {
            entries.push({
              url: `${orgBaseUrl}/${page}`,
              lastmod: new Date().toISOString().split('T')[0],
              changefreq: 'monthly',
              priority: 0.7
            });
          });
        }
      });
    }

    return this.generateSitemapXml(entries);
  }

  /**
   * Generate structured data for organization
   */
  static generateOrganizationSchema(config: OrganizationSeoConfig): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: config.brandName,
      description: config.description,
      url: config.domain ? `https://${config.domain}` : 'https://thinktank-scheduler.com',
      logo: config.logo ? {
        '@type': 'ImageObject',
        url: config.logo
      } : undefined,
      contactPoint: config.contactInfo ? {
        '@type': 'ContactPoint',
        telephone: config.contactInfo.phone,
        email: config.contactInfo.email,
        contactType: 'customer service'
      } : undefined,
      address: config.contactInfo.address ? {
        '@type': 'PostalAddress',
        streetAddress: config.contactInfo.address.street,
        addressLocality: config.contactInfo.address.city,
        addressRegion: config.contactInfo.address.state,
        postalCode: config.contactInfo.address.zipCode,
        addressCountry: config.contactInfo.address.country
      } : undefined,
      sameAs: Object.values(config.socialProfiles).filter(Boolean),
      openingHours: config.businessHours?.map(hours => `${hours.day} ${hours.open}-${hours.close}`)
    };
  }

  /**
   * Generate local business schema for service companies
   */
  static generateLocalBusinessSchema(config: OrganizationSeoConfig): any {
    if (!config.contactInfo.address) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: config.brandName,
      description: config.description,
      url: config.domain ? `https://${config.domain}` : 'https://thinktank-scheduler.com',
      telephone: config.contactInfo.phone,
      email: config.contactInfo.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: config.contactInfo.address.street,
        addressLocality: config.contactInfo.address.city,
        addressRegion: config.contactInfo.address.state,
        postalCode: config.contactInfo.address.zipCode,
        addressCountry: config.contactInfo.address.country
      },
      geo: {
        '@type': 'GeoCoordinates',
        // These would be geocoded from the address
        latitude: '0',
        longitude: '0'
      },
      openingHoursSpecification: config.businessHours?.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours.day,
        opens: hours.open,
        closes: hours.close
      })),
      priceRange: '$',
      serviceArea: {
        '@type': 'State',
        name: config.contactInfo.address.state
      }
    };
  }

  /**
   * Generate service schema
   */
  static generateServiceSchema(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Installation Scheduling Software',
      description: 'Professional installation scheduling and team management software for businesses.',
      provider: {
        '@type': 'Organization',
        name: 'Think Tank Technologies'
      },
      serviceType: 'Software as a Service',
      category: 'Business Software',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Installation Scheduler Plans',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Free Plan'
            },
            price: '0',
            priceCurrency: 'USD'
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Professional Plan'
            },
            price: '49',
            priceCurrency: 'USD'
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Enterprise Plan'
            },
            price: '199',
            priceCurrency: 'USD'
          }
        ]
      }
    };
  }

  /**
   * Generate FAQ schema
   */
  static generateFaqSchema(faqs: Array<{ question: string; answer: string }>): any {
    return {
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
    };
  }

  /**
   * Generate breadcrumb schema
   */
  static generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  }

  /**
   * Generate software application schema
   */
  static generateSoftwareApplicationSchema(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Think Tank Installation Scheduler',
      description: 'Comprehensive installation scheduling and team management software',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '49',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'PriceSpecification',
          price: '49',
          priceCurrency: 'USD',
          billingDuration: 'P1M'
        }
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '127',
        bestRating: '5',
        worstRating: '1'
      },
      featureList: [
        'Team Management',
        'Installation Scheduling',
        'Route Optimization',
        'Real-time Tracking',
        'Mobile Apps',
        'API Integration',
        'Analytics & Reporting',
        'Multi-tenant Support'
      ]
    };
  }

  /**
   * Optimize images for SEO
   */
  static optimizeImageSeo(
    imageUrl: string,
    alt: string,
    title?: string,
    caption?: string
  ): {
    src: string;
    alt: string;
    title?: string;
    loading: string;
    decoding: string;
    itemProp?: string;
    schema?: any;
  } {
    const optimizedImage = {
      src: imageUrl,
      alt: alt,
      title: title,
      loading: 'lazy',
      decoding: 'async',
      itemProp: 'image'
    };

    // Generate image schema if needed
    if (caption) {
      return {
        ...optimizedImage,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'ImageObject',
          url: imageUrl,
          caption: caption,
          description: alt
        }
      };
    }

    return optimizedImage;
  }

  /**
   * Generate robots.txt content
   */
  static generateRobotsTxt(sitemapUrl?: string): string {
    const baseContent = `User-agent: *
Allow: /

# Block admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /.well-known/

# Block search and filter URLs
Disallow: /*?search=*
Disallow: /*?filter=*
Disallow: /*?sort=*

# Allow important assets
Allow: /_next/static/
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap*.xml

${sitemapUrl ? `\nSitemap: ${sitemapUrl}` : ''}

# Crawl delay for specific bots
User-agent: Bingbot
Crawl-delay: 1

User-agent: Slurp
Crawl-delay: 1`;

    return baseContent;
  }

  /**
   * Get default metadata for page types
   */
  private static getDefaultMetadata(
    pageType: string,
    baseUrl: string,
    siteName: string
  ): SeoMetadata {
    const defaultMeta = {
      homepage: {
        title: 'Installation Scheduling Software | Think Tank Scheduler',
        description: 'Professional installation scheduling and team management software. Streamline your operations with route optimization, real-time tracking, and powerful analytics.',
        keywords: ['installation scheduling', 'team management', 'route optimization', 'field service', 'scheduling software'],
      },
      features: {
        title: 'Features | Think Tank Installation Scheduler',
        description: 'Discover powerful features including team management, route optimization, real-time tracking, mobile apps, and advanced analytics.',
        keywords: ['scheduling features', 'team management', 'route optimization', 'mobile apps', 'analytics'],
      },
      pricing: {
        title: 'Pricing Plans | Think Tank Installation Scheduler',
        description: 'Choose the perfect plan for your business. Free tier available. Professional and Enterprise plans with advanced features.',
        keywords: ['pricing', 'plans', 'free trial', 'subscription', 'cost'],
      },
      about: {
        title: 'About Us | Think Tank Installation Scheduler',
        description: 'Learn about Think Tank Technologies and our mission to revolutionize installation scheduling and field service management.',
        keywords: ['about', 'company', 'team', 'mission', 'field service'],
      },
      contact: {
        title: 'Contact Us | Think Tank Installation Scheduler',
        description: 'Get in touch with our team for support, sales inquiries, or partnership opportunities.',
        keywords: ['contact', 'support', 'sales', 'help', 'customer service'],
      },
      documentation: {
        title: 'Documentation | Think Tank Installation Scheduler API',
        description: 'Complete API documentation with examples, SDKs, and integration guides for the Think Tank Installation Scheduler.',
        keywords: ['API documentation', 'integration', 'SDK', 'developer', 'REST API'],
      }
    };

    const pageMeta = defaultMeta[pageType as keyof typeof defaultMeta] || defaultMeta.homepage;

    return {
      ...pageMeta,
      canonical: `${baseUrl}${pageType === 'homepage' ? '' : `/${pageType}`}`,
      robots: 'index, follow',
      openGraph: {
        title: pageMeta.title,
        description: pageMeta.description,
        type: 'website',
        url: `${baseUrl}${pageType === 'homepage' ? '' : `/${pageType}`}`,
        image: `${baseUrl}/og-image.jpg`,
        siteName
      },
      twitter: {
        card: 'summary_large_image',
        title: pageMeta.title,
        description: pageMeta.description,
        image: `${baseUrl}/twitter-image.jpg`,
        site: '@thinktanktech'
      },
      jsonLd: [
        this.generateWebsiteSchema(baseUrl, siteName),
        this.generateSoftwareApplicationSchema()
      ]
    };
  }

  /**
   * Generate website schema
   */
  private static generateWebsiteSchema(baseUrl: string, siteName: string): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }

  /**
   * Generate sitemap XML
   */
  private static generateSitemapXml(entries: SitemapEntry[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
    const urlsetClose = '</urlset>';

    const urls = entries.map(entry => {
      let url = `  <url>\n    <loc>${this.escapeXml(entry.url)}</loc>\n`;
      
      if (entry.lastmod) {
        url += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      }
      
      if (entry.changefreq) {
        url += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      }
      
      if (entry.priority !== undefined) {
        url += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }

      // Add alternate URLs for internationalization
      if (entry.alternateUrls && entry.alternateUrls.length > 0) {
        entry.alternateUrls.forEach(alt => {
          url += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${this.escapeXml(alt.url)}" />\n`;
        });
      }

      url += '  </url>\n';
      return url;
    }).join('');

    return xmlHeader + urlsetOpen + urls + urlsetClose;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default SeoService;