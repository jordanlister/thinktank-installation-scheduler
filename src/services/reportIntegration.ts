// Think Tank Technologies Report Integration Service
// Seamless integration with existing systems for automated report generation

import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import {
  Installation,
  TeamMember,
  Assignment,
  SchedulingResult,
  OptimizedAssignment,
  TeamAnalytics,
  SchedulingAnalytics,
  EmailMessage,
  PDFReport,
  ReportSchedule,
  IntegrationData,
  User,
  UserRole
} from '../types';
import { emailGenerator } from './emailGenerator';
import { pdfGenerator } from './pdfGenerator';
import { reportAnalytics, dynamicContent } from './reportAnalytics';

export class ReportIntegrationService {
  private static instance: ReportIntegrationService;
  private integrationListeners: Map<string, Array<(data: IntegrationData) => void>> = new Map();
  private scheduledReports: Map<string, ReportSchedule> = new Map();

  private constructor() {
    this.initializeIntegrationPoints();
  }

  public static getInstance(): ReportIntegrationService {
    if (!ReportIntegrationService.instance) {
      ReportIntegrationService.instance = new ReportIntegrationService();
    }
    return ReportIntegrationService.instance;
  }

  /**
   * Initialize integration points with existing systems
   */
  private initializeIntegrationPoints(): void {
    // Set up listeners for various system events
    this.setupSchedulingIntegration();
    this.setupTeamManagementIntegration();
    this.setupGeographicRoutingIntegration();
    this.setupDataProcessorIntegration();
  }

  /**
   * Set up scheduling system integration
   */
  private setupSchedulingIntegration(): void {
    // Listen for scheduling events and trigger appropriate reports
    this.addIntegrationListener('scheduling_completed', async (data) => {
      await this.handleSchedulingCompleted(data);
    });

    this.addIntegrationListener('assignment_created', async (data) => {
      await this.handleAssignmentCreated(data);
    });

    this.addIntegrationListener('assignment_updated', async (data) => {
      await this.handleAssignmentUpdated(data);
    });
  }

  /**
   * Set up team management integration
   */
  private setupTeamManagementIntegration(): void {
    this.addIntegrationListener('team_performance_calculated', async (data) => {
      await this.handleTeamPerformanceUpdate(data);
    });

    this.addIntegrationListener('team_member_added', async (data) => {
      await this.handleTeamMemberAdded(data);
    });

    this.addIntegrationListener('availability_updated', async (data) => {
      await this.handleAvailabilityUpdated(data);
    });
  }

  /**
   * Set up geographic routing integration
   */
  private setupGeographicRoutingIntegration(): void {
    this.addIntegrationListener('routes_optimized', async (data) => {
      await this.handleRoutesOptimized(data);
    });

    this.addIntegrationListener('travel_analysis_completed', async (data) => {
      await this.handleTravelAnalysisCompleted(data);
    });
  }

  /**
   * Set up data processor integration
   */
  private setupDataProcessorIntegration(): void {
    this.addIntegrationListener('data_imported', async (data) => {
      await this.handleDataImported(data);
    });

    this.addIntegrationListener('validation_completed', async (data) => {
      await this.handleValidationCompleted(data);
    });
  }

  /**
   * Handle scheduling completion event
   */
  private async handleSchedulingCompleted(data: IntegrationData): Promise<void> {
    try {
      const schedulingResult = data as any as SchedulingResult;
      
      // Generate schedule reports for managers
      await this.generateScheduleReports(schedulingResult);
      
      // Send assignment notifications to team members
      await this.sendAssignmentNotifications(schedulingResult.assignments);
      
      // Generate customer confirmations
      await this.sendCustomerConfirmations(schedulingResult.assignments);
      
      // Create analytics report if it's end of day/week
      await this.checkAndGenerateAnalyticsReports();

    } catch (error) {
      console.error('Error handling scheduling completion:', error);
    }
  }

  /**
   * Handle assignment creation event
   */
  private async handleAssignmentCreated(data: IntegrationData): Promise<void> {
    try {
      const assignment = data as any as Assignment;
      await this.sendSingleAssignmentNotification(assignment);
    } catch (error) {
      console.error('Error handling assignment creation:', error);
    }
  }

  /**
   * Handle assignment update event
   */
  private async handleAssignmentUpdated(data: IntegrationData): Promise<void> {
    try {
      const assignment = data as any as Assignment;
      await this.sendAssignmentUpdateNotification(assignment);
    } catch (error) {
      console.error('Error handling assignment update:', error);
    }
  }

  /**
   * Handle team performance update event
   */
  private async handleTeamPerformanceUpdate(data: IntegrationData): Promise<void> {
    try {
      const teamAnalytics = data as any as TeamAnalytics;
      await this.generatePerformanceReports(teamAnalytics);
    } catch (error) {
      console.error('Error handling team performance update:', error);
    }
  }

  /**
   * Handle new team member addition
   */
  private async handleTeamMemberAdded(data: IntegrationData): Promise<void> {
    try {
      const teamMember = data as any as TeamMember;
      await this.sendWelcomeNotification(teamMember);
    } catch (error) {
      console.error('Error handling team member addition:', error);
    }
  }

  /**
   * Handle availability updates
   */
  private async handleAvailabilityUpdated(data: IntegrationData): Promise<void> {
    try {
      // Check if availability changes affect scheduled assignments
      await this.checkAvailabilityConflicts(data);
    } catch (error) {
      console.error('Error handling availability update:', error);
    }
  }

  /**
   * Handle route optimization completion
   */
  private async handleRoutesOptimized(data: IntegrationData): Promise<void> {
    try {
      const routeData = data as any;
      await this.generateRouteOptimizationReports(routeData);
    } catch (error) {
      console.error('Error handling route optimization:', error);
    }
  }

  /**
   * Handle travel analysis completion
   */
  private async handleTravelAnalysisCompleted(data: IntegrationData): Promise<void> {
    try {
      const travelData = data as any;
      await this.generateTravelAnalysisReports(travelData);
    } catch (error) {
      console.error('Error handling travel analysis:', error);
    }
  }

  /**
   * Handle data import completion
   */
  private async handleDataImported(data: IntegrationData): Promise<void> {
    try {
      await this.generateDataImportSummary(data);
    } catch (error) {
      console.error('Error handling data import:', error);
    }
  }

  /**
   * Handle data validation completion
   */
  private async handleValidationCompleted(data: IntegrationData): Promise<void> {
    try {
      await this.generateValidationReport(data);
    } catch (error) {
      console.error('Error handling validation completion:', error);
    }
  }

  /**
   * Generate schedule reports for managers
   */
  private async generateScheduleReports(schedulingResult: SchedulingResult): Promise<void> {
    const managers = await this.getManagerUsers();
    
    for (const manager of managers) {
      const reportData = this.prepareScheduleReportData(schedulingResult, manager);
      
      // Generate PDF report
      const pdfReport = await pdfGenerator.generateReport(
        await this.getTemplate('installation_schedule', 'pdf'),
        reportData,
        {
          userId: manager.id,
          dataSource: 'installation_scheduler',
          deliveryMethod: 'email'
        }
      );

      // Send email with PDF attachment
      const emailMessage = await emailGenerator.generateEmail(
        'schedule_update',
        {
          id: manager.id,
          email: manager.email,
          name: `${manager.firstName} ${manager.lastName}`,
          role: manager.role
        },
        {
          managerName: `${manager.firstName} ${manager.lastName}`,
          scheduleDate: format(new Date(), 'MMMM do, yyyy'),
          totalJobs: schedulingResult.assignments.length,
          unassignedJobs: schedulingResult.unassignedJobs.length,
          conflicts: schedulingResult.conflicts.length
        },
        {
          attachments: [{
            id: pdfReport.id,
            filename: `${pdfReport.name}.pdf`,
            contentType: 'application/pdf',
            size: pdfReport.fileSize || 0,
            url: pdfReport.fileUrl
          }]
        }
      );

      await emailGenerator.sendEmail(emailMessage);
    }
  }

  /**
   * Send assignment notifications to team members
   */
  private async sendAssignmentNotifications(assignments: OptimizedAssignment[]): Promise<void> {
    for (const assignment of assignments) {
      await this.sendSingleAssignmentNotification(assignment);
    }
  }

  /**
   * Send single assignment notification
   */
  private async sendSingleAssignmentNotification(assignment: Assignment): Promise<void> {
    const installation = await this.getInstallationById(assignment.installationId);
    const teamMember = await this.getTeamMemberById(assignment.leadId);
    const assistant = assignment.assistantId ? (await this.getTeamMemberById(assignment.assistantId)) || undefined : undefined;

    if (!installation || !teamMember) return;

    const emailMessage = await emailGenerator.generateAssignmentNotification(
      assignment,
      installation,
      teamMember,
      assistant
    );

    await emailGenerator.sendEmail(emailMessage);

    // Also send to assistant if assigned
    if (assistant) {
      const assistantEmailMessage = await emailGenerator.generateAssignmentNotification(
        assignment,
        installation,
        assistant,
        teamMember
      );
      await emailGenerator.sendEmail(assistantEmailMessage);
    }
  }

  /**
   * Send customer confirmations
   */
  private async sendCustomerConfirmations(assignments: OptimizedAssignment[]): Promise<void> {
    for (const assignment of assignments) {
      const installation = await this.getInstallationById(assignment.installationId);
      const lead = await this.getTeamMemberById(assignment.leadId);
      const assistant = assignment.assistantId ? (await this.getTeamMemberById(assignment.assistantId)) || undefined : undefined;

      if (!installation || !lead) continue;

      const emailMessage = await emailGenerator.generateCustomerConfirmation(
        installation,
        lead,
        assistant
      );

      await emailGenerator.sendEmail(emailMessage);
    }
  }

  /**
   * Generate performance reports
   */
  private async generatePerformanceReports(teamAnalytics: TeamAnalytics): Promise<void> {
    const managers = await this.getManagerUsers();
    
    for (const manager of managers) {
      const reportData = this.preparePerformanceReportData(teamAnalytics, manager);
      
      // Generate PDF report
      const pdfReport = await pdfGenerator.generateReport(
        await this.getTemplate('team_performance', 'pdf'),
        reportData,
        {
          userId: manager.id,
          dataSource: 'team_management',
          reportPeriod: teamAnalytics.period
        }
      );

      // Send performance email
      const emailMessage = await emailGenerator.generatePerformanceReport(
        manager,
        {
          weekStart: teamAnalytics.period.start,
          completedJobs: teamAnalytics.teamMetrics.totalTeamMembers * 10, // Mock calculation
          utilizationRate: teamAnalytics.teamMetrics.overallUtilization,
          topPerformers: teamAnalytics.individualPerformance
            .sort((a, b) => b.metrics.completionRate - a.metrics.completionRate)
            .slice(0, 3)
            .map(perf => ({
              name: perf.name,
              jobsCompleted: perf.metrics.totalJobs,
              efficiency: perf.metrics.completionRate
            })),
          issues: teamAnalytics.recommendations
            .filter(rec => rec.priority === 'high')
            .map(rec => rec.description)
        },
        pdfReport
      );

      await emailGenerator.sendEmail(emailMessage);
    }
  }

  /**
   * Send welcome notification to new team member
   */
  private async sendWelcomeNotification(teamMember: TeamMember): Promise<void> {
    const welcomeData = dynamicContent.bindTemplateData('welcome_template', {
      memberName: `${teamMember.firstName} ${teamMember.lastName}`,
      role: teamMember.role,
      region: teamMember.region,
      startDate: format(new Date(), 'MMMM do, yyyy'),
      supervisor: await this.getSupervisorName(teamMember.region),
      trainingSchedule: await this.getTrainingSchedule(teamMember.id)
    });

    // This would use a welcome email template
    console.log('Welcome notification would be sent to:', teamMember.email, welcomeData);
  }

  /**
   * Check for availability conflicts with scheduled assignments
   */
  private async checkAvailabilityConflicts(data: IntegrationData): Promise<void> {
    // Check if availability changes create conflicts with scheduled assignments
    // Send notifications to schedulers if conflicts are detected
    const conflicts = await this.detectAvailabilityConflicts(data);
    
    if (conflicts.length > 0) {
      await this.notifySchedulersOfConflicts(conflicts);
    }
  }

  /**
   * Generate route optimization reports
   */
  private async generateRouteOptimizationReports(routeData: any): Promise<void> {
    const schedulers = await this.getSchedulerUsers();
    
    for (const scheduler of schedulers) {
      const reportData = this.prepareRouteOptimizationData(routeData);
      
      const pdfReport = await pdfGenerator.generateReport(
        await this.getTemplate('route_optimization', 'pdf'),
        reportData,
        {
          userId: scheduler.id,
          dataSource: 'geographic_routing'
        }
      );

      console.log(`Route optimization report generated for ${scheduler.email}:`, pdfReport.id);
    }
  }

  /**
   * Generate travel analysis reports
   */
  private async generateTravelAnalysisReports(travelData: any): Promise<void> {
    // Generate comprehensive travel analysis reports
    console.log('Travel analysis report would be generated:', travelData);
  }

  /**
   * Generate data import summary
   */
  private async generateDataImportSummary(data: IntegrationData): Promise<void> {
    const admins = await this.getAdminUsers();
    
    for (const admin of admins) {
      const summaryData = {
        adminName: `${admin.firstName} ${admin.lastName}`,
        importDate: format(new Date(), 'MMMM do, yyyy'),
        recordsProcessed: data.records,
        errors: data.errors?.length || 0,
        source: data.source,
        dataType: data.dataType
      };

      console.log('Data import summary would be sent to:', admin.email, summaryData);
    }
  }

  /**
   * Generate validation report
   */
  private async generateValidationReport(data: IntegrationData): Promise<void> {
    // Generate data validation reports for quality assurance
    console.log('Validation report would be generated:', data);
  }

  /**
   * Check and generate analytics reports based on schedule
   */
  private async checkAndGenerateAnalyticsReports(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Daily reports at 6 PM
    if (currentHour === 18) {
      await this.generateDailyAnalyticsReports();
    }

    // Weekly reports on Sunday at 8 AM
    if (currentDay === 0 && currentHour === 8) {
      await this.generateWeeklyAnalyticsReports();
    }
  }

  /**
   * Generate daily analytics reports
   */
  private async generateDailyAnalyticsReports(): Promise<void> {
    const today = new Date();
    const period = {
      start: startOfDay(today).toISOString(),
      end: endOfDay(today).toISOString()
    };

    const analytics = await reportAnalytics.generateAnalytics(period);
    
    // Send to managers and admins
    const recipients = await this.getManagersAndAdmins();
    
    for (const recipient of recipients) {
      console.log(`Daily analytics report would be sent to: ${recipient.email}`);
    }
  }

  /**
   * Generate weekly analytics reports
   */
  private async generateWeeklyAnalyticsReports(): Promise<void> {
    const today = new Date();
    const period = {
      start: startOfWeek(today).toISOString(),
      end: endOfWeek(today).toISOString()
    };

    const analytics = await reportAnalytics.generateAnalytics(period);
    
    // Generate comprehensive weekly reports
    console.log('Weekly analytics reports would be generated:', analytics);
  }

  /**
   * Add integration event listener
   */
  public addIntegrationListener(eventType: string, handler: (data: IntegrationData) => void): void {
    if (!this.integrationListeners.has(eventType)) {
      this.integrationListeners.set(eventType, []);
    }
    this.integrationListeners.get(eventType)!.push(handler);
  }

  /**
   * Trigger integration event
   */
  public triggerIntegrationEvent(eventType: string, data: IntegrationData): void {
    const handlers = this.integrationListeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in integration handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Schedule recurring reports
   */
  public scheduleRecurringReport(schedule: ReportSchedule): void {
    this.scheduledReports.set(schedule.id, schedule);
    
    // In a real implementation, this would set up actual cron jobs
    console.log(`Scheduled recurring report: ${schedule.name}`, schedule.schedule);
  }

  /**
   * Cancel scheduled report
   */
  public cancelScheduledReport(scheduleId: string): void {
    this.scheduledReports.delete(scheduleId);
    console.log(`Cancelled scheduled report: ${scheduleId}`);
  }

  // Helper methods for data retrieval and preparation

  private async getInstallationById(id: string): Promise<Installation | null> {
    // In a real implementation, this would query the database
    return null;
  }

  private async getTeamMemberById(id: string): Promise<TeamMember | null> {
    // In a real implementation, this would query the database
    return null;
  }

  private async getManagerUsers(): Promise<User[]> {
    // In a real implementation, this would query the database
    return [];
  }

  private async getSchedulerUsers(): Promise<User[]> {
    // In a real implementation, this would query the database
    return [];
  }

  private async getAdminUsers(): Promise<User[]> {
    // In a real implementation, this would query the database
    return [];
  }

  private async getManagersAndAdmins(): Promise<User[]> {
    // In a real implementation, this would query the database
    return [];
  }

  private async getTemplate(type: string, format: 'email' | 'pdf'): Promise<any> {
    // In a real implementation, this would retrieve the template from the service
    return { id: `${format}_${type}`, name: `${type} Template`, type };
  }

  private prepareScheduleReportData(schedulingResult: SchedulingResult, manager: User): any {
    return {
      region: 'All Regions', // Would be determined based on manager's jurisdiction
      dateRange: format(new Date(), 'MMMM do, yyyy'),
      totalInstallations: schedulingResult.assignments.length,
      teamsAssigned: new Set(schedulingResult.assignments.map(a => a.leadId)).size,
      installations: [], // Would be populated from actual data
      teamAssignments: schedulingResult.assignments,
      routeOptimization: schedulingResult.optimizationMetrics
    };
  }

  private preparePerformanceReportData(teamAnalytics: TeamAnalytics, manager: User): any {
    return {
      reportPeriod: `${format(parseISO(teamAnalytics.period.start), 'MMM do')} - ${format(parseISO(teamAnalytics.period.end), 'MMM do, yyyy')}`,
      metrics: teamAnalytics.teamMetrics,
      teamReports: teamAnalytics.individualPerformance,
      chartData: this.prepareChartData(teamAnalytics)
    };
  }

  private prepareRouteOptimizationData(routeData: any): any {
    return {
      date: format(new Date(), 'MMMM do, yyyy'),
      summary: {
        totalRoutes: routeData.totalRoutes || 0,
        totalDistance: routeData.totalDistance || 0,
        totalTime: routeData.totalTime || 0,
        savings: routeData.savings || {}
      },
      routes: routeData.routes || [],
      metrics: routeData.metrics || {}
    };
  }

  private prepareChartData(teamAnalytics: TeamAnalytics): any {
    return {
      performanceChart: teamAnalytics.individualPerformance.map(perf => ({
        name: perf.name,
        performance: perf.metrics.completionRate
      })),
      utilizationChart: teamAnalytics.individualPerformance.map(perf => ({
        name: perf.name,
        utilization: perf.utilizationRate
      }))
    };
  }

  private async getSupervisorName(region: string): Promise<string> {
    // In a real implementation, this would look up the regional supervisor
    return 'Regional Supervisor';
  }

  private async getTrainingSchedule(teamMemberId: string): Promise<any[]> {
    // In a real implementation, this would retrieve the training schedule
    return [];
  }

  private async detectAvailabilityConflicts(data: IntegrationData): Promise<any[]> {
    // In a real implementation, this would detect conflicts
    return [];
  }

  private async notifySchedulersOfConflicts(conflicts: any[]): Promise<void> {
    // In a real implementation, this would notify schedulers
    console.log('Schedulers would be notified of conflicts:', conflicts);
  }
}

// Export singleton instance
export const reportIntegration = ReportIntegrationService.getInstance();