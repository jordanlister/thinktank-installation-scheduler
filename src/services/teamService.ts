// Think Tank Technologies - Team Management Service

import { supabase } from './supabase';
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

export const teamService = {
  // Get all team members
  async getTeamMembers(): Promise<{ data: TeamMember[], error?: any }> {
    try {
      const { data, error } = await supabase
        .from('team_member_details')
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
  },

  // Create a new team member
  async createTeamMember(data: CreateTeamMemberData): Promise<TeamMember> {
    try {
      // First create the user record
      const userInsert: any = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role
      };

      // Add emergency contact if provided
      if (data.emergencyContactName) {
        userInsert.emergency_contact = {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelationship
        };
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(userInsert)
        .select()
        .single();

      if (userError) throw userError;

      // Then create the team member record using the same ID
      const { data: teamMemberData, error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          id: userData.id, // Use the same ID as the user
          employee_id: `EMP${Date.now()}`, // Generate employee ID
          region: data.region,
          capacity: data.capacity,
          travel_radius: data.travelRadius,
          specializations: data.specializations || [],
          hire_date: new Date().toISOString().split('T')[0],
          employment_status: 'active',
          job_title: this.getRoleTitle(data.role)
        })
        .select()
        .single();

      if (teamMemberError) throw teamMemberError;

      // Create work preferences if provided
      if (data.preferredStartTime || data.maxDailyJobs) {
        await supabase
          .from('work_preferences')
          .insert({
            team_member_id: teamMemberData.id,
            preferred_start_time: data.preferredStartTime || '08:00',
            preferred_end_time: data.preferredEndTime || '17:00',
            max_daily_jobs: data.maxDailyJobs || 5,
            max_weekly_hours: data.maxWeeklyHours || 40,
            weekends_available: data.weekendsAvailable || false,
            overtime_available: data.overtimeAvailable || false,
            travel_preference: data.travelPreference || 'regional'
          });
      }

      // Return the complete team member data
      return await this.getTeamMemberById(teamMemberData.id);
    } catch (error) {
      console.error('Error creating team member:', error);
      throw error;
    }
  },

  // Update an existing team member
  async updateTeamMember(id: string, updates: UpdateTeamMemberData): Promise<TeamMember> {
    try {
      // Update user data if name, email, or emergency contact changed (team_member.id = user.id)
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
            name: updates.emergencyContactName,
            phone: updates.emergencyContactPhone,
            relationship: updates.emergencyContactRelationship
          };
        }

        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', id); // Use the same ID

        if (userError) throw userError;
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
        const { error: teamMemberError } = await supabase
          .from('team_members')
          .update(teamMemberUpdates)
          .eq('id', id);

        if (teamMemberError) throw teamMemberError;
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

        // First try to update existing preferences
        const { error: updateError } = await supabase
          .from('work_preferences')
          .update(workPrefUpdates)
          .eq('team_member_id', id);

        // If no existing preferences, create new ones
        if (updateError && updateError.code === 'PGRST116') {
          await supabase
            .from('work_preferences')
            .insert({
              team_member_id: id,
              ...workPrefUpdates
            });
        } else if (updateError) {
          throw updateError;
        }
      }

      return await this.getTeamMemberById(id);
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  },

  // Delete a team member
  async deleteTeamMember(id: string): Promise<void> {
    try {
      // Instead of hard delete, mark as inactive
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ employment_status: 'terminated' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Also deactivate the user (same ID)
      const { error: userError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id);

      if (userError) throw userError;
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  },

  // Get a single team member by ID
  async getTeamMemberById(id: string): Promise<TeamMember> {
    try {
      const { data, error } = await supabase
        .from('team_member_details')
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
  },

  // Helper function to get team member skills
  async getTeamMemberSkills(teamMemberId: string) {
    const { data, error } = await supabase
      .from('team_member_skills')
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
  },

  // Helper function to get team member certifications
  async getTeamMemberCertifications(teamMemberId: string) {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('team_member_id', teamMemberId);

    if (error) throw error;
    return data || [];
  },

  // Helper function to get team member equipment
  async getTeamMemberEquipment(teamMemberId: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('assigned_to', teamMemberId);

    if (error) throw error;
    return data || [];
  },

  // Helper function to get team member availability
  async getTeamMemberAvailability(teamMemberId: string) {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('team_member_id', teamMemberId);

    if (error) throw error;
    return data || [];
  },

  // Helper function to get team member work preferences
  async getTeamMemberWorkPreferences(teamMemberId: string) {
    const { data, error } = await supabase
      .from('work_preferences')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Helper function to get team member performance
  async getTeamMemberPerformance(teamMemberId: string) {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Transform database data to TeamMember type
  transformTeamMemberData(tm: any, skills: any[], certifications: any[], equipment: any[], availability: any[], workPrefs: any, performance: any): TeamMember {
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
      homeBase: undefined, // Will be populated from addresses table if needed
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
  },

  // Helper function to get role title
  getRoleTitle(role: string): string {
    const roleTitles: { [key: string]: string } = {
      'admin': 'System Administrator',
      'scheduler': 'Installation Scheduler',
      'lead': 'Lead Installer',
      'assistant': 'Installation Assistant',
      'viewer': 'Viewer'
    };
    return roleTitles[role] || 'Team Member';
  },

  // Manage team member schedule
  async updateTeamMemberSchedule(teamMemberId: string, scheduleData: any): Promise<void> {
    try {
      // Implementation for schedule management would go here
      // This could involve updating availability, creating assignments, etc.
      console.log('Schedule management for team member:', teamMemberId, scheduleData);
      
      // For now, we'll just show that the function was called
      // In a real implementation, this would update availability and assignments
    } catch (error) {
      console.error('Error updating team member schedule:', error);
      throw error;
    }
  },

  // Skills Management
  async getAllSkills() {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async addTeamMemberSkill(teamMemberId: string, skillId: string, level: string, notes?: string) {
    const { data, error } = await supabase
      .from('team_member_skills')
      .insert({
        team_member_id: teamMemberId,
        skill_id: skillId,
        level,
        notes,
        acquired_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeTeamMemberSkill(teamMemberId: string, skillId: string) {
    const { error } = await supabase
      .from('team_member_skills')
      .delete()
      .eq('team_member_id', teamMemberId)
      .eq('skill_id', skillId);

    if (error) throw error;
  },

  async updateTeamMemberSkill(teamMemberId: string, skillId: string, updates: any) {
    const { data, error } = await supabase
      .from('team_member_skills')
      .update(updates)
      .eq('team_member_id', teamMemberId)
      .eq('skill_id', skillId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Certifications Management
  async addCertification(teamMemberId: string, certificationData: any) {
    const { data, error } = await supabase
      .from('certifications')
      .insert({
        team_member_id: teamMemberId,
        ...certificationData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeCertification(certificationId: string) {
    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certificationId);

    if (error) throw error;
  },

  async updateCertification(certificationId: string, updates: any) {
    const { data, error } = await supabase
      .from('certifications')
      .update(updates)
      .eq('id', certificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Equipment Management
  async getAvailableEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('status', 'available')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async assignEquipment(equipmentId: string, teamMemberId: string) {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        assigned_to: teamMemberId,
        assigned_date: new Date().toISOString().split('T')[0],
        status: 'assigned'
      })
      .eq('id', equipmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unassignEquipment(equipmentId: string) {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        assigned_to: null,
        assigned_date: null,
        status: 'available'
      })
      .eq('id', equipmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Availability Management
  async addAvailability(teamMemberId: string, availabilityData: any) {
    const { data, error } = await supabase
      .from('availability')
      .insert({
        team_member_id: teamMemberId,
        ...availabilityData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeAvailability(availabilityId: string) {
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', availabilityId);

    if (error) throw error;
  },

  async updateWorkPreferences(teamMemberId: string, preferences: any) {
    const { data, error } = await supabase
      .from('work_preferences')
      .upsert({
        team_member_id: teamMemberId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Advanced Schedule Management
  async getTeamMemberSchedule(teamMemberId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('availability')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .order('start_date', { ascending: true });

    if (startDate) {
      query = query.gte('end_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateAvailability(availabilityId: string, updates: any) {
    const { data, error } = await supabase
      .from('availability')
      .update(updates)
      .eq('id', availabilityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkAddAvailability(teamMemberId: string, availabilityEntries: any[]) {
    const entries = availabilityEntries.map(entry => ({
      team_member_id: teamMemberId,
      ...entry
    }));

    const { data, error } = await supabase
      .from('availability')
      .insert(entries)
      .select();

    if (error) throw error;
    return data || [];
  },

  async clearTeamMemberSchedule(teamMemberId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('availability')
      .delete()
      .eq('team_member_id', teamMemberId);

    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async getScheduleConflicts(teamMemberId: string, startDate: string, endDate: string) {
    // Check for overlapping availability entries
    const { data: overlapping, error } = await supabase
      .from('availability')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (error) throw error;

    // In a full implementation, this would also check against:
    // - Job assignments
    // - Company holidays
    // - Team capacity limits
    // - Other business rules

    return {
      overlapping: overlapping || [],
      conflicts: [] // Placeholder for detected conflicts
    };
  },

  async applyScheduleTemplate(teamMemberId: string, templateType: string, startDate: string, endDate: string) {
    const templates = {
      'standard': {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '08:00',
        endTime: '17:00',
        isAvailable: true
      },
      'extended': {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        startTime: '07:00',
        endTime: '18:00',
        isAvailable: true
      },
      'parttime': {
        days: ['monday', 'wednesday', 'friday'],
        startTime: '09:00',
        endTime: '15:00',
        isAvailable: true
      }
    };

    const template = templates[templateType as keyof typeof templates];
    if (!template) throw new Error('Invalid template type');

    const availabilityEntry = {
      start_date: startDate,
      end_date: endDate,
      start_time: template.startTime,
      end_time: template.endTime,
      is_available: template.isAvailable,
      is_recurring: true,
      recurring_days: template.days,
      notes: `Applied ${templateType} template`
    };

    return await this.addAvailability(teamMemberId, availabilityEntry);
  }
};