// Think Tank Technologies Installation Scheduler - Authentication Middleware
// Provides tenant isolation, route protection, and RBAC enforcement

import { authService } from '../services/authService';
import { supabase } from '../services/supabase';
import {
  AuthUser,
  OrganizationRole,
  ProjectRole,
  Permission,
  JWTClaims
} from '../types';

// Route protection levels
export enum ProtectionLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  ORGANIZATION_MEMBER = 'organization_member',
  PROJECT_MEMBER = 'project_member',
  ROLE_REQUIRED = 'role_required',
  PERMISSION_REQUIRED = 'permission_required'
}

// Route configuration
export interface RouteConfig {
  path: string;
  protection: ProtectionLevel;
  organizationRoles?: OrganizationRole[];
  projectRoles?: ProjectRole[];
  permissions?: string[];
  requireCurrentProject?: boolean;
  allowSuperAdmin?: boolean;
}

// Middleware context
export interface AuthMiddlewareContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  organizationId: string | null;
  currentProjectId: string | null;
  organizationRole: OrganizationRole | null;
  currentProjectRole: ProjectRole | null;
  permissions: Permission[];
  hasPermission: (resource: string, action: string, context?: any) => boolean;
  hasOrganizationRole: (role: OrganizationRole) => boolean;
  hasProjectRole: (projectId: string, role: ProjectRole) => boolean;
  isSuperAdmin: boolean;
}

// Security audit log entry
export interface SecurityAuditEntry {
  userId?: string;
  organizationId?: string;
  projectId?: string;
  action: string;
  resource: string;
  result: 'allowed' | 'denied';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

class AuthMiddleware {
  private auditLog: SecurityAuditEntry[] = [];
  private rateLimiter = new Map<string, { count: number; lastReset: number }>();

  /**
   * Initialize middleware context from current user
   */
  async initializeContext(): Promise<AuthMiddlewareContext> {
    const user = await authService.getCurrentUser();
    
    const context: AuthMiddlewareContext = {
      user,
      isAuthenticated: !!user,
      organizationId: user?.organizationId || null,
      currentProjectId: user?.currentProject?.id || null,
      organizationRole: user?.organizationRole || null,
      currentProjectRole: user?.currentProject ? 
        user.projects.find(p => p.projectId === user.currentProject?.id)?.role || null : null,
      permissions: user?.permissions || [],
      hasPermission: (resource: string, action: string, context?: any) => 
        this.checkPermission(user, resource, action, context),
      hasOrganizationRole: (role: OrganizationRole) => 
        user?.organizationRole === role,
      hasProjectRole: (projectId: string, role: ProjectRole) => 
        user?.projects.some(p => p.projectId === projectId && p.role === role && p.isActive) || false,
      isSuperAdmin: this.checkSuperAdmin(user),
    };

    return context;
  }

  /**
   * Check route access permissions
   */
  async checkRouteAccess(
    routeConfig: RouteConfig, 
    context?: AuthMiddlewareContext
  ): Promise<{ allowed: boolean; reason?: string; redirectTo?: string }> {
    const middlewareContext = context || await this.initializeContext();
    
    // Log access attempt
    this.logSecurityEvent({
      userId: middlewareContext.user?.id,
      organizationId: middlewareContext.organizationId || undefined,
      projectId: middlewareContext.currentProjectId || undefined,
      action: 'route_access',
      resource: routeConfig.path,
      result: 'allowed', // Will update if denied
      timestamp: new Date().toISOString()
    });

    // Check rate limiting
    if (!this.checkRateLimit(middlewareContext.user?.id || 'anonymous')) {
      this.updateAuditLogResult(routeConfig.path, 'denied', 'Rate limit exceeded');
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // Public routes - always allowed
    if (routeConfig.protection === ProtectionLevel.PUBLIC) {
      return { allowed: true };
    }

    // Authenticated routes - require login
    if (routeConfig.protection === ProtectionLevel.AUTHENTICATED) {
      if (!middlewareContext.isAuthenticated) {
        this.updateAuditLogResult(routeConfig.path, 'denied', 'Authentication required');
        return { allowed: false, reason: 'Authentication required', redirectTo: '/login' };
      }
      return { allowed: true };
    }

    // Super admin bypass (if configured)
    if (routeConfig.allowSuperAdmin && middlewareContext.isSuperAdmin) {
      return { allowed: true };
    }

    // Organization member routes
    if (routeConfig.protection === ProtectionLevel.ORGANIZATION_MEMBER) {
      if (!middlewareContext.organizationId) {
        this.updateAuditLogResult(routeConfig.path, 'denied', 'Organization membership required');
        return { allowed: false, reason: 'Organization membership required' };
      }
      return { allowed: true };
    }

    // Project member routes
    if (routeConfig.protection === ProtectionLevel.PROJECT_MEMBER) {
      if (!middlewareContext.currentProjectId) {
        this.updateAuditLogResult(routeConfig.path, 'denied', 'Project assignment required');
        return { allowed: false, reason: 'Project assignment required', redirectTo: '/select-project' };
      }
      return { allowed: true };
    }

    // Role-based routes
    if (routeConfig.protection === ProtectionLevel.ROLE_REQUIRED) {
      // Check organization roles
      if (routeConfig.organizationRoles && routeConfig.organizationRoles.length > 0) {
        if (!middlewareContext.organizationRole || 
            !routeConfig.organizationRoles.includes(middlewareContext.organizationRole)) {
          this.updateAuditLogResult(routeConfig.path, 'denied', 'Insufficient organization role');
          return { allowed: false, reason: 'Insufficient organization role' };
        }
      }

      // Check project roles
      if (routeConfig.projectRoles && routeConfig.projectRoles.length > 0) {
        if (!middlewareContext.currentProjectRole || 
            !routeConfig.projectRoles.includes(middlewareContext.currentProjectRole)) {
          this.updateAuditLogResult(routeConfig.path, 'denied', 'Insufficient project role');
          return { allowed: false, reason: 'Insufficient project role' };
        }
      }

      return { allowed: true };
    }

    // Permission-based routes
    if (routeConfig.protection === ProtectionLevel.PERMISSION_REQUIRED && routeConfig.permissions) {
      for (const permission of routeConfig.permissions) {
        const [resource, action] = permission.split(':');
        if (!middlewareContext.hasPermission(resource, action)) {
          this.updateAuditLogResult(routeConfig.path, 'denied', `Missing permission: ${permission}`);
          return { allowed: false, reason: `Missing permission: ${permission}` };
        }
      }
      return { allowed: true };
    }

    // Default deny
    this.updateAuditLogResult(routeConfig.path, 'denied', 'Access denied - default policy');
    return { allowed: false, reason: 'Access denied' };
  }

  /**
   * Create protected route wrapper component
   */
  createProtectedRoute(routeConfig: RouteConfig) {
    return function ProtectedRoute({ children }: { children: React.ReactNode }) {
      const [isLoading, setIsLoading] = React.useState(true);
      const [isAllowed, setIsAllowed] = React.useState(false);
      const [error, setError] = React.useState<string | null>(null);
      const [redirectTo, setRedirectTo] = React.useState<string | null>(null);

      React.useEffect(() => {
        const checkAccess = async () => {
          try {
            const result = await authMiddleware.checkRouteAccess(routeConfig);
            setIsAllowed(result.allowed);
            if (!result.allowed) {
              setError(result.reason || 'Access denied');
              if (result.redirectTo) {
                setRedirectTo(result.redirectTo);
              }
            }
          } catch (error) {
            setError('Failed to check route access');
          } finally {
            setIsLoading(false);
          }
        };

        checkAccess();
      }, []);

      // Redirect if needed
      React.useEffect(() => {
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      }, [redirectTo]);

      if (isLoading) {
        return <div className="loading-spinner">Checking access...</div>;
      }

      if (!isAllowed) {
        return (
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>{error}</p>
          </div>
        );
      }

      return <>{children}</>;
    };
  }

  /**
   * Tenant isolation middleware for API calls
   */
  async addTenantContext(queryBuilder: any, context?: AuthMiddlewareContext): Promise<any> {
    const middlewareContext = context || await this.initializeContext();

    if (!middlewareContext.organizationId) {
      throw new Error('Tenant context required');
    }

    // Add organization filter
    queryBuilder = queryBuilder.eq('organization_id', middlewareContext.organizationId);

    // Add project filter if applicable
    if (middlewareContext.currentProjectId && queryBuilder._query?.table !== 'organizations') {
      queryBuilder = queryBuilder.eq('project_id', middlewareContext.currentProjectId);
    }

    return queryBuilder;
  }

  /**
   * Validate JWT claims for API requests
   */
  async validateJWTClaims(token: string): Promise<{ valid: boolean; claims?: JWTClaims; error?: string }> {
    try {
      // Verify token with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return { valid: false, error: 'Invalid token' };
      }

      // Build claims from user data
      const user = await authService.getCurrentUser();
      if (!user) {
        return { valid: false, error: 'User context not found' };
      }

      const claims: JWTClaims = {
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        organizationRole: user.organizationRole,
        currentProject: user.currentProject?.id,
        projects: user.projects,
        permissions: user.permissions.map(p => `${p.resource}:${p.action}`),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        iat: Math.floor(Date.now() / 1000)
      };

      return { valid: true, claims };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Token validation failed' 
      };
    }
  }

  /**
   * Check specific permission
   */
  private checkPermission(user: AuthUser | null, resource: string, action: string, context?: any): boolean {
    if (!user) return false;

    return user.permissions.some(permission => {
      // Check direct match
      if (permission.resource === resource && permission.action === action) {
        return this.checkPermissionConditions(permission, context);
      }

      // Check wildcard resource
      if (permission.resource === '*' && permission.action === action) {
        return this.checkPermissionConditions(permission, context);
      }

      // Check manage action (implies all actions)
      if (permission.resource === resource && permission.action === 'manage') {
        return this.checkPermissionConditions(permission, context);
      }

      // Check global manage
      if (permission.resource === '*' && permission.action === 'manage') {
        return this.checkPermissionConditions(permission, context);
      }

      return false;
    });
  }

  /**
   * Check permission conditions
   */
  private checkPermissionConditions(permission: Permission, context?: any): boolean {
    if (!permission.conditions) return true;

    // Check project-specific permissions
    if (permission.conditions.projectId && context?.projectId) {
      return permission.conditions.projectId === context.projectId;
    }

    return true;
  }

  /**
   * Check if user is super admin
   */
  private checkSuperAdmin(user: AuthUser | null): boolean {
    // In a real implementation, you might have specific super admin flags
    // For now, we'll consider organization owners as super admins within their org
    return user?.organizationRole === OrganizationRole.OWNER;
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const key = identifier;

    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, { count: 1, lastReset: now });
      return true;
    }

    const limit = this.rateLimiter.get(key)!;

    // Reset window if expired
    if (now - limit.lastReset > windowMs) {
      limit.count = 1;
      limit.lastReset = now;
      return true;
    }

    // Check if limit exceeded
    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(entry: SecurityAuditEntry): void {
    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // In production, you would persist this to a database or external audit service
    if (entry.result === 'denied') {
      console.warn('Security event:', entry);
    }
  }

  /**
   * Update audit log result (for cases where we determine result after initial log)
   */
  private updateAuditLogResult(resource: string, result: 'allowed' | 'denied', reason?: string): void {
    const recentEntry = this.auditLog
      .slice()
      .reverse()
      .find(entry => entry.resource === resource && entry.action === 'route_access');

    if (recentEntry) {
      recentEntry.result = result;
      if (reason) {
        recentEntry.reason = reason;
      }
    }
  }

  /**
   * Get security audit log (for admin viewing)
   */
  getSecurityAuditLog(limit = 100): SecurityAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Clear rate limiting for a user (admin function)
   */
  clearRateLimit(identifier: string): void {
    this.rateLimiter.delete(identifier);
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(identifier: string): { count: number; resetTime: number } | null {
    const limit = this.rateLimiter.get(identifier);
    return limit ? {
      count: limit.count,
      resetTime: limit.lastReset + 60000 // 1 minute window
    } : null;
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();

// Common route configurations
export const RouteConfigs = {
  PUBLIC: {
    protection: ProtectionLevel.PUBLIC
  } as RouteConfig,
  
  AUTHENTICATED: {
    protection: ProtectionLevel.AUTHENTICATED
  } as RouteConfig,
  
  ORGANIZATION_ADMIN: {
    protection: ProtectionLevel.ROLE_REQUIRED,
    organizationRoles: [OrganizationRole.OWNER, OrganizationRole.ADMIN]
  } as RouteConfig,
  
  PROJECT_MANAGER: {
    protection: ProtectionLevel.ROLE_REQUIRED,
    projectRoles: [ProjectRole.ADMIN, ProjectRole.MANAGER],
    requireCurrentProject: true
  } as RouteConfig,
  
  USER_MANAGEMENT: {
    protection: ProtectionLevel.PERMISSION_REQUIRED,
    permissions: ['users:manage']
  } as RouteConfig,
  
  SETTINGS_ADMIN: {
    protection: ProtectionLevel.PERMISSION_REQUIRED,
    permissions: ['settings:manage']
  } as RouteConfig
};

export default authMiddleware;