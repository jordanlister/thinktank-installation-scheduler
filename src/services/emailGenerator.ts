// Think Tank Technologies Email Generation and Delivery Service
// Professional email template system with personalized content generation

import Handlebars from 'handlebars';
import { format, parseISO, addDays, isAfter, isBefore } from 'date-fns';
import {
  EmailTemplate,
  EmailMessage,
  EmailStatus,
  EmailTemplateType,
  EmailVariable,
  EmailAttachment,
  EmailDeliveryReceipt,
  Installation,
  TeamMember,
  User,
  Assignment,
  TeamPerformanceReport,
  PDFReport
} from '../types';

// Email configuration and branding
export const EMAIL_CONFIG = {
  FROM_ADDRESS: 'noreply@thinktanktechnologies.com',
  FROM_NAME: 'Think Tank Technologies',
  REPLY_TO: 'support@thinktanktechnologies.com',
  BRANDING: {
    PRIMARY_COLOR: '#1a365d',
    SECONDARY_COLOR: '#2d3748',
    ACCENT_COLOR: '#3182ce',
    LOGO_URL: '/assets/images/think-tank-logo.png',
    FOOTER_TEXT: 'Think Tank Technologies - Professional Installation Services'
  }
};

// Built-in email templates
export const DEFAULT_EMAIL_TEMPLATES: Partial<EmailTemplate>[] = [
  {
    name: 'Installation Assignment Notification',
    type: 'assignment_notification',
    subject: 'New Installation Assignment - {{customerName}} ({{installDate}})',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Think Tank Technologies</h1>
          <h2>Installation Assignment</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f7fafc;">
          <h3>Hello {{teamMemberName}},</h3>
          
          <p>You have been assigned to a new installation:</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #3182ce; margin: 20px 0;">
            <h4>Customer: {{customerName}}</h4>
            <p><strong>Date:</strong> {{installDate}}</p>
            <p><strong>Time:</strong> {{installTime}}</p>
            <p><strong>Address:</strong> {{address}}</p>
            <p><strong>Phone:</strong> {{customerPhone}}</p>
            {{#if partnerName}}
            <p><strong>Partner:</strong> {{partnerName}}</p>
            {{/if}}
          </div>
          
          {{#if specialInstructions}}
          <div style="background-color: #fff3cd; padding: 10px; border: 1px solid #ffc107; margin: 15px 0;">
            <h5>Special Instructions:</h5>
            <p>{{specialInstructions}}</p>
          </div>
          {{/if}}
          
          <p>Please confirm your availability by clicking the link below:</p>
          <a href="{{confirmationLink}}" style="display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirm Assignment</a>
          
          <p>If you cannot make this appointment, please contact dispatch immediately.</p>
          
          <p>Best regards,<br>Think Tank Technologies Team</p>
        </div>
      </div>
    `,
    bodyPlain: `
Hello {{teamMemberName}},

You have been assigned to a new installation:

Customer: {{customerName}}
Date: {{installDate}}
Time: {{installTime}}
Address: {{address}}
Phone: {{customerPhone}}
{{#if partnerName}}Partner: {{partnerName}}{{/if}}

{{#if specialInstructions}}
Special Instructions:
{{specialInstructions}}
{{/if}}

Please confirm your availability: {{confirmationLink}}

If you cannot make this appointment, please contact dispatch immediately.

Best regards,
Think Tank Technologies Team
    `,
    variables: [
      { name: 'teamMemberName', type: 'string', description: 'Name of assigned team member', required: true, example: 'John Smith' },
      { name: 'customerName', type: 'string', description: 'Customer name', required: true, example: 'ABC Corporation' },
      { name: 'installDate', type: 'date', description: 'Installation date', required: true, example: '2024-01-15' },
      { name: 'installTime', type: 'string', description: 'Installation time', required: true, example: '9:00 AM' },
      { name: 'address', type: 'string', description: 'Installation address', required: true, example: '123 Main St, City, ST 12345' },
      { name: 'customerPhone', type: 'string', description: 'Customer phone number', required: true, example: '(555) 123-4567' },
      { name: 'partnerName', type: 'string', description: 'Partner team member name', required: false, example: 'Jane Doe' },
      { name: 'specialInstructions', type: 'string', description: 'Special instructions', required: false, example: 'Use back entrance' },
      { name: 'confirmationLink', type: 'string', description: 'Assignment confirmation link', required: true, example: 'https://app.thinktank.com/confirm/123' }
    ],
    targetAudience: ['lead', 'assistant']
  },
  {
    name: 'Customer Installation Confirmation',
    type: 'customer_confirmation',
    subject: 'Installation Scheduled - {{installDate}} at {{installTime}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Think Tank Technologies</h1>
          <h2>Installation Confirmation</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f7fafc;">
          <h3>Dear {{customerName}},</h3>
          
          <p>Your installation has been scheduled and confirmed. Here are the details:</p>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h4>Installation Details</h4>
            <p><strong>Date:</strong> {{installDate}}</p>
            <p><strong>Time:</strong> {{installTime}}</p>
            <p><strong>Address:</strong> {{address}}</p>
            <p><strong>Estimated Duration:</strong> {{duration}}</p>
            
            <h5>Your Installation Team</h5>
            <p><strong>Lead Technician:</strong> {{leadName}} - {{leadPhone}}</p>
            {{#if assistantName}}
            <p><strong>Assistant:</strong> {{assistantName}} - {{assistantPhone}}</p>
            {{/if}}
          </div>
          
          <div style="background-color: #e6fffa; padding: 15px; border-left: 4px solid #38a169; margin: 20px 0;">
            <h5>What to Expect</h5>
            <ul>
              <li>Our team will arrive within the scheduled time window</li>
              <li>Please ensure the installation area is accessible</li>
              <li>A representative should be present during installation</li>
              <li>Installation typically takes {{duration}}</li>
            </ul>
          </div>
          
          {{#if specialInstructions}}
          <div style="background-color: #fff3cd; padding: 10px; border: 1px solid #ffc107; margin: 15px 0;">
            <h5>Special Notes:</h5>
            <p>{{specialInstructions}}</p>
          </div>
          {{/if}}
          
          <p>If you need to reschedule or have questions, please contact us at {{supportPhone}} or reply to this email.</p>
          
          <p>Thank you for choosing Think Tank Technologies!</p>
        </div>
        
        <div style="background-color: #2d3748; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>Think Tank Technologies - Professional Installation Services</p>
          <p>Phone: {{supportPhone}} | Email: {{supportEmail}}</p>
        </div>
      </div>
    `,
    bodyPlain: `
Dear {{customerName}},

Your installation has been scheduled and confirmed. Here are the details:

INSTALLATION DETAILS
Date: {{installDate}}
Time: {{installTime}}
Address: {{address}}
Estimated Duration: {{duration}}

YOUR INSTALLATION TEAM
Lead Technician: {{leadName}} - {{leadPhone}}
{{#if assistantName}}Assistant: {{assistantName}} - {{assistantPhone}}{{/if}}

WHAT TO EXPECT
- Our team will arrive within the scheduled time window
- Please ensure the installation area is accessible
- A representative should be present during installation
- Installation typically takes {{duration}}

{{#if specialInstructions}}
SPECIAL NOTES:
{{specialInstructions}}
{{/if}}

If you need to reschedule or have questions, please contact us at {{supportPhone}} or reply to this email.

Thank you for choosing Think Tank Technologies!

Think Tank Technologies - Professional Installation Services
Phone: {{supportPhone}} | Email: {{supportEmail}}
    `,
    variables: [
      { name: 'customerName', type: 'string', description: 'Customer name', required: true, example: 'John Smith' },
      { name: 'installDate', type: 'date', description: 'Installation date', required: true, example: '2024-01-15' },
      { name: 'installTime', type: 'string', description: 'Installation time', required: true, example: '9:00 AM - 11:00 AM' },
      { name: 'address', type: 'string', description: 'Installation address', required: true, example: '123 Main St, City, ST 12345' },
      { name: 'duration', type: 'string', description: 'Estimated duration', required: true, example: '2-3 hours' },
      { name: 'leadName', type: 'string', description: 'Lead technician name', required: true, example: 'Mike Johnson' },
      { name: 'leadPhone', type: 'string', description: 'Lead technician phone', required: true, example: '(555) 123-4567' },
      { name: 'assistantName', type: 'string', description: 'Assistant name', required: false, example: 'Sarah Wilson' },
      { name: 'assistantPhone', type: 'string', description: 'Assistant phone', required: false, example: '(555) 987-6543' },
      { name: 'specialInstructions', type: 'string', description: 'Special instructions', required: false, example: 'Please use service entrance' },
      { name: 'supportPhone', type: 'string', description: 'Support phone number', required: true, example: '1-800-THINK-TANK' },
      { name: 'supportEmail', type: 'string', description: 'Support email', required: true, example: 'support@thinktanktechnologies.com' }
    ],
    targetAudience: ['viewer']
  },
  {
    name: 'Weekly Performance Report',
    type: 'performance_report',
    subject: 'Weekly Performance Report - {{weekOf}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Think Tank Technologies</h1>
          <h2>Weekly Performance Report</h2>
          <p>Week of {{weekOf}}</p>
        </div>
        
        <div style="padding: 20px; background-color: #f7fafc;">
          <h3>Hello {{managerName}},</h3>
          
          <p>Here's your team performance summary for the week of {{weekOf}}:</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background-color: white; padding: 15px; border-left: 4px solid #38a169;">
              <h4>Completed Installations</h4>
              <p style="font-size: 24px; font-weight: bold; color: #38a169;">{{completedJobs}}</p>
            </div>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #3182ce;">
              <h4>Team Utilization</h4>
              <p style="font-size: 24px; font-weight: bold; color: #3182ce;">{{utilizationRate}}%</p>
            </div>
          </div>
          
          <div style="background-color: white; padding: 20px; margin: 20px 0;">
            <h4>Top Performers</h4>
            {{#each topPerformers}}
            <div style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
              <strong>{{name}}</strong> - {{jobsCompleted}} jobs completed ({{efficiency}}% efficiency)
            </div>
            {{/each}}
          </div>
          
          {{#if issues}}
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <h5>Issues Requiring Attention:</h5>
            <ul>
              {{#each issues}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}
          
          <p>Full detailed report is attached.</p>
          
          <p>Best regards,<br>Think Tank Technologies Analytics Team</p>
        </div>
      </div>
    `,
    bodyPlain: `
Weekly Performance Report - Week of {{weekOf}}

Hello {{managerName}},

Here's your team performance summary for the week of {{weekOf}}:

SUMMARY METRICS
- Completed Installations: {{completedJobs}}
- Team Utilization: {{utilizationRate}}%

TOP PERFORMERS
{{#each topPerformers}}
- {{name}}: {{jobsCompleted}} jobs completed ({{efficiency}}% efficiency)
{{/each}}

{{#if issues}}
ISSUES REQUIRING ATTENTION:
{{#each issues}}
- {{this}}
{{/each}}
{{/if}}

Full detailed report is attached.

Best regards,
Think Tank Technologies Analytics Team
    `,
    variables: [
      { name: 'managerName', type: 'string', description: 'Manager name', required: true, example: 'Sarah Johnson' },
      { name: 'weekOf', type: 'date', description: 'Week starting date', required: true, example: '2024-01-15' },
      { name: 'completedJobs', type: 'number', description: 'Number of completed jobs', required: true, example: 42 },
      { name: 'utilizationRate', type: 'number', description: 'Team utilization percentage', required: true, example: 87 },
      { name: 'topPerformers', type: 'array', description: 'Top performing team members', required: true, example: [] },
      { name: 'issues', type: 'array', description: 'Issues requiring attention', required: false, example: [] }
    ],
    targetAudience: ['admin', 'scheduler']
  }
];

export class EmailGeneratorService {
  private static instance: EmailGeneratorService;
  private templates: Map<string, EmailTemplate> = new Map();
  private handlebars: typeof Handlebars;

  private constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.loadDefaultTemplates();
  }

  public static getInstance(): EmailGeneratorService {
    if (!EmailGeneratorService.instance) {
      EmailGeneratorService.instance = new EmailGeneratorService();
    }
    return EmailGeneratorService.instance;
  }

  /**
   * Generate personalized email from template and data
   */
  public async generateEmail(
    templateId: string,
    recipientData: EmailRecipientData,
    variables: { [key: string]: any },
    options: EmailGenerationOptions = {}
  ): Promise<EmailMessage> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Email template not found: ${templateId}`);
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Compile and render template
      const compiledSubject = this.handlebars.compile(template.subject);
      const compiledBodyHtml = this.handlebars.compile(template.bodyHtml);
      const compiledBodyPlain = this.handlebars.compile(template.bodyPlain);

      // Prepare context data
      const context = this.prepareTemplateContext(variables, recipientData, options);

      // Generate email content
      const subject = compiledSubject(context);
      const bodyHtml = compiledBodyHtml(context);
      const bodyPlain = compiledBodyPlain(context);

      const emailMessage: EmailMessage = {
        id: messageId,
        templateId: template.id,
        to: [recipientData.email],
        from: options.from || EMAIL_CONFIG.FROM_ADDRESS,
        replyTo: options.replyTo || EMAIL_CONFIG.REPLY_TO,
        subject,
        bodyHtml,
        bodyPlain,
        attachments: options.attachments || [],
        status: 'draft' as EmailStatus,
        variables: context,
        metadata: {
          sourceSystem: 'installation_scheduler',
          contextData: options.contextData || {},
          recipientGroups: [recipientData.role],
          generatedAt: new Date().toISOString(),
          externalId: options.externalId
        },
        priority: options.priority || 'medium',
        trackingEnabled: options.trackingEnabled !== false,
        scheduledAt: options.scheduledAt
      };

      return emailMessage;

    } catch (error) {
      console.error('Email Generation Error:', error);
      throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate bulk emails for multiple recipients
   */
  public async generateBulkEmails(
    templateId: string,
    recipients: EmailRecipientData[],
    variablesProvider: (recipient: EmailRecipientData) => { [key: string]: any },
    options: EmailGenerationOptions = {}
  ): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];
    
    for (const recipient of recipients) {
      try {
        const variables = variablesProvider(recipient);
        const message = await this.generateEmail(templateId, recipient, variables, {
          ...options,
          contextData: { ...options.contextData, bulkEmailId: options.externalId }
        });
        messages.push(message);
      } catch (error) {
        console.error(`Failed to generate email for ${recipient.email}:`, error);
        // Continue with other recipients
      }
    }

    return messages;
  }

  /**
   * Send email message
   */
  public async sendEmail(message: EmailMessage): Promise<EmailDeliveryReceipt> {
    try {
      // In a real implementation, this would use a service like SendGrid, AWS SES, etc.
      // For now, we'll simulate the email sending process
      
      const deliveryReceipt: EmailDeliveryReceipt = {
        messageId: message.id,
        events: [
          {
            type: 'queued',
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Simulate email sending delay
      setTimeout(async () => {
        deliveryReceipt.events.push({
          type: 'sent',
          timestamp: new Date().toISOString()
        });

        // Simulate delivery
        setTimeout(() => {
          deliveryReceipt.deliveredAt = new Date().toISOString();
          deliveryReceipt.events.push({
            type: 'delivered',
            timestamp: new Date().toISOString()
          });
        }, 1000);
      }, 500);

      return deliveryReceipt;

    } catch (error) {
      console.error('Email Sending Error:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate assignment notification emails
   */
  public async generateAssignmentNotification(
    assignment: Assignment,
    installation: Installation,
    teamMember: TeamMember,
    partner?: TeamMember
  ): Promise<EmailMessage> {
    const templateId = 'assignment_notification';
    
    const recipientData: EmailRecipientData = {
      email: teamMember.email,
      name: `${teamMember.firstName} ${teamMember.lastName}`,
      role: teamMember.role,
      id: teamMember.id
    };

    const variables = {
      teamMemberName: `${teamMember.firstName} ${teamMember.lastName}`,
      customerName: installation.customerName,
      installDate: format(parseISO(installation.scheduledDate), 'EEEE, MMMM do, yyyy'),
      installTime: installation.scheduledTime,
      address: this.formatAddress(installation.address),
      customerPhone: installation.customerPhone,
      partnerName: partner ? `${partner.firstName} ${partner.lastName}` : null,
      specialInstructions: installation.notes,
      confirmationLink: `${window.location.origin}/assignments/${assignment.id}/confirm`
    };

    return this.generateEmail(templateId, recipientData, variables);
  }

  /**
   * Generate customer confirmation email
   */
  public async generateCustomerConfirmation(
    installation: Installation,
    lead: TeamMember,
    assistant?: TeamMember
  ): Promise<EmailMessage> {
    const templateId = 'customer_confirmation';
    
    const recipientData: EmailRecipientData = {
      email: installation.customerEmail,
      name: installation.customerName,
      role: 'viewer',
      id: installation.id
    };

    const variables = {
      customerName: installation.customerName,
      installDate: format(parseISO(installation.scheduledDate), 'EEEE, MMMM do, yyyy'),
      installTime: installation.scheduledTime,
      address: this.formatAddress(installation.address),
      duration: `${installation.duration || 120} minutes`,
      leadName: `${lead.firstName} ${lead.lastName}`,
      leadPhone: lead.emergencyContact?.phoneNumber || 'Contact dispatch',
      assistantName: assistant ? `${assistant.firstName} ${assistant.lastName}` : null,
      assistantPhone: assistant?.emergencyContact?.phoneNumber || null,
      specialInstructions: installation.notes,
      supportPhone: '1-800-THINK-TANK',
      supportEmail: 'support@thinktanktechnologies.com'
    };

    return this.generateEmail(templateId, recipientData, variables);
  }

  /**
   * Generate performance report email
   */
  public async generatePerformanceReport(
    manager: User,
    reportData: PerformanceReportData,
    pdfReport?: PDFReport
  ): Promise<EmailMessage> {
    const templateId = 'performance_report';
    
    const recipientData: EmailRecipientData = {
      email: manager.email,
      name: `${manager.firstName} ${manager.lastName}`,
      role: manager.role,
      id: manager.id
    };

    const variables = {
      managerName: `${manager.firstName} ${manager.lastName}`,
      weekOf: format(parseISO(reportData.weekStart), 'MMMM do, yyyy'),
      completedJobs: reportData.completedJobs,
      utilizationRate: reportData.utilizationRate,
      topPerformers: reportData.topPerformers,
      issues: reportData.issues
    };

    const attachments: EmailAttachment[] = [];
    if (pdfReport && pdfReport.filePath) {
      attachments.push({
        id: pdfReport.id,
        filename: `${pdfReport.name}.pdf`,
        contentType: 'application/pdf',
        size: pdfReport.fileSize || 0,
        url: pdfReport.fileUrl
      });
    }

    return this.generateEmail(templateId, recipientData, variables, { attachments });
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    this.handlebars.registerHelper('formatDate', (date: string, formatStr = 'MMMM do, yyyy') => {
      try {
        return format(parseISO(date), formatStr);
      } catch {
        return date;
      }
    });

    this.handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });

    this.handlebars.registerHelper('pluralize', (count: number, singular: string, plural?: string) => {
      return count === 1 ? singular : (plural || `${singular}s`);
    });

    this.handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifGreaterThan', function(arg1: number, arg2: number, options: any) {
      return arg1 > arg2 ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * Load default email templates
   */
  private loadDefaultTemplates(): void {
    DEFAULT_EMAIL_TEMPLATES.forEach((templateData, index) => {
      const template: EmailTemplate = {
        id: `template_${index + 1}`,
        ...templateData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: 1
      } as EmailTemplate;

      this.templates.set(template.id, template);
      // Also set by type for easy lookup
      this.templates.set(template.type, template);
    });
  }

  /**
   * Prepare template context with all necessary data
   */
  private prepareTemplateContext(
    variables: { [key: string]: any },
    recipientData: EmailRecipientData,
    options: EmailGenerationOptions
  ): { [key: string]: any } {
    return {
      ...variables,
      recipient: recipientData,
      currentDate: format(new Date(), 'MMMM do, yyyy'),
      currentYear: new Date().getFullYear(),
      companyName: 'Think Tank Technologies',
      companyEmail: EMAIL_CONFIG.FROM_ADDRESS,
      supportEmail: EMAIL_CONFIG.REPLY_TO,
      unsubscribeLink: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(recipientData.email)}`,
      ...options.contextData
    };
  }

  /**
   * Format address for display
   */
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

  /**
   * Get all available templates
   */
  public getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values()).filter(t => !t.type || Object.values(EmailTemplateType).includes(t.type as any));
  }

  /**
   * Get template by ID or type
   */
  public getTemplate(idOrType: string): EmailTemplate | undefined {
    return this.templates.get(idOrType);
  }

  /**
   * Add or update template
   */
  public setTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
    this.templates.set(template.type, template);
  }

  /**
   * Preview email with sample data
   */
  public async previewEmail(
    templateId: string,
    sampleData: { [key: string]: any }
  ): Promise<{ subject: string; bodyHtml: string; bodyPlain: string }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const compiledSubject = this.handlebars.compile(template.subject);
    const compiledBodyHtml = this.handlebars.compile(template.bodyHtml);
    const compiledBodyPlain = this.handlebars.compile(template.bodyPlain);

    // Use sample data with fallbacks
    const context = {
      ...sampleData,
      currentDate: format(new Date(), 'MMMM do, yyyy'),
      companyName: 'Think Tank Technologies'
    };

    return {
      subject: compiledSubject(context),
      bodyHtml: compiledBodyHtml(context),
      bodyPlain: compiledBodyPlain(context)
    };
  }
}

// Supporting interfaces and types
export interface EmailRecipientData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface EmailGenerationOptions {
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  scheduledAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  trackingEnabled?: boolean;
  contextData?: { [key: string]: any };
  externalId?: string;
}

export interface PerformanceReportData {
  weekStart: string;
  completedJobs: number;
  utilizationRate: number;
  topPerformers: Array<{
    name: string;
    jobsCompleted: number;
    efficiency: number;
  }>;
  issues?: string[];
}

// Export singleton instance
export const emailGenerator = EmailGeneratorService.getInstance();