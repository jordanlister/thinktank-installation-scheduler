// Think Tank Technologies - Advanced Input Sanitization

import type { SanitizeOptions } from './types';

/**
 * Default sanitization options
 */
export const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
  allowedAttributes: {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'width', 'height']
  },
  stripUnknownTags: true,
  stripUnknownAttributes: true,
  normalizeWhitespace: true,
  trimWhitespace: true,
  maxLength: 10000
};

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Dangerous HTML tags that should always be stripped
 */
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'button',
  'textarea', 'select', 'option', 'meta', 'link', 'style', 'title', 'base',
  'bgsound', 'blink', 'marquee', 'body', 'html', 'head'
];

/**
 * Dangerous attributes that should always be stripped
 */
const DANGEROUS_ATTRIBUTES = [
  'onabort', 'onblur', 'onchange', 'onclick', 'ondblclick', 'onerror',
  'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown',
  'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onreset',
  'onresize', 'onselect', 'onsubmit', 'onunload', 'javascript', 'vbscript',
  'expression', 'formaction', 'formenctype', 'formmethod', 'formnovalidate',
  'formtarget', 'frameborder', 'hidden', 'id', 'name', 'sandbox', 'seamless',
  'srcdoc', 'style'
];

/**
 * Protocol whitelist for URLs
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Advanced HTML sanitization with configurable options
 */
export function sanitizeHTML(input: string, options: Partial<SanitizeOptions> = {}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const config = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  let sanitized = input;

  // Basic cleanup
  if (config.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (config.normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip dangerous tags
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Process allowed tags
  if (config.allowedTags.length > 0) {
    // Remove tags not in allowlist
    sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/gi, (match, tagName) => {
      const lowerTagName = tagName.toLowerCase();
      
      if (!config.allowedTags.includes(lowerTagName)) {
        return config.stripUnknownTags ? '' : sanitizeTagContent(match);
      }

      // Clean allowed tags
      return sanitizeTag(match, lowerTagName, config);
    });
  } else if (config.stripUnknownTags) {
    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Final HTML entity encoding for remaining content
  sanitized = encodeHTMLEntities(sanitized);

  // Apply length limit
  if (sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
    // Try to break at a word boundary
    const lastSpace = sanitized.lastIndexOf(' ');
    if (lastSpace > config.maxLength * 0.8) {
      sanitized = sanitized.substring(0, lastSpace) + '...';
    }
  }

  return sanitized;
}

/**
 * Sanitizes a single HTML tag
 */
function sanitizeTag(tag: string, tagName: string, config: SanitizeOptions): string {
  // For self-closing tags like <br>, return as-is if allowed
  if (['br', 'hr'].includes(tagName)) {
    return `<${tagName}>`;
  }

  // Extract attributes if tag has them
  const attributeMatch = tag.match(/<([^>\s]+)([^>]*)>/);
  if (!attributeMatch) {
    return tag;
  }

  const [, , attributesString] = attributeMatch;
  if (!attributesString.trim()) {
    return `<${tagName}>`;
  }

  const allowedAttrs = config.allowedAttributes[tagName] || [];
  const cleanedAttributes = sanitizeAttributes(attributesString, allowedAttrs);

  return cleanedAttributes ? `<${tagName} ${cleanedAttributes}>` : `<${tagName}>`;
}

/**
 * Sanitizes HTML attributes
 */
function sanitizeAttributes(attributesString: string, allowedAttributes: string[]): string {
  if (!allowedAttributes.length) {
    return '';
  }

  const attributes: string[] = [];
  const attrRegex = /(\w+)=["']?([^"'>\s]+)["']?/g;
  let match;

  while ((match = attrRegex.exec(attributesString)) !== null) {
    const [, attrName, attrValue] = match;
    const lowerAttrName = attrName.toLowerCase();

    // Skip dangerous attributes
    if (DANGEROUS_ATTRIBUTES.includes(lowerAttrName)) {
      continue;
    }

    // Only include allowed attributes
    if (allowedAttributes.includes(lowerAttrName)) {
      const sanitizedValue = sanitizeAttributeValue(lowerAttrName, attrValue);
      if (sanitizedValue) {
        attributes.push(`${lowerAttrName}="${sanitizedValue}"`);
      }
    }
  }

  return attributes.join(' ');
}

/**
 * Sanitizes individual attribute values
 */
function sanitizeAttributeValue(attrName: string, value: string): string {
  if (!value) return '';

  let sanitized = value.trim();

  // Handle URL attributes
  if (['href', 'src', 'action', 'formaction'].includes(attrName)) {
    return sanitizeURL(sanitized);
  }

  // Handle style attribute (if allowed)
  if (attrName === 'style') {
    return sanitizeCSS(sanitized);
  }

  // General attribute sanitization
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, '');

  // Encode HTML entities in attribute values
  return encodeHTMLEntities(sanitized);
}

/**
 * Sanitizes URLs in attributes
 */
function sanitizeURL(url: string): string {
  if (!url) return '';

  try {
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }

    // Handle anchor links
    if (url.startsWith('#')) {
      return url;
    }

    // Parse absolute URLs
    const parsed = new URL(url);
    
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    // Invalid URL format
    return '';
  }
}

/**
 * Sanitizes CSS (basic implementation)
 */
function sanitizeCSS(css: string): string {
  if (!css) return '';

  // Remove dangerous CSS properties and values
  const dangerousPatterns = [
    /javascript:/gi,
    /vbscript:/gi,
    /expression\(/gi,
    /-moz-binding/gi,
    /behavior:/gi,
    /@import/gi,
    /url\(/gi
  ];

  let sanitized = css;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
}

/**
 * Strips tag content but preserves inner text
 */
function sanitizeTagContent(tag: string): string {
  // Extract text content from tags
  const textMatch = tag.match(/>([^<]*)</);
  return textMatch ? textMatch[1] : '';
}

/**
 * Encodes HTML entities
 */
function encodeHTMLEntities(text: string): string {
  return text.replace(/[&<>"'\/`=]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Decodes HTML entities (for display)
 */
export function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };

  return text.replace(/&[a-zA-Z0-9#x]+;/g, entity => entities[entity] || entity);
}

/**
 * Sanitizes plain text (no HTML)
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters

  // Apply length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    const lastSpace = sanitized.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      sanitized = sanitized.substring(0, lastSpace) + '...';
    }
  }

  return sanitized;
}

/**
 * Sanitizes JSON input to prevent prototype pollution
 */
export function sanitizeJSON(input: string): any {
  try {
    const parsed = JSON.parse(input);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Recursively sanitizes object properties to prevent prototype pollution
 */
function sanitizeObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  
  for (const key in obj) {
    // Skip dangerous prototype properties
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
}

/**
 * Sanitizes file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed_file';
  }

  return fileName
    .replace(/[^a-zA-Z0-9.-_]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^[.-]|[.-]$/g, '') // Remove leading/trailing dots and dashes
    .substring(0, 255); // Limit length
}

/**
 * Comprehensive input sanitizer that chooses appropriate method
 */
export function sanitize(input: any, type: 'html' | 'text' | 'json' | 'filename' = 'text', options?: Partial<SanitizeOptions>): any {
  if (typeof input !== 'string') {
    return type === 'json' ? sanitizeObject(input) : '';
  }

  switch (type) {
    case 'html':
      return sanitizeHTML(input, options);
    case 'text':
      return sanitizeText(input, options?.maxLength);
    case 'json':
      return sanitizeJSON(input);
    case 'filename':
      return sanitizeFileName(input);
    default:
      return sanitizeText(input);
  }
}