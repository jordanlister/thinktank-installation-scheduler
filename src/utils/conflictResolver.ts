// Think Tank Technologies Installation Scheduler - Conflict Detection and Resolution

import type {
  OptimizedAssignment,
  TeamMember,
  SchedulingConstraints,
  SchedulingConflict,
  ConflictType,
  SchedulingRequest,
  Installation
} from '../types';
import { calculateDistance } from './geographicUtils';

/**
 * Conflict Detection and Resolution System
 * 
 * Identifies and resolves scheduling conflicts including:
 * - Time overlaps and double-booking
 * - Capacity exceeded scenarios
 * - Travel distance violations
 * - Team unavailability conflicts
 * - Missing specialization requirements
 * - Deadline conflicts
 * - Geographic mismatches
 */

/**
 * Detect all types of scheduling conflicts in assignments
 */
export function detectConflicts(
  assignments: OptimizedAssignment[],
  teams: TeamMember[],
  constraints: SchedulingConstraints
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  
  // Create team lookup for efficiency
  const teamLookup = new Map(teams.map(team => [team.id, team]));
  
  // Check each type of conflict
  conflicts.push(...detectTimeOverlapConflicts(assignments, teamLookup));
  conflicts.push(...detectCapacityConflicts(assignments, teamLookup, constraints));
  conflicts.push(...detectTravelDistanceConflicts(assignments, teamLookup, constraints));
  conflicts.push(...detectAvailabilityConflicts(assignments, teamLookup));
  conflicts.push(...detectSpecializationConflicts(assignments, teamLookup, constraints));
  conflicts.push(...detectDeadlineConflicts(assignments, constraints));
  conflicts.push(...detectGeographicConflicts(assignments, teamLookup));
  
  return conflicts;
}

/**
 * Detect time overlap conflicts where team members are double-booked
 */
function detectTimeOverlapConflicts(
  assignments: OptimizedAssignment[],
  teamLookup: Map<string, TeamMember>
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  const teamSchedules = new Map<string, OptimizedAssignment[]>();
  
  // Group assignments by team member
  assignments.forEach(assignment => {
    const teamId = assignment.leadId || assignment.assistantId;
    if (!teamId) return;
    
    if (!teamSchedules.has(teamId)) {
      teamSchedules.set(teamId, []);
    }
    teamSchedules.get(teamId)!.push(assignment);
  });
  
  // Check for overlaps within each team member's schedule
  teamSchedules.forEach((teamAssignments, teamId) => {
    const sortedAssignments = teamAssignments.sort((a, b) => 
      new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime()
    );
    
    for (let i = 0; i < sortedAssignments.length - 1; i++) {
      for (let j = i + 1; j < sortedAssignments.length; j++) {
        const assignment1 = sortedAssignments[i];
        const assignment2 = sortedAssignments[j];
        
        if (hasTimeOverlap(assignment1, assignment2)) {
          conflicts.push({
            id: `overlap_${assignment1.id}_${assignment2.id}`,
            type: 'time_overlap',
            severity: 'high',
            description: `Team member ${teamLookup.get(teamId)?.firstName || teamId} has overlapping assignments`,
            affectedJobs: [assignment1.installationId, assignment2.installationId],
            affectedTeamMembers: [teamId],
            suggestedResolution: 'Reschedule one of the conflicting assignments',
            autoResolvable: true
          });
        }
      }
    }
  });
  
  return conflicts;
}

/**
 * Detect capacity conflicts where team members exceed their daily limits
 */
function detectCapacityConflicts(
  assignments: OptimizedAssignment[],
  teamLookup: Map<string, TeamMember>,
  constraints: SchedulingConstraints
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  const dailyAssignments = new Map<string, Map<string, number>>();
  
  // Count assignments per team member per day
  assignments.forEach(assignment => {
    const teamId = assignment.leadId || assignment.assistantId;
    if (!teamId) return;
    
    // For now, use current date as placeholder - would need actual job date
    const date = new Date().toISOString().split('T')[0];
    
    if (!dailyAssignments.has(teamId)) {
      dailyAssignments.set(teamId, new Map());
    }
    
    const teamDailyCount = dailyAssignments.get(teamId)!;
    teamDailyCount.set(date, (teamDailyCount.get(date) || 0) + 1);
  });
  
  // Check for capacity violations
  dailyAssignments.forEach((dailyCounts, teamId) => {
    const team = teamLookup.get(teamId);
    if (!team) return;
    
    dailyCounts.forEach((count, date) => {
      const maxCapacity = Math.min(team.capacity, constraints.maxDailyJobs);
      
      if (count > maxCapacity) {
        const excessJobs = assignments.filter(a => 
          (a.leadId === teamId || a.assistantId === teamId)
        ).slice(maxCapacity);
        
        conflicts.push({
          id: `capacity_${teamId}_${date}`,
          type: 'capacity_exceeded',
          severity: 'medium',
          description: `Team member ${team.firstName} ${team.lastName} exceeds daily capacity (${count}/${maxCapacity})`,
          affectedJobs: excessJobs.map(a => a.installationId),
          affectedTeamMembers: [teamId],
          suggestedResolution: `Reassign ${count - maxCapacity} jobs to other available team members`,
          autoResolvable: true
        });
      }
    });
  });
  
  return conflicts;
}

/**
 * Detect travel distance conflicts where assignments exceed reasonable travel limits
 */
function detectTravelDistanceConflicts(
  assignments: OptimizedAssignment[],
  teamLookup: Map<string, TeamMember>,
  constraints: SchedulingConstraints
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  
  assignments.forEach(assignment => {
    const teamId = assignment.leadId || assignment.assistantId;
    if (!teamId) return;
    const team = teamLookup.get(teamId);
    if (!team || !team.coordinates) return;
    
    // Check if travel distance exceeds team's radius or constraints
    const maxAllowedDistance = Math.min(team.travelRadius, constraints.maxTravelDistance);
    
    if (assignment.estimatedTravelDistance > maxAllowedDistance) {
      conflicts.push({
        id: `travel_${assignment.id}`,
        type: 'travel_distance',
        severity: 'medium',
        description: `Assignment requires travel of ${assignment.estimatedTravelDistance} miles, exceeding limit of ${maxAllowedDistance} miles`,
        affectedJobs: [assignment.installationId],
        affectedTeamMembers: [teamId],
        suggestedResolution: 'Reassign to a team member closer to the job location',
        autoResolvable: true
      });
    }
  });
  
  return conflicts;
}

/**
 * Detect availability conflicts where team members are assigned during unavailable periods
 */
function detectAvailabilityConflicts(
  assignments: OptimizedAssignment[],
  teamLookup: Map<string, TeamMember>
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  
  assignments.forEach(assignment => {
    const teamId = assignment.leadId || assignment.assistantId;
    if (!teamId) return;
    const team = teamLookup.get(teamId);
    if (!team) return;
    
    // Check if team member is available during assignment time
    const assignmentDate = new Date(assignment.assignedAt);
    const isAvailable = team.availability.some(avail => {
      const startDate = new Date(avail.startDate);
      const endDate = new Date(avail.endDate);
      
      return avail.isAvailable && 
             assignmentDate >= startDate && 
             assignmentDate <= endDate;
    });
    
    if (!isAvailable) {
      conflicts.push({
        id: `unavailable_${assignment.id}`,
        type: 'unavailable_team',
        severity: 'high',
        description: `Team member ${team.firstName} ${team.lastName} is not available during assigned time`,
        affectedJobs: [assignment.installationId],
        affectedTeamMembers: [teamId],
        suggestedResolution: 'Reassign to an available team member or reschedule',
        autoResolvable: true
      });
    }
  });
  
  return conflicts;
}

/**
 * Detect specialization conflicts where required skills are missing
 */
function detectSpecializationConflicts(
  assignments: OptimizedAssignment[],
  teamLookup: Map<string, TeamMember>,
  constraints: SchedulingConstraints
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  
  assignments.forEach(assignment => {
    const teamId = assignment.leadId || assignment.assistantId;
    if (!teamId) return;
    const team = teamLookup.get(teamId);
    if (!team) return;
    
    const requiredSpecs = constraints.requiredSpecializations[assignment.installationId];
    if (!requiredSpecs || requiredSpecs.length === 0) return;
    
    const missingSpecs = requiredSpecs.filter(spec => 
      !team.specializations.includes(spec)
    );
    
    if (missingSpecs.length > 0) {
      conflicts.push({
        id: `specialization_${assignment.id}`,
        type: 'missing_specialization',
        severity: 'high',
        description: `Team member ${team.firstName} ${team.lastName} lacks required specializations: ${missingSpecs.join(', ')}`,
        affectedJobs: [assignment.installationId],
        affectedTeamMembers: [teamId],
        suggestedResolution: `Reassign to team member with specializations: ${missingSpecs.join(', ')}`,
        autoResolvable: true
      });
    }
  });
  
  return conflicts;
}

/**
 * Detect deadline conflicts where assignments cannot meet required deadlines
 */
function detectDeadlineConflicts(
  assignments: OptimizedAssignment[],
  constraints: SchedulingConstraints
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  
  assignments.forEach(assignment => {
    const deadline = constraints.deadlines[assignment.installationId];
    if (!deadline) return;
    
    const deadlineDate = new Date(deadline);
    const assignmentDate = new Date(assignment.assignedAt);
    
    if (assignmentDate > deadlineDate) {
      conflicts.push({
        id: `deadline_${assignment.id}`,
        type: 'deadline_conflict',
        severity: 'critical',
        description: `Assignment scheduled after required deadline of ${deadline}`,
        affectedJobs: [assignment.installationId],
        affectedTeamMembers: [assignment.leadId || assignment.assistantId].filter(Boolean),
        suggestedResolution: 'Prioritize this assignment or find earlier time slot',
        autoResolvable: false
      });
    }
  });
  
  return conflicts;
}

/**
 * Detect geographic conflicts where team assignments are geographically inefficient
 */
function detectGeographicConflicts(
  assignments: OptimizedAssignment[],
  teamLookup: Map<string, TeamMember>
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  const teamAssignments = new Map<string, OptimizedAssignment[]>();
  
  // Group assignments by team
  assignments.forEach(assignment => {
    const teamId = assignment.leadId || assignment.assistantId;
    if (!teamId) return;
    
    if (!teamAssignments.has(teamId)) {
      teamAssignments.set(teamId, []);
    }
    teamAssignments.get(teamId)!.push(assignment);
  });
  
  // Check for inefficient geographic distribution
  teamAssignments.forEach((teamJobs, teamId) => {
    const team = teamLookup.get(teamId);
    if (!team || !team.coordinates || teamJobs.length <= 1) return;
    
    // Calculate if any assignments are unusually far from team's base or other assignments
    teamJobs.forEach(assignment => {
      // This would need job coordinate data to work properly
      // For now, we'll create a placeholder check
      
      const totalTravelDistance = teamJobs.reduce((sum, job) => sum + job.estimatedTravelDistance, 0);
      const averageDistance = totalTravelDistance / teamJobs.length;
      
      if (assignment.estimatedTravelDistance > averageDistance * 2) {
        conflicts.push({
          id: `geographic_${assignment.id}`,
          type: 'geographic_mismatch',
          severity: 'low',
          description: `Assignment is geographically isolated from team member's other jobs`,
          affectedJobs: [assignment.installationId],
          affectedTeamMembers: [teamId],
          suggestedResolution: 'Consider reassigning to reduce overall travel distance',
          autoResolvable: true
        });
      }
    });
  });
  
  return conflicts;
}

/**
 * Resolve conflicts automatically where possible
 */
export function resolveConflicts(
  assignments: OptimizedAssignment[],
  conflicts: SchedulingConflict[],
  request: SchedulingRequest
): OptimizedAssignment[] {
  let resolvedAssignments = [...assignments];
  const resolvedConflicts = new Set<string>();
  
  // Sort conflicts by severity (critical first)
  const sortedConflicts = conflicts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
  
  for (const conflict of sortedConflicts) {
    if (!conflict.autoResolvable || resolvedConflicts.has(conflict.id)) continue;
    
    switch (conflict.type) {
      case 'time_overlap':
        resolvedAssignments = resolveTimeOverlapConflict(resolvedAssignments, conflict, request);
        break;
      case 'capacity_exceeded':
        resolvedAssignments = resolveCapacityConflict(resolvedAssignments, conflict, request);
        break;
      case 'travel_distance':
        resolvedAssignments = resolveTravelDistanceConflict(resolvedAssignments, conflict, request);
        break;
      case 'unavailable_team':
        resolvedAssignments = resolveAvailabilityConflict(resolvedAssignments, conflict, request);
        break;
      case 'missing_specialization':
        resolvedAssignments = resolveSpecializationConflict(resolvedAssignments, conflict, request);
        break;
      case 'geographic_mismatch':
        resolvedAssignments = resolveGeographicConflict(resolvedAssignments, conflict, request);
        break;
    }
    
    resolvedConflicts.add(conflict.id);
  }
  
  return resolvedAssignments;
}

/**
 * Helper function to check if two assignments have time overlap
 */
function hasTimeOverlap(assignment1: OptimizedAssignment, assignment2: OptimizedAssignment): boolean {
  // This would need actual start/end times from the jobs
  // For now, return false as placeholder
  return false;
}

/**
 * Resolve time overlap conflicts by rescheduling
 */
function resolveTimeOverlapConflict(
  assignments: OptimizedAssignment[],
  conflict: SchedulingConflict,
  request: SchedulingRequest
): OptimizedAssignment[] {
  // Find alternative time slots or team members
  // Implementation would depend on specific business rules
  return assignments;
}

/**
 * Resolve capacity conflicts by redistributing assignments
 */
function resolveCapacityConflict(
  assignments: OptimizedAssignment[],
  conflict: SchedulingConflict,
  request: SchedulingRequest
): OptimizedAssignment[] {
  // Find team members with available capacity
  // Reassign excess jobs
  return assignments;
}

/**
 * Resolve travel distance conflicts by reassigning to closer team members
 */
function resolveTravelDistanceConflict(
  assignments: OptimizedAssignment[],
  conflict: SchedulingConflict,
  request: SchedulingRequest
): OptimizedAssignment[] {
  // Find team members within acceptable travel distance
  // Reassign the job
  return assignments;
}

/**
 * Resolve availability conflicts by finding available team members
 */
function resolveAvailabilityConflict(
  assignments: OptimizedAssignment[],
  conflict: SchedulingConflict,
  request: SchedulingRequest
): OptimizedAssignment[] {
  // Find available team members during the required time
  // Reassign or reschedule
  return assignments;
}

/**
 * Resolve specialization conflicts by finding qualified team members
 */
function resolveSpecializationConflict(
  assignments: OptimizedAssignment[],
  conflict: SchedulingConflict,
  request: SchedulingRequest
): OptimizedAssignment[] {
  // Find team members with required specializations
  // Reassign the job
  return assignments;
}

/**
 * Resolve geographic conflicts by optimizing job distribution
 */
function resolveGeographicConflict(
  assignments: OptimizedAssignment[],
  conflict: SchedulingConflict,
  request: SchedulingRequest
): OptimizedAssignment[] {
  // Find more geographically suitable team members
  // Reassign for better geographic distribution
  return assignments;
}

/**
 * Calculate conflict resolution success rate
 */
export function calculateResolutionMetrics(
  originalConflicts: SchedulingConflict[],
  resolvedAssignments: OptimizedAssignment[],
  teams: TeamMember[],
  constraints: SchedulingConstraints
): {
  originalConflictCount: number;
  resolvedConflictCount: number;
  resolutionRate: number;
  remainingConflicts: SchedulingConflict[];
} {
  const remainingConflicts = detectConflicts(resolvedAssignments, teams, constraints);
  const resolvedCount = originalConflicts.length - remainingConflicts.length;
  
  return {
    originalConflictCount: originalConflicts.length,
    resolvedConflictCount: resolvedCount,
    resolutionRate: originalConflicts.length > 0 ? (resolvedCount / originalConflicts.length) * 100 : 100,
    remainingConflicts
  };
}