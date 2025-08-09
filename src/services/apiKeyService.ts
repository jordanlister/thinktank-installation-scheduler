// Think Tank Technologies - API Key Management Service
// Handles organization-specific API key generation, validation, and management

import { MultiTenantService, TenantContext, ApiKeyContext } from './multiTenantService';
import { supabase } from './supabase';

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expiresAt?: string;
  description?: string;
}

export interface ApiKeyInfo {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  description?: string;
}

export interface ApiKeyUsage {
  keyId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApiKeyStats {
  keyId: string;
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: string | null;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    percentage: number;
  }>;
}

export class ApiKeyService extends MultiTenantService {

  /**
   * Generate a new API key for the organization
   */
  async generateApiKey(request: CreateApiKeyRequest): Promise<{ apiKey: string; keyInfo: ApiKeyInfo }> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to generate API keys');
    }

    try {
      // Generate the actual API key
      const { data: apiKeyResult, error } = await supabase
        .rpc('generate_api_key', {
          p_organization_id: this.organizationId,
          p_name: request.name,
          p_scopes: request.scopes
        });

      if (error) throw error;

      // Get the created API key info
      const { data: keyInfo, error: keyError } = await this.getBaseQuery('organization_api_keys')
        .select('*')
        .eq('name', request.name)
        .eq('organization_id', this.organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (keyError) throw keyError;

      // Set expiration if provided
      if (request.expiresAt) {
        await this.getBaseQuery('organization_api_keys')
          .update({ expires_at: request.expiresAt })
          .eq('id', keyInfo.id);
        keyInfo.expires_at = request.expiresAt;
      }

      // Log activity
      await this.logActivity(
        'api_key_created',
        `Generated API key: ${request.name}`,
        'api_key',
        keyInfo.id,
        { 
          name: request.name,
          scopes: request.scopes,
          expiresAt: request.expiresAt
        }
      );

      return {
        apiKey: apiKeyResult,
        keyInfo: this.transformApiKeyData(keyInfo)
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  }

  /**
   * Get all API keys for the organization
   */
  async getApiKeys(): Promise<ApiKeyInfo[]> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view API keys');
    }

    try {
      const { data, error } = await this.getBaseQuery('organization_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.transformApiKeyData);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(keyId: string): Promise<ApiKeyInfo> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view API keys');
    }

    try {
      const { data, error } = await this.getBaseQuery('organization_api_keys')
        .select('*')
        .eq('id', keyId)
        .single();

      if (error) throw error;

      return this.transformApiKeyData(data);
    } catch (error) {
      console.error('Error fetching API key:', error);
      throw error;
    }
  }

  /**
   * Update API key settings
   */
  async updateApiKey(keyId: string, updates: {
    name?: string;
    scopes?: string[];
    expiresAt?: string;
    isActive?: boolean;
    description?: string;
  }): Promise<ApiKeyInfo> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to update API keys');
    }

    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.scopes) updateData.scopes = updates.scopes;
      if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { data, error } = await this.getBaseQuery('organization_api_keys')
        .update(updateData)
        .eq('id', keyId)
        .select('*')
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'api_key_updated',
        `Updated API key: ${data.name}`,
        'api_key',
        keyId,
        { updates: Object.keys(updateData) }
      );

      return this.transformApiKeyData(data);
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to revoke API keys');
    }

    try {
      const { data, error } = await this.getBaseQuery('organization_api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .select('name')
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'api_key_revoked',
        `Revoked API key: ${data.name}`,
        'api_key',
        keyId
      );
    } catch (error) {
      console.error('Error revoking API key:', error);
      throw error;
    }
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(keyId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to delete API keys');
    }

    try {
      // Get key name for logging
      const { data: keyData } = await this.getBaseQuery('organization_api_keys')
        .select('name')
        .eq('id', keyId)
        .single();

      // Delete the key
      const { error } = await this.getBaseQuery('organization_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'api_key_deleted',
        `Deleted API key: ${keyData?.name || keyId}`,
        'api_key',
        keyId
      );
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  /**
   * Validate API key and get context
   */
  static async validateApiKey(apiKey: string): Promise<ApiKeyContext | null> {
    try {
      const keyHash = await this.hashApiKey(apiKey);
      
      const { data, error } = await supabase
        .from('organization_api_keys')
        .select('id, organization_id, scopes, last_used_at, expires_at')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Update last used timestamp
      await supabase
        .from('organization_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);

      return {
        organizationId: data.organization_id,
        scopes: data.scopes || [],
        keyId: data.id
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Log API key usage
   */
  static async logApiKeyUsage(
    keyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // In a production environment, you might want to use a separate table for usage logs
      // or even a time-series database for better performance
      await supabase
        .from('api_key_usage_logs')
        .insert({
          key_id: keyId,
          endpoint,
          method,
          status_code: statusCode,
          response_time: responseTime,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging API key usage:', error);
      // Don't throw - usage logging should not block API operations
    }
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(keyId: string): Promise<ApiKeyStats> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view API key statistics');
    }

    try {
      // In a production environment, these queries would be optimized
      // and possibly use materialized views or aggregation tables
      const { data: usageLogs, error } = await supabase
        .from('api_key_usage_logs')
        .select('*')
        .eq('key_id', keyId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalRequests = usageLogs.length;
      const requestsToday = usageLogs.filter(log => new Date(log.timestamp) >= todayStart).length;
      const requestsThisWeek = usageLogs.filter(log => new Date(log.timestamp) >= weekStart).length;
      const requestsThisMonth = usageLogs.filter(log => new Date(log.timestamp) >= monthStart).length;

      const totalResponseTime = usageLogs.reduce((sum, log) => sum + log.response_time, 0);
      const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

      const errorCount = usageLogs.filter(log => log.status_code >= 400).length;
      const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

      const lastUsed = usageLogs.length > 0 ? usageLogs[0].timestamp : null;

      // Calculate top endpoints
      const endpointCounts = usageLogs.reduce((acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({
          endpoint,
          count,
          percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
        }));

      return {
        keyId,
        totalRequests,
        requestsToday,
        requestsThisWeek,
        requestsThisMonth,
        averageResponseTime,
        errorRate,
        lastUsed,
        topEndpoints
      };
    } catch (error) {
      console.error('Error fetching API key stats:', error);
      throw error;
    }
  }

  /**
   * Get available API scopes
   */
  getAvailableScopes(): Array<{ scope: string; description: string; category: string }> {
    return [
      // Read scopes
      { scope: 'installations:read', description: 'Read installation data', category: 'Read' },
      { scope: 'team_members:read', description: 'Read team member information', category: 'Read' },
      { scope: 'assignments:read', description: 'Read assignment data', category: 'Read' },
      { scope: 'schedules:read', description: 'Read schedule information', category: 'Read' },
      { scope: 'reports:read', description: 'Access reports and analytics', category: 'Read' },
      
      // Write scopes
      { scope: 'installations:write', description: 'Create and modify installations', category: 'Write' },
      { scope: 'team_members:write', description: 'Manage team members', category: 'Write' },
      { scope: 'assignments:write', description: 'Create and modify assignments', category: 'Write' },
      { scope: 'schedules:write', description: 'Manage schedules', category: 'Write' },
      
      // Admin scopes
      { scope: 'organization:admin', description: 'Full organization administration', category: 'Admin' },
      { scope: 'api_keys:admin', description: 'Manage API keys', category: 'Admin' },
      { scope: 'integrations:admin', description: 'Manage integrations', category: 'Admin' },
      
      // Special scopes
      { scope: '*', description: 'Full access to all resources', category: 'Special' }
    ];
  }

  /**
   * Check if API key has required scope
   */
  static hasScope(apiContext: ApiKeyContext, requiredScope: string): boolean {
    return apiContext.scopes.includes(requiredScope) || apiContext.scopes.includes('*');
  }

  /**
   * Hash API key for storage/comparison
   */
  private static async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Transform database data to ApiKeyInfo type
   */
  private transformApiKeyData(data: any): ApiKeyInfo {
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      keyPrefix: data.key_prefix,
      scopes: data.scopes || [],
      lastUsedAt: data.last_used_at,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      description: data.description
    };
  }
}

/**
 * Middleware function to validate API key from request
 */
export async function validateApiKeyMiddleware(
  apiKey: string,
  requiredScope: string
): Promise<{ isValid: boolean; context: ApiKeyContext | null; error?: string }> {
  try {
    const apiContext = await ApiKeyService.validateApiKey(apiKey);
    
    if (!apiContext) {
      return { isValid: false, context: null, error: 'Invalid API key' };
    }

    if (!ApiKeyService.hasScope(apiContext, requiredScope)) {
      return { 
        isValid: false, 
        context: apiContext, 
        error: `Insufficient scope. Required: ${requiredScope}` 
      };
    }

    return { isValid: true, context: apiContext };
  } catch (error) {
    return { 
      isValid: false, 
      context: null, 
      error: error instanceof Error ? error.message : 'API key validation failed' 
    };
  }
}

export default ApiKeyService;