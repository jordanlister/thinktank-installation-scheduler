// Think Tank Technologies - Input Validation and Sanitization

import type { ValidationConfig, FormSubmissionData, ThreatDetection } from './types';

/**
 * Default validation configuration for marketing forms
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxInputLength: 10000, // 10KB max input
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a'],
  allowedAttributes: {
    'a': ['href', 'title']
  },
  sanitizeOptions: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u'],
    allowedAttributes: {},
    stripUnknownTags: true,
    stripUnknownAttributes: true,
    normalizeWhitespace: true,
    trimWhitespace: true,
    maxLength: 10000
  },
  honeypotField: '_website', // Honeypot field name
  requiredFields: ['name', 'email']
};

/**
 * Email validation regex - RFC 5322 compliant
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Phone validation regex - International format
 */
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

/**
 * Name validation regex - Letters, spaces, hyphens, apostrophes
 */
const NAME_REGEX = /^[a-zA-Z\s\-'\.]{2,50}$/;

/**
 * Company name validation regex - More permissive for business names
 */
const COMPANY_REGEX = /^[a-zA-Z0-9\s\-'\.&,()]{2,100}$/;

/**
 * URL validation regex - Basic URL format
 */
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

/**
 * Malicious patterns to detect and block
 */
const MALICIOUS_PATTERNS = [
  // SQL Injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  // XSS Patterns
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onclick\s*=/gi,
  /onerror\s*=/gi,
  // Command Injection
  /(\||;|&|\$\(|\`)/g,
  // Path Traversal
  /\.\.[\/\\]/g,
  // LDAP Injection
  /(\*|\(|\)|\\|\/)/g
];

/**
 * Validates an email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC 5321 limit
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates a phone number
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validates a person's name
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  return NAME_REGEX.test(name.trim());
}

/**
 * Validates a company name
 */
export function validateCompany(company: string): boolean {
  if (!company || typeof company !== 'string') return false;
  return COMPANY_REGEX.test(company.trim());
}

/**
 * Validates a URL
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return URL_REGEX.test(url.trim());
}

/**
 * Validates message content
 */
export function validateMessage(message: string, maxLength: number = 5000): boolean {
  if (!message || typeof message !== 'string') return false;
  if (message.length > maxLength) return false;
  
  // Check for malicious patterns
  return !MALICIOUS_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeInput(input: string, config: ValidationConfig = DEFAULT_VALIDATION_CONFIG): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace
  if (config.sanitizeOptions.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Normalize whitespace
  if (config.sanitizeOptions.normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Apply length limit
  if (sanitized.length > config.sanitizeOptions.maxLength) {
    sanitized = sanitized.substring(0, config.sanitizeOptions.maxLength);
  }

  return sanitized;
}

/**
 * Detects potential security threats in input
 */
export function detectThreat(input: string): ThreatDetection {
  if (!input || typeof input !== 'string') {
    return { isThreat: false, confidence: 0, reasons: [], blockedPatterns: [] };
  }

  const reasons: string[] = [];
  const blockedPatterns: string[] = [];
  let threatScore = 0;

  // Check for malicious patterns
  MALICIOUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      threatScore += 20;
      const patternName = getPatternName(index);
      reasons.push(`Detected ${patternName} pattern`);
      blockedPatterns.push(patternName);
    }
  });

  // Check for suspicious characteristics
  const suspiciousChars = /[<>{}[\]\\|`~]/g;
  const suspiciousMatches = input.match(suspiciousChars);
  if (suspiciousMatches && suspiciousMatches.length > 5) {
    threatScore += 10;
    reasons.push('High number of suspicious characters');
  }

  // Check for encoded content that might bypass filters
  if (input.includes('%') && /(%[0-9a-fA-F]{2}){3,}/.test(input)) {
    threatScore += 15;
    reasons.push('Potential URL encoding bypass attempt');
  }

  // Check for unusually long input
  if (input.length > 10000) {
    threatScore += 10;
    reasons.push('Unusually long input detected');
  }

  // Check for repeated patterns (potential DoS)
  const repeatedPattern = /(.{10,})\1{3,}/;
  if (repeatedPattern.test(input)) {
    threatScore += 25;
    reasons.push('Repeated pattern detected (potential DoS)');
  }

  const confidence = Math.min(threatScore / 100, 1);
  const isThreat = confidence > 0.3; // 30% confidence threshold

  return {
    isThreat,
    confidence,
    reasons,
    blockedPatterns
  };
}

/**
 * Gets human-readable pattern names
 */
function getPatternName(index: number): string {
  const names = [
    'SQL Injection',
    'Script Tag',
    'IFrame Tag',
    'JavaScript Protocol',
    'VBScript Protocol',
    'OnLoad Handler',
    'OnClick Handler',
    'OnError Handler',
    'Command Injection',
    'Path Traversal',
    'LDAP Injection'
  ];
  return names[index] || 'Unknown Pattern';
}

/**
 * Validates form data structure and content
 */
export function validateFormData(
  data: FormSubmissionData, 
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
  threats: ThreatDetection[];
} {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  const threats: ThreatDetection[] = [];

  // Check honeypot field
  if (data[config.honeypotField]) {
    return {
      isValid: false,
      errors: { _honeypot: 'Spam detected' },
      sanitizedData: {},
      threats: [{ 
        isThreat: true, 
        confidence: 1, 
        reasons: ['Honeypot field filled'], 
        blockedPatterns: ['Honeypot'] 
      }]
    };
  }

  // Validate required fields
  config.requiredFields.forEach(field => {
    if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // Validate and sanitize each field
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith('_') || typeof value !== 'string') {
      return; // Skip internal fields and non-string values
    }

    // Check for threats
    const threat = detectThreat(value);
    if (threat.isThreat) {
      threats.push(threat);
      errors[key] = 'Invalid content detected';
      return;
    }

    // Sanitize input
    const sanitized = sanitizeInput(value, config);
    sanitizedData[key] = sanitized;

    // Field-specific validation
    switch (key) {
      case 'email':
        if (!validateEmail(sanitized)) {
          errors[key] = 'Invalid email address';
        }
        break;
      case 'phone':
        if (sanitized && !validatePhone(sanitized)) {
          errors[key] = 'Invalid phone number';
        }
        break;
      case 'name':
      case 'firstName':
      case 'lastName':
        if (!validateName(sanitized)) {
          errors[key] = 'Invalid name format';
        }
        break;
      case 'company':
      case 'companyName':
        if (sanitized && !validateCompany(sanitized)) {
          errors[key] = 'Invalid company name';
        }
        break;
      case 'website':
      case 'url':
        if (sanitized && !validateURL(sanitized)) {
          errors[key] = 'Invalid URL format';
        }
        break;
      case 'message':
      case 'description':
      case 'comment':
        if (!validateMessage(sanitized)) {
          errors[key] = 'Message contains invalid content';
        }
        break;
    }

    // Check field length
    if (sanitized.length > config.maxInputLength) {
      errors[key] = `${key} is too long (max ${config.maxInputLength} characters)`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0 && threats.length === 0,
    errors,
    sanitizedData,
    threats
  };
}

/**
 * Rate limiting validation based on timestamp and user agent
 */
export function validateSubmissionTiming(data: FormSubmissionData): boolean {
  const now = Date.now();
  const timestamp = data._timestamp ? parseInt(data._timestamp.toString()) : 0;
  
  // Form must be on page for at least 3 seconds (anti-bot measure)
  const minTimeOnPage = 3000;
  
  // Form must be submitted within 1 hour (prevent replay attacks)
  const maxTimeOnPage = 3600000;
  
  const timeOnPage = now - timestamp;
  
  return timeOnPage >= minTimeOnPage && timeOnPage <= maxTimeOnPage;
}

/**
 * Validates file uploads (if implemented)
 */
export function validateFileUpload(file: File, allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }

  // Check for executable files
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar', '.js', '.vbs'];
  const hasExecExt = dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  if (hasExecExt) {
    errors.push('Executable files are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a validation schema for specific forms
 */
export function createFormValidator(formType: 'contact' | 'newsletter' | 'demo' | 'custom') {
  const configs = {
    contact: {
      ...DEFAULT_VALIDATION_CONFIG,
      requiredFields: ['name', 'email', 'message']
    },
    newsletter: {
      ...DEFAULT_VALIDATION_CONFIG,
      requiredFields: ['email']
    },
    demo: {
      ...DEFAULT_VALIDATION_CONFIG,
      requiredFields: ['name', 'email', 'company']
    },
    custom: DEFAULT_VALIDATION_CONFIG
  };

  return (data: FormSubmissionData) => validateFormData(data, configs[formType]);
}