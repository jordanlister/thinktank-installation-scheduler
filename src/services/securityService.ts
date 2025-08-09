// Think Tank Technologies Installation Scheduler - Security Service
// Implements comprehensive security measures, audit logging, and threat detection

import { supabase } from './supabase';
import { authService } from './authService';
import {
  OrganizationActivity,
  AuthUser,
  OrganizationRole,
  ProjectRole
} from '../types';

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_SUSPICIOUS = 'login_suspicious',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_EXPORT = 'data_export',
  BULK_OPERATION = 'bulk_operation',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_USED = 'api_key_used',
  INVITATION_SENT = 'invitation_sent',
  USER_ROLE_CHANGED = 'user_role_changed',
  ORGANIZATION_SETTINGS_CHANGED = 'organization_settings_changed',
  PROJECT_ACCESS_GRANTED = 'project_access_granted',
  PROJECT_ACCESS_REVOKED = 'project_access_revoked',
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALICIOUS_REQUEST = 'malicious_request'
}

export enum SecurityRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  organizationId: string;
  userId?: string;
  type: SecurityEventType;
  riskLevel: SecurityRiskLevel;
  description: string;
  details: SecurityEventDetails;
  ipAddress?: string;
  userAgent?: string;
  location?: GeographicLocation;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface SecurityEventDetails {
  resource?: string;
  action?: string;
  previousValue?: any;
  newValue?: any;
  affectedUsers?: string[];
  metadata?: Record<string, any>;
  context?: string;
  sessionId?: string;
  requestId?: string;
}

export interface GeographicLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// Security policy configuration
export interface SecurityPolicy {
  organizationId: string;
  passwordPolicy: PasswordPolicy;
  sessionPolicy: SessionPolicy;
  accessPolicy: AccessPolicy;
  auditPolicy: AuditPolicy;
  alertPolicy: AlertPolicy;
  dataRetentionPolicy: DataRetentionPolicy;
  updatedAt: string;
  updatedBy: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days, 0 for no expiry
  preventReuse: number; // number of previous passwords to remember
  lockoutAttempts: number;
  lockoutDuration: number; // minutes
}

export interface SessionPolicy {
  maxDuration: number; // minutes
  idleTimeout: number; // minutes
  requireReauthForSensitive: boolean;
  maxConcurrentSessions: number;
  allowRememberMe: boolean;
  requireMFA: boolean;
}

export interface AccessPolicy {
  allowedIPRanges?: string[];
  blockedIPRanges?: string[];
  requireVPN: boolean;
  allowMobileAccess: boolean;
  allowAPIAccess: boolean;
  restrictToBusinessHours: boolean;
  businessHours?: {
    start: string;
    end: string;
    timezone: string;
    allowWeekends: boolean;
  };
}

export interface AuditPolicy {
  logAllActions: boolean;
  logSensitiveDataAccess: boolean;
  logFailedAttempts: boolean;
  retentionDays: number;
  realTimeAlerting: boolean;
  exportEnabled: boolean;
}

export interface AlertPolicy {
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    failedLogins: number;
    privilegeChanges: boolean;
    dataExports: boolean;
    afterHoursAccess: boolean;
    suspiciousActivity: boolean;
  };
  notificationChannels: ('email' | 'slack' | 'webhook')[];
  alertRecipients: string[];
}

export interface DataRetentionPolicy {
  auditLogDays: number;
  sessionLogDays: number;
  securityEventDays: number;
  autoCleanup: boolean;
  backupBeforeCleanup: boolean;
}

// Threat detection patterns
export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: string; // regex or rule definition
  riskLevel: SecurityRiskLevel;
  enabled: boolean;
  actions: ThreatAction[];
}

export interface ThreatAction {
  type: 'alert' | 'block' | 'lockAccount' | 'requireMFA' | 'logEvent';
  parameters?: Record<string, any>;
}

class SecurityService {
  private threatPatterns: Map<string, ThreatPattern> = new Map();
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private activeThreats: Map<string, SecurityEvent[]> = new Map();

  constructor() {
    this.initializeDefaultThreatPatterns();
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    organizationId: string,
    type: SecurityEventType,
    details: Partial<SecurityEventDetails> = {},
    riskLevel: SecurityRiskLevel = SecurityRiskLevel.LOW,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const event: Partial<SecurityEvent> = {
        organization_id: organizationId,
        user_id: userId,
        type,
        risk_level: riskLevel,
        description: this.getEventDescription(type, details),
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
        resolved: riskLevel === SecurityRiskLevel.LOW // Auto-resolve low risk events
      };

      // Add geographic location if possible
      if (ipAddress) {
        event.location = await this.getGeographicLocation(ipAddress);
      }

      // Store security event
      const { data: securityEvent, error } = await supabase
        .from('security_events')
        .insert([event])
        .select()
        .single();

      if (error) {
        console.error('Failed to log security event:', error);
        return;
      }

      // Also log as organization activity for audit trail
      await this.logOrganizationActivity(organizationId, {
        userId,
        activityType: `security_${type}`,
        description: event.description!,
        metadata: {
          securityEventId: securityEvent.id,
          riskLevel,
          details
        }
      });

      // Check for threat patterns
      await this.checkThreatPatterns(organizationId, securityEvent);

      // Send real-time alerts if needed
      if (riskLevel === SecurityRiskLevel.HIGH || riskLevel === SecurityRiskLevel.CRITICAL) {
        await this.sendSecurityAlert(organizationId, securityEvent);
      }

    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }

  /**
   * Analyze login attempt for suspicious activity
   */
  async analyzeLoginAttempt(
    organizationId: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ suspicious: boolean; riskLevel: SecurityRiskLevel; reasons: string[] }> {
    const reasons: string[] = [];
    let riskLevel = SecurityRiskLevel.LOW;
    let suspicious = false;

    try {
      // Get recent login attempts for this email
      const { data: recentAttempts } = await supabase
        .from('security_events')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('details->email', email)
        .in('type', [SecurityEventType.LOGIN_SUCCESS, SecurityEventType.LOGIN_FAILED])
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(20);

      const attempts = recentAttempts || [];

      // Check for multiple failed attempts
      const failedAttempts = attempts.filter(a => a.type === SecurityEventType.LOGIN_FAILED).length;
      if (failedAttempts >= 5) {
        reasons.push(`${failedAttempts} failed login attempts in last 24 hours`);
        riskLevel = SecurityRiskLevel.HIGH;
        suspicious = true;
      }

      // Check for geographic anomalies
      if (ipAddress) {
        const location = await this.getGeographicLocation(ipAddress);
        const recentSuccessfulLogins = attempts.filter(a => 
          a.type === SecurityEventType.LOGIN_SUCCESS && a.location
        );

        if (recentSuccessfulLogins.length > 0) {
          const lastLocation = recentSuccessfulLogins[0].location;
          if (lastLocation && location && 
              this.calculateDistance(location, lastLocation) > 1000) { // 1000km threshold
            reasons.push('Login from unusual geographic location');
            riskLevel = Math.max(riskLevel as any, SecurityRiskLevel.MEDIUM as any);
            suspicious = true;
          }
        }
      }

      // Check for unusual time patterns
      const currentHour = new Date().getHours();
      const businessHours = await this.getBusinessHours(organizationId);
      if (businessHours && (currentHour < businessHours.start || currentHour > businessHours.end)) {
        const recentAfterHours = attempts.filter(a => {
          const hour = new Date(a.timestamp).getHours();
          return hour < businessHours.start || hour > businessHours.end;
        });

        if (recentAfterHours.length === 0) { // First after-hours login
          reasons.push('Login outside business hours');
          riskLevel = Math.max(riskLevel as any, SecurityRiskLevel.MEDIUM as any);
          suspicious = true;
        }
      }

      // Check for rapid successive attempts
      if (attempts.length >= 3) {
        const timeDiffs = attempts.slice(0, 3).map((attempt, i) => {
          if (i === 0) return Infinity;
          return new Date(attempts[i-1].timestamp).getTime() - new Date(attempt.timestamp).getTime();
        });

        const rapidAttempts = timeDiffs.filter(diff => diff < 60000).length; // Less than 1 minute
        if (rapidAttempts >= 2) {
          reasons.push('Rapid successive login attempts');
          riskLevel = Math.max(riskLevel as any, SecurityRiskLevel.MEDIUM as any);
          suspicious = true;
        }
      }

      // Check user agent anomalies
      if (userAgent && attempts.length > 0) {
        const commonUserAgent = this.getMostCommonUserAgent(attempts);
        if (commonUserAgent && userAgent !== commonUserAgent) {
          reasons.push('Login from new device/browser');
          riskLevel = Math.max(riskLevel as any, SecurityRiskLevel.LOW as any);
        }
      }

      return { suspicious, riskLevel, reasons };

    } catch (error) {
      console.error('Login analysis failed:', error);
      return { suspicious: false, riskLevel: SecurityRiskLevel.LOW, reasons: [] };
    }
  }

  /**
   * Check for privilege escalation attempts
   */
  async checkPrivilegeEscalation(
    organizationId: string,
    userId: string,
    targetUserId: string,
    currentRole: OrganizationRole | ProjectRole,
    newRole: OrganizationRole | ProjectRole,
    context: 'organization' | 'project' = 'organization'
  ): Promise<{ allowed: boolean; riskLevel: SecurityRiskLevel; reason?: string }> {
    try {
      // Get user's permissions
      const user = await authService.getCurrentUser();
      if (!user || user.id !== userId) {
        await this.logSecurityEvent(
          organizationId,
          SecurityEventType.PRIVILEGE_ESCALATION,
          {
            action: 'role_change_attempt',
            metadata: { targetUserId, currentRole, newRole, context },
            context: 'Unauthorized role change attempt'
          },
          SecurityRiskLevel.HIGH,
          userId
        );

        return {
          allowed: false,
          riskLevel: SecurityRiskLevel.HIGH,
          reason: 'Unauthorized privilege escalation attempt'
        };
      }

      // Define role hierarchy
      const orgRoleHierarchy = [
        OrganizationRole.MEMBER,
        OrganizationRole.MANAGER,
        OrganizationRole.ADMIN,
        OrganizationRole.OWNER
      ];

      const projectRoleHierarchy = [
        ProjectRole.VIEWER,
        ProjectRole.ASSISTANT,
        ProjectRole.LEAD,
        ProjectRole.SCHEDULER,
        ProjectRole.MANAGER,
        ProjectRole.ADMIN
      ];

      const hierarchy = context === 'organization' ? orgRoleHierarchy : projectRoleHierarchy;
      
      const currentLevel = hierarchy.indexOf(currentRole as any);
      const newLevel = hierarchy.indexOf(newRole as any);
      const userLevel = context === 'organization' 
        ? hierarchy.indexOf(user.organizationRole as any)
        : hierarchy.indexOf(user.projects.find(p => p.isActive)?.role as any || -1);

      // Check if user can assign this role
      if (userLevel < newLevel) {
        await this.logSecurityEvent(
          organizationId,
          SecurityEventType.PRIVILEGE_ESCALATION,
          {
            action: 'insufficient_privileges',
            metadata: { targetUserId, currentRole, newRole, userLevel, newLevel },
            context: 'User attempted to assign higher privilege than they possess'
          },
          SecurityRiskLevel.MEDIUM,
          userId
        );

        return {
          allowed: false,
          riskLevel: SecurityRiskLevel.MEDIUM,
          reason: 'Cannot assign privileges higher than your own'
        };
      }

      // Check for suspicious elevation (skipping multiple levels)
      if (newLevel - currentLevel > 2) {
        await this.logSecurityEvent(
          organizationId,
          SecurityEventType.PRIVILEGE_ESCALATION,
          {
            action: 'suspicious_elevation',
            metadata: { targetUserId, currentRole, newRole, levelJump: newLevel - currentLevel },
            context: 'Large privilege elevation detected'
          },
          SecurityRiskLevel.MEDIUM,
          userId
        );

        return {
          allowed: true,
          riskLevel: SecurityRiskLevel.MEDIUM,
          reason: 'Large privilege elevation - monitoring required'
        };
      }

      // Log legitimate role change
      await this.logSecurityEvent(
        organizationId,
        SecurityEventType.USER_ROLE_CHANGED,
        {
          action: 'role_changed',
          metadata: { targetUserId, currentRole, newRole },
          context: 'Legitimate role change'
        },
        SecurityRiskLevel.LOW,
        userId
      );

      return { allowed: true, riskLevel: SecurityRiskLevel.LOW };

    } catch (error) {
      console.error('Privilege escalation check failed:', error);
      return { allowed: false, riskLevel: SecurityRiskLevel.HIGH, reason: 'Security check failed' };
    }
  }

  /**
   * Monitor data export activities
   */
  async monitorDataExport(
    organizationId: string,
    userId: string,
    exportType: string,
    recordCount: number,
    dataTypes: string[],
    ipAddress?: string
  ): Promise<void> {
    let riskLevel = SecurityRiskLevel.LOW;
    const details: SecurityEventDetails = {
      action: 'data_export',
      metadata: {
        exportType,
        recordCount,
        dataTypes,
        timestamp: new Date().toISOString()
      }
    };

    // Determine risk level based on export size and sensitivity
    if (recordCount > 10000) {
      riskLevel = SecurityRiskLevel.MEDIUM;
      details.context = 'Large data export';
    }

    if (recordCount > 100000) {
      riskLevel = SecurityRiskLevel.HIGH;
      details.context = 'Very large data export';
    }

    // Check for sensitive data types
    const sensitiveTypes = ['users', 'customers', 'financial', 'personal'];
    const hasSensitiveData = dataTypes.some(type => 
      sensitiveTypes.some(sensitive => type.toLowerCase().includes(sensitive))
    );

    if (hasSensitiveData) {
      riskLevel = Math.max(riskLevel as any, SecurityRiskLevel.MEDIUM as any);
      details.context = 'Export includes sensitive data';
    }

    await this.logSecurityEvent(
      organizationId,
      SecurityEventType.DATA_EXPORT,
      details,
      riskLevel,
      userId,
      ipAddress
    );
  }

  /**
   * Get security dashboard metrics
   */
  async getSecurityMetrics(organizationId: string, days: number = 30): Promise<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsByRisk: Record<SecurityRiskLevel, number>;
    activeThreats: number;
    suspiciousLogins: number;
    dataExports: number;
    privilegeChanges: number;
    topRisks: SecurityEvent[];
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', startDate);

      const securityEvents = events || [];

      const eventsByType = securityEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<SecurityEventType, number>);

      const eventsByRisk = securityEvents.reduce((acc, event) => {
        acc[event.risk_level] = (acc[event.risk_level] || 0) + 1;
        return acc;
      }, {} as Record<SecurityRiskLevel, number>);

      const activeThreats = securityEvents.filter(e => 
        !e.resolved && e.risk_level !== SecurityRiskLevel.LOW
      ).length;

      const suspiciousLogins = securityEvents.filter(e => 
        e.type === SecurityEventType.LOGIN_SUSPICIOUS
      ).length;

      const dataExports = securityEvents.filter(e => 
        e.type === SecurityEventType.DATA_EXPORT
      ).length;

      const privilegeChanges = securityEvents.filter(e => 
        e.type === SecurityEventType.PRIVILEGE_ESCALATION ||
        e.type === SecurityEventType.USER_ROLE_CHANGED
      ).length;

      const topRisks = securityEvents
        .filter(e => !e.resolved)
        .sort((a, b) => {
          const riskOrder = { 
            [SecurityRiskLevel.CRITICAL]: 4,
            [SecurityRiskLevel.HIGH]: 3,
            [SecurityRiskLevel.MEDIUM]: 2,
            [SecurityRiskLevel.LOW]: 1
          };
          return riskOrder[b.risk_level] - riskOrder[a.risk_level];
        })
        .slice(0, 10);

      return {
        totalEvents: securityEvents.length,
        eventsByType,
        eventsByRisk,
        activeThreats,
        suspiciousLogins,
        dataExports,
        privilegeChanges,
        topRisks
      };

    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw error;
    }
  }

  /**
   * Initialize default threat patterns
   */
  private initializeDefaultThreatPatterns(): void {
    const patterns: ThreatPattern[] = [
      {
        id: 'brute_force',
        name: 'Brute Force Attack',
        description: 'Multiple failed login attempts',
        pattern: 'failed_logins > 5 in 10 minutes',
        riskLevel: SecurityRiskLevel.HIGH,
        enabled: true,
        actions: [
          { type: 'lockAccount', parameters: { duration: 30 } },
          { type: 'alert' }
        ]
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation',
        description: 'Unauthorized role changes',
        pattern: 'role_change without proper permissions',
        riskLevel: SecurityRiskLevel.CRITICAL,
        enabled: true,
        actions: [
          { type: 'block' },
          { type: 'alert' },
          { type: 'logEvent' }
        ]
      },
      {
        id: 'mass_data_export',
        name: 'Mass Data Export',
        description: 'Large data exports in short time',
        pattern: 'data_export > 50000 records',
        riskLevel: SecurityRiskLevel.MEDIUM,
        enabled: true,
        actions: [
          { type: 'alert' },
          { type: 'requireMFA' }
        ]
      },
      {
        id: 'geographic_anomaly',
        name: 'Geographic Anomaly',
        description: 'Login from unusual location',
        pattern: 'login from location > 1000km from usual',
        riskLevel: SecurityRiskLevel.MEDIUM,
        enabled: true,
        actions: [
          { type: 'requireMFA' },
          { type: 'alert' }
        ]
      },
      {
        id: 'after_hours_access',
        name: 'After Hours Access',
        description: 'Access outside business hours',
        pattern: 'access outside 9-17 business hours',
        riskLevel: SecurityRiskLevel.LOW,
        enabled: true,
        actions: [
          { type: 'logEvent' },
          { type: 'alert' }
        ]
      }
    ];

    patterns.forEach(pattern => {
      this.threatPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Check event against threat patterns
   */
  private async checkThreatPatterns(organizationId: string, event: SecurityEvent): Promise<void> {
    for (const pattern of this.threatPatterns.values()) {
      if (!pattern.enabled) continue;

      const matches = await this.evaluatePattern(pattern, event, organizationId);
      if (matches) {
        await this.executeThreatActions(pattern, event, organizationId);
      }
    }
  }

  /**
   * Evaluate threat pattern against event
   */
  private async evaluatePattern(
    pattern: ThreatPattern, 
    event: SecurityEvent, 
    organizationId: string
  ): Promise<boolean> {
    // Simple pattern matching - in production, you'd use a more sophisticated rule engine
    switch (pattern.id) {
      case 'brute_force':
        return await this.checkBruteForcePattern(event, organizationId);
      case 'privilege_escalation':
        return event.type === SecurityEventType.PRIVILEGE_ESCALATION;
      case 'mass_data_export':
        return event.type === SecurityEventType.DATA_EXPORT && 
               (event.details.metadata?.recordCount || 0) > 50000;
      case 'geographic_anomaly':
        return event.type === SecurityEventType.LOGIN_SUSPICIOUS &&
               event.details.context?.includes('geographic');
      case 'after_hours_access':
        return await this.checkAfterHoursPattern(event, organizationId);
      default:
        return false;
    }
  }

  /**
   * Execute threat pattern actions
   */
  private async executeThreatActions(
    pattern: ThreatPattern, 
    event: SecurityEvent, 
    organizationId: string
  ): Promise<void> {
    for (const action of pattern.actions) {
      try {
        await this.executeThreatAction(action, event, organizationId);
      } catch (error) {
        console.error(`Failed to execute threat action ${action.type}:`, error);
      }
    }
  }

  /**
   * Execute individual threat action
   */
  private async executeThreatAction(
    action: ThreatAction, 
    event: SecurityEvent, 
    organizationId: string
  ): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.sendSecurityAlert(organizationId, event);
        break;
      case 'block':
        // Implement request blocking logic
        break;
      case 'lockAccount':
        if (event.userId) {
          await this.lockUserAccount(event.userId, action.parameters?.duration || 30);
        }
        break;
      case 'requireMFA':
        // Implement MFA requirement logic
        break;
      case 'logEvent':
        // Already logged, but could trigger additional logging
        break;
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(organizationId: string, event: SecurityEvent): Promise<void> {
    // Get alert recipients from organization settings
    const policy = await this.getSecurityPolicy(organizationId);
    if (!policy?.alertPolicy.enableRealTimeAlerts) return;

    // Create notification for security team
    await supabase.from('notifications').insert([{
      organization_id: organizationId,
      type: 'security_alert',
      priority: event.riskLevel === SecurityRiskLevel.CRITICAL ? 'urgent' : 'high',
      title: `Security Alert: ${event.type}`,
      message: event.description,
      data: {
        securityEventId: event.id,
        riskLevel: event.riskLevel,
        userId: event.userId,
        timestamp: event.timestamp
      }
    }]);

    // In production, you would also send emails, Slack messages, webhooks, etc.
    console.warn('Security Alert:', {
      organizationId,
      type: event.type,
      riskLevel: event.riskLevel,
      description: event.description
    });
  }

  /**
   * Helper methods
   */
  private getEventDescription(type: SecurityEventType, details: Partial<SecurityEventDetails>): string {
    const descriptions = {
      [SecurityEventType.LOGIN_SUCCESS]: 'Successful login',
      [SecurityEventType.LOGIN_FAILED]: 'Failed login attempt',
      [SecurityEventType.LOGIN_SUSPICIOUS]: 'Suspicious login activity detected',
      [SecurityEventType.PASSWORD_CHANGED]: 'Password changed',
      [SecurityEventType.PRIVILEGE_ESCALATION]: 'Privilege escalation attempt',
      [SecurityEventType.DATA_EXPORT]: `Data export: ${details.metadata?.recordCount || 'unknown'} records`,
      [SecurityEventType.USER_ROLE_CHANGED]: 'User role changed',
      // Add more as needed
    };

    return descriptions[type] || `Security event: ${type}`;
  }

  private async getGeographicLocation(ipAddress: string): Promise<GeographicLocation | undefined> {
    // In production, integrate with a geolocation service
    // For now, return undefined
    return undefined;
  }

  private calculateDistance(loc1: GeographicLocation, loc2: GeographicLocation): number {
    if (!loc1.latitude || !loc1.longitude || !loc2.latitude || !loc2.longitude) {
      return 0;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(loc1.latitude)) * Math.cos(this.toRad(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  private getMostCommonUserAgent(attempts: any[]): string | null {
    const userAgents = attempts
      .map(a => a.user_agent)
      .filter(ua => ua);
    
    if (userAgents.length === 0) return null;

    const counts = userAgents.reduce((acc, ua) => {
      acc[ua] = (acc[ua] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  private async checkBruteForcePattern(event: SecurityEvent, organizationId: string): Promise<boolean> {
    if (event.type !== SecurityEventType.LOGIN_FAILED) return false;

    // Check for multiple failed attempts in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentFailures } = await supabase
      .from('security_events')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('type', SecurityEventType.LOGIN_FAILED)
      .gte('timestamp', tenMinutesAgo);

    return (recentFailures?.length || 0) >= 5;
  }

  private async checkAfterHoursPattern(event: SecurityEvent, organizationId: string): Promise<boolean> {
    const businessHours = await this.getBusinessHours(organizationId);
    if (!businessHours) return false;

    const eventHour = new Date(event.timestamp).getHours();
    return eventHour < businessHours.start || eventHour > businessHours.end;
  }

  private async getBusinessHours(organizationId: string): Promise<{ start: number; end: number } | null> {
    // Get from organization settings
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    const workingHours = org?.settings?.workingHours;
    if (!workingHours) return null;

    return {
      start: parseInt(workingHours.start.split(':')[0]),
      end: parseInt(workingHours.end.split(':')[0])
    };
  }

  private async getSecurityPolicy(organizationId: string): Promise<SecurityPolicy | null> {
    // In production, this would be stored in the database
    return this.securityPolicies.get(organizationId) || null;
  }

  private async lockUserAccount(userId: string, durationMinutes: number): Promise<void> {
    const unlockAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    
    await supabase
      .from('users')
      .update({ 
        is_active: false,
        settings: { lockedUntil: unlockAt }
      })
      .eq('id', userId);
  }

  private async logOrganizationActivity(
    organizationId: string, 
    activity: Partial<OrganizationActivity>
  ): Promise<void> {
    try {
      await supabase.from('organization_activities').insert([{
        organization_id: organizationId,
        ...activity,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to log organization activity:', error);
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();

export default securityService;