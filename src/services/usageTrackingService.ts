// Think Tank Technologies Installation Scheduler - Usage Tracking Service
import { supabase } from './supabase';
import {
  UsageMetrics,
  UsageWarning,
  UsageWarningType,
  SubscriptionPlan,
  SubscriptionLimits,
  FeatureUsage,
  SubscriptionFeatures
} from '../types';
import { SUBSCRIPTION_PLANS, getPlanConfig, isFeatureEnabled, isWithinLimits } from '../config/subscriptionPlans';

interface UsageCalculationResult {
  metrics: UsageMetrics;
  warnings: UsageWarning[];
}

interface ResourceUsage {
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
}

class UsageTrackingService {
  private readonly WARNING_THRESHOLD = 80; // 80%
  private readonly CRITICAL_THRESHOLD = 95; // 95%

  /**
   * Calculate current usage metrics for an organization
   */
  async calculateUsageMetrics(organizationId: string): Promise<UsageMetrics> {
    try {
      // Get current subscription to determine limits
      const subscription = await this.getCurrentSubscription(organizationId);
      const planConfig = getPlanConfig(subscription?.planId || SubscriptionPlan.FREE);
      
      // Calculate current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get current usage counts
      const [
        projectsCount,
        teamMembersCount,
        installationsCount,
        storageUsage,
        apiRequestsCount,
        featureUsageData
      ] = await Promise.all([
        this.getProjectsCount(organizationId),
        this.getTeamMembersCount(organizationId),
        this.getInstallationsCount(organizationId, periodStart, periodEnd),
        this.getStorageUsage(organizationId),
        this.getApiRequestsCount(organizationId, periodStart, periodEnd),
        this.getFeatureUsage(organizationId)
      ]);

      // Calculate usage percentages
      const projects = this.calculateResourceUsage(projectsCount, planConfig.limits.projects);
      const teamMembers = this.calculateResourceUsage(teamMembersCount, planConfig.limits.teamMembers);
      const installations = this.calculateResourceUsage(installationsCount, planConfig.limits.installations);
      const storage = this.calculateResourceUsage(storageUsage, planConfig.limits.storageGB);
      const apiRequests = this.calculateResourceUsage(apiRequestsCount, planConfig.limits.apiRequests);

      // Generate warnings
      const warnings = this.generateUsageWarnings(organizationId, {
        projects,
        teamMembers,
        installations,
        storage,
        apiRequests
      });

      const metrics: UsageMetrics = {
        organizationId,
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString()
        },
        projects,
        teamMembers,
        installations,
        storage: {
          currentGB: storageUsage,
          limitGB: planConfig.limits.storageGB,
          percentage: storage.percentage
        },
        apiRequests: {
          current: apiRequestsCount,
          limit: planConfig.limits.apiRequests,
          percentage: apiRequests.percentage,
          resetDate: new Date(periodEnd).toISOString()
        },
        features: featureUsageData,
        warnings,
        lastCalculated: now.toISOString()
      };

      // Store metrics in database
      await this.storeUsageMetrics(metrics);

      return metrics;
    } catch (error) {
      console.error('Error calculating usage metrics:', error);
      throw new Error(`Failed to calculate usage metrics: ${error.message}`);
    }
  }

  /**
   * Get usage metrics for an organization (from cache or calculate)
   */
  async getUsageMetrics(organizationId: string, forceRefresh: boolean = false): Promise<UsageMetrics> {
    if (!forceRefresh) {
      // Try to get recent cached metrics
      const { data: cachedMetrics } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      // Use cached metrics if they're less than 5 minutes old
      if (cachedMetrics) {
        const calculatedAt = new Date(cachedMetrics.calculated_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (calculatedAt > fiveMinutesAgo) {
          return this.mapDatabaseMetricsToUsageMetrics(cachedMetrics);
        }
      }
    }

    // Calculate fresh metrics
    return await this.calculateUsageMetrics(organizationId);
  }

  /**
   * Check if an organization can perform an action based on subscription limits
   */
  async canPerformAction(
    organizationId: string,
    resourceType: keyof SubscriptionLimits,
    additionalCount: number = 1
  ): Promise<{ allowed: boolean; reason?: string; currentUsage?: number; limit?: number }> {
    try {
      const metrics = await this.getUsageMetrics(organizationId);
      const subscription = await this.getCurrentSubscription(organizationId);
      const planConfig = getPlanConfig(subscription?.planId || SubscriptionPlan.FREE);

      let currentUsage: number;
      let limit: number;

      switch (resourceType) {
        case 'projects':
          currentUsage = metrics.projects.current;
          limit = planConfig.limits.projects;
          break;
        case 'teamMembers':
          currentUsage = metrics.teamMembers.current;
          limit = planConfig.limits.teamMembers;
          break;
        case 'installations':
          currentUsage = metrics.installations.current;
          limit = planConfig.limits.installations;
          break;
        default:
          return { allowed: true };
      }

      // -1 means unlimited
      if (limit === -1) {
        return { allowed: true, currentUsage, limit };
      }

      const wouldExceed = (currentUsage + additionalCount) > limit;
      
      return {
        allowed: !wouldExceed,
        reason: wouldExceed ? `This action would exceed your ${resourceType} limit of ${limit}` : undefined,
        currentUsage,
        limit
      };
    } catch (error) {
      console.error('Error checking action permission:', error);
      // Allow action if we can't determine limits (fail open)
      return { allowed: true };
    }
  }

  /**
   * Check if a feature is enabled for an organization
   */
  async isFeatureAvailable(
    organizationId: string,
    feature: keyof SubscriptionFeatures
  ): Promise<{ available: boolean; reason?: string; planRequired?: SubscriptionPlan }> {
    try {
      const subscription = await this.getCurrentSubscription(organizationId);
      const currentPlan = subscription?.planId || SubscriptionPlan.FREE;
      
      const isEnabled = isFeatureEnabled(currentPlan, feature);
      
      if (isEnabled) {
        return { available: true };
      }

      // Find the minimum plan that includes this feature
      let planRequired: SubscriptionPlan | undefined;
      const planOrder = [SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE];
      
      for (const plan of planOrder) {
        if (isFeatureEnabled(plan, feature)) {
          planRequired = plan;
          break;
        }
      }

      return {
        available: false,
        reason: `This feature requires a ${planRequired || 'higher'} plan`,
        planRequired
      };
    } catch (error) {
      console.error('Error checking feature availability:', error);
      // Allow feature if we can't determine plan (fail open)
      return { available: true };
    }
  }

  /**
   * Record feature usage
   */
  async recordFeatureUsage(organizationId: string, feature: string): Promise<void> {
    try {
      // Check if feature is available
      const featureCheck = await this.isFeatureAvailable(organizationId, feature as keyof SubscriptionFeatures);
      
      if (!featureCheck.available) {
        throw new Error(featureCheck.reason || 'Feature not available');
      }

      // Record usage in usage_history table for analytics
      const { error } = await supabase
        .from('usage_history')
        .insert([{
          organization_id: organizationId,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          metric_name: `feature_${feature}`,
          metric_value: 1,
          metadata: {
            feature,
            timestamp: new Date().toISOString()
          }
        }]);

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error recording feature usage:', error);
      }
    } catch (error) {
      console.error('Error recording feature usage:', error);
      // Don't throw - feature usage recording shouldn't break functionality
    }
  }

  /**
   * Get usage warnings for an organization
   */
  async getUsageWarnings(organizationId: string): Promise<UsageWarning[]> {
    const { data: warnings } = await supabase
      .from('usage_warnings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });

    return warnings?.map(w => ({
      type: w.type as UsageWarningType,
      resource: w.resource_type,
      currentUsage: w.current_usage,
      limit: w.limit_value,
      percentage: w.usage_percentage,
      severity: w.severity as 'info' | 'warning' | 'critical',
      message: w.message,
      actionRequired: w.action_required,
      suggestedAction: w.suggested_action
    })) || [];
  }

  /**
   * Acknowledge a usage warning
   */
  async acknowledgeWarning(organizationId: string, warningId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('usage_warnings')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId
      })
      .eq('id', warningId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to acknowledge warning: ${error.message}`);
    }
  }

  /**
   * Get historical usage data for analytics
   */
  async getUsageHistory(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    metricName?: string
  ): Promise<Array<{ date: string; metric: string; value: number; metadata?: any }>> {
    let query = supabase
      .from('usage_history')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    const { data } = await query;

    return data?.map(row => ({
      date: row.date,
      metric: row.metric_name,
      value: row.metric_value,
      metadata: row.metadata
    })) || [];
  }

  // Private helper methods

  private async getCurrentSubscription(organizationId: string) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  private async getProjectsCount(organizationId: string): Promise<number> {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return count || 0;
  }

  private async getTeamMembersCount(organizationId: string): Promise<number> {
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return count || 0;
  }

  private async getInstallationsCount(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    const { count } = await supabase
      .from('installations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return count || 0;
  }

  private async getStorageUsage(organizationId: string): Promise<number> {
    // Placeholder - would need actual storage calculation
    // This could sum up file sizes from uploads, reports, etc.
    return 0;
  }

  private async getApiRequestsCount(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    // Placeholder - would track API requests if API functionality is implemented
    return 0;
  }

  private async getFeatureUsage(organizationId: string): Promise<Record<string, FeatureUsage>> {
    const { data: usageData } = await supabase
      .from('usage_history')
      .select('*')
      .eq('organization_id', organizationId)
      .like('metric_name', 'feature_%')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 30 days

    const features: Record<string, FeatureUsage> = {};
    
    if (usageData) {
      for (const usage of usageData) {
        const featureName = usage.metric_name.replace('feature_', '');
        if (!features[featureName]) {
          features[featureName] = {
            enabled: true,
            used: false,
            usageCount: 0
          };
        }
        features[featureName].used = true;
        features[featureName].usageCount += usage.metric_value;
        features[featureName].lastUsed = usage.created_at;
      }
    }

    return features;
  }

  private calculateResourceUsage(current: number, limit: number): ResourceUsage {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);

    return {
      current,
      limit: isUnlimited ? -1 : limit,
      percentage,
      isUnlimited
    };
  }

  private generateUsageWarnings(
    organizationId: string,
    usage: {
      projects: ResourceUsage;
      teamMembers: ResourceUsage;
      installations: ResourceUsage;
      storage: ResourceUsage;
      apiRequests: ResourceUsage;
    }
  ): UsageWarning[] {
    const warnings: UsageWarning[] = [];

    // Check each resource against thresholds
    Object.entries(usage).forEach(([resourceType, resourceUsage]) => {
      if (resourceUsage.isUnlimited) return;

      let severity: 'info' | 'warning' | 'critical';
      let warningType: UsageWarningType;
      let message: string;
      let actionRequired: boolean;
      let suggestedAction: string;

      if (resourceUsage.percentage >= this.CRITICAL_THRESHOLD) {
        severity = 'critical';
        warningType = resourceUsage.percentage >= 100 ? UsageWarningType.LIMIT_EXCEEDED : UsageWarningType.APPROACHING_LIMIT;
        actionRequired = true;
        message = `You have ${resourceUsage.percentage >= 100 ? 'exceeded' : 'nearly reached'} your ${resourceType} limit`;
        suggestedAction = 'Upgrade to a higher plan to increase your limits';
      } else if (resourceUsage.percentage >= this.WARNING_THRESHOLD) {
        severity = 'warning';
        warningType = UsageWarningType.APPROACHING_LIMIT;
        actionRequired = false;
        message = `You are approaching your ${resourceType} limit (${Math.round(resourceUsage.percentage)}% used)`;
        suggestedAction = 'Consider upgrading your plan if you need more capacity';
      } else {
        return; // No warning needed
      }

      warnings.push({
        type: warningType,
        resource: resourceType,
        currentUsage: resourceUsage.current,
        limit: resourceUsage.limit,
        percentage: resourceUsage.percentage,
        severity,
        message,
        actionRequired,
        suggestedAction
      });
    });

    return warnings;
  }

  private async storeUsageMetrics(metrics: UsageMetrics): Promise<void> {
    const { error } = await supabase
      .from('usage_metrics')
      .upsert([{
        organization_id: metrics.organizationId,
        period_start: metrics.period.start,
        period_end: metrics.period.end,
        projects_count: metrics.projects.current,
        projects_limit: metrics.projects.limit,
        team_members_count: metrics.teamMembers.current,
        team_members_limit: metrics.teamMembers.limit,
        installations_count: metrics.installations.current,
        installations_limit: metrics.installations.limit,
        storage_gb: metrics.storage.currentGB,
        storage_limit_gb: metrics.storage.limitGB,
        api_requests_count: metrics.apiRequests.current,
        api_requests_limit: metrics.apiRequests.limit,
        api_requests_reset_date: metrics.apiRequests.resetDate,
        feature_usage: metrics.features,
        calculated_at: metrics.lastCalculated
      }], {
        onConflict: 'organization_id,period_start'
      });

    if (error) {
      console.error('Error storing usage metrics:', error);
    }

    // Store warnings
    if (metrics.warnings.length > 0) {
      await this.storeUsageWarnings(metrics.organizationId, metrics.warnings);
    }
  }

  private async storeUsageWarnings(organizationId: string, warnings: UsageWarning[]): Promise<void> {
    // Clear existing warnings for this organization
    await supabase
      .from('usage_warnings')
      .delete()
      .eq('organization_id', organizationId)
      .eq('acknowledged', false);

    // Insert new warnings
    if (warnings.length > 0) {
      const warningRecords = warnings.map(warning => ({
        organization_id: organizationId,
        type: warning.type,
        resource_type: warning.resource,
        current_usage: warning.currentUsage,
        limit_value: warning.limit,
        usage_percentage: warning.percentage,
        severity: warning.severity,
        message: warning.message,
        action_required: warning.actionRequired,
        suggested_action: warning.suggestedAction
      }));

      const { error } = await supabase
        .from('usage_warnings')
        .insert(warningRecords);

      if (error) {
        console.error('Error storing usage warnings:', error);
      }
    }
  }

  private mapDatabaseMetricsToUsageMetrics(dbMetrics: any): UsageMetrics {
    return {
      organizationId: dbMetrics.organization_id,
      period: {
        start: dbMetrics.period_start,
        end: dbMetrics.period_end
      },
      projects: {
        current: dbMetrics.projects_count,
        limit: dbMetrics.projects_limit,
        percentage: dbMetrics.projects_limit === -1 ? 0 : (dbMetrics.projects_count / dbMetrics.projects_limit) * 100
      },
      teamMembers: {
        current: dbMetrics.team_members_count,
        limit: dbMetrics.team_members_limit,
        percentage: dbMetrics.team_members_limit === -1 ? 0 : (dbMetrics.team_members_count / dbMetrics.team_members_limit) * 100
      },
      installations: {
        current: dbMetrics.installations_count,
        limit: dbMetrics.installations_limit,
        percentage: dbMetrics.installations_limit === -1 ? 0 : (dbMetrics.installations_count / dbMetrics.installations_limit) * 100
      },
      storage: {
        currentGB: dbMetrics.storage_gb,
        limitGB: dbMetrics.storage_limit_gb,
        percentage: dbMetrics.storage_limit_gb === -1 ? 0 : (dbMetrics.storage_gb / dbMetrics.storage_limit_gb) * 100
      },
      apiRequests: {
        current: dbMetrics.api_requests_count,
        limit: dbMetrics.api_requests_limit,
        percentage: dbMetrics.api_requests_limit === -1 ? 0 : (dbMetrics.api_requests_count / dbMetrics.api_requests_limit) * 100,
        resetDate: dbMetrics.api_requests_reset_date
      },
      features: dbMetrics.feature_usage || {},
      warnings: [], // These would be loaded separately
      lastCalculated: dbMetrics.calculated_at
    };
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();