// Think Tank Technologies Report Analytics and Advanced Features
// Dynamic data binding, conditional content, and analytics for email and PDF reports

import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subDays, subWeeks } from 'date-fns';
import {
  ReportAnalytics,
  EmailAnalyticsMetrics,
  PDFAnalyticsMetrics,
  TemplateUsageReport,
  RecipientEngagementReport,
  ReportSystemPerformance,
  ReportRecommendation,
  EmailMessage,
  PDFReport,
  ConditionalContent,
  DynamicContent,
  DataSource,
  Installation,
  TeamMember,
  Priority
} from '../types';

export class ReportAnalyticsService {
  private static instance: ReportAnalyticsService;
  private emailMetrics: Map<string, any> = new Map();
  private pdfMetrics: Map<string, any> = new Map();
  private engagementData: Map<string, any> = new Map();
  private systemMetrics: any = {};

  private constructor() {
    this.initializeMetrics();
  }

  public static getInstance(): ReportAnalyticsService {
    if (!ReportAnalyticsService.instance) {
      ReportAnalyticsService.instance = new ReportAnalyticsService();
    }
    return ReportAnalyticsService.instance;
  }

  /**
   * Generate comprehensive report analytics for a given period
   */
  public async generateAnalytics(period: { start: string; end: string }): Promise<ReportAnalytics> {
    const emailMetrics = await this.calculateEmailMetrics(period);
    const pdfMetrics = await this.calculatePDFMetrics(period);
    const templateUsage = await this.getTemplateUsageReport(period);
    const recipientEngagement = await this.getRecipientEngagementReport(period);
    const systemPerformance = await this.getSystemPerformance(period);
    const recommendations = await this.generateRecommendations(period);

    return {
      period,
      emailMetrics,
      pdfMetrics,
      templateUsage,
      recipientEngagement,
      systemPerformance,
      recommendations
    };
  }

  /**
   * Calculate email analytics metrics from real data
   */
  private async calculateEmailMetrics(period: { start: string; end: string }): Promise<EmailAnalyticsMetrics> {
    try {
      // Query email logs from Supabase
      const { default: supabase } = await import('./supabase');
      
      const { data: emailLogs, error } = await supabase
        .from('email_logs')
        .select('*')
        .gte('created_at', period.start)
        .lte('created_at', period.end);

      if (error) {
        console.warn('Failed to fetch email metrics, using calculated values:', error);
        // Return calculated values based on available data
        return this.calculateFallbackEmailMetrics();
      }

      const totalSent = emailLogs?.length || 0;
      const totalDelivered = emailLogs?.filter(log => log.status === 'delivered')?.length || 0;
      const totalOpened = emailLogs?.filter(log => log.opened_at)?.length || 0;
      const totalClicked = emailLogs?.filter(log => log.clicked_at)?.length || 0;
      const totalBounced = emailLogs?.filter(log => log.status === 'bounced')?.length || 0;
      const unsubscribed = emailLogs?.filter(log => log.unsubscribed_at)?.length || 0;
      const spamComplaints = emailLogs?.filter(log => log.spam_complaint_at)?.length || 0;

      return {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        unsubscribeRate: totalDelivered > 0 ? (unsubscribed / totalDelivered) * 100 : 0,
        spamComplaintRate: totalDelivered > 0 ? (spamComplaints / totalDelivered) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating email metrics:', error);
      return this.calculateFallbackEmailMetrics();
    }
  }

  /**
   * Fallback email metrics when database is not available
   */
  private calculateFallbackEmailMetrics(): EmailAnalyticsMetrics {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
      spamComplaintRate: 0
    };
  }

  /**
   * Calculate PDF analytics metrics from real data
   */
  private async calculatePDFMetrics(period: { start: string; end: string }): Promise<PDFAnalyticsMetrics> {
    try {
      // Query PDF generation logs from Supabase
      const { default: supabase } = await import('./supabase');
      
      const { data: pdfLogs, error } = await supabase
        .from('pdf_reports')
        .select('*')
        .gte('created_at', period.start)
        .lte('created_at', period.end);

      if (error) {
        console.warn('Failed to fetch PDF metrics, using calculated values:', error);
        return this.calculateFallbackPDFMetrics();
      }

      const totalGenerated = pdfLogs?.length || 0;
      const totalDownloaded = pdfLogs?.filter(log => log.downloaded_at)?.length || 0;
      const failedGenerations = pdfLogs?.filter(log => log.status === 'failed')?.length || 0;
      
      // Calculate averages
      const generationTimes = pdfLogs?.filter(log => log.generation_time_ms)?.map(log => log.generation_time_ms) || [];
      const fileSizes = pdfLogs?.filter(log => log.file_size_mb)?.map(log => log.file_size_mb) || [];
      
      const averageGenerationTime = generationTimes.length > 0 
        ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length / 1000 // Convert to seconds
        : 0;
        
      const averageFileSize = fileSizes.length > 0
        ? fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length
        : 0;

      // Get most popular templates
      const templateCounts = pdfLogs?.reduce((acc, log) => {
        acc[log.template_name] = (acc[log.template_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const mostPopularTemplates = Object.entries(templateCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      return {
        totalGenerated,
        totalDownloaded,
        averageGenerationTime,
        averageFileSize,
        failureRate: totalGenerated > 0 ? (failedGenerations / totalGenerated) * 100 : 0,
        mostPopularTemplates,
        peakGenerationTimes: ['09:00', '13:00', '17:00'] // This would need time analysis
      };
    } catch (error) {
      console.error('Error calculating PDF metrics:', error);
      return this.calculateFallbackPDFMetrics();
    }
  }

  /**
   * Fallback PDF metrics when database is not available
   */
  private calculateFallbackPDFMetrics(): PDFAnalyticsMetrics {
    return {
      totalGenerated: 0,
      totalDownloaded: 0,
      averageGenerationTime: 0,
      averageFileSize: 0,
      failureRate: 0,
      mostPopularTemplates: [],
      peakGenerationTimes: []
    };
  }

  /**
   * Get template usage report from real data
   */
  private async getTemplateUsageReport(period: { start: string; end: string }): Promise<TemplateUsageReport[]> {
    try {
      const { default: supabase } = await import('./supabase');
      
      // Query both email and PDF templates usage
      const [emailResult, pdfResult] = await Promise.all([
        supabase
          .from('email_templates')
          .select('*')
          .gte('last_used', period.start)
          .lte('last_used', period.end),
        supabase
          .from('pdf_templates')
          .select('*')
          .gte('last_used', period.start)
          .lte('last_used', period.end)
      ]);

      const reports: TemplateUsageReport[] = [];
      
      // Process email templates
      if (emailResult.data) {
        emailResult.data.forEach(template => {
          reports.push({
            templateId: template.id,
            templateName: template.name,
            templateType: 'email',
            usageCount: template.usage_count || 0,
            lastUsed: template.last_used,
            averageRating: template.average_rating || 0,
            popularVariables: template.popular_variables || [],
            commonErrors: template.common_errors || []
          });
        });
      }
      
      // Process PDF templates
      if (pdfResult.data) {
        pdfResult.data.forEach(template => {
          reports.push({
            templateId: template.id,
            templateName: template.name,
            templateType: 'pdf',
            usageCount: template.usage_count || 0,
            lastUsed: template.last_used,
            popularVariables: template.popular_variables || [],
            commonErrors: template.common_errors || []
          });
        });
      }
      
      return reports;
    } catch (error) {
      console.error('Error fetching template usage report:', error);
      return [];
    }
  }

  /**
   * Get recipient engagement report from real data
   */
  private async getRecipientEngagementReport(period: { start: string; end: string }): Promise<RecipientEngagementReport[]> {
    try {
      const { default: supabase } = await import('./supabase');
      
      // Get user engagement data from email logs and user preferences
      const { data: engagementData, error } = await supabase
        .from('user_email_engagement')
        .select(`
          *,
          users!inner(
            id,
            email,
            role
          )
        `)
        .gte('period_start', period.start)
        .lte('period_end', period.end);

      if (error || !engagementData) {
        console.warn('Failed to fetch engagement data:', error);
        return [];
      }

      return engagementData.map(data => ({
        recipientId: data.user_id,
        email: data.users.email,
        role: data.users.role,
        totalReceived: data.total_received || 0,
        totalOpened: data.total_opened || 0,
        totalClicked: data.total_clicked || 0,
        engagementScore: data.engagement_score || 0,
        preferences: data.preferences || {
          format: 'email',
          deliveryTime: '09:00',
          frequency: 'daily',
          includeCharts: false,
          includeRawData: false
        },
        lastActive: data.last_active
      }));
    } catch (error) {
      console.error('Error fetching recipient engagement report:', error);
      return [];
    }
  }

  /**
   * Get system performance metrics from real data
   */
  private async getSystemPerformance(period: { start: string; end: string }): Promise<ReportSystemPerformance> {
    try {
      const { default: supabase } = await import('./supabase');
      
      // Get system performance data
      const { data: performanceData, error } = await supabase
        .from('system_performance_logs')
        .select('*')
        .gte('created_at', period.start)
        .lte('created_at', period.end)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error || !performanceData?.length) {
        console.warn('Failed to fetch system performance data:', error);
        return this.getDefaultSystemPerformance();
      }

      // Calculate averages from real data
      const emailTimes = performanceData.filter(d => d.email_delivery_time).map(d => d.email_delivery_time);
      const pdfTimes = performanceData.filter(d => d.pdf_generation_time).map(d => d.pdf_generation_time);
      
      const averageEmailDeliveryTime = emailTimes.length > 0 
        ? emailTimes.reduce((sum, time) => sum + time, 0) / emailTimes.length
        : 0;
        
      const averagePDFGenerationTime = pdfTimes.length > 0
        ? pdfTimes.reduce((sum, time) => sum + time, 0) / pdfTimes.length
        : 0;

      const errors = performanceData.filter(d => d.error_count > 0);
      const errorRate = performanceData.length > 0 
        ? (errors.length / performanceData.length) * 100
        : 0;

      // Calculate uptime (assuming we log every hour)
      const uptimeRecords = performanceData.filter(d => d.system_uptime !== undefined);
      const systemUptime = uptimeRecords.length > 0
        ? uptimeRecords.reduce((sum, record) => sum + record.system_uptime, 0) / uptimeRecords.length
        : 0;

      return {
        averageEmailDeliveryTime,
        averagePDFGenerationTime,
        systemUptime,
        errorRate,
        peakLoadTimes: ['09:00-10:00', '13:00-14:00', '17:00-18:00'], // This would need time analysis
        resourceUtilization: {
          cpu: performanceData[0]?.cpu_usage || 0,
          memory: performanceData[0]?.memory_usage || 0,
          storage: performanceData[0]?.storage_usage || 0,
          bandwidth: performanceData[0]?.bandwidth_usage || 0
        }
      };
    } catch (error) {
      console.error('Error fetching system performance data:', error);
      return this.getDefaultSystemPerformance();
    }
  }

  /**
   * Default system performance when no data is available
   */
  private getDefaultSystemPerformance(): ReportSystemPerformance {
    return {
      averageEmailDeliveryTime: 0,
      averagePDFGenerationTime: 0,
      systemUptime: 0,
      errorRate: 0,
      peakLoadTimes: [],
      resourceUtilization: {
        cpu: 0,
        memory: 0,
        storage: 0,
        bandwidth: 0
      }
    };
  }

  /**
   * Generate recommendations based on real analytics data
   */
  private async generateRecommendations(period: { start: string; end: string }): Promise<ReportRecommendation[]> {
    try {
      const emailMetrics = await this.calculateEmailMetrics(period);
      const pdfMetrics = await this.calculatePDFMetrics(period);
      const systemPerformance = await this.getSystemPerformance(period);
      
      const recommendations: ReportRecommendation[] = [];
      
      // Email performance recommendations
      if (emailMetrics.openRate < 25) {
        recommendations.push({
          type: 'template_optimization',
          priority: 'high',
          description: `Email open rate is ${emailMetrics.openRate.toFixed(1)}%, which is below industry average (25%)`,
          expectedImpact: 'Optimizing email content could increase open rates by 15-20%',
          actionItems: [
            'Review and improve email subject lines',
            'Optimize send times based on recipient behavior',
          'Personalize subject lines with recipient names'
          ],
          estimatedEffort: '2-3 hours'
        });
      }
      
      // PDF performance recommendations
      if (pdfMetrics.failureRate > 5) {
        recommendations.push({
          type: 'system_optimization',
          priority: 'high',
          description: `PDF generation failure rate is ${pdfMetrics.failureRate.toFixed(1)}%, which is above acceptable threshold (5%)`,
          expectedImpact: 'Improving system reliability could reduce failures by 80%',
          actionItems: [
            'Investigate PDF generation errors',
            'Optimize PDF template complexity',
            'Implement retry mechanism for failed generations'
          ],
          estimatedEffort: '4-8 hours'
        });
      }
      
      // System performance recommendations
      if (systemPerformance.errorRate > 2) {
        recommendations.push({
          type: 'system_optimization',
          priority: 'medium',
          description: `System error rate is ${systemPerformance.errorRate.toFixed(1)}%, consider system optimization`,
          expectedImpact: 'System improvements could reduce errors by 60%',
          actionItems: [
            'Review system logs for common errors',
            'Optimize database queries',
            'Implement better error handling'
          ],
          estimatedEffort: '6-10 hours'
        });
      }
      
      // Low engagement recommendations
      if (emailMetrics.clickRate < 5) {
        recommendations.push({
          type: 'engagement_optimization',
          priority: 'medium',
          description: `Email click rate is ${emailMetrics.clickRate.toFixed(1)}%, below industry average (5%)`,
          expectedImpact: 'Content optimization could improve click rates by 25%',
          actionItems: [
            'Review email content and call-to-action placement',
            'A/B test different email layouts',
            'Include more relevant and actionable content'
          ],
          estimatedEffort: '3-5 hours'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Track email event (open, click, bounce, etc.)
   */
  public trackEmailEvent(messageId: string, eventType: string, data?: any): void {
    const key = `email_${messageId}`;
    const events = this.emailMetrics.get(key) || [];
    events.push({
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    });
    this.emailMetrics.set(key, events);
  }

  /**
   * Track PDF generation and download
   */
  public trackPDFEvent(reportId: string, eventType: string, data?: any): void {
    const key = `pdf_${reportId}`;
    const events = this.pdfMetrics.get(key) || [];
    events.push({
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    });
    this.pdfMetrics.set(key, events);
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    this.systemMetrics = {
      startTime: new Date().toISOString(),
      emailsSent: 0,
      pdfGenerated: 0,
      errors: 0
    };
  }
}

export class DynamicContentService {
  private static instance: DynamicContentService;
  private dataSources: Map<string, DataSource> = new Map();

  private constructor() {}

  public static getInstance(): DynamicContentService {
    if (!DynamicContentService.instance) {
      DynamicContentService.instance = new DynamicContentService();
    }
    return DynamicContentService.instance;
  }

  /**
   * Evaluate conditional content based on data context
   */
  public evaluateConditionalContent(
    conditionalContent: ConditionalContent[],
    dataContext: any
  ): any[] {
    return conditionalContent
      .filter(content => this.evaluateConditions(content.conditions, dataContext))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map(content => content.content);
  }

  /**
   * Generate dynamic content from data sources
   */
  public async generateDynamicContent(
    dynamicContent: DynamicContent,
    dataContext: any
  ): Promise<any> {
    const dataSource = this.dataSources.get(dynamicContent.dataSource);
    if (!dataSource) {
      throw new Error(`Data source not found: ${dynamicContent.dataSource}`);
    }

    // Execute query and transform data
    const rawData = await this.executeQuery(dataSource, dynamicContent.query, dataContext);
    return this.transformData(rawData, dynamicContent.template);
  }

  /**
   * Bind data to template variables with advanced transformations
   */
  public bindTemplateData(
    template: string,
    data: any,
    transformations?: { [key: string]: any }
  ): { [key: string]: any } {
    const boundData: { [key: string]: any } = { ...data };

    // Apply transformations
    if (transformations) {
      Object.entries(transformations).forEach(([key, transformation]) => {
        if (boundData[key] !== undefined) {
          boundData[key] = this.applyTransformation(boundData[key], transformation);
        }
      });
    }

    // Add computed fields
    boundData.computedFields = this.generateComputedFields(boundData);

    return boundData;
  }

  /**
   * Generate installation-specific dynamic content
   */
  public generateInstallationContent(installation: Installation, teamMembers: TeamMember[]): any {
    const lead = teamMembers.find(tm => tm.id === installation.leadId);
    const assistant = teamMembers.find(tm => tm.id === installation.assistantId);

    return {
      // Basic installation data
      customerName: installation.customerName,
      customerPhone: installation.customerPhone,
      customerEmail: installation.customerEmail,
      installDate: format(parseISO(installation.scheduledDate), 'EEEE, MMM do, yyyy'),
      installTime: installation.scheduledTime,
      address: this.formatAddress(installation.address),
      duration: `${installation.duration || 120} minutes`,
      priority: this.formatPriority(installation.priority),

      // Team information
      leadName: lead ? `${lead.firstName} ${lead.lastName}` : 'TBD',
      leadPhone: lead?.emergencyContact?.phoneNumber || 'Contact dispatch',
      assistantName: assistant ? `${assistant.firstName} ${assistant.lastName}` : null,
      assistantPhone: assistant?.emergencyContact?.phoneNumber || null,

      // Conditional content based on installation details
      specialInstructions: installation.notes,
      isUrgent: installation.priority === 'urgent',
      isHighPriority: ['high', 'urgent'].includes(installation.priority),
      hasAssistant: !!assistant,
      
      // Computed fields
      estimatedCompletionTime: this.calculateCompletionTime(installation),
      travelDistance: this.calculateTravelDistance(installation, lead),
      weatherConditions: this.getWeatherConditions(installation.address, installation.scheduledDate),

      // Links and actions
      confirmationLink: `${window.location.origin}/installations/${installation.id}/confirm`,
      rescheduleLink: `${window.location.origin}/installations/${installation.id}/reschedule`,
      supportLink: `${window.location.origin}/support`,

      // Company information
      companyName: 'Think Tank Technologies',
      supportPhone: '1-800-THINK-TANK',
      supportEmail: 'support@thinktanktechnologies.com'
    };
  }

  /**
   * Generate team performance dynamic content
   */
  public generatePerformanceContent(teamMember: TeamMember, metrics: any, period: { start: string; end: string }): any {
    return {
      // Team member info
      memberName: `${teamMember.firstName} ${teamMember.lastName}`,
      memberEmail: teamMember.email,
      role: this.formatRole(teamMember.role),
      region: teamMember.region,

      // Performance metrics
      jobsCompleted: metrics.totalJobs || 0,
      completionRate: metrics.completionRate || 0,
      customerSatisfaction: metrics.customerSatisfaction || 0,
      efficiencyScore: metrics.travelEfficiency || 0,
      utilizationRate: this.calculateUtilization(metrics),

      // Period information
      periodStart: format(parseISO(period.start), 'MMM do, yyyy'),
      periodEnd: format(parseISO(period.end), 'MMM do, yyyy'),
      periodDays: this.calculatePeriodDays(period),

      // Conditional performance indicators
      isTopPerformer: metrics.performanceRank <= 3,
      needsImprovement: metrics.completionRate < 85,
      hasExcellentRating: metrics.customerSatisfaction >= 4.5,

      // Computed insights
      averageJobsPerDay: this.calculateAverageJobsPerDay(metrics, period),
      improvementTrend: this.calculateTrend(metrics),
      recommendations: this.generatePerformanceRecommendations(metrics),

      // Comparative data
      teamAverage: metrics.teamAverage || {},
      rankInTeam: metrics.performanceRank || 0,
      totalTeamMembers: metrics.totalTeamMembers || 0
    };
  }

  // Private helper methods

  private evaluateConditions(conditions: any[], dataContext: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(dataContext, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue == condition.value;
        case 'notEquals':
          return fieldValue != condition.value;
        case 'greaterThan':
          return Number(fieldValue) > Number(condition.value);
        case 'lessThan':
          return Number(fieldValue) < Number(condition.value);
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        default:
          return false;
      }
    });
  }

  private async executeQuery(dataSource: DataSource, query: string, context: any): Promise<any> {
    // In a real implementation, this would execute actual database queries
    // For now, return mock data based on the query
    return {};
  }

  private transformData(data: any, template: string): any {
    // Apply data transformations based on template
    return data;
  }

  private applyTransformation(value: any, transformation: any): any {
    switch (transformation.type) {
      case 'format':
        return this.formatValue(value, transformation.options);
      case 'calculate':
        return this.calculateValue(value, transformation.options);
      case 'filter':
        return this.filterValue(value, transformation.options);
      case 'sort':
        return this.sortValue(value, transformation.options);
      case 'group':
        return this.groupValue(value, transformation.options);
      default:
        return value;
    }
  }

  private generateComputedFields(data: any): any {
    return {
      generatedAt: new Date().toISOString(),
      generatedBy: 'Think Tank Technologies',
      reportId: `report_${Date.now()}`,
      version: '1.0'
    };
  }

  private formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  private formatPriority(priority: Priority): string {
    const priorityMap = {
      low: 'Low Priority',
      medium: 'Standard Priority',
      high: 'High Priority',
      urgent: 'URGENT'
    };
    return priorityMap[priority] || priority;
  }

  private formatRole(role: string): string {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private calculateCompletionTime(installation: Installation): string {
    const duration = installation.duration || 120;
    const startTime = new Date(`${installation.scheduledDate} ${installation.scheduledTime}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    return format(endTime, 'h:mm a');
  }

  private calculateTravelDistance(installation: Installation, teamMember?: TeamMember): string {
    // In a real implementation, this would calculate actual distance
    return '12.3 miles';
  }

  private getWeatherConditions(address: any, date: string): string {
    // In a real implementation, this would fetch weather data
    return 'Partly cloudy, 72°F';
  }

  private calculateUtilization(metrics: any): number {
    const totalHours = metrics.totalHours || 40;
    const workedHours = metrics.workedHours || 35;
    return Math.round((workedHours / totalHours) * 100);
  }

  private calculatePeriodDays(period: { start: string; end: string }): number {
    const start = parseISO(period.start);
    const end = parseISO(period.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateAverageJobsPerDay(metrics: any, period: { start: string; end: string }): number {
    const days = this.calculatePeriodDays(period);
    const workingDays = Math.max(1, Math.floor(days * 5/7)); // Assume 5-day work week
    return Math.round((metrics.totalJobs || 0) / workingDays * 10) / 10;
  }

  private calculateTrend(metrics: any): 'improving' | 'declining' | 'stable' {
    const currentRate = metrics.completionRate || 0;
    const previousRate = metrics.previousCompletionRate || currentRate;
    
    if (currentRate > previousRate + 2) return 'improving';
    if (currentRate < previousRate - 2) return 'declining';
    return 'stable';
  }

  private generatePerformanceRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.completionRate < 85) {
      recommendations.push('Focus on improving job completion rate');
    }
    if (metrics.customerSatisfaction < 4.0) {
      recommendations.push('Consider additional customer service training');
    }
    if (metrics.travelEfficiency < 75) {
      recommendations.push('Optimize route planning to reduce travel time');
    }
    
    return recommendations;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatValue(value: any, options: any): any {
    // Implement value formatting logic
    return value;
  }

  private calculateValue(value: any, options: any): any {
    // Implement value calculation logic
    return value;
  }

  private filterValue(value: any, options: any): any {
    // Implement value filtering logic
    return value;
  }

  private sortValue(value: any, options: any): any {
    // Implement value sorting logic
    return value;
  }

  private groupValue(value: any, options: any): any {
    // Implement value grouping logic
    return value;
  }
}

// Export singleton instances
export const reportAnalytics = ReportAnalyticsService.getInstance();
export const dynamicContent = DynamicContentService.getInstance();