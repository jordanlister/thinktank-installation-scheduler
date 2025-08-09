// Think Tank Technologies - Multi-Tenant Assignment Service
// Transforms the original assignment service for multi-tenant support

import { MultiTenantService, TenantContext } from './multiTenantService';
import type { 
  Assignment, 
  AssignmentStatus,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentConflict,
  WorkloadData,
  BulkAssignmentRequest,
  BulkAssignmentResult,
  AssignmentResult,
  AssignmentAnalytics
} from '../types';

export class MultiTenantAssignmentService extends MultiTenantService {

  /**
   * Get all assignments within the current organization/project context
   */
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const { data, error } = await this.getProjectQuery('assignments')
        .select(`
          id,
          installation_id,
          lead_id,
          assistant_id,
          assigned_at,
          assigned_by,
          status,
          estimated_travel_time,
          estimated_travel_distance,
          actual_travel_time,
          actual_travel_distance,
          travel_route,
          buffer_time,
          workload_score,
          efficiency_score,
          notes,
          installations!inner (
            id,
            customer_name,
            scheduled_date,
            scheduled_time,
            duration,
            status as installation_status,
            priority
          ),
          lead:team_members!assignments_lead_id_fkey (
            id,
            users!inner (first_name, last_name, email)
          ),
          assistant:team_members!assignments_assistant_id_fkey (
            id,
            users!inner (first_name, last_name, email)
          )
        `);

      if (error) {
        throw new Error(`Failed to fetch assignments: ${error.message}`);
      }

      return data.map(this.transformDatabaseAssignment);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a specific date range within project context
   */
  async getAssignmentsByDateRange(startDate: string, endDate: string): Promise<Assignment[]> {
    try {
      const { data, error } = await this.getProjectQuery('assignments')
        .select(`
          *,
          installations!inner (
            id,
            customer_name,
            scheduled_date,
            scheduled_time,
            duration,
            status,
            priority
          ),
          lead:team_members!assignments_lead_id_fkey (
            id,
            users!inner (first_name, last_name)
          ),
          assistant:team_members!assignments_assistant_id_fkey (
            id,
            users!inner (first_name, last_name)
          )
        `)
        .gte('installations.scheduled_date', startDate)
        .lte('installations.scheduled_date', endDate);

      if (error) {
        throw new Error(`Failed to fetch assignments by date range: ${error.message}`);
      }

      return data.map(this.transformDatabaseAssignment);
    } catch (error) {
      console.error('Error fetching assignments by date range:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a specific team member within project context
   */
  async getAssignmentsByTeamMember(teamMemberId: string): Promise<Assignment[]> {
    try {
      const { data, error } = await this.getProjectQuery('assignments')
        .select(`
          *,
          installations!inner (*),
          lead:team_members!assignments_lead_id_fkey (
            id,
            users!inner (first_name, last_name)
          ),
          assistant:team_members!assignments_assistant_id_fkey (
            id,
            users!inner (first_name, last_name)
          )
        `)
        .or(`lead_id.eq.${teamMemberId},assistant_id.eq.${teamMemberId}`);

      if (error) {
        throw new Error(`Failed to fetch team member assignments: ${error.message}`);
      }

      return data.map(this.transformDatabaseAssignment);
    } catch (error) {
      console.error('Error fetching team member assignments:', error);
      throw error;
    }
  }

  /**
   * Create a new assignment within project context
   */
  async createAssignment(request: CreateAssignmentRequest): Promise<AssignmentResult> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to create assignments');
    }

    if (!this.projectId) {
      throw new Error('Project context required to create assignments');
    }

    try {
      // Validate that installation and team members belong to the same project
      await this.validateAssignmentContext(request.installationId, request.leadId, request.assistantId);

      const assignmentData = this.addProjectContext({
        installation_id: request.installationId,
        lead_id: request.leadId,
        assistant_id: request.assistantId,
        assigned_by: this.userId,
        status: 'assigned' as AssignmentStatus,
        notes: request.notes,
        buffer_time: 30 // default buffer time
      });

      const { data, error } = await this.getProjectQuery('assignments')
        .insert([assignmentData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create assignment: ${error.message}`);
      }

      // Log activity
      await this.logActivity(
        'assignment_created',
        `Created assignment for installation ${request.installationId}`,
        'assignment',
        data.id,
        { installationId: request.installationId, leadId: request.leadId }
      );

      return {
        assignmentId: data.id,
        installationId: request.installationId,
        teamMemberId: request.leadId || '',
        confidence: 0.9,
        score: 85,
        reasoning: ['Manual assignment created'],
        alternatives: [],
        warnings: []
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Update an existing assignment
   */
  async updateAssignment(id: string, updates: UpdateAssignmentRequest): Promise<Assignment> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to update assignments');
    }

    try {
      // Validate assignment belongs to current project
      await this.validateAssignmentExists(id);

      const updateData: any = {};
      
      if (updates.leadId) {
        await this.validateTeamMemberInProject(updates.leadId);
        updateData.lead_id = updates.leadId;
      }
      if (updates.assistantId) {
        await this.validateTeamMemberInProject(updates.assistantId);
        updateData.assistant_id = updates.assistantId;
      }
      if (updates.status) updateData.status = updates.status;
      if (updates.notes) updateData.notes = updates.notes;

      const { data, error } = await this.getProjectQuery('assignments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          installations!inner (*),
          lead:team_members!assignments_lead_id_fkey (
            id,
            users!inner (first_name, last_name)
          ),
          assistant:team_members!assignments_assistant_id_fkey (
            id,
            users!inner (first_name, last_name)
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update assignment: ${error.message}`);
      }

      // Log activity
      await this.logActivity(
        'assignment_updated',
        `Updated assignment ${id}`,
        'assignment',
        id,
        { updates: Object.keys(updateData) }
      );

      return this.transformDatabaseAssignment(data);
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(id: string): Promise<void> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to delete assignments');
    }

    try {
      // Validate assignment belongs to current project
      await this.validateAssignmentExists(id);

      const { error } = await this.getProjectQuery('assignments')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete assignment: ${error.message}`);
      }

      // Log activity
      await this.logActivity(
        'assignment_deleted',
        `Deleted assignment ${id}`,
        'assignment',
        id
      );
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  }

  /**
   * Detect scheduling conflicts within project context
   */
  async detectConflicts(dateRange: { start: string; end: string }): Promise<AssignmentConflict[]> {
    try {
      const assignments = await this.getAssignmentsByDateRange(dateRange.start, dateRange.end);
      const conflicts: AssignmentConflict[] = [];

      // Group assignments by team member and date
      const assignmentsByTeamAndDate = assignments.reduce((acc, assignment) => {
        const key = `${assignment.leadId}_${assignment.installationId}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(assignment);
        return acc;
      }, {} as Record<string, Assignment[]>);

      // Check for time overlaps
      Object.entries(assignmentsByTeamAndDate).forEach(([key, teamAssignments]) => {
        if (teamAssignments.length > 1) {
          teamAssignments.forEach((assignment, index) => {
            teamAssignments.slice(index + 1).forEach(otherAssignment => {
              conflicts.push({
                id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'time_overlap',
                affectedAssignments: [assignment.id, otherAssignment.id],
                severity: 'medium',
                description: 'Team member has overlapping assignments',
                detectedAt: new Date().toISOString(),
                suggestedResolutions: [
                  {
                    id: 'resolution_1',
                    method: 'reschedule',
                    description: 'Reschedule one of the conflicting assignments',
                    impactScore: 5,
                    estimatedEffort: 2,
                    affectedAssignments: [assignment.id, otherAssignment.id],
                    executionSteps: [
                      {
                        id: 'step_1',
                        order: 1,
                        action: 'reschedule_assignment',
                        parameters: { assignmentId: otherAssignment.id },
                        validationRules: ['check_team_availability'],
                        rollbackAction: 'restore_original_schedule'
                      }
                    ]
                  }
                ],
                autoResolvable: true,
                impactScore: 7
              });
            });
          });
        }
      });

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  /**
   * Calculate workload distribution for team members in current project
   */
  async calculateWorkloadDistribution(dateRange: { start: string; end: string }): Promise<WorkloadData[]> {
    try {
      const assignments = await this.getAssignmentsByDateRange(dateRange.start, dateRange.end);
      const workloadMap = new Map<string, WorkloadData>();

      assignments.forEach(assignment => {
        const teamMemberId = assignment.leadId;
        const date = assignment.installationId; // This should be extracted from installation data
        const key = `${teamMemberId}_${date}`;

        if (!workloadMap.has(key)) {
          workloadMap.set(key, {
            teamMemberId,
            date,
            assignedHours: 0,
            capacity: 8 * 60, // 8 hours in minutes
            efficiency: 0.8,
            conflicts: 0,
            utilizationPercentage: 0,
            workloadStatus: 'optimal',
            assignments: [],
            travelTime: 0,
            bufferTime: 0,
            overtimeHours: 0
          });
        }

        const workload = workloadMap.get(key)!;
        workload.assignedHours += assignment.estimatedDuration || 120; // default 2 hours
        workload.assignments.push(assignment.id);
        workload.travelTime += assignment.estimatedTravelTime || 30;
        workload.bufferTime += assignment.bufferTime || 30;
      });

      // Calculate utilization and status
      workloadMap.forEach(workload => {
        workload.utilizationPercentage = (workload.assignedHours / workload.capacity) * 100;
        
        if (workload.utilizationPercentage > 100) {
          workload.workloadStatus = 'overloaded';
          workload.overtimeHours = workload.assignedHours - workload.capacity;
        } else if (workload.utilizationPercentage > 90) {
          workload.workloadStatus = 'critical';
        } else if (workload.utilizationPercentage < 60) {
          workload.workloadStatus = 'underutilized';
        }
      });

      return Array.from(workloadMap.values());
    } catch (error) {
      console.error('Error calculating workload distribution:', error);
      throw error;
    }
  }

  /**
   * Get assignment analytics for a period within project context
   */
  async getAssignmentAnalytics(period: { start: string; end: string }): Promise<AssignmentAnalytics> {
    try {
      const assignments = await this.getAssignmentsByDateRange(period.start, period.end);
      const conflicts = await this.detectConflicts(period);
      
      const totalAssignments = assignments.length;
      const autoAssignments = assignments.filter(a => a.metadata?.autoAssigned).length;
      const manualAssignments = totalAssignments - autoAssignments;
      const reassignments = assignments.filter(a => a.metadata?.originalAssignmentId).length;

      return {
        period,
        totalAssignments,
        autoAssignments,
        manualAssignments,
        reassignments,
        conflicts: conflicts.length,
        resolutionRate: 0.95, // This would be calculated from actual resolution data
        averageResponseTime: 300, // 5 minutes
        teamUtilization: [], // This would be calculated from workload data
        workloadDistribution: {
          variance: 0.2,
          standardDeviation: 0.45,
          balanceScore: 0.8,
          overutilizedTeamMembers: 0,
          underutilizedTeamMembers: 1,
          optimalTeamMembers: assignments.length - 1,
          redistributionOpportunities: 2
        },
        efficiencyMetrics: {
          averageAssignmentTime: 120,
          averageTravelDistance: 25,
          skillMatchRate: 0.9,
          geographicEfficiency: 0.85,
          conflictRate: conflicts.length / totalAssignments,
          autoResolutionRate: 0.8,
          customerSatisfactionImpact: 0.95,
          costPerAssignment: 150
        },
        trendData: [],
        recommendations: []
      };
    } catch (error) {
      console.error('Error generating assignment analytics:', error);
      throw error;
    }
  }

  /**
   * Bulk assignment creation within project context
   */
  async createBulkAssignments(requests: BulkAssignmentRequest[]): Promise<BulkAssignmentResult> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to create bulk assignments');
    }

    if (!this.projectId) {
      throw new Error('Project context required for bulk assignments');
    }

    const results: AssignmentResult[] = [];
    const errors: { request: BulkAssignmentRequest; error: string }[] = [];

    for (const request of requests) {
      try {
        const result = await this.createAssignment(request);
        results.push(result);
      } catch (error) {
        errors.push({
          request,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: requests.length,
      successCount: results.length,
      failureCount: errors.length
    };
  }

  /**
   * Validate assignment context (installation and team members in same project)
   */
  private async validateAssignmentContext(
    installationId: string,
    leadId?: string,
    assistantId?: string
  ): Promise<void> {
    // Validate installation belongs to current project
    const { data: installation, error: installationError } = await this.getProjectQuery('installations')
      .select('id')
      .eq('id', installationId)
      .single();

    if (installationError || !installation) {
      throw new Error('Installation not found in current project');
    }

    // Validate team members belong to current project
    if (leadId) {
      await this.validateTeamMemberInProject(leadId);
    }
    if (assistantId) {
      await this.validateTeamMemberInProject(assistantId);
    }
  }

  /**
   * Validate team member belongs to current project
   */
  private async validateTeamMemberInProject(teamMemberId: string): Promise<void> {
    const { data: teamMember, error } = await this.getProjectQuery('team_members')
      .select('id')
      .eq('id', teamMemberId)
      .single();

    if (error || !teamMember) {
      throw new Error(`Team member ${teamMemberId} not found in current project`);
    }
  }

  /**
   * Validate assignment exists in current project
   */
  private async validateAssignmentExists(assignmentId: string): Promise<void> {
    const { data: assignment, error } = await this.getProjectQuery('assignments')
      .select('id')
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      throw new Error(`Assignment ${assignmentId} not found in current project`);
    }
  }

  /**
   * Transform database assignment data to application format
   */
  private transformDatabaseAssignment(data: any): Assignment {
    return {
      id: data.id,
      installationId: data.installation_id,
      leadId: data.lead_id,
      assistantId: data.assistant_id,
      assignedAt: data.assigned_at,
      assignedBy: data.assigned_by,
      status: data.status,
      priority: data.installations?.priority || 'medium',
      estimatedDuration: data.installations?.duration || 120,
      actualDuration: data.actual_duration,
      notes: data.notes,
      estimatedTravelTime: data.estimated_travel_time,
      estimatedTravelDistance: data.estimated_travel_distance,
      actualTravelTime: data.actual_travel_time,
      actualTravelDistance: data.actual_travel_distance,
      travelRoute: data.travel_route,
      bufferTime: data.buffer_time,
      workloadScore: data.workload_score,
      efficiencyScore: data.efficiency_score,
      metadata: {
        autoAssigned: false, // This would be determined from the assignment creation context
        conflictResolved: false,
        workloadScore: data.workload_score || 0.8,
        efficiencyScore: data.efficiency_score || 0.9,
        customerPreference: false
      },
      history: [] // This would need to be implemented with a separate history tracking system
    };
  }
}

export default MultiTenantAssignmentService;