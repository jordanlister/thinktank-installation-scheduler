// Think Tank Technologies Installation Scheduler - Invitation Service
// Manages user invitations, email templates, and onboarding flows

import { supabase } from './supabase';
import {
  UserInvitation,
  InvitationMetadata,
  OrganizationRole,
  ProjectRole,
  InvitationEmailTemplate,
  EmailTemplateVariable,
  AuthUser,
  Organization,
  Project
} from '../types';

// Invitation creation data
export interface CreateInvitationData {
  email: string;
  organizationRole: OrganizationRole;
  projectId?: string;
  projectRole?: ProjectRole;
  firstName?: string;
  lastName?: string;
  message?: string;
  expiresInDays?: number;
}

// Invitation acceptance data
export interface AcceptInvitationData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

// Bulk invitation data
export interface BulkInvitationData {
  invitations: CreateInvitationData[];
  organizationRole: OrganizationRole;
  projectId?: string;
  projectRole?: ProjectRole;
}

// Email template context
export interface EmailTemplateContext {
  invitee: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  inviter: {
    firstName: string;
    lastName: string;
    email: string;
  };
  organization: {
    name: string;
    slug: string;
    primaryColor?: string;
    logo?: string;
  };
  project?: {
    name: string;
    description?: string;
  };
  invitation: {
    token: string;
    organizationRole: string;
    projectRole?: string;
    message?: string;
    expiresAt: string;
    acceptUrl: string;
  };
}

// Default email templates
const DEFAULT_EMAIL_TEMPLATES: Record<string, InvitationEmailTemplate> = {
  organization_invitation: {
    id: 'org_invite_default',
    name: 'Organization Invitation',
    subject: 'You\'ve been invited to join {{organization.name}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invitation to {{organization.name}}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, {{organization.primaryColor || '#3B82F6'}} 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: {{organization.primaryColor || '#3B82F6'}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .btn:hover { background: #1E40AF; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .logo { max-height: 50px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              {{#if organization.logo}}
                <img src="{{organization.logo}}" alt="{{organization.name}}" class="logo">
              {{/if}}
              <h1>You're Invited!</h1>
            </div>
            
            <div class="content">
              <h2>Hello {{invitee.firstName || invitee.email}},</h2>
              
              <p><strong>{{inviter.firstName}} {{inviter.lastName}}</strong> has invited you to join <strong>{{organization.name}}</strong> as a <strong>{{invitation.organizationRole}}</strong>.</p>
              
              {{#if invitation.message}}
                <div class="details">
                  <h3>Personal Message:</h3>
                  <p style="font-style: italic;">"{{invitation.message}}"</p>
                </div>
              {{/if}}
              
              {{#if project}}
                <div class="details">
                  <h3>Project Assignment:</h3>
                  <p>You'll be assigned to the <strong>{{project.name}}</strong> project as a <strong>{{invitation.projectRole}}</strong>.</p>
                  {{#if project.description}}
                    <p><em>{{project.description}}</em></p>
                  {{/if}}
                </div>
              {{/if}}
              
              <div class="details">
                <h3>What's Next?</h3>
                <ul>
                  <li>Click the button below to accept your invitation</li>
                  <li>Create your account with a secure password</li>
                  <li>Complete your profile setup</li>
                  <li>Start collaborating with your team!</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="{{invitation.acceptUrl}}" class="btn">Accept Invitation</a>
              </div>
              
              <p><small>This invitation expires on {{invitation.expiresAt}}. If you don't accept it by then, you'll need to request a new invitation.</small></p>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact {{inviter.firstName}} at {{inviter.email}}</p>
              <p>Think Tank Technologies - Installation Scheduler</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
You've been invited to join {{organization.name}}!

Hello {{invitee.firstName || invitee.email}},

{{inviter.firstName}} {{inviter.lastName}} has invited you to join {{organization.name}} as a {{invitation.organizationRole}}.

{{#if invitation.message}}
Personal Message: "{{invitation.message}}"
{{/if}}

{{#if project}}
You'll be assigned to the {{project.name}} project as a {{invitation.projectRole}}.
{{/if}}

To accept your invitation:
1. Visit: {{invitation.acceptUrl}}
2. Create your account with a secure password
3. Complete your profile setup
4. Start collaborating with your team!

This invitation expires on {{invitation.expiresAt}}.

If you have any questions, please contact {{inviter.firstName}} at {{inviter.email}}

Think Tank Technologies - Installation Scheduler
    `,
    variables: [
      { name: 'invitee.email', description: 'Invitee email address', required: true },
      { name: 'invitee.firstName', description: 'Invitee first name', required: false },
      { name: 'inviter.firstName', description: 'Inviter first name', required: true },
      { name: 'inviter.lastName', description: 'Inviter last name', required: true },
      { name: 'organization.name', description: 'Organization name', required: true },
      { name: 'invitation.organizationRole', description: 'Organization role', required: true },
      { name: 'invitation.acceptUrl', description: 'Invitation acceptance URL', required: true }
    ],
    isActive: true
  }
};

class InvitationService {
  /**
   * Create and send invitation
   */
  async createInvitation(
    organizationId: string, 
    inviterId: string, 
    data: CreateInvitationData
  ): Promise<{ success: boolean; invitation?: UserInvitation; error?: string }> {
    try {
      // Validate email isn't already a member or has pending invitation
      const existingUser = await this.checkExistingUser(organizationId, data.email);
      if (existingUser) {
        return { success: false, error: 'User is already a member or has a pending invitation' };
      }

      // Generate secure token
      const token = this.generateInvitationToken();
      const expiresAt = new Date(Date.now() + (data.expiresInDays || 7) * 24 * 60 * 60 * 1000).toISOString();

      // Create invitation record
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert([{
          organization_id: organizationId,
          project_id: data.projectId,
          email: data.email,
          organization_role: data.organizationRole,
          project_role: data.projectRole,
          invited_by: inviterId,
          token,
          expires_at: expiresAt,
          metadata: {
            firstName: data.firstName,
            lastName: data.lastName,
            message: data.message,
            source: 'admin'
          } as InvitationMetadata
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Send invitation email
      await this.sendInvitationEmail(invitation, organizationId, inviterId);

      // Log activity
      await this.logInvitationActivity(organizationId, inviterId, 'invitation_sent', {
        inviteeEmail: data.email,
        organizationRole: data.organizationRole,
        projectId: data.projectId,
        projectRole: data.projectRole
      });

      return { success: true, invitation };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create invitation' 
      };
    }
  }

  /**
   * Send bulk invitations
   */
  async createBulkInvitations(
    organizationId: string, 
    inviterId: string, 
    data: BulkInvitationData
  ): Promise<{ 
    success: boolean; 
    results?: { successful: number; failed: number; errors: string[] }; 
    error?: string 
  }> {
    try {
      const results = { successful: 0, failed: 0, errors: [] as string[] };

      for (const invitationData of data.invitations) {
        const result = await this.createInvitation(organizationId, inviterId, {
          ...invitationData,
          organizationRole: invitationData.organizationRole || data.organizationRole,
          projectId: invitationData.projectId || data.projectId,
          projectRole: invitationData.projectRole || data.projectRole
        });

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`${invitationData.email}: ${result.error}`);
        }
      }

      // Log bulk activity
      await this.logInvitationActivity(organizationId, inviterId, 'bulk_invitations_sent', {
        total: data.invitations.length,
        successful: results.successful,
        failed: results.failed
      });

      return { success: true, results };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create bulk invitations' 
      };
    }
  }

  /**
   * Validate invitation token
   */
  async validateInvitation(token: string): Promise<{ 
    valid: boolean; 
    invitation?: UserInvitation; 
    error?: string 
  }> {
    try {
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          organizations (*),
          projects (*),
          invited_by_user:users!invited_by (first_name, last_name, email)
        `)
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (error || !invitation) {
        return { valid: false, error: 'Invitation not found' };
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { valid: false, error: 'Invitation has expired' };
      }

      return { valid: true, invitation };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Failed to validate invitation' 
      };
    }
  }

  /**
   * Accept invitation and create user account
   */
  async acceptInvitation(data: AcceptInvitationData): Promise<{ 
    success: boolean; 
    user?: AuthUser; 
    error?: string 
  }> {
    try {
      // Validate invitation
      const validation = await this.validateInvitation(data.token);
      if (!validation.valid || !validation.invitation) {
        return { success: false, error: validation.error };
      }

      const invitation = validation.invitation;

      // Create user account through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            organization_id: invitation.organization_id,
            organization_role: invitation.organization_role,
            invitation_token: data.token,
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // The user creation and invitation acceptance will be handled by the database trigger
      // Mark invitation as accepted
      await supabase
        .from('user_invitations')
        .update({ 
          accepted_at: new Date().toISOString(), 
          accepted_by: authData.user?.id 
        })
        .eq('token', data.token);

      // Log activity
      await this.logInvitationActivity(invitation.organization_id, authData.user?.id, 'invitation_accepted', {
        invitationId: invitation.id,
        email: invitation.email
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to accept invitation' 
      };
    }
  }

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: string, inviterId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      // Get invitation
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', invitationId)
        .is('accepted_at', null)
        .single();

      if (error || !invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      // Extend expiration
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('user_invitations')
        .update({ expires_at: newExpiresAt })
        .eq('id', invitationId);

      // Resend email
      await this.sendInvitationEmail(invitation, invitation.organization_id, inviterId);

      // Log activity
      await this.logInvitationActivity(invitation.organization_id, inviterId, 'invitation_resent', {
        invitationId,
        email: invitation.email
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to resend invitation' 
      };
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, userId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId)
        .is('accepted_at', null)
        .select()
        .single();

      if (error || !invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      // Log activity
      await this.logInvitationActivity(invitation.organization_id, userId, 'invitation_cancelled', {
        invitationId,
        email: invitation.email
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel invitation' 
      };
    }
  }

  /**
   * Get organization invitations
   */
  async getOrganizationInvitations(organizationId: string): Promise<{
    success: boolean;
    invitations?: UserInvitation[];
    error?: string;
  }> {
    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          invited_by_user:users!invited_by (first_name, last_name, email),
          projects (name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, invitations: invitations || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get invitations' 
      };
    }
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(
    invitation: UserInvitation, 
    organizationId: string, 
    inviterId: string
  ): Promise<void> {
    try {
      // Get context data
      const context = await this.buildEmailContext(invitation, organizationId, inviterId);
      
      // Get email template
      const template = DEFAULT_EMAIL_TEMPLATES.organization_invitation;
      
      // Render template
      const renderedHtml = this.renderTemplate(template.htmlContent, context);
      const renderedText = this.renderTemplate(template.textContent, context);
      const renderedSubject = this.renderTemplate(template.subject, context);

      // In a real implementation, you would integrate with an email service
      // For now, we'll log the email content and create a notification
      console.log('Sending invitation email:', {
        to: invitation.email,
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText
      });

      // Create notification for inviter
      await supabase.from('notifications').insert([{
        organization_id: organizationId,
        recipient_id: inviterId,
        type: 'invitation_sent',
        priority: 'medium',
        title: 'Invitation Sent',
        message: `Invitation sent to ${invitation.email}`,
        data: {
          invitationId: invitation.id,
          email: invitation.email,
          role: invitation.organization_role
        }
      }]);

    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw error;
    }
  }

  /**
   * Build email template context
   */
  private async buildEmailContext(
    invitation: UserInvitation, 
    organizationId: string, 
    inviterId: string
  ): Promise<EmailTemplateContext> {
    // Get organization data
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    // Get inviter data
    const { data: inviter } = await supabase
      .from('users')
      .select('*')
      .eq('id', inviterId)
      .single();

    // Get project data if applicable
    let project = undefined;
    if (invitation.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', invitation.project_id)
        .single();
      project = projectData;
    }

    const acceptUrl = `${window.location.origin}/accept-invitation?token=${invitation.token}`;

    return {
      invitee: {
        email: invitation.email,
        firstName: invitation.metadata.firstName,
        lastName: invitation.metadata.lastName,
      },
      inviter: {
        firstName: inviter.first_name,
        lastName: inviter.last_name,
        email: inviter.email,
      },
      organization: {
        name: organization.name,
        slug: organization.slug,
        primaryColor: organization.branding?.primaryColor,
        logo: organization.branding?.logo,
      },
      project: project ? {
        name: project.name,
        description: project.description,
      } : undefined,
      invitation: {
        token: invitation.token,
        organizationRole: invitation.organization_role,
        projectRole: invitation.project_role,
        message: invitation.metadata.message,
        expiresAt: new Date(invitation.expires_at).toLocaleDateString(),
        acceptUrl,
      },
    };
  }

  /**
   * Render template with context (basic Handlebars-like templating)
   */
  private renderTemplate(template: string, context: any): string {
    let rendered = template;

    // Simple variable replacement
    const variableRegex = /\{\{([^}]+)\}\}/g;
    rendered = rendered.replace(variableRegex, (match, variable) => {
      const value = this.getNestedProperty(context, variable.trim());
      return value !== undefined ? String(value) : match;
    });

    // Simple conditional blocks
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    rendered = rendered.replace(conditionalRegex, (match, condition, content) => {
      const value = this.getNestedProperty(context, condition.trim());
      return value ? content : '';
    });

    return rendered;
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current && current[prop], obj);
  }

  /**
   * Generate secure invitation token
   */
  private generateInvitationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'inv_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if user already exists or has pending invitation
   */
  private async checkExistingUser(organizationId: string, email: string): Promise<boolean> {
    // Check existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .single();

    if (existingUser) return true;

    // Check pending invitation
    const { data: pendingInvitation } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    return !!pendingInvitation;
  }

  /**
   * Log invitation activity
   */
  private async logInvitationActivity(
    organizationId: string, 
    userId: string | undefined, 
    activityType: string, 
    metadata: any
  ): Promise<void> {
    try {
      await supabase.from('organization_activities').insert([{
        organization_id: organizationId,
        user_id: userId,
        activity_type: activityType,
        description: this.getActivityDescription(activityType, metadata),
        metadata,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to log invitation activity:', error);
    }
  }

  /**
   * Get activity description
   */
  private getActivityDescription(activityType: string, metadata: any): string {
    switch (activityType) {
      case 'invitation_sent':
        return `Invitation sent to ${metadata.inviteeEmail} as ${metadata.organizationRole}`;
      case 'invitation_accepted':
        return `Invitation accepted by ${metadata.email}`;
      case 'invitation_resent':
        return `Invitation resent to ${metadata.email}`;
      case 'invitation_cancelled':
        return `Invitation cancelled for ${metadata.email}`;
      case 'bulk_invitations_sent':
        return `Bulk invitations sent: ${metadata.successful} successful, ${metadata.failed} failed`;
      default:
        return `Invitation activity: ${activityType}`;
    }
  }
}

// Export singleton instance
export const invitationService = new InvitationService();

export default invitationService;