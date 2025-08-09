// Think Tank Technologies Installation Scheduler - Billing Security Service
import crypto from 'crypto';
import { supabase } from './supabase';
import { Request } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

interface AuditLogEntry {
  organizationId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

class BillingSecurityService {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  
  private readonly DEFAULT_RATE_LIMITS = {
    billing: { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute for billing operations
    webhooks: { windowMs: 60000, maxRequests: 100 }, // 100 webhook requests per minute
    subscription: { windowMs: 300000, maxRequests: 5 }, // 5 subscription changes per 5 minutes
    payment: { windowMs: 60000, maxRequests: 3 } // 3 payment attempts per minute
  };

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): WebhookVerificationResult {
    try {
      if (!signature || !endpointSecret) {
        return {
          isValid: false,
          error: 'Missing signature or endpoint secret'
        };
      }

      // Extract timestamp and signature from header
      const elements = signature.split(',');
      const signatureElements: Record<string, string> = {};
      
      for (const element of elements) {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      }

      const timestamp = signatureElements.t;
      const v1Signature = signatureElements.v1;

      if (!timestamp || !v1Signature) {
        return {
          isValid: false,
          error: 'Invalid signature format'
        };
      }

      // Check timestamp tolerance (5 minutes)
      const timestampMs = parseInt(timestamp) * 1000;
      const now = Date.now();
      const tolerance = 5 * 60 * 1000; // 5 minutes

      if (Math.abs(now - timestampMs) > tolerance) {
        return {
          isValid: false,
          error: 'Timestamp outside of tolerance'
        };
      }

      // Compute expected signature
      const signedPayload = timestamp + '.' + payload;
      const expectedSignature = crypto
        .createHmac('sha256', endpointSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(v1Signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        return {
          isValid: false,
          error: 'Signature mismatch'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check rate limit for a given key and operation
   */
  checkRateLimit(
    key: string, 
    operation: 'billing' | 'webhooks' | 'subscription' | 'payment',
    customConfig?: RateLimitConfig
  ): { allowed: boolean; resetTime?: number; remaining?: number } {
    const config = customConfig || this.DEFAULT_RATE_LIMITS[operation];
    const now = Date.now();
    const windowKey = `${key}:${operation}`;
    
    // Get current limit data
    const limitData = this.rateLimitStore.get(windowKey);
    
    // If no data exists or window has expired, reset
    if (!limitData || now >= limitData.resetTime) {
      this.rateLimitStore.set(windowKey, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        allowed: true,
        resetTime: now + config.windowMs,
        remaining: config.maxRequests - 1
      };
    }
    
    // Check if within limit
    if (limitData.count < config.maxRequests) {
      limitData.count++;
      this.rateLimitStore.set(windowKey, limitData);
      
      return {
        allowed: true,
        resetTime: limitData.resetTime,
        remaining: config.maxRequests - limitData.count
      };
    }
    
    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: limitData.resetTime,
      remaining: 0
    };
  }

  /**
   * Generate rate limiting key from request
   */
  generateRateLimitKey(req: Request, includeUser: boolean = true): string {
    const parts: string[] = [];
    
    // Add IP address
    const ip = this.getClientIP(req);
    if (ip) parts.push(ip);
    
    // Add user ID if available and requested
    if (includeUser && req.user?.id) {
      parts.push(req.user.id);
    }
    
    // Add organization ID if available
    if (req.user?.organizationId) {
      parts.push(req.user.organizationId);
    }
    
    return parts.join(':') || 'anonymous';
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string | undefined {
    // Check various headers for IP address
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = req.headers['x-real-ip'] as string;
    if (realIP) {
      return realIP;
    }
    
    const clientIP = req.headers['x-client-ip'] as string;
    if (clientIP) {
      return clientIP;
    }
    
    return req.connection?.remoteAddress || req.socket?.remoteAddress;
  }

  /**
   * Create audit log entry for billing operations
   */
  async createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const auditEntry = {
        organization_id: entry.organizationId || null,
        user_id: entry.userId || null,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId || null,
        details: entry.details || {},
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        success: entry.success,
        error_message: entry.errorMessage || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('billing_audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to create audit log:', error);
      }
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  /**
   * Log billing operation for audit trail
   */
  async auditBillingOperation(
    action: string,
    resource: string,
    req: Request,
    options: {
      organizationId?: string;
      userId?: string;
      resourceId?: string;
      details?: Record<string, any>;
      success: boolean;
      errorMessage?: string;
    }
  ): Promise<void> {
    const auditData: AuditLogEntry = {
      organizationId: options.organizationId || req.user?.organizationId,
      userId: options.userId || req.user?.id,
      action,
      resource,
      resourceId: options.resourceId,
      details: options.details || {},
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      success: options.success,
      errorMessage: options.errorMessage
    };

    await this.createAuditLog(auditData);
  }

  /**
   * Validate request origin and headers for security
   */
  validateRequestSecurity(req: Request): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for required headers
    if (!req.headers['user-agent']) {
      issues.push('Missing User-Agent header');
    }
    
    // Check for suspicious patterns in User-Agent
    const userAgent = req.headers['user-agent'] as string;
    if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
      issues.push('Suspicious User-Agent pattern detected');
    }
    
    // Check content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        issues.push('Invalid or missing Content-Type for body requests');
      }
    }
    
    // Check for excessively large requests
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
      issues.push('Request payload too large');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Check for suspicious User-Agent patterns
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /^curl/i,
      /^wget/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /python/i,
      /^$/
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get audit logs for an organization
   */
  async getAuditLogs(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      userId?: string;
    } = {}
  ): Promise<{
    logs: any[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('billing_audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (options.action) {
        query = query.eq('action', options.action);
      }

      if (options.resource) {
        query = query.eq('resource', options.resource);
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      } else if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get audit logs: ${error.message}`);
      }

      return {
        logs: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimitStore(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now >= data.resetTime) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.rateLimitStore.delete(key);
    });
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): {
    activeKeys: number;
    totalRequests: number;
    operations: Record<string, number>;
  } {
    const stats = {
      activeKeys: this.rateLimitStore.size,
      totalRequests: 0,
      operations: {} as Record<string, number>
    };
    
    for (const [key, data] of this.rateLimitStore.entries()) {
      const operation = key.split(':').pop() || 'unknown';
      stats.totalRequests += data.count;
      stats.operations[operation] = (stats.operations[operation] || 0) + data.count;
    }
    
    return stats;
  }

  /**
   * Initialize security service - run cleanup periodically
   */
  initialize(): void {
    // Clean up rate limit store every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore();
    }, 5 * 60 * 1000);
    
    console.log('Billing Security Service initialized');
  }
}

// Export singleton instance
export const billingSecurityService = new BillingSecurityService();