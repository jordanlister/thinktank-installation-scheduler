// Think Tank Technologies - Security Types

export interface SecurityConfig {
  csp: CSPConfig;
  headers: SecurityHeaders;
  validation: ValidationConfig;
  rateLimit: RateLimitConfig;
  monitoring: MonitoringConfig;
  cookies: CookieConfig;
  thirdParty: ThirdPartyConfig;
}

export interface CSPConfig {
  nonce: string;
  reportUri?: string;
  reportOnly: boolean;
  directives: {
    'default-src': string[];
    'script-src': string[];
    'style-src': string[];
    'img-src': string[];
    'font-src': string[];
    'connect-src': string[];
    'frame-src': string[];
    'media-src': string[];
    'object-src': string[];
    'child-src': string[];
    'worker-src': string[];
    'manifest-src': string[];
    'form-action': string[];
    'frame-ancestors': string[];
    'base-uri': string[];
    'upgrade-insecure-requests': boolean;
    'block-all-mixed-content': boolean;
  };
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
  'Cache-Control': string;
  'X-DNS-Prefetch-Control': string;
}

export interface ValidationConfig {
  maxInputLength: number;
  allowedTags: string[];
  allowedAttributes: { [key: string]: string[] };
  sanitizeOptions: SanitizeOptions;
  honeypotField: string;
  requiredFields: string[];
}

export interface SanitizeOptions {
  allowedTags: string[];
  allowedAttributes: { [key: string]: string[] };
  stripUnknownTags: boolean;
  stripUnknownAttributes: boolean;
  normalizeWhitespace: boolean;
  trimWhitespace: boolean;
  maxLength: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (ip: string, userAgent?: string) => string;
  onLimitReached: (ip: string, endpoint: string) => void;
}

export interface MonitoringConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableCspReporting: boolean;
  enableSecurityAudit: boolean;
  alertThreshold: number;
  auditEndpoints: string[];
  sensitiveDataPatterns: RegExp[];
}

export interface CookieConfig {
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  domain?: string;
  path: string;
  prefix: string;
}

export interface ThirdPartyConfig {
  allowedDomains: string[];
  allowedScripts: { src: string; integrity?: string; crossorigin?: string }[];
  allowedStyles: { href: string; integrity?: string; crossorigin?: string }[];
  allowedImages: string[];
  enableSRI: boolean;
  blockUnknownScripts: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  userId?: string;
}

export enum SecurityEventType {
  CSP_VIOLATION = 'csp_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_INPUT = 'invalid_input',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MALICIOUS_PAYLOAD = 'malicious_payload',
  SPAM_ATTEMPT = 'spam_attempt',
  SECURITY_HEADER_MISSING = 'security_header_missing',
  THIRD_PARTY_VIOLATION = 'third_party_violation'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface FormSubmissionData {
  [key: string]: any;
  _honeypot?: string;
  _timestamp?: number;
  _userAgent?: string;
  _referrer?: string;
}

export interface SecurityAuditResult {
  passed: boolean;
  score: number;
  violations: SecurityViolation[];
  recommendations: string[];
}

export interface SecurityViolation {
  rule: string;
  severity: SecuritySeverity;
  description: string;
  fix: string;
  element?: string;
  value?: string;
}

export interface ThreatDetection {
  isThreat: boolean;
  confidence: number;
  reasons: string[];
  blockedPatterns: string[];
}