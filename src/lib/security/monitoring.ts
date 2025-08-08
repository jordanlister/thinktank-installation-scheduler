// Think Tank Technologies - Security Monitoring and Incident Response

import type { SecurityEvent, SecurityEventType, SecuritySeverity, MonitoringConfig, SecurityAuditResult, SecurityViolation } from './types';

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  logLevel: 'warn',
  enableCspReporting: true,
  enableSecurityAudit: true,
  alertThreshold: 10, // Alert after 10 events per hour
  auditEndpoints: ['/contact', '/demo', '/newsletter'],
  sensitiveDataPatterns: [
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
  ]
};

/**
 * Security event logger
 */
export class SecurityMonitor {
  private config: MonitoringConfig;
  private events: SecurityEvent[] = [];
  private alertCounts = new Map<string, { count: number; resetTime: number }>();
  private auditResults: SecurityAuditResult[] = [];

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.startPeriodicCleanup();
  }

  /**
   * Logs a security event
   */
  logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    details: Record<string, any> = {},
    context?: {
      ip?: string;
      userAgent?: string;
      endpoint?: string;
      userId?: string;
    }
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      severity,
      message,
      details: this.sanitizeDetails(details),
      ...context
    };

    this.events.push(event);

    // Log to console based on log level
    this.logToConsole(event);

    // Send alert if threshold exceeded
    this.checkAlertThreshold(type, severity);

    // Persist event (in production, send to external logging service)
    this.persistEvent(event);
  }

  /**
   * Logs CSP violation
   */
  logCSPViolation(violation: any, context?: { ip?: string; userAgent?: string }): void {
    this.logEvent(
      SecurityEventType.CSP_VIOLATION,
      SecuritySeverity.MEDIUM,
      'Content Security Policy violation',
      {
        blockedUri: violation['blocked-uri'],
        documentUri: violation['document-uri'],
        effectiveDirective: violation['effective-directive'],
        violatedDirective: violation['violated-directive'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number']
      },
      context
    );
  }

  /**
   * Logs rate limiting event
   */
  logRateLimit(ip: string, endpoint: string, userAgent?: string): void {
    this.logEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecuritySeverity.MEDIUM,
      'Rate limit exceeded',
      {
        endpoint,
        requestCount: this.getRecentRequestCount(ip, endpoint)
      },
      { ip, userAgent, endpoint }
    );
  }

  /**
   * Logs spam detection
   */
  logSpamDetection(
    ip: string, 
    endpoint: string, 
    confidence: number, 
    reasons: string[],
    userAgent?: string
  ): void {
    this.logEvent(
      SecurityEventType.SPAM_ATTEMPT,
      confidence > 0.8 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
      'Spam attempt detected',
      {
        confidence,
        reasons,
        endpoint
      },
      { ip, userAgent, endpoint }
    );
  }

  /**
   * Logs malicious input detection
   */
  logMaliciousInput(
    input: string,
    patterns: string[],
    context?: {
      ip?: string;
      userAgent?: string;
      endpoint?: string;
      field?: string;
    }
  ): void {
    this.logEvent(
      SecurityEventType.MALICIOUS_PAYLOAD,
      SecuritySeverity.HIGH,
      'Malicious input detected',
      {
        inputLength: input.length,
        patterns,
        field: context?.field,
        sanitizedInput: this.sanitizeForLogging(input)
      },
      context
    );
  }

  /**
   * Performs security audit of current state
   */
  performSecurityAudit(): SecurityAuditResult {
    const violations: SecurityViolation[] = [];
    let score = 100;

    // Check for missing security headers
    if (typeof window !== 'undefined') {
      // Check CSP
      if (!this.hasCSPHeader()) {
        violations.push({
          rule: 'Content-Security-Policy',
          severity: SecuritySeverity.HIGH,
          description: 'Content Security Policy header is missing',
          fix: 'Implement CSP header with appropriate directives'
        });
        score -= 25;
      }

      // Check for HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        violations.push({
          rule: 'HTTPS',
          severity: SecuritySeverity.HIGH,
          description: 'Site is not served over HTTPS',
          fix: 'Enable HTTPS for all traffic'
        });
        score -= 20;
      }

      // Check for insecure elements
      const insecureElements = this.findInsecureElements();
      if (insecureElements.length > 0) {
        violations.push({
          rule: 'Mixed Content',
          severity: SecuritySeverity.MEDIUM,
          description: `Found ${insecureElements.length} insecure elements`,
          fix: 'Update all HTTP resources to HTTPS',
          element: insecureElements.join(', ')
        });
        score -= insecureElements.length * 5;
      }
    }

    // Check recent security events for patterns
    const recentEvents = this.getRecentEvents(24 * 60 * 60 * 1000); // Last 24 hours
    const criticalEvents = recentEvents.filter(e => e.severity === SecuritySeverity.CRITICAL);
    const highEvents = recentEvents.filter(e => e.severity === SecuritySeverity.HIGH);

    if (criticalEvents.length > 0) {
      violations.push({
        rule: 'Critical Security Events',
        severity: SecuritySeverity.CRITICAL,
        description: `${criticalEvents.length} critical security events in last 24 hours`,
        fix: 'Investigate and address critical security incidents immediately'
      });
      score -= criticalEvents.length * 10;
    }

    if (highEvents.length > 5) {
      violations.push({
        rule: 'High Risk Events',
        severity: SecuritySeverity.HIGH,
        description: `${highEvents.length} high-risk security events in last 24 hours`,
        fix: 'Review and address high-risk security patterns'
      });
      score -= Math.min(highEvents.length * 2, 20);
    }

    const auditResult: SecurityAuditResult = {
      passed: violations.length === 0,
      score: Math.max(score, 0),
      violations,
      recommendations: this.generateRecommendations(violations)
    };

    this.auditResults.push(auditResult);
    return auditResult;
  }

  /**
   * Gets recent security events
   */
  getRecentEvents(timeWindowMs: number): SecurityEvent[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.events.filter(event => event.timestamp > cutoff);
  }

  /**
   * Gets security statistics
   */
  getSecurityStats(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecuritySeverity, number>;
    topIPs: { ip: string; count: number }[];
    topEndpoints: { endpoint: string; count: number }[];
  } {
    const recentEvents = this.getRecentEvents(timeWindowMs);
    
    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<SecuritySeverity, number> = {} as any;
    const ipCounts = new Map<string, number>();
    const endpointCounts = new Map<string, number>();

    recentEvents.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Count by IP
      if (event.ip) {
        ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
      }
      
      // Count by endpoint
      if (event.endpoint) {
        endpointCounts.set(event.endpoint, (endpointCounts.get(event.endpoint) || 0) + 1);
      }
    });

    // Get top IPs and endpoints
    const topIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      topEndpoints
    };
  }

  /**
   * Exports security events for analysis
   */
  exportEvents(format: 'json' | 'csv' = 'json', timeWindowMs?: number): string {
    const events = timeWindowMs ? this.getRecentEvents(timeWindowMs) : this.events;
    
    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'severity', 'message', 'ip', 'endpoint', 'userAgent'];
      const csv = [
        headers.join(','),
        ...events.map(event => [
          new Date(event.timestamp).toISOString(),
          event.type,
          event.severity,
          `"${event.message.replace(/"/g, '""')}"`,
          event.ip || '',
          event.endpoint || '',
          event.userAgent ? `"${event.userAgent.replace(/"/g, '""')}"` : ''
        ].join(','))
      ].join('\n');
      return csv;
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Private helper methods
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove or mask sensitive data
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        this.config.sensitiveDataPatterns.forEach(pattern => {
          sanitized[key] = sanitized[key].replace(pattern, '[REDACTED]');
        });
      }
    });

    return sanitized;
  }

  private sanitizeForLogging(input: string): string {
    let sanitized = input.substring(0, 200); // Truncate long inputs
    
    // Mask sensitive patterns
    this.config.sensitiveDataPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  private logToConsole(event: SecurityEvent): void {
    const shouldLog = this.shouldLogLevel(event.severity);
    if (!shouldLog) return;

    const logMessage = `[SECURITY ${event.severity.toUpperCase()}] ${event.type}: ${event.message}`;
    const logData = {
      id: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      details: event.details,
      context: {
        ip: event.ip,
        endpoint: event.endpoint,
        userAgent: event.userAgent?.substring(0, 100)
      }
    };

    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
        console.error(logMessage, logData);
        break;
      case SecuritySeverity.HIGH:
        console.error(logMessage, logData);
        break;
      case SecuritySeverity.MEDIUM:
        console.warn(logMessage, logData);
        break;
      case SecuritySeverity.LOW:
        console.info(logMessage, logData);
        break;
    }
  }

  private shouldLogLevel(severity: SecuritySeverity): boolean {
    const levels = {
      debug: ['debug', 'info', 'warn', 'error'],
      info: ['info', 'warn', 'error'],
      warn: ['warn', 'error'],
      error: ['error']
    };

    const severityToLevel = {
      [SecuritySeverity.LOW]: 'debug',
      [SecuritySeverity.MEDIUM]: 'info',
      [SecuritySeverity.HIGH]: 'warn',
      [SecuritySeverity.CRITICAL]: 'error'
    };

    const requiredLevels = levels[this.config.logLevel];
    const eventLevel = severityToLevel[severity];

    return requiredLevels.includes(eventLevel);
  }

  private checkAlertThreshold(type: SecurityEventType, severity: SecuritySeverity): void {
    const key = `${type}_${severity}`;
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    const current = this.alertCounts.get(key) || { count: 0, resetTime: now + hourMs };
    
    if (current.resetTime <= now) {
      current.count = 1;
      current.resetTime = now + hourMs;
    } else {
      current.count++;
    }

    this.alertCounts.set(key, current);

    if (current.count >= this.config.alertThreshold) {
      this.sendAlert(type, severity, current.count);
    }
  }

  private sendAlert(type: SecurityEventType, severity: SecuritySeverity, count: number): void {
    // In production, send to alerting system (PagerDuty, Slack, email, etc.)
    console.warn(`🚨 SECURITY ALERT: ${count} ${type} events (${severity}) in the last hour`);
    
    // Reset counter to prevent spam
    this.alertCounts.delete(`${type}_${severity}`);
  }

  private persistEvent(event: SecurityEvent): void {
    // In production, send to external logging service
    // For now, just keep in memory with size limit
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000); // Keep last 5000 events
    }
  }

  private hasCSPHeader(): boolean {
    // In browser, we can't easily check response headers
    // This would need to be checked server-side
    return true;
  }

  private findInsecureElements(): string[] {
    if (typeof document === 'undefined') return [];

    const insecure: string[] = [];
    
    // Check for HTTP images
    const images = document.querySelectorAll('img[src^="http:"]');
    if (images.length > 0) insecure.push(`${images.length} HTTP images`);

    // Check for HTTP scripts
    const scripts = document.querySelectorAll('script[src^="http:"]');
    if (scripts.length > 0) insecure.push(`${scripts.length} HTTP scripts`);

    // Check for HTTP stylesheets
    const styles = document.querySelectorAll('link[href^="http:"]');
    if (styles.length > 0) insecure.push(`${styles.length} HTTP stylesheets`);

    return insecure;
  }

  private getRecentRequestCount(ip: string, endpoint: string): number {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return this.events.filter(event => 
      event.ip === ip && 
      event.endpoint === endpoint && 
      event.timestamp > oneHourAgo
    ).length;
  }

  private generateRecommendations(violations: SecurityViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.rule === 'Content-Security-Policy')) {
      recommendations.push('Implement a strict Content Security Policy to prevent XSS attacks');
    }

    if (violations.some(v => v.rule === 'HTTPS')) {
      recommendations.push('Enable HTTPS across all pages and resources');
    }

    if (violations.some(v => v.severity === SecuritySeverity.CRITICAL)) {
      recommendations.push('Immediately investigate and remediate critical security incidents');
    }

    if (violations.some(v => v.rule === 'Mixed Content')) {
      recommendations.push('Audit all external resources and ensure they use HTTPS');
    }

    // Add general recommendations
    if (violations.length === 0) {
      recommendations.push('Continue monitoring for security events and maintain current security posture');
    } else {
      recommendations.push('Regular security audits should be performed to maintain security standards');
      recommendations.push('Consider implementing additional security monitoring tools');
    }

    return recommendations;
  }

  private startPeriodicCleanup(): void {
    // Clean up old events every hour
    setInterval(() => {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.events = this.events.filter(event => event.timestamp > oneWeekAgo);
      
      // Clean up alert counts
      const now = Date.now();
      for (const [key, data] of this.alertCounts.entries()) {
        if (data.resetTime <= now) {
          this.alertCounts.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

// Convenience functions
export function logSecurityEvent(
  type: SecurityEventType,
  severity: SecuritySeverity,
  message: string,
  details?: Record<string, any>,
  context?: Parameters<SecurityMonitor['logEvent']>[4]
): void {
  securityMonitor.logEvent(type, severity, message, details, context);
}

export function performSecurityAudit(): SecurityAuditResult {
  return securityMonitor.performSecurityAudit();
}

export function getSecurityStats(timeWindowMs?: number): ReturnType<SecurityMonitor['getSecurityStats']> {
  return securityMonitor.getSecurityStats(timeWindowMs);
}