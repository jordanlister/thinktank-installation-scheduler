// Think Tank Technologies - Assignment Service
// Handles all assignment-related database operations

import { supabase } from './supabase';
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

export class AssignmentService {
  /**
   * Get all assignments with related data
   */
  static async getAllAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
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
  }

  /**
   * Get assignments for a specific date range
   */
  static async getAssignmentsByDateRange(startDate: string, endDate: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
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
  }

  /**
   * Get assignments for a specific team member
   */
  static async getAssignmentsByTeamMember(teamMemberId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
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
  }

  /**
   * Create a new assignment
   */
  static async createAssignment(request: CreateAssignmentRequest): Promise<AssignmentResult> {
    const { data, error } = await supabase
      .from('assignments')
      .insert([{
        installation_id: request.installationId,
        lead_id: request.leadId,
        assistant_id: request.assistantId,
        assigned_by: 'current_user', // This should be set from auth context
        status: 'assigned' as AssignmentStatus,
        notes: request.notes,
        buffer_time: 30 // default buffer time
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }

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
  }

  /**
   * Update an existing assignment
   */
  static async updateAssignment(id: string, updates: UpdateAssignmentRequest): Promise<Assignment> {
    const updateData: any = {};
    
    if (updates.leadId) updateData.lead_id = updates.leadId;
    if (updates.assistantId) updateData.assistant_id = updates.assistantId;
    if (updates.status) updateData.status = updates.status;
    if (updates.notes) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('assignments')
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

    return this.transformDatabaseAssignment(data);
  }

  /**
   * Delete an assignment
   */
  static async deleteAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }
  }

  /**
   * Detect scheduling conflicts
   */
  static async detectConflicts(dateRange: { start: string; end: string }): Promise<AssignmentConflict[]> {
    // This is a simplified conflict detection - in production you'd have more sophisticated logic
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
  }

  /**
   * Calculate workload distribution for team members
   */
  static async calculateWorkloadDistribution(dateRange: { start: string; end: string }): Promise<WorkloadData[]> {
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
  }

  /**
   * Get assignment analytics for a period
   */
  static async getAssignmentAnalytics(period: { start: string; end: string }): Promise<AssignmentAnalytics> {
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
  }

  /**
   * Transform database assignment data to application format
   */
  private static transformDatabaseAssignment(data: any): Assignment {
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

export default AssignmentService;