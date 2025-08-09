// Think Tank Technologies Installation Scheduler - Multi-Tenant Authentication Service
// Enhanced authentication with organization context, JWT claims, and RBAC

import { supabase } from './supabase';
import { 
  User, 
  AuthUser, 
  Organization, 
  Project, 
  ProjectAssignment,
  OrganizationRole, 
  ProjectRole,
  UserInvitation,
  Permission,
  JWTClaims,
  InvitationMetadata,
  OrganizationActivity
} from '../types';

// Enhanced authentication response
export interface AuthResponse {
  user: AuthUser | null;
  session: any;
  error: string | null;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data with organization context
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string; // For invited users
  invitationToken?: string; // For accepting invitations
}

// Organization creation data
export interface CreateOrganizationData {
  name: string;
  slug: string;
  domain?: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPassword: string;
}

// RBAC permissions definition
const PERMISSIONS_MATRIX: Record<string, Record<string, Permission[]>> = {
  // Organization-level permissions
  organization: {
    owner: [
      { id: 'org:*', resource: 'organization', action: 'manage' },
      { id: 'org:billing', resource: 'billing', action: 'manage' },
      { id: 'org:users', resource: 'users', action: 'manage' },
      { id: 'org:projects', resource: 'projects', action: 'manage' },
      { id: 'org:settings', resource: 'settings', action: 'manage' },
    ],
    admin: [
      { id: 'org:users', resource: 'users', action: 'manage' },
      { id: 'org:projects', resource: 'projects', action: 'manage' },
      { id: 'org:settings', resource: 'settings', action: 'update' },
      { id: 'org:data', resource: 'data', action: 'manage' },
    ],
    manager: [
      { id: 'org:users', resource: 'users', action: 'read' },
      { id: 'org:projects', resource: 'projects', action: 'update' },
      { id: 'org:data', resource: 'data', action: 'update' },
    ],
    member: [
      { id: 'org:users', resource: 'users', action: 'read' },
      { id: 'org:projects', resource: 'projects', action: 'read' },
      { id: 'org:data', resource: 'data', action: 'read' },
    ]
  },
  // Project-level permissions
  project: {
    admin: [
      { id: 'proj:*', resource: 'project', action: 'manage' },
      { id: 'proj:assignments', resource: 'assignments', action: 'manage' },
      { id: 'proj:team', resource: 'team', action: 'manage' },
      { id: 'proj:schedule', resource: 'schedule', action: 'manage' },
    ],
    manager: [
      { id: 'proj:assignments', resource: 'assignments', action: 'manage' },
      { id: 'proj:team', resource: 'team', action: 'update' },
      { id: 'proj:schedule', resource: 'schedule', action: 'manage' },
      { id: 'proj:data', resource: 'data', action: 'update' },
    ],
    scheduler: [
      { id: 'proj:assignments', resource: 'assignments', action: 'update' },
      { id: 'proj:schedule', resource: 'schedule', action: 'update' },
      { id: 'proj:data', resource: 'data', action: 'update' },
    ],
    lead: [
      { id: 'proj:assignments', resource: 'assignments', action: 'read' },
      { id: 'proj:schedule', resource: 'schedule', action: 'read' },
      { id: 'proj:data', resource: 'data', action: 'read' },
    ],
    assistant: [
      { id: 'proj:assignments', resource: 'assignments', action: 'read' },
      { id: 'proj:schedule', resource: 'schedule', action: 'read' },
    ],
    viewer: [
      { id: 'proj:data', resource: 'data', action: 'read' },
    ]
  }
};

class MultiTenantAuthService {
  private currentUser: AuthUser | null = null;

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, session: null, error: 'No user returned from authentication' };
      }

      // Get enhanced user data with organization context
      const authUser = await this.buildAuthUser(data.user.id);
      if (!authUser) {
        return { user: null, session: null, error: 'Failed to load user organization context' };
      }

      this.currentUser = authUser;

      // Log authentication event
      await this.logActivity(authUser.organizationId, {
        activityType: 'user_login',
        userId: authUser.id,
        description: `User ${authUser.email} signed in`,
        metadata: {
          loginMethod: 'password',
          timestamp: new Date().toISOString()
        }
      });

      return { user: authUser, session: data.session, error: null };
    } catch (error) {
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Sign up new user (with optional organization context)
   */
  async signUp(data: RegistrationData): Promise<AuthResponse> {
    try {
      let organizationId: string | undefined;
      let organizationRole: OrganizationRole = OrganizationRole.MEMBER;

      // Check if signing up via invitation
      if (data.invitationToken) {
        const invitation = await this.validateInvitationToken(data.invitationToken);
        if (!invitation) {
          return { user: null, session: null, error: 'Invalid or expired invitation' };
        }

        organizationId = invitation.organizationId;
        organizationRole = invitation.organizationRole;
      }

      // Create auth user
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            organization_id: organizationId,
            organization_role: organizationRole,
            invitation_token: data.invitationToken,
          }
        }
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      // The user creation will be handled by the database trigger
      // which processes the invitation token and sets up organization context

      return { 
        user: null, // User will need to verify email first
        session: authData.session, 
        error: null 
      };
    } catch (error) {
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  /**
   * Create new organization with owner
   */
  async createOrganization(data: CreateOrganizationData): Promise<AuthResponse> {
    try {
      // First create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: data.name,
          slug: data.slug,
          domain: data.domain,
          subscription_plan: 'free',
          settings: {
            timezone: 'UTC',
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            workingHours: { start: '08:00', end: '17:00' },
            defaultJobDuration: 240,
            maxJobsPerDay: 8,
            enableAutoAssignments: false,
            requireApprovalForChanges: true
          },
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          }
        }])
        .select()
        .single();

      if (orgError) {
        return { user: null, session: null, error: orgError.message };
      }

      // Create the owner user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.ownerEmail,
        password: data.ownerPassword,
        options: {
          data: {
            first_name: data.ownerFirstName,
            last_name: data.ownerLastName,
            organization_id: orgData.id,
            organization_role: OrganizationRole.OWNER,
          }
        }
      });

      if (authError) {
        // Cleanup organization if user creation failed
        await supabase.from('organizations').delete().eq('id', orgData.id);
        return { user: null, session: null, error: authError.message };
      }

      // Create default project
      await supabase.from('projects').insert([{
        organization_id: orgData.id,
        name: 'Default Project',
        description: 'Initial project for your organization',
        created_by: authData.user?.id,
        settings: {
          defaultDuration: 240,
          workingHours: { start: '08:00', end: '17:00' },
          bufferTime: 30,
          maxTravelDistance: 50
        }
      }]);

      return {
        user: null, // User will need to verify email
        session: authData.session,
        error: null
      };
    } catch (error) {
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Organization creation failed' 
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      if (this.currentUser) {
        await this.logActivity(this.currentUser.organizationId, {
          activityType: 'user_logout',
          userId: this.currentUser.id,
          description: `User ${this.currentUser.email} signed out`,
          metadata: { timestamp: new Date().toISOString() }
        });
      }

      const { error } = await supabase.auth.signOut();
      this.currentUser = null;

      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.currentUser = null;
        return null;
      }

      // Return cached user if same
      if (this.currentUser && this.currentUser.id === user.id) {
        return this.currentUser;
      }

      // Build fresh auth user data
      const authUser = await this.buildAuthUser(user.id);
      this.currentUser = authUser;

      return authUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Switch user's current project context
   */
  async switchProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'No authenticated user' };
      }

      // Verify user has access to this project
      const hasAccess = this.currentUser.projects.some(p => p.projectId === projectId && p.isActive);
      if (!hasAccess) {
        return { success: false, error: 'User does not have access to this project' };
      }

      // Update user's current project
      const { error } = await supabase
        .from('users')
        .update({ settings: { ...this.currentUser.settings, currentProjectId: projectId } })
        .eq('id', this.currentUser.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh user context
      this.currentUser = await this.buildAuthUser(this.currentUser.id);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Project switch failed' 
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(resource: string, action: string, context?: any): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions.some(permission => 
      (permission.resource === resource || permission.resource === '*') &&
      (permission.action === action || permission.action === 'manage') &&
      this.checkPermissionConditions(permission, context)
    );
  }

  /**
   * Get user's role in specific project
   */
  getProjectRole(projectId: string): ProjectRole | null {
    if (!this.currentUser) {
      return null;
    }

    const project = this.currentUser.projects.find(p => p.projectId === projectId);
    return project?.role || null;
  }

  /**
   * Invite user to organization
   */
  async inviteUser(email: string, organizationRole: OrganizationRole, projectId?: string, projectRole?: ProjectRole): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Authentication required' };
      }

      // Check permissions
      if (!this.hasPermission('users', 'create')) {
        return { success: false, error: 'Insufficient permissions to invite users' };
      }

      // Generate invitation token
      const token = this.generateInvitationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      // Create invitation record
      const { error } = await supabase
        .from('user_invitations')
        .insert([{
          organization_id: this.currentUser.organizationId,
          project_id: projectId,
          email,
          organization_role: organizationRole,
          project_role: projectRole,
          invited_by: this.currentUser.id,
          token,
          expires_at: expiresAt,
          metadata: {
            source: 'admin',
            inviterName: `${this.currentUser.firstName} ${this.currentUser.lastName}`
          }
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      // Send invitation email (this would integrate with your email service)
      await this.sendInvitationEmail(email, token, {
        organizationName: this.currentUser.organization.name,
        inviterName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        role: organizationRole
      });

      // Log activity
      await this.logActivity(this.currentUser.organizationId, {
        activityType: 'user_invited',
        userId: this.currentUser.id,
        description: `User invitation sent to ${email}`,
        metadata: {
          email,
          organizationRole,
          projectId,
          projectRole
        }
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invitation failed' 
      };
    }
  }

  /**
   * Build enhanced AuthUser from user ID
   */
  private async buildAuthUser(userId: string): Promise<AuthUser | null> {
    try {
      // Get user with organization data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          organizations (*)
        `)
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return null;
      }

      // Get user's project assignments
      const { data: projectData, error: projectError } = await supabase
        .from('project_users')
        .select(`
          project_id,
          role,
          is_active,
          projects (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (projectError) {
        console.error('Failed to load project assignments:', projectError);
      }

      const projects: ProjectAssignment[] = (projectData || []).map(item => ({
        projectId: item.project_id,
        projectName: item.projects.name,
        role: item.role,
        isActive: item.is_active
      }));

      // Determine current project
      const currentProjectId = userData.settings?.currentProjectId;
      let currentProject: Project | undefined;

      if (currentProjectId) {
        const { data: currentProjectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', currentProjectId)
          .single();

        currentProject = currentProjectData || undefined;
      }

      // Calculate permissions
      const permissions = this.calculatePermissions(userData.role, projects);

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        organizationId: userData.organization_id,
        organizationRole: userData.role,
        organization: userData.organizations,
        currentProject,
        projects,
        permissions,
        settings: userData.settings || {},
        lastLoginAt: userData.last_login_at || new Date().toISOString()
      };

      return authUser;
    } catch (error) {
      console.error('Failed to build auth user:', error);
      return null;
    }
  }

  /**
   * Calculate user permissions based on roles
   */
  private calculatePermissions(organizationRole: OrganizationRole, projects: ProjectAssignment[]): Permission[] {
    const permissions: Permission[] = [];

    // Add organization-level permissions
    const orgPermissions = PERMISSIONS_MATRIX.organization[organizationRole] || [];
    permissions.push(...orgPermissions);

    // Add project-level permissions
    projects.forEach(project => {
      if (project.isActive) {
        const projectPermissions = PERMISSIONS_MATRIX.project[project.role] || [];
        // Scope permissions to the specific project
        projectPermissions.forEach(permission => {
          permissions.push({
            ...permission,
            conditions: { projectId: project.projectId }
          });
        });
      }
    });

    return permissions;
  }

  /**
   * Check permission conditions
   */
  private checkPermissionConditions(permission: Permission, context?: any): boolean {
    if (!permission.conditions) {
      return true;
    }

    if (context && permission.conditions.projectId) {
      return context.projectId === permission.conditions.projectId;
    }

    return true;
  }

  /**
   * Validate invitation token
   */
  private async validateInvitationToken(token: string): Promise<UserInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('accepted_at', null)
        .single();

      return error ? null : data;
    } catch (error) {
      return null;
    }
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
   * Send invitation email (placeholder - integrate with your email service)
   */
  private async sendInvitationEmail(email: string, token: string, context: any): Promise<void> {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`Sending invitation email to ${email} with token ${token}`);
    
    // For now, just log the invitation URL
    const invitationUrl = `${window.location.origin}/accept-invitation?token=${token}`;
    console.log(`Invitation URL: ${invitationUrl}`);
  }

  /**
   * Log organization activity
   */
  private async logActivity(organizationId: string, activity: Partial<OrganizationActivity>): Promise<void> {
    try {
      await supabase.from('organization_activities').insert([{
        organization_id: organizationId,
        ...activity,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

// Export singleton instance
export const authService = new MultiTenantAuthService();

// Export legacy functions for backward compatibility
export const auth = {
  signIn: (email: string, password: string) => authService.signIn({ email, password }),
  signUp: (email: string, password: string, userData: any) => authService.signUp({
    email,
    password,
    firstName: userData.firstName,
    lastName: userData.lastName,
  }),
  signOut: () => authService.signOut(),
  getCurrentUser: () => authService.getCurrentUser(),
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { data: null, error };
  }
};

export default authService;