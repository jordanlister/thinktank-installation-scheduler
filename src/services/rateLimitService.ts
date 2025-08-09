// Think Tank Technologies - Rate Limiting Service
// Provides organization-level and API key-level rate limiting

import { supabase } from './supabase';

export interface RateLimitConfig {
  organizationId: string;
  keyId?: string;
  windowSizeMs: number;
  maxRequests: number;
  burstLimit?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStats {
  organizationId: string;
  keyId?: string;
  currentRequests: number;
  maxRequests: number;
  windowStart: number;
  windowEnd: number;
  resetTime: number;
  isBlocked: boolean;
}

export class RateLimitService {
  private static readonly DEFAULT_CONFIGS = {
    // Organization-level limits (per hour)
    FREE_TIER: { windowSizeMs: 3600000, maxRequests: 1000, burstLimit: 100 },
    PROFESSIONAL: { windowSizeMs: 3600000, maxRequests: 10000, burstLimit: 500 },
    ENTERPRISE: { windowSizeMs: 3600000, maxRequests: 100000, burstLimit: 2000 },
    
    // API key-level limits (per minute)
    API_KEY_DEFAULT: { windowSizeMs: 60000, maxRequests: 100, burstLimit: 20 }
  };

  /**
   * Check if request is allowed based on organization and API key limits
   */
  static async checkRateLimit(
    organizationId: string,
    keyId?: string,
    endpoint?: string
  ): Promise<RateLimitResult> {
    try {
      // Get organization subscription to determine rate limits
      const orgConfig = await this.getOrganizationRateLimit(organizationId);
      const orgResult = await this.checkLimit(organizationId, orgConfig);
      
      if (!orgResult.allowed) {
        return orgResult;
      }

      // If API key is provided, check API key specific limits
      if (keyId) {
        const keyConfig = await this.getApiKeyRateLimit(keyId);
        const keyResult = await this.checkLimit(`api_key:${keyId}`, keyConfig);
        
        if (!keyResult.allowed) {
          return keyResult;
        }
      }

      // Update request count
      await this.incrementRequestCount(organizationId, keyId);

      return {
        allowed: true,
        remaining: Math.min(orgResult.remaining, keyId ? await this.getKeyRemaining(keyId) : orgResult.remaining),
        resetTime: orgResult.resetTime
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow request but log issue
      return { allowed: true, remaining: 0, resetTime: Date.now() + 3600000 };
    }
  }

  /**
   * Get current rate limit status
   */
  static async getRateLimitStatus(
    organizationId: string,
    keyId?: string
  ): Promise<RateLimitStats> {
    try {
      const now = Date.now();
      const windowSize = 3600000; // 1 hour
      const windowStart = Math.floor(now / windowSize) * windowSize;
      
      // Get organization request count
      const { data: orgData, error } = await supabase
        .from('rate_limit_buckets')
        .select('request_count, max_requests')
        .eq('identifier', organizationId)
        .eq('window_start', new Date(windowStart).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const currentRequests = orgData?.request_count || 0;
      const maxRequests = orgData?.max_requests || 1000;

      return {
        organizationId,
        keyId,
        currentRequests,
        maxRequests,
        windowStart,
        windowEnd: windowStart + windowSize,
        resetTime: windowStart + windowSize,
        isBlocked: currentRequests >= maxRequests
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      throw error;
    }
  }

  /**
   * Reset rate limit for organization or API key
   */
  static async resetRateLimit(organizationId: string, keyId?: string): Promise<void> {
    try {
      const identifier = keyId ? `api_key:${keyId}` : organizationId;
      
      const { error } = await supabase
        .from('rate_limit_buckets')
        .delete()
        .eq('identifier', identifier);

      if (error) throw error;

      // Log the reset
      await this.logRateLimitEvent(organizationId, 'reset', keyId);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      throw error;
    }
  }

  /**
   * Get organization rate limit configuration based on subscription
   */
  private static async getOrganizationRateLimit(organizationId: string): Promise<RateLimitConfig> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      const plan = data.subscription_plan || 'free';
      let config;
      
      switch (plan.toLowerCase()) {
        case 'professional':
          config = this.DEFAULT_CONFIGS.PROFESSIONAL;
          break;
        case 'enterprise':
          config = this.DEFAULT_CONFIGS.ENTERPRISE;
          break;
        default:
          config = this.DEFAULT_CONFIGS.FREE_TIER;
      }

      return {
        organizationId,
        ...config
      };
    } catch (error) {
      console.error('Error getting organization rate limit:', error);
      // Return default config on error
      return {
        organizationId,
        ...this.DEFAULT_CONFIGS.FREE_TIER
      };
    }
  }

  /**
   * Get API key rate limit configuration
   */
  private static async getApiKeyRateLimit(keyId: string): Promise<RateLimitConfig> {
    try {
      const { data, error } = await supabase
        .from('organization_api_keys')
        .select('organization_id')
        .eq('id', keyId)
        .single();

      if (error) throw error;

      return {
        organizationId: data.organization_id,
        keyId,
        ...this.DEFAULT_CONFIGS.API_KEY_DEFAULT
      };
    } catch (error) {
      console.error('Error getting API key rate limit:', error);
      throw error;
    }
  }

  /**
   * Check rate limit for a specific identifier
   */
  private static async checkLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowSizeMs) * config.windowSizeMs;
    const windowEnd = windowStart + config.windowSizeMs;

    try {
      // Get current request count for this window
      const { data, error } = await supabase
        .from('rate_limit_buckets')
        .select('request_count')
        .eq('identifier', identifier)
        .eq('window_start', new Date(windowStart).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const currentCount = data?.request_count || 0;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      
      if (currentCount >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowEnd,
          retryAfter: Math.ceil((windowEnd - now) / 1000)
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime: windowEnd
      };
    } catch (error) {
      console.error('Error checking limit:', error);
      throw error;
    }
  }

  /**
   * Increment request count for organization and API key
   */
  private static async incrementRequestCount(organizationId: string, keyId?: string): Promise<void> {
    const now = Date.now();
    const orgConfig = await this.getOrganizationRateLimit(organizationId);
    const windowStart = Math.floor(now / orgConfig.windowSizeMs) * orgConfig.windowSizeMs;

    try {
      // Increment organization count
      await this.upsertBucket(organizationId, windowStart, orgConfig.maxRequests);

      // Increment API key count if provided
      if (keyId) {
        const keyConfig = await this.getApiKeyRateLimit(keyId);
        const keyWindowStart = Math.floor(now / keyConfig.windowSizeMs) * keyConfig.windowSizeMs;
        await this.upsertBucket(`api_key:${keyId}`, keyWindowStart, keyConfig.maxRequests);
      }
    } catch (error) {
      console.error('Error incrementing request count:', error);
      // Don't throw - incrementing should not block requests
    }
  }

  /**
   * Upsert rate limit bucket
   */
  private static async upsertBucket(identifier: string, windowStart: number, maxRequests: number): Promise<void> {
    const { error } = await supabase
      .from('rate_limit_buckets')
      .upsert({
        identifier,
        window_start: new Date(windowStart).toISOString(),
        request_count: 1,
        max_requests: maxRequests,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'identifier,window_start',
        ignoreDuplicates: false
      });

    if (error) {
      // If upsert failed, try to increment existing record
      await supabase
        .from('rate_limit_buckets')
        .update({ 
          request_count: supabase.raw('request_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('identifier', identifier)
        .eq('window_start', new Date(windowStart).toISOString());
    }
  }

  /**
   * Get remaining requests for API key
   */
  private static async getKeyRemaining(keyId: string): Promise<number> {
    const now = Date.now();
    const config = await this.getApiKeyRateLimit(keyId);
    const windowStart = Math.floor(now / config.windowSizeMs) * config.windowSizeMs;

    const { data, error } = await supabase
      .from('rate_limit_buckets')
      .select('request_count')
      .eq('identifier', `api_key:${keyId}`)
      .eq('window_start', new Date(windowStart).toISOString())
      .single();

    if (error) return config.maxRequests;

    return Math.max(0, config.maxRequests - (data?.request_count || 0));
  }

  /**
   * Log rate limit events for monitoring
   */
  private static async logRateLimitEvent(
    organizationId: string,
    eventType: 'exceeded' | 'reset' | 'warning',
    keyId?: string,
    details?: any
  ): Promise<void> {
    try {
      await supabase
        .from('rate_limit_events')
        .insert({
          organization_id: organizationId,
          key_id: keyId,
          event_type: eventType,
          details: details || {},
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging rate limit event:', error);
      // Don't throw - logging should not block operations
    }
  }

  /**
   * Clean up old rate limit buckets (should be run periodically)
   */
  static async cleanupOldBuckets(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const { error } = await supabase
        .from('rate_limit_buckets')
        .delete()
        .lt('window_start', cutoffDate.toISOString());

      if (error) throw error;

      console.log('Cleaned up old rate limit buckets');
    } catch (error) {
      console.error('Error cleaning up rate limit buckets:', error);
    }
  }

  /**
   * Get rate limit analytics for organization
   */
  static async getRateLimitAnalytics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalRequests: number;
    averageRequestsPerHour: number;
    peakRequestsPerHour: number;
    rateLimitExceeded: number;
    topApiKeys: Array<{ keyId: string; keyName: string; requests: number }>;
  }> {
    try {
      // Get organization buckets
      const { data: buckets, error } = await supabase
        .from('rate_limit_buckets')
        .select('request_count, window_start, identifier')
        .eq('identifier', organizationId)
        .gte('window_start', startDate)
        .lte('window_start', endDate)
        .order('window_start');

      if (error) throw error;

      const totalRequests = buckets.reduce((sum, bucket) => sum + bucket.request_count, 0);
      const hours = buckets.length || 1;
      const averageRequestsPerHour = totalRequests / hours;
      const peakRequestsPerHour = Math.max(...buckets.map(b => b.request_count));

      // Get rate limit exceeded events
      const { data: events, error: eventsError } = await supabase
        .from('rate_limit_events')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('event_type', 'exceeded')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (eventsError) throw eventsError;

      // Get API key usage
      const { data: keyBuckets, error: keyError } = await supabase
        .from('rate_limit_buckets')
        .select('request_count, identifier')
        .like('identifier', `api_key:%`)
        .gte('window_start', startDate)
        .lte('window_start', endDate);

      if (keyError) throw keyError;

      const keyUsage = keyBuckets.reduce((acc, bucket) => {
        const keyId = bucket.identifier.replace('api_key:', '');
        acc[keyId] = (acc[keyId] || 0) + bucket.request_count;
        return acc;
      }, {} as Record<string, number>);

      // Get key names
      const topApiKeys = await Promise.all(
        Object.entries(keyUsage)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(async ([keyId, requests]) => {
            const { data } = await supabase
              .from('organization_api_keys')
              .select('name')
              .eq('id', keyId)
              .single();
            
            return {
              keyId,
              keyName: data?.name || 'Unknown',
              requests
            };
          })
      );

      return {
        totalRequests,
        averageRequestsPerHour,
        peakRequestsPerHour,
        rateLimitExceeded: events.length,
        topApiKeys
      };
    } catch (error) {
      console.error('Error getting rate limit analytics:', error);
      throw error;
    }
  }
}

export default RateLimitService;