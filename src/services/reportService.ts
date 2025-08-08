// Think Tank Technologies - Report Service
// Handles PDF generation and email distribution

import { supabase } from './supabase';
import type { 
  PDFTemplate,
  EmailTemplate,
  ReportRequest,
  ReportStatus,
  ScheduledReport
} from '../types';

export class ReportService {
  /**
   * Get all PDF templates
   */
  static async getPDFTemplates(): Promise<PDFTemplate[]> {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch PDF templates: ${error.message}`);
    }

    return data.map(this.transformPDFTemplate);
  }

  /**
   * Get all email templates
   */
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch email templates: ${error.message}`);
    }

    return data.map(this.transformEmailTemplate);
  }

  /**
   * Generate a PDF report
   */
  static async generatePDFReport(request: {
    templateId: string;
    name: string;
    variables: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const { data, error } = await supabase
      .from('pdf_reports')
      .insert([{
        template_id: request.templateId,
        name: request.name,
        generated_by: 'current_user', // This should be set from auth context
        status: 'queued' as ReportStatus,
        variables: request.variables,
        metadata: request.metadata || {},
        generated_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to queue PDF generation: ${error.message}`);
    }

    // In a real implementation, this would trigger a background job
    // For now, we'll simulate successful generation
    setTimeout(async () => {
      await supabase
        .from('pdf_reports')
        .update({
          status: 'completed',
          file_url: `https://storage.supabase.co/reports/${data.id}.pdf`,
          file_path: `/reports/${data.id}.pdf`,
          file_size: 1024 * 1024, // 1MB mock size
          page_count: 5
        })
        .eq('id', data.id);
    }, 2000);

    return data.id;
  }

  /**
   * Get PDF report status
   */
  static async getPDFReportStatus(reportId: string): Promise<{
    id: string;
    status: ReportStatus;
    fileUrl: string | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from('pdf_reports')
      .select('id, status, file_url, error')
      .eq('id', reportId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch report status: ${error.message}`);
    }

    return {
      id: data.id,
      status: data.status,
      fileUrl: data.file_url,
      error: data.error
    };
  }

  /**
   * Get recent PDF reports
   */
  static async getRecentPDFReports(limit: number = 10): Promise<Array<{
    id: string;
    name: string;
    status: ReportStatus;
    generatedAt: string;
    fileUrl: string | null;
    templateName: string;
  }>> {
    const { data, error } = await supabase
      .from('pdf_reports')
      .select(`
        id,
        name,
        status,
        generated_at,
        file_url,
        pdf_templates!inner (name)
      `)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent reports: ${error.message}`);
    }

    return data.map(report => ({
      id: report.id,
      name: report.name,
      status: report.status,
      generatedAt: report.generated_at,
      fileUrl: report.file_url,
      templateName: report.pdf_templates.name
    }));
  }

  /**
   * Send email report
   */
  static async sendEmailReport(request: {
    templateId: string;
    toAddresses: string[];
    ccAddresses?: string[];
    variables: Record<string, any>;
    attachments?: Array<{
      name: string;
      url: string;
    }>;
    scheduledAt?: string;
  }): Promise<string> {
    const template = await this.getEmailTemplate(request.templateId);
    if (!template) {
      throw new Error('Email template not found');
    }

    // Replace variables in subject and body
    const subject = this.replaceVariables(template.subject, request.variables);
    const bodyHtml = this.replaceVariables(template.bodyHtml, request.variables);
    const bodyPlain = this.replaceVariables(template.bodyPlain, request.variables);

    const { data, error } = await supabase
      .from('email_messages')
      .insert([{
        template_id: request.templateId,
        to_addresses: request.toAddresses,
        cc_addresses: request.ccAddresses || [],
        from_address: 'noreply@thinktanktech.com',
        subject: subject,
        body_html: bodyHtml,
        body_plain: bodyPlain,
        attachments: request.attachments || [],
        scheduled_at: request.scheduledAt || new Date().toISOString(),
        status: 'queued',
        variables: request.variables,
        priority: 'medium'
      }])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to queue email: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get scheduled reports
   */
  static async getScheduledReports(): Promise<ScheduledReport[]> {
    const { data, error } = await supabase
      .from('report_schedules')
      .select(`
        id,
        name,
        cron_expression,
        timezone,
        recipients,
        variables,
        is_active,
        last_run,
        next_run,
        pdf_templates (name, type),
        email_templates (name, type)
      `)
      .eq('is_active', true)
      .order('next_run');

    if (error) {
      throw new Error(`Failed to fetch scheduled reports: ${error.message}`);
    }

    return data.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      cronExpression: schedule.cron_expression,
      timezone: schedule.timezone,
      recipients: schedule.recipients,
      variables: schedule.variables,
      isActive: schedule.is_active,
      lastRun: schedule.last_run,
      nextRun: schedule.next_run,
      templateName: schedule.pdf_templates?.name || schedule.email_templates?.name || 'Unknown',
      templateType: schedule.pdf_templates?.type || schedule.email_templates?.type || 'unknown'
    }));
  }

  /**
   * Create scheduled report
   */
  static async createScheduledReport(request: {
    name: string;
    templateId: string;
    templateType: 'pdf' | 'email';
    cronExpression: string;
    timezone: string;
    recipients: string[];
    variables: Record<string, any>;
  }): Promise<string> {
    const nextRun = this.calculateNextRun(request.cronExpression, request.timezone);

    const { data, error } = await supabase
      .from('report_schedules')
      .insert([{
        name: request.name,
        template_id: request.templateType === 'pdf' ? request.templateId : null,
        email_template_id: request.templateType === 'email' ? request.templateId : null,
        template_type: request.templateType,
        cron_expression: request.cronExpression,
        timezone: request.timezone,
        recipients: request.recipients,
        variables: request.variables,
        is_active: true,
        next_run: nextRun,
        created_by: 'current_user' // This should be set from auth context
      }])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create scheduled report: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Generate common reports with predefined templates and data
   */
  static async generateScheduleReport(dateRange: { start: string; end: string }): Promise<string> {
    // This would fetch installation and assignment data for the date range
    const variables = {
      dateRange,
      generatedAt: new Date().toISOString(),
      generatedBy: 'current_user'
    };

    return await this.generatePDFReport({
      templateId: 'schedule-template-id', // This would be a real template ID
      name: `Schedule Report - ${dateRange.start} to ${dateRange.end}`,
      variables
    });
  }

  static async generatePerformanceReport(period: 'week' | 'month' | 'quarter'): Promise<string> {
    const variables = {
      period,
      generatedAt: new Date().toISOString(),
      generatedBy: 'current_user'
    };

    return await this.generatePDFReport({
      templateId: 'performance-template-id', // This would be a real template ID
      name: `Performance Report - ${period}`,
      variables
    });
  }

  static async generateAnalyticsReport(): Promise<string> {
    const variables = {
      generatedAt: new Date().toISOString(),
      generatedBy: 'current_user'
    };

    return await this.generatePDFReport({
      templateId: 'analytics-template-id', // This would be a real template ID
      name: `Analytics Dashboard - ${new Date().toISOString().split('T')[0]}`,
      variables
    });
  }

  /**
   * Helper methods
   */
  private static async getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      return null;
    }

    return this.transformEmailTemplate(data);
  }

  private static replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      result = result.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return result;
  }

  private static calculateNextRun(cronExpression: string, timezone: string): string {
    // This is a simplified implementation - in production you'd use a proper cron parser
    const now = new Date();
    const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to tomorrow
    return nextRun.toISOString();
  }

  private static transformPDFTemplate(data: any): PDFTemplate {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      layout: data.layout,
      components: data.components,
      variables: data.variables,
      styling: data.styling,
      isActive: data.is_active,
      version: data.version,
      metadata: data.metadata,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static transformEmailTemplate(data: any): EmailTemplate {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject,
      bodyHtml: data.body_html,
      bodyPlain: data.body_plain,
      variables: data.variables,
      targetAudience: data.target_audience,
      isActive: data.is_active,
      version: data.version,
      metadata: data.metadata,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export default ReportService;