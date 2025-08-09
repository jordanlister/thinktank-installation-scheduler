// Think Tank Technologies - Multi-Tenant Service Base Class
// Provides organization and project context for all API operations

import { supabase } from './supabase';
import type { PostgrestQueryBuilder } from '@supabase/supabase-js';

export interface TenantContext {
  organizationId: string;
  projectId?: string;
  userId: string;
  userRole: 'owner' | 'admin' | 'manager' | 'member';
  projectRole?: 'admin' | 'manager' | 'scheduler' | 'lead' | 'assistant' | 'viewer';
}

export interface ApiKeyContext {
  organizationId: string;
  scopes: string[];
  keyId: string;
}

export abstract class MultiTenantService {
  protected organizationId: string;
  protected projectId?: string;
  protected userId: string;
  protected userRole: string;
  protected projectRole?: string;

  constructor(context: TenantContext) {
    this.organizationId = context.organizationId;
    this.projectId = context.projectId;
    this.userId = context.userId;
    this.userRole = context.userRole;
    this.projectRole = context.projectRole;
  }

  /**
   * Get base query with organization isolation
   */
  protected getBaseQuery(tableName: string): PostgrestQueryBuilder<any, any[], any> {
    return supabase
      .from(tableName)
      .eq('organization_id', this.organizationId);
  }

  /**
   * Get project-scoped query with both organization and project isolation
   */
  protected getProjectQuery(tableName: string): PostgrestQueryBuilder<any, any[], any> {
    if (!this.projectId) {
      throw new Error('Project context required for this operation');
    }

    return supabase
      .from(tableName)
      .eq('organization_id', this.organizationId)
      .eq('project_id', this.projectId);
  }

  /**
   * Check if user has permission to perform operation
   */
  protected hasPermission(operation: 'read' | 'write' | 'admin'): boolean {
    switch (operation) {
      case 'admin':
        return ['owner', 'admin'].includes(this.userRole);
      case 'write':
        return ['owner', 'admin', 'manager'].includes(this.userRole) ||
               ['admin', 'manager', 'scheduler'].includes(this.projectRole || '');
      case 'read':
        return true; // All organization members can read
      default:
        return false;
    }
  }

  /**
   * Add organization context to data before insert
   */
  protected addOrganizationContext(data: any): any {
    return {
      ...data,
      organization_id: this.organizationId,
      created_by: this.userId
    };
  }

  /**
   * Add project context to data before insert
   */
  protected addProjectContext(data: any): any {
    if (!this.projectId) {
      throw new Error('Project context required for this operation');
    }

    return {
      ...this.addOrganizationContext(data),
      project_id: this.projectId
    };
  }

  /**
   * Get user's organization context
   */
  static async getUserContext(userId: string): Promise<TenantContext | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_context', { user_id: userId });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const userContext = data[0];
      return {
        organizationId: userContext.organization_id,
        userId: userId,
        userRole: userContext.organization_role,
        projectId: undefined // Will be set when user selects a project
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return null;
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
        .select('id, organization_id, scopes, last_used_at')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

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
   * Check if API key has required scope
   */
  protected hasScope(apiContext: ApiKeyContext, requiredScope: string): boolean {
    return apiContext.scopes.includes(requiredScope) || apiContext.scopes.includes('*');
  }

  /**
   * Log organization activity
   */
  protected async logActivity(
    activityType: string,
    description: string,
    entityType?: string,
    entityId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.rpc('log_organization_activity', {
        p_organization_id: this.organizationId,
        p_project_id: this.projectId || null,
        p_user_id: this.userId,
        p_activity_type: activityType,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_description: description,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging should not block operations
    }
  }

  /**
   * Get organization settings
   */
  protected async getOrganizationSettings(): Promise<any> {
    const { data, error } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.organizationId)
      .single();

    if (error) throw error;
    return data.settings || {};
  }

  /**
   * Get project settings if project context is available
   */
  protected async getProjectSettings(): Promise<any> {
    if (!this.projectId) return {};

    const { data, error } = await supabase
      .from('projects')
      .select('settings')
      .eq('id', this.projectId)
      .eq('organization_id', this.organizationId)
      .single();

    if (error) throw error;
    return data.settings || {};
  }
}

/**
 * Create service instance with current user context
 */
export async function createTenantService<T extends MultiTenantService>(
  ServiceClass: new (context: TenantContext) => T,
  userId: string,
  projectId?: string
): Promise<T | null> {
  const context = await MultiTenantService.getUserContext(userId);
  if (!context) return null;

  if (projectId) {
    // Validate user has access to the project
    const { data, error } = await supabase
      .from('project_users')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('User does not have access to the specified project');
    }

    context.projectId = projectId;
    context.projectRole = data.role;
  }

  return new ServiceClass(context);
}

/**
 * Service factory for API key authentication
 */
export async function createApiKeyService<T extends MultiTenantService>(
  ServiceClass: new (context: TenantContext) => T,
  apiKey: string,
  requiredScope: string
): Promise<T | null> {
  const apiContext = await MultiTenantService.validateApiKey(apiKey);
  if (!apiContext) return null;

  // Check scope
  const hasRequiredScope = apiContext.scopes.includes(requiredScope) || 
                          apiContext.scopes.includes('*');
  if (!hasRequiredScope) {
    throw new Error(`API key does not have required scope: ${requiredScope}`);
  }

  // Create minimal tenant context for API operations
  const tenantContext: TenantContext = {
    organizationId: apiContext.organizationId,
    userId: 'api-key-user', // Special user for API operations
    userRole: 'member' // API keys have limited permissions
  };

  return new ServiceClass(tenantContext);
}

/**
 * Middleware function to extract tenant context from request
 */
export function getTenantContextFromRequest(request: any): TenantContext | null {
  // Extract from JWT token or API key
  const authHeader = request.headers?.authorization;
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    // JWT token - extract user context
    const token = authHeader.slice(7);
    // In a real implementation, you'd decode and validate the JWT
    // For now, we'll assume the context is passed in the request
    return request.tenantContext || null;
  } else if (authHeader.startsWith('ApiKey ')) {
    // API key - would be validated separately
    return null;
  }

  return null;
}

export default MultiTenantService;