// Think Tank Technologies - Multi-Tenant Team Service
// Transforms the original team service for multi-tenant support

import { MultiTenantService, TenantContext } from './multiTenantService';
import type { TeamMember } from '../types';

export interface CreateTeamMemberData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  region: string;
  capacity: number;
  travelRadius: number;
  specializations?: string[];
  homeAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  preferredStartTime?: string;
  preferredEndTime?: string;
  maxDailyJobs?: number;
  maxWeeklyHours?: number;
  weekendsAvailable?: boolean;
  overtimeAvailable?: boolean;
  travelPreference?: string;
}

export interface UpdateTeamMemberData extends Partial<CreateTeamMemberData> {
  id: string;
  employmentStatus?: string;
}

export class MultiTenantTeamService extends MultiTenantService {

  /**
   * Get all team members for the current organization/project
   */
  async getTeamMembers(): Promise<{ data: TeamMember[], error?: any }> {
    try {
      const query = this.projectId ? 
        this.getProjectQuery('team_member_details') :
        this.getBaseQuery('team_member_details');

      const { data, error } = await query
        .select('*')
        .order('first_name', { ascending: true });

      if (error) return { data: [], error };

      const teamMembers = await Promise.all(
        data.map(async (tm: any) => {
          const [skillsData, certificationsData, equipmentData, availabilityData, workPrefsData, performanceData] = await Promise.all([
            this.getTeamMemberSkills(tm.id),
            this.getTeamMemberCertifications(tm.id),
            this.getTeamMemberEquipment(tm.id),
            this.getTeamMemberAvailability(tm.id),
            this.getTeamMemberWorkPreferences(tm.id),
            this.getTeamMemberPerformance(tm.id)
          ]);

          return this.transformTeamMemberData(tm, skillsData, certificationsData, equipmentData, availabilityData, workPrefsData, performanceData);
        })
      );

      return { data: teamMembers };
    } catch (error) {
      console.error('Error fetching team members:', error);
      return { data: [], error };
    }
  }

  /**
   * Create a new team member within the organization/project context
   */
  async createTeamMember(data: CreateTeamMemberData): Promise<TeamMember> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to create team members');
    }

    if (!this.projectId) {
      throw new Error('Project context required to create team members');
    }

    try {
      // First create the user record with organization context
      const userInsert = this.addOrganizationContext({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        is_active: true
      });

      // Add emergency contact if provided
      if (data.emergencyContactName || data.emergencyContactPhone) {
        userInsert.emergency_contact = {
          name: data.emergencyContactName || '',
          phone: data.emergencyContactPhone || '',
          relationship: data.emergencyContactRelationship || ''
        };
      }

      const { data: userData, error: userError } = await this.getBaseQuery('users')
        .insert(userInsert)
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // Then create the team member record with project context
      const teamMemberData = this.addProjectContext({
        id: userData.id, // Use the same ID as the user
        user_id: userData.id,
        employee_id: `EMP${Date.now()}`, // Generate employee ID
        region: data.region,
        capacity: data.capacity || 8,
        travel_radius: data.travelRadius || 50,
        specializations: data.specializations || [],
        hire_date: new Date().toISOString().split('T')[0],
        employment_status: 'active',
        job_title: this.getRoleTitle(data.role),
        department: 'Installation Services'
      });

      const { data: teamMemberResult, error: teamMemberError } = await this.getProjectQuery('team_members')
        .insert(teamMemberData)
        .select()
        .single();

      if (teamMemberError) {
        console.error('Team member creation error:', teamMemberError);
        // If team member creation fails, try to clean up the user
        await this.getBaseQuery('users').delete().eq('id', userData.id);
        throw new Error(`Failed to create team member: ${teamMemberError.message}`);
      }

      // Assign user to the project
      const { error: projectUserError } = await this.getBaseQuery('project_users')
        .insert({
          project_id: this.projectId,
          user_id: userData.id,
          role: data.role,
          assigned_by: this.userId,
          assigned_at: new Date().toISOString(),
          is_active: true
        });

      if (projectUserError) {
        console.warn('Failed to assign user to project:', projectUserError);
      }

      // Create work preferences if provided
      if (data.preferredStartTime || data.maxDailyJobs) {
        const { error: workPrefError } = await this.getBaseQuery('work_preferences')
          .insert({
            team_member_id: teamMemberResult.id,
            preferred_start_time: data.preferredStartTime || '08:00',
            preferred_end_time: data.preferredEndTime || '17:00',
            max_daily_jobs: data.maxDailyJobs || 5,
            max_weekly_hours: data.maxWeeklyHours || 40,
            weekends_available: data.weekendsAvailable || false,
            overtime_available: data.overtimeAvailable || false,
            travel_preference: data.travelPreference || 'regional'
          });

        if (workPrefError) {
          console.warn('Work preferences creation failed:', workPrefError);
        }
      }

      // Log activity
      await this.logActivity(
        'team_member_created',
        `Created team member ${data.firstName} ${data.lastName}`,
        'team_member',
        teamMemberResult.id,
        { email: data.email, role: data.role }
      );

      // Return the complete team member data
      return await this.getTeamMemberById(teamMemberResult.id);
    } catch (error) {
      console.error('Error creating team member:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
          throw new Error('A team member with this email already exists');
        } else if (error.message.includes('permission denied') || error.message.includes('not authorized')) {
          throw new Error('You do not have permission to create team members');
        } else if (error.message.includes('foreign key constraint') || error.message.includes('violates')) {
          throw new Error('Invalid data provided for team member creation');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw new Error('Database tables are not properly configured. Please contact system administrator.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Update an existing team member
   */
  async updateTeamMember(id: string, updates: UpdateTeamMemberData): Promise<TeamMember> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to update team members');
    }

    try {
      // Update user data if name, email, or emergency contact changed
      if (updates.firstName || updates.lastName || updates.email || updates.role || 
          updates.emergencyContactName || updates.emergencyContactPhone || updates.emergencyContactRelationship) {
        const userUpdates: any = {};
        if (updates.firstName) userUpdates.first_name = updates.firstName;
        if (updates.lastName) userUpdates.last_name = updates.lastName;
        if (updates.email) userUpdates.email = updates.email;
        if (updates.role) userUpdates.role = updates.role;

        // Handle emergency contact
        if (updates.emergencyContactName || updates.emergencyContactPhone || updates.emergencyContactRelationship) {
          userUpdates.emergency_contact = {
            name: updates.emergencyContactName || '',
            phone: updates.emergencyContactPhone || '',
            relationship: updates.emergencyContactRelationship || ''
          };
        }

        const { error: userError } = await this.getBaseQuery('users')
          .update(userUpdates)
          .eq('id', id);

        if (userError) {
          console.error('User update error:', userError);
          throw new Error(`Failed to update user: ${userError.message}`);
        }
      }

      // Update team member data
      const teamMemberUpdates: any = {};
      if (updates.region) teamMemberUpdates.region = updates.region;
      if (updates.capacity) teamMemberUpdates.capacity = updates.capacity;
      if (updates.travelRadius) teamMemberUpdates.travel_radius = updates.travelRadius;
      if (updates.specializations) teamMemberUpdates.specializations = updates.specializations;
      if (updates.employmentStatus) teamMemberUpdates.employment_status = updates.employmentStatus;
      if (updates.role) teamMemberUpdates.job_title = this.getRoleTitle(updates.role);

      if (Object.keys(teamMemberUpdates).length > 0) {
        const query = this.projectId ? 
          this.getProjectQuery('team_members') :
          this.getBaseQuery('team_members');

        const { error: teamMemberError } = await query
          .update(teamMemberUpdates)
          .eq('id', id);

        if (teamMemberError) {
          console.error('Team member update error:', teamMemberError);
          throw new Error(`Failed to update team member: ${teamMemberError.message}`);
        }
      }

      // Update work preferences if provided
      if (updates.preferredStartTime || updates.maxDailyJobs || updates.maxWeeklyHours !== undefined) {
        const workPrefUpdates: any = {};
        if (updates.preferredStartTime) workPrefUpdates.preferred_start_time = updates.preferredStartTime;
        if (updates.preferredEndTime) workPrefUpdates.preferred_end_time = updates.preferredEndTime;
        if (updates.maxDailyJobs) workPrefUpdates.max_daily_jobs = updates.maxDailyJobs;
        if (updates.maxWeeklyHours !== undefined) workPrefUpdates.max_weekly_hours = updates.maxWeeklyHours;
        if (updates.weekendsAvailable !== undefined) workPrefUpdates.weekends_available = updates.weekendsAvailable;
        if (updates.overtimeAvailable !== undefined) workPrefUpdates.overtime_available = updates.overtimeAvailable;
        if (updates.travelPreference) workPrefUpdates.travel_preference = updates.travelPreference;

        // Try to update existing preferences, if none exist then insert
        const { error: updateError } = await this.getBaseQuery('work_preferences')
          .update(workPrefUpdates)
          .eq('team_member_id', id);

        // If no rows were affected, insert new preferences
        if (updateError && updateError.code === 'PGRST116') {
          await this.getBaseQuery('work_preferences')
            .insert({
              team_member_id: id,
              ...workPrefUpdates
            });
        } else if (updateError) {
          console.warn('Work preferences update failed:', updateError);
        }
      }

      // Log activity
      await this.logActivity(
        'team_member_updated',
        `Updated team member ${id}`,
        'team_member',
        id,
        { updates: Object.keys(updates) }
      );

      return await this.getTeamMemberById(id);
    } catch (error) {
      console.error('Error updating team member:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          throw new Error('You do not have permission to update team members');
        } else if (error.message.includes('not found')) {
          throw new Error('Team member not found');
        }
      }
      
      throw error;
    }
  }

  /**
   * Delete a team member (soft delete)
   */
  async deleteTeamMember(id: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to delete team members');
    }

    try {
      // Instead of hard delete, mark as inactive
      const query = this.projectId ? 
        this.getProjectQuery('team_members') :
        this.getBaseQuery('team_members');

      const { error: teamMemberError } = await query
        .update({ employment_status: 'terminated' })
        .eq('id', id);

      if (teamMemberError) {
        console.error('Team member deactivation error:', teamMemberError);
        throw new Error(`Failed to deactivate team member: ${teamMemberError.message}`);
      }

      // Also deactivate the user (same ID)
      const { error: userError } = await this.getBaseQuery('users')
        .update({ is_active: false })
        .eq('id', id);

      if (userError) {
        console.error('User deactivation error:', userError);
        throw new Error(`Failed to deactivate user: ${userError.message}`);
      }

      // Log activity
      await this.logActivity(
        'team_member_deleted',
        `Deactivated team member ${id}`,
        'team_member',
        id
      );
    } catch (error) {
      console.error('Error deleting team member:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          throw new Error('You do not have permission to delete team members');
        } else if (error.message.includes('not found')) {
          throw new Error('Team member not found');
        }
      }
      
      throw error;
    }
  }

  /**
   * Get a single team member by ID
   */
  async getTeamMemberById(id: string): Promise<TeamMember> {
    try {
      const query = this.projectId ? 
        this.getProjectQuery('team_member_details') :
        this.getBaseQuery('team_member_details');

      const { data, error } = await query
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get additional related data
      const [skillsData, certificationsData, equipmentData, availabilityData, workPrefsData, performanceData] = await Promise.all([
        this.getTeamMemberSkills(id),
        this.getTeamMemberCertifications(id),
        this.getTeamMemberEquipment(id),
        this.getTeamMemberAvailability(id),
        this.getTeamMemberWorkPreferences(id),
        this.getTeamMemberPerformance(id)
      ]);

      return this.transformTeamMemberData(data, skillsData, certificationsData, equipmentData, availabilityData, workPrefsData, performanceData);
    } catch (error) {
      console.error('Error fetching team member:', error);
      throw error;
    }
  }

  /**
   * Helper function to get team member skills
   */
  private async getTeamMemberSkills(teamMemberId: string) {
    const { data, error } = await this.getBaseQuery('team_member_skills')
      .select(`
        level,
        acquired_date,
        last_assessed,
        skills!inner (
          id,
          name,
          category
        )
      `)
      .eq('team_member_id', teamMemberId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Helper function to get team member certifications
   */
  private async getTeamMemberCertifications(teamMemberId: string) {
    const { data, error } = await this.getBaseQuery('certifications')
      .select('*')
      .eq('team_member_id', teamMemberId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Helper function to get team member equipment
   */
  private async getTeamMemberEquipment(teamMemberId: string) {
    const { data, error } = await this.getBaseQuery('equipment')
      .select('*')
      .eq('assigned_to', teamMemberId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Helper function to get team member availability
   */
  private async getTeamMemberAvailability(teamMemberId: string) {
    const { data, error } = await this.getBaseQuery('availability')
      .select('*')
      .eq('team_member_id', teamMemberId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Helper function to get team member work preferences
   */
  private async getTeamMemberWorkPreferences(teamMemberId: string) {
    const { data, error } = await this.getBaseQuery('work_preferences')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Helper function to get team member performance
   */
  private async getTeamMemberPerformance(teamMemberId: string) {
    const { data, error } = await this.getBaseQuery('performance_metrics')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Transform database data to TeamMember type
   */
  private transformTeamMemberData(tm: any, skills: any[], certifications: any[], equipment: any[], availability: any[], workPrefs: any, performance: any): TeamMember {
    return {
      id: tm.id,
      email: tm.email,
      firstName: tm.first_name,
      lastName: tm.last_name,
      role: tm.role,
      isActive: tm.employment_status === 'active',
      createdAt: tm.created_at,
      updatedAt: tm.updated_at,
      region: tm.region,
      subRegions: tm.sub_regions || [],
      specializations: tm.specializations || [],
      skills: skills.map(s => ({
        id: s.skills.id,
        name: s.skills.name,
        category: s.skills.category,
        level: s.level,
        acquiredDate: s.acquired_date,
        lastAssessed: s.last_assessed,
        assessedBy: undefined,
        notes: undefined
      })),
      certifications: certifications.map(c => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        certificationNumber: c.certification_number,
        issueDate: c.issue_date,
        expirationDate: c.expiration_date,
        status: c.status,
        renewalRequired: c.renewal_required,
        documentUrl: c.document_url,
        cost: c.cost,
        notes: c.notes
      })),
      equipment: equipment.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        serialNumber: e.serial_number,
        assignedDate: e.assigned_date,
        status: e.status,
        condition: e.condition,
        lastInspected: e.last_inspected,
        nextInspectionDue: e.next_inspection_due,
        purchaseDate: e.purchase_date,
        warranty: e.warranty_expiration ? {
          expirationDate: e.warranty_expiration,
          provider: e.warranty_provider || ''
        } : undefined,
        specifications: e.specifications || {},
        notes: e.notes
      })),
      availability: availability.map(a => ({
        id: a.id,
        teamMemberId: a.team_member_id,
        startDate: a.start_date,
        endDate: a.end_date,
        startTime: a.start_time,
        endTime: a.end_time,
        isRecurring: a.is_recurring,
        recurringDays: a.recurring_days,
        isAvailable: a.is_available,
        notes: a.notes
      })),
      capacity: tm.capacity || 8,
      travelRadius: tm.travel_radius || 50,
      coordinates: undefined,
      homeBase: undefined,
      performanceMetrics: performance ? {
        completionRate: performance.completion_rate,
        averageTime: performance.average_time,
        customerSatisfaction: performance.customer_satisfaction,
        travelEfficiency: performance.travel_efficiency,
        totalJobs: performance.total_jobs,
        totalDistance: performance.total_distance,
        qualityScore: performance.quality_score,
        safetyScore: performance.safety_score,
        punctualityScore: performance.punctuality_score,
        communicationScore: performance.communication_score,
        revenueGenerated: performance.revenue_generated,
        overtimeHours: performance.overtime_hours,
        periodStart: performance.period_start,
        periodEnd: performance.period_end
      } : undefined,
      emergencyContact: tm.emergency_contact ? {
        name: tm.emergency_contact.name || 'Not provided',
        relationship: tm.emergency_contact.relationship || 'Not specified',
        phoneNumber: tm.emergency_contact.phone || 'Not provided'
      } : {
        name: 'Not provided',
        relationship: 'Not specified',
        phoneNumber: 'Not provided'
      },
      preferredPartners: [],
      workPreferences: {
        preferredStartTime: workPrefs?.preferred_start_time || '08:00',
        preferredEndTime: workPrefs?.preferred_end_time || '17:00',
        maxDailyJobs: workPrefs?.max_daily_jobs || 5,
        maxWeeklyHours: workPrefs?.max_weekly_hours || 40,
        weekendsAvailable: workPrefs?.weekends_available || false,
        overtimeAvailable: workPrefs?.overtime_available || false,
        travelPreference: workPrefs?.travel_preference || 'regional',
        specialRequests: workPrefs?.special_requests || [],
        unavailableDates: workPrefs?.unavailable_dates || []
      },
      trainingRecord: [],
      employmentInfo: {
        employeeId: tm.employee_id || '',
        hireDate: tm.created_at.split('T')[0],
        department: 'Installation Services',
        jobTitle: tm.job_title || 'Team Member',
        workLocation: tm.region,
        employmentType: 'full_time',
        status: tm.employment_status || 'active'
      },
      profilePhoto: undefined,
      notes: undefined
    };
  }

  /**
   * Helper function to get role title
   */
  private getRoleTitle(role: string): string {
    const roleTitles: { [key: string]: string } = {
      'admin': 'System Administrator',
      'scheduler': 'Installation Scheduler',
      'lead': 'Lead Installer',
      'assistant': 'Installation Assistant',
      'viewer': 'Viewer'
    };
    return roleTitles[role] || 'Team Member';
  }
}

export default MultiTenantTeamService;