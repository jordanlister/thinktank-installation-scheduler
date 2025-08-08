/**
 * Sitemap Generation Utility
 * 
 * Generates XML sitemap for marketing pages with proper SEO attributes
 * including priority, changefreq, and lastmod dates.
 */

import { SITE_CONFIG, PAGE_METADATA } from './constants';

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: {
    url: string;
    caption?: string;
    title?: string;
  }[];
}

// Marketing page URLs with SEO metadata
export const MARKETING_PAGES: SitemapEntry[] = [
  {
    url: '/',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 1.0,
    images: [
      {
        url: '/images/og/homepage-hero.jpg',
        caption: 'Think Tank Technologies - AI-Powered Field Service Management Software',
        title: 'Homepage Hero Image'
      }
    ]
  },
  {
    url: '/features',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.9,
    images: [
      {
        url: '/images/og/features-overview.jpg',
        caption: 'Advanced Features - Field Service Management Software',
        title: 'Features Overview'
      }
    ]
  },
  {
    url: '/solutions',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly', 
    priority: 0.9,
    images: [
      {
        url: '/images/og/solutions-industries.jpg',
        caption: 'Industry-Specific Field Service Solutions',
        title: 'Solutions for Different Industries'
      }
    ]
  },
  {
    url: '/pricing',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8,
    images: [
      {
        url: '/images/og/pricing-plans.jpg',
        caption: 'Pricing Plans - Field Service Management Software',
        title: 'Transparent Pricing Plans'
      }
    ]
  },
  {
    url: '/resources',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7,
    images: [
      {
        url: '/images/og/resources-hub.jpg',
        caption: 'Resources Hub - Field Service Management Guides & Case Studies',
        title: 'Educational Resources'
      }
    ]
  },
  {
    url: '/company',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.6,
    images: [
      {
        url: '/images/og/company-team.jpg',
        caption: 'About Think Tank Technologies - Field Service Management Leaders',
        title: 'Company Team and Leadership'
      }
    ]
  },
  {
    url: '/contact',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7,
    images: [
      {
        url: '/images/og/contact-us.jpg',
        caption: 'Contact Think Tank Technologies - Field Service Management Experts',
        title: 'Contact Information'
      }
    ]
  }
];

// Additional resource pages (would be dynamically generated in a real CMS)
export const RESOURCE_PAGES: SitemapEntry[] = [
  {
    url: '/resources/case-studies',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.6
  },
  {
    url: '/resources/documentation',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.6
  },
  {
    url: '/resources/webinars',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.5
  },
  {
    url: '/resources/blog',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.5
  },
  // Specific case studies
  {
    url: '/resources/case-studies/hvac-pro-cost-reduction',
    lastmod: '2024-01-15',
    changefreq: 'yearly',
    priority: 0.4
  },
  {
    url: '/resources/case-studies/solartech-optimization',
    lastmod: '2024-02-01',
    changefreq: 'yearly',
    priority: 0.4
  },
  {
    url: '/resources/case-studies/telecom-efficiency',
    lastmod: '2024-02-15',
    changefreq: 'yearly',
    priority: 0.4
  }
];

// Solution-specific pages
export const SOLUTION_PAGES: SitemapEntry[] = [
  {
    url: '/solutions/hvac',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    url: '/solutions/solar',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    url: '/solutions/telecom',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    url: '/solutions/security',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    url: '/solutions/enterprise',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.6
  }
];

// Legal and policy pages
export const LEGAL_PAGES: SitemapEntry[] = [
  {
    url: '/legal/privacy',
    lastmod: '2024-01-01',
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    url: '/legal/terms',
    lastmod: '2024-01-01',
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    url: '/legal/security',
    lastmod: '2024-01-01',
    changefreq: 'yearly',
    priority: 0.3
  }
];

// Combine all pages
export const getAllSitemapEntries = (): SitemapEntry[] => {
  return [
    ...MARKETING_PAGES,
    ...RESOURCE_PAGES,
    ...SOLUTION_PAGES,
    ...LEGAL_PAGES
  ];
};

// Generate full URL from path
export const generateFullUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.siteUrl}${cleanPath}`;
};

// Generate XML sitemap content
export const generateSitemapXML = (entries?: SitemapEntry[]): string => {
  const sitemapEntries = entries || getAllSitemapEntries();
  
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  const xmlEntries = sitemapEntries.map(entry => {
    const fullUrl = generateFullUrl(entry.url);
    
    let xml = `  <url>
    <loc>${fullUrl}</loc>`;
    
    if (entry.lastmod) {
      xml += `
    <lastmod>${entry.lastmod}</lastmod>`;
    }
    
    if (entry.changefreq) {
      xml += `
    <changefreq>${entry.changefreq}</changefreq>`;
    }
    
    if (entry.priority) {
      xml += `
    <priority>${entry.priority}</priority>`;
    }
    
    if (entry.images && entry.images.length > 0) {
      entry.images.forEach(image => {
        xml += `
    <image:image>
      <image:loc>${SITE_CONFIG.siteUrl}${image.url}</image:loc>`;
        
        if (image.caption) {
          xml += `
      <image:caption>${escapeXML(image.caption)}</image:caption>`;
        }
        
        if (image.title) {
          xml += `
      <image:title>${escapeXML(image.title)}</image:title>`;
        }
        
        xml += `
    </image:image>`;
      });
    }
    
    xml += `
  </url>`;
    
    return xml;
  }).join('\n');

  const xmlFooter = `
</urlset>`;

  return xmlHeader + '\n' + xmlEntries + xmlFooter;
};

// Generate robots.txt content
export const generateRobotsTxt = (): string => {
  const disallowedPaths = [
    '/app/*',           // Authenticated app routes
    '/api/*',           // API endpoints (if any)
    '*.json',           // JSON files
    '/admin/*',         // Admin routes
    '/dashboard/*',     // Dashboard routes
    '/private/*',       // Private routes
  ];

  const allowedPaths = [
    '/',                // Homepage
    '/features',        // Features
    '/solutions',       // Solutions
    '/pricing',         // Pricing
    '/resources',       // Resources
    '/company',         // Company
    '/contact',         // Contact
    '/legal/*'          // Legal pages
  ];

  let robotsTxt = `User-agent: *\n`;
  
  // Add allowed paths first
  allowedPaths.forEach(path => {
    robotsTxt += `Allow: ${path}\n`;
  });
  
  // Add disallowed paths
  disallowedPaths.forEach(path => {
    robotsTxt += `Disallow: ${path}\n`;
  });
  
  // Add sitemap reference
  robotsTxt += `\nSitemap: ${SITE_CONFIG.siteUrl}/sitemap.xml\n`;
  
  // Add crawl delay for courtesy
  robotsTxt += `\nCrawl-delay: 1\n`;
  
  return robotsTxt;
};

// Utility to escape XML special characters
const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Generate sitemap index (if multiple sitemaps)
export const generateSitemapIndex = (sitemapUrls: string[]): string => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const xmlEntries = sitemapUrls.map(sitemapUrl => {
    return `  <sitemap>
    <loc>${sitemapUrl}</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;
  }).join('\n');

  const xmlFooter = `
</sitemapindex>`;

  return xmlHeader + '\n' + xmlEntries + xmlFooter;
};

// Validate sitemap entry
export const validateSitemapEntry = (entry: SitemapEntry): boolean => {
  // Check required URL
  if (!entry.url || entry.url.length === 0) {
    return false;
  }
  
  // Check priority range
  if (entry.priority && (entry.priority < 0 || entry.priority > 1)) {
    return false;
  }
  
  // Check valid changefreq values
  const validChangefreq = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  if (entry.changefreq && !validChangefreq.includes(entry.changefreq)) {
    return false;
  }
  
  return true;
};

// Get priority based on page type
export const getPagePriority = (path: string): number => {
  if (path === '/') return 1.0;
  if (path.match(/^\/(features|solutions|pricing)$/)) return 0.9;
  if (path.match(/^\/(resources|contact)$/)) return 0.7;
  if (path.match(/^\/company/)) return 0.6;
  if (path.match(/^\/resources\//)) return 0.5;
  if (path.match(/^\/solutions\//)) return 0.7;
  if (path.match(/^\/legal\//)) return 0.3;
  return 0.5; // Default
};

// Get change frequency based on page type  
export const getChangeFrequency = (path: string): SitemapEntry['changefreq'] => {
  if (path === '/') return 'weekly';
  if (path.match(/^\/(features|solutions|pricing|company|contact)$/)) return 'monthly';
  if (path === '/resources') return 'weekly';
  if (path.match(/^\/resources\/blog/)) return 'daily';
  if (path.match(/^\/resources\//)) return 'weekly';
  if (path.match(/^\/legal\//)) return 'yearly';
  return 'monthly'; // Default
};