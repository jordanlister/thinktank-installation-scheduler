#!/usr/bin/env node

/**
 * Sitemap Generation Script
 * 
 * Generates sitemap.xml and robots.txt files for the Think Tank Technologies
 * marketing site using the SEO utilities.
 * 
 * Usage: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

// Mock the SEO utilities since we can't import TS directly in Node
const SITE_CONFIG = {
  siteUrl: 'https://thinktanktechnologies.com'
};

const MARKETING_PAGES = [
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

// Utility to escape XML special characters
const escapeXML = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Generate full URL from path
const generateFullUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.siteUrl}${cleanPath}`;
};

// Generate XML sitemap content
const generateSitemapXML = (entries) => {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  const xmlEntries = entries.map(entry => {
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
const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /
Allow: /features
Allow: /solutions
Allow: /pricing
Allow: /resources
Allow: /company
Allow: /contact
Allow: /legal/*
Disallow: /app/*
Disallow: /api/*
Disallow: *.json
Disallow: /admin/*
Disallow: /dashboard/*
Disallow: /private/*

Sitemap: ${SITE_CONFIG.siteUrl}/sitemap.xml

Crawl-delay: 1`;
};

// Main execution
const main = () => {
  console.log('🔍 Generating SEO files for Think Tank Technologies...\n');

  // Generate sitemap
  const sitemapContent = generateSitemapXML(MARKETING_PAGES);
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log('✅ Generated sitemap.xml');
  console.log(`   📍 Location: ${sitemapPath}`);
  console.log(`   📄 Pages: ${MARKETING_PAGES.length}`);

  // Generate robots.txt
  const robotsContent = generateRobotsTxt();
  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  
  fs.writeFileSync(robotsPath, robotsContent, 'utf8');
  console.log('✅ Generated robots.txt');
  console.log(`   📍 Location: ${robotsPath}`);

  console.log('\n🎉 SEO file generation completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   • Sitemap includes all marketing pages');
  console.log('   • Image sitemaps included for Open Graph images');
  console.log('   • Robots.txt allows marketing routes, blocks app routes');
  console.log('   • Proper change frequencies and priorities set');
  
  console.log('\n🔧 Next steps:');
  console.log('   1. Update SITE_CONFIG.siteUrl in constants.ts with production URL');
  console.log('   2. Add actual Open Graph images to public/images/ directory');
  console.log('   3. Submit sitemap to Google Search Console');
  console.log('   4. Test structured data with Google\'s Rich Results Test');
};

// Run the script
main();