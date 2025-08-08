// Think Tank Technologies - Rate Limiting and Anti-Spam Measures

import type { RateLimitConfig } from './types';

/**
 * Default rate limiting configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per window
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (ip: string, userAgent?: string) => `${ip}:${userAgent?.substring(0, 50) || 'unknown'}`,
  onLimitReached: (ip: string, endpoint: string) => {
    console.warn(`Rate limit exceeded for IP ${ip} on endpoint ${endpoint}`);
  }
};

/**
 * In-memory store for rate limiting (use Redis in production)
 */
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);
    
    if (existing) {
      existing.count++;
      return existing;
    }

    const newEntry = { count: 1, resetTime: now + windowMs };
    this.set(key, newEntry);
    return newEntry;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global store instance
const globalStore = new MemoryStore();

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: MemoryStore;

  constructor(config: Partial<RateLimitConfig> = {}, store?: MemoryStore) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
    this.store = store || globalStore;
  }

  /**
   * Checks if a request should be rate limited
   */
  checkLimit(ip: string, endpoint: string, userAgent?: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
  } {
    const key = this.generateKey(ip, endpoint, userAgent);
    const entry = this.store.increment(key, this.config.windowMs);
    
    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    if (!allowed) {
      this.config.onLimitReached(ip, endpoint);
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      totalRequests: entry.count
    };
  }

  /**
   * Generates a unique key for rate limiting
   */
  private generateKey(ip: string, endpoint: string, userAgent?: string): string {
    const baseKey = this.config.keyGenerator(ip, userAgent);
    return `${baseKey}:${endpoint}`;
  }

  /**
   * Resets rate limit for a specific key
   */
  resetLimit(ip: string, endpoint: string, userAgent?: string): void {
    const key = this.generateKey(ip, endpoint, userAgent);
    this.store.set(key, { count: 0, resetTime: Date.now() + this.config.windowMs });
  }

  /**
   * Gets current rate limit status
   */
  getStatus(ip: string, endpoint: string, userAgent?: string): {
    requests: number;
    remaining: number;
    resetTime: number;
  } | null {
    const key = this.generateKey(ip, endpoint, userAgent);
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    return {
      requests: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

/**
 * Advanced anti-spam detection
 */
export class AntiSpam {
  private suspiciousIPs = new Map<string, { score: number; lastSeen: number; patterns: string[] }>();
  private honeypotSubmissions = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupSuspiciousIPs();
    }, 60 * 60 * 1000);
  }

  /**
   * Analyzes a form submission for spam indicators
   */
  analyzeSubmission(data: Record<string, any>, ip: string, userAgent: string): {
    isSpam: boolean;
    confidence: number;
    reasons: string[];
    score: number;
  } {
    let spamScore = 0;
    const reasons: string[] = [];

    // Check honeypot field
    if (data._honeypot || data.website || data.url) {
      spamScore += 100;
      reasons.push('Honeypot field filled');
      this.honeypotSubmissions.add(ip);
    }

    // Check submission timing (too fast indicates bot)
    const submissionTime = Date.now() - (data._timestamp || Date.now());
    if (submissionTime < 3000) { // Less than 3 seconds
      spamScore += 50;
      reasons.push('Form submitted too quickly');
    }

    // Check for duplicate content
    if (this.isDuplicateContent(data)) {
      spamScore += 40;
      reasons.push('Duplicate content detected');
    }

    // Check for suspicious patterns in text
    const textFields = ['message', 'comment', 'description', 'name', 'company'];
    for (const field of textFields) {
      if (data[field]) {
        const textScore = this.analyzeText(data[field]);
        spamScore += textScore;
        if (textScore > 20) {
          reasons.push(`Suspicious content in ${field}`);
        }
      }
    }

    // Check IP reputation
    const ipScore = this.getIPReputationScore(ip);
    spamScore += ipScore;
    if (ipScore > 30) {
      reasons.push('Suspicious IP address');
    }

    // Check user agent
    const uaScore = this.analyzeUserAgent(userAgent);
    spamScore += uaScore;
    if (uaScore > 20) {
      reasons.push('Suspicious user agent');
    }

    // Update IP tracking
    this.updateIPTracking(ip, spamScore, reasons);

    const confidence = Math.min(spamScore / 100, 1);
    const isSpam = confidence > 0.6; // 60% confidence threshold

    return {
      isSpam,
      confidence,
      reasons,
      score: spamScore
    };
  }

  /**
   * Analyzes text content for spam patterns
   */
  private analyzeText(text: string): number {
    let score = 0;

    // Check for excessive links
    const linkCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > 3) {
      score += 30;
    }

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5) {
      score += 20;
    }

    // Check for common spam phrases
    const spamPhrases = [
      'make money', 'work from home', 'click here', 'act now', 'limited time',
      'guarantee', 'no risk', 'free trial', 'special promotion', 'earn cash',
      'lose weight', 'viagra', 'casino', 'lottery', 'winner'
    ];

    const lowerText = text.toLowerCase();
    const spamPhraseCount = spamPhrases.filter(phrase => lowerText.includes(phrase)).length;
    score += spamPhraseCount * 15;

    // Check for excessive repetition
    const words = text.split(/\s+/);
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length > 2) {
        wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1);
      }
    });

    const maxRepeats = Math.max(...wordCounts.values());
    if (maxRepeats > 5) {
      score += 25;
    }

    // Check text length patterns
    if (text.length < 10) {
      score += 10; // Too short
    } else if (text.length > 5000) {
      score += 20; // Suspiciously long
    }

    return score;
  }

  /**
   * Analyzes user agent for bot indicators
   */
  private analyzeUserAgent(userAgent: string): number {
    if (!userAgent) return 50; // No user agent is suspicious

    let score = 0;

    // Check for common bot patterns
    const botPatterns = [
      /bot/i, /spider/i, /crawler/i, /scraper/i, /curl/i, /wget/i,
      /python/i, /java/i, /perl/i, /ruby/i
    ];

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      score += 40;
    }

    // Check for very old browsers (often used by bots)
    if (userAgent.includes('MSIE 6.0') || userAgent.includes('MSIE 7.0')) {
      score += 30;
    }

    // Check for missing common browser strings
    const browserStrings = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge'];
    if (!browserStrings.some(browser => userAgent.includes(browser))) {
      score += 25;
    }

    return score;
  }

  /**
   * Gets IP reputation score
   */
  private getIPReputationScore(ip: string): number {
    // Check honeypot submissions
    if (this.honeypotSubmissions.has(ip)) {
      return 80;
    }

    // Check suspicious IP tracking
    const suspicious = this.suspiciousIPs.get(ip);
    if (suspicious) {
      return Math.min(suspicious.score, 50);
    }

    return 0;
  }

  /**
   * Updates IP tracking information
   */
  private updateIPTracking(ip: string, score: number, reasons: string[]): void {
    const existing = this.suspiciousIPs.get(ip) || { score: 0, lastSeen: 0, patterns: [] };
    
    existing.score = Math.min(existing.score + score, 100);
    existing.lastSeen = Date.now();
    existing.patterns.push(...reasons);

    this.suspiciousIPs.set(ip, existing);
  }

  /**
   * Checks for duplicate content (simplified)
   */
  private isDuplicateContent(data: Record<string, any>): boolean {
    // In a real implementation, you'd store hashes of recent submissions
    // and check against them. This is a simplified version.
    const content = Object.values(data).join(' ').toLowerCase();
    const hash = this.simpleHash(content);
    
    // For demo purposes, just check if all text fields are identical
    const textFields = Object.values(data).filter(v => typeof v === 'string' && v.length > 10);
    if (textFields.length > 1) {
      return textFields.every(field => field === textFields[0]);
    }

    return false;
  }

  /**
   * Simple hash function for content comparison
   */
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Cleans up old suspicious IP entries
   */
  private cleanupSuspiciousIPs(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > maxAge) {
        this.suspiciousIPs.delete(ip);
      }
    }

    // Clean up honeypot submissions older than 1 hour
    // (In real implementation, you'd store timestamps)
  }

  /**
   * Blocks an IP address
   */
  blockIP(ip: string, reason: string): void {
    this.suspiciousIPs.set(ip, {
      score: 100,
      lastSeen: Date.now(),
      patterns: [reason]
    });
  }

  /**
   * Checks if an IP is blocked
   */
  isBlocked(ip: string): boolean {
    const suspicious = this.suspiciousIPs.get(ip);
    return suspicious ? suspicious.score >= 80 : false;
  }

  /**
   * Gets IP reputation information
   */
  getIPReputation(ip: string): {
    isBlocked: boolean;
    score: number;
    lastSeen: number | null;
    patterns: string[];
  } {
    const suspicious = this.suspiciousIPs.get(ip);
    
    return {
      isBlocked: this.isBlocked(ip),
      score: suspicious?.score || 0,
      lastSeen: suspicious?.lastSeen || null,
      patterns: suspicious?.patterns || []
    };
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.suspiciousIPs.clear();
    this.honeypotSubmissions.clear();
  }
}

// Global instances
export const defaultRateLimiter = new RateLimiter();
export const defaultAntiSpam = new AntiSpam();

/**
 * Convenience function for checking rate limits
 */
export function checkRateLimit(
  ip: string, 
  endpoint: string, 
  userAgent?: string,
  config?: Partial<RateLimitConfig>
): ReturnType<RateLimiter['checkLimit']> {
  const limiter = config ? new RateLimiter(config) : defaultRateLimiter;
  return limiter.checkLimit(ip, endpoint, userAgent);
}

/**
 * Convenience function for spam detection
 */
export function checkSpam(
  data: Record<string, any>,
  ip: string,
  userAgent: string
): ReturnType<AntiSpam['analyzeSubmission']> {
  return defaultAntiSpam.analyzeSubmission(data, ip, userAgent);
}

/**
 * Combined security check for form submissions
 */
export function securityCheck(
  data: Record<string, any>,
  ip: string,
  endpoint: string,
  userAgent: string = '',
  rateLimitConfig?: Partial<RateLimitConfig>
): {
  allowed: boolean;
  rateLimit: ReturnType<RateLimiter['checkLimit']>;
  spamCheck: ReturnType<AntiSpam['analyzeSubmission']>;
  blockedReasons: string[];
} {
  const blockedReasons: string[] = [];
  
  // Check rate limiting
  const rateLimit = checkRateLimit(ip, endpoint, userAgent, rateLimitConfig);
  if (!rateLimit.allowed) {
    blockedReasons.push('Rate limit exceeded');
  }

  // Check for spam
  const spamCheck = checkSpam(data, ip, userAgent);
  if (spamCheck.isSpam) {
    blockedReasons.push('Spam detected');
  }

  // Check if IP is blocked
  if (defaultAntiSpam.isBlocked(ip)) {
    blockedReasons.push('IP address blocked');
  }

  return {
    allowed: blockedReasons.length === 0,
    rateLimit,
    spamCheck,
    blockedReasons
  };
}