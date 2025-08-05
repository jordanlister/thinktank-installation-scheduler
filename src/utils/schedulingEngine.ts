// Think Tank Technologies Installation Scheduler - Core Scheduling Engine

import type {
  Installation,
  TeamMember,
  SchedulingRequest,
  SchedulingResult,
  OptimizedAssignment,
  SchedulingConflict,
  OptimizationMetrics,
  DailySchedule,
  GeographicCluster,
  DistanceMatrix,
  TravelOptimization,
  ConflictType,
  RoutePoint
} from '../types';
import { calculateDistance, createGeographicClusters, optimizeRoute } from './geographicUtils';
import { detectConflicts, resolveConflicts } from './conflictResolver';

/**
 * Installation Scheduling Optimization Engine
 * 
 * Core algorithms for intelligent job assignment based on:
 * - Geographic proximity and travel distance optimization
 * - Team member availability and workload balancing
 * - Installation complexity and duration constraints
 * - Priority levels and deadline requirements
 * - Regional expertise and specializations
 */
export class SchedulingEngine {
  private distanceMatrix: DistanceMatrix = {};
  private geographicClusters: GeographicCluster[] = [];

  /**
   * Main optimization method that processes scheduling requests
   */
  async optimizeSchedule(request: SchedulingRequest): Promise<SchedulingResult> {
    console.log('Starting schedule optimization...', {
      jobs: request.jobs.length,
      teams: request.teams.length,
      goal: request.preferences.optimizationGoal
    });

    // Step 1: Pre-process and validate data
    const validatedJobs = this.validateJobs(request.jobs);
    const availableTeams = this.filterAvailableTeams(request.teams, validatedJobs);

    // Step 2: Build distance matrix and geographic clusters
    await this.buildDistanceMatrix(validatedJobs);
    this.geographicClusters = createGeographicClusters(validatedJobs);

    // Step 3: Initialize assignments
    let assignments: OptimizedAssignment[] = [];
    let unassignedJobs: Installation[] = [];

    // Step 4: Apply optimization strategy based on preferences
    switch (request.preferences.optimizationGoal) {
      case 'travel_distance':
        ({ assignments, unassignedJobs } = await this.optimizeForTravelDistance(
          validatedJobs, availableTeams, request
        ));
        break;
      case 'workload_balance':
        ({ assignments, unassignedJobs } = await this.optimizeForWorkloadBalance(
          validatedJobs, availableTeams, request
        ));
        break;
      case 'deadline_priority':
        ({ assignments, unassignedJobs } = await this.optimizeForDeadlines(
          validatedJobs, availableTeams, request
        ));
        break;
      case 'customer_satisfaction':
        ({ assignments, unassignedJobs } = await this.optimizeForCustomerSatisfaction(
          validatedJobs, availableTeams, request
        ));
        break;
      default:
        ({ assignments, unassignedJobs } = await this.optimizeHybrid(
          validatedJobs, availableTeams, request
        ));
    }

    // Step 5: Detect and resolve conflicts
    const conflicts = detectConflicts(assignments, availableTeams, request.constraints);
    const resolvedAssignments = resolveConflicts(assignments, conflicts, request);

    // Step 6: Calculate optimization metrics
    const optimizationMetrics = this.calculateOptimizationMetrics(
      resolvedAssignments, unassignedJobs, validatedJobs, availableTeams
    );

    // Step 7: Generate daily schedules
    const scheduleByDate = this.generateDailySchedules(resolvedAssignments);

    // Step 8: Generate recommendations
    const recommendations = this.generateRecommendations(
      resolvedAssignments, unassignedJobs, conflicts, optimizationMetrics
    );

    return {
      assignments: resolvedAssignments,
      unassignedJobs,
      optimizationMetrics,
      conflicts,
      recommendations,
      scheduleByDate
    };
  }

  /**
   * Travel Distance Optimization Strategy
   * Minimize total travel distance across all assignments
   */
  private async optimizeForTravelDistance(
    jobs: Installation[],
    teams: TeamMember[],
    request: SchedulingRequest
  ): Promise<{ assignments: OptimizedAssignment[], unassignedJobs: Installation[] }> {
    const assignments: OptimizedAssignment[] = [];
    const unassignedJobs: Installation[] = [];

    // Group jobs by geographic clusters
    const clusteredJobs = this.assignJobsToClusters(jobs);

    for (const cluster of this.geographicClusters) {
      const clusterJobs = clusteredJobs[cluster.id] || [];
      if (clusterJobs.length === 0) continue;

      // Find optimal team for this cluster
      const optimalTeam = this.findOptimalTeamForCluster(cluster, teams, request);
      if (!optimalTeam) {
        unassignedJobs.push(...clusterJobs);
        continue;
      }

      // Optimize route within cluster
      const optimizedRoute = await optimizeRoute(clusterJobs, optimalTeam);
      
      // Create assignments with travel optimization
      for (let i = 0; i < optimizedRoute.route.length; i++) {
        const routePoint = optimizedRoute.route[i];
        const job = clusterJobs.find(j => j.id === routePoint.jobId);
        if (!job) continue;

        const assignment = this.createOptimizedAssignment(
          job,
          optimalTeam,
          routePoint,
          i > 0 ? optimizedRoute.route[i - 1] : null,
          i < optimizedRoute.route.length - 1 ? optimizedRoute.route[i + 1] : null
        );

        assignments.push(assignment);
      }
    }

    return { assignments, unassignedJobs };
  }

  /**
   * Workload Balance Optimization Strategy
   * Ensure fair distribution of jobs across team members
   */
  private async optimizeForWorkloadBalance(
    jobs: Installation[],
    teams: TeamMember[],
    request: SchedulingRequest
  ): Promise<{ assignments: OptimizedAssignment[], unassignedJobs: Installation[] }> {
    const assignments: OptimizedAssignment[] = [];
    const unassignedJobs: Installation[] = [];
    
    // Track workload per team member
    const workloadTracker = new Map<string, number>();
    teams.forEach(team => workloadTracker.set(team.id, 0));

    // Sort jobs by priority and complexity
    const sortedJobs = [...jobs].sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    for (const job of sortedJobs) {
      // Find team member with lowest current workload who can handle this job
      const availableTeams = teams.filter(team => 
        this.canTeamHandleJob(team, job, request.constraints)
      ).sort((a, b) => 
        (workloadTracker.get(a.id) || 0) - (workloadTracker.get(b.id) || 0)
      );

      if (availableTeams.length === 0) {
        unassignedJobs.push(job);
        continue;
      }

      const assignedTeam = availableTeams[0];
      const currentWorkload = workloadTracker.get(assignedTeam.id) || 0;
      
      // Check if assignment would exceed balance threshold
      const averageWorkload = jobs.length / teams.length;
      const balanceThreshold = averageWorkload * 1.2; // 20% variance allowed

      if (currentWorkload >= balanceThreshold && availableTeams.length > 1) {
        // Try to assign to next available team
        const alternativeTeam = availableTeams[1];
        if ((workloadTracker.get(alternativeTeam.id) || 0) < balanceThreshold) {
          const assignment = this.createOptimizedAssignment(job, alternativeTeam);
          assignments.push(assignment);
          workloadTracker.set(alternativeTeam.id, (workloadTracker.get(alternativeTeam.id) || 0) + 1);
          continue;
        }
      }

      const assignment = this.createOptimizedAssignment(job, assignedTeam);
      assignments.push(assignment);
      workloadTracker.set(assignedTeam.id, currentWorkload + 1);
    }

    return { assignments, unassignedJobs };
  }

  /**
   * Deadline Priority Optimization Strategy
   * Prioritize jobs with tight deadlines and critical priorities
   */
  private async optimizeForDeadlines(
    jobs: Installation[],
    teams: TeamMember[],
    request: SchedulingRequest
  ): Promise<{ assignments: OptimizedAssignment[], unassignedJobs: Installation[] }> {
    const assignments: OptimizedAssignment[] = [];
    const unassignedJobs: Installation[] = [];

    // Sort jobs by deadline urgency and priority
    const sortedJobs = [...jobs].sort((a, b) => {
      const deadlineA = request.constraints.deadlines[a.id];
      const deadlineB = request.constraints.deadlines[b.id];
      
      if (deadlineA && deadlineB) {
        const dateComparison = new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
        if (dateComparison !== 0) return dateComparison;
      }
      
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    for (const job of sortedJobs) {
      const deadline = request.constraints.deadlines[job.id];
      const availableTeams = teams.filter(team => 
        this.canTeamHandleJob(team, job, request.constraints)
      );

      if (availableTeams.length === 0) {
        unassignedJobs.push(job);
        continue;
      }

      // If there's a deadline, find team that can meet it
      let selectedTeam = availableTeams[0];
      if (deadline) {
        const urgentTeam = availableTeams.find(team => 
          this.canMeetDeadline(team, job, deadline, assignments)
        );
        if (urgentTeam) {
          selectedTeam = urgentTeam;
        }
      }

      const assignment = this.createOptimizedAssignment(job, selectedTeam);
      assignments.push(assignment);
    }

    return { assignments, unassignedJobs };
  }

  /**
   * Customer Satisfaction Optimization Strategy
   * Consider team expertise, customer preferences, and service quality
   */
  private async optimizeForCustomerSatisfaction(
    jobs: Installation[],
    teams: TeamMember[],
    request: SchedulingRequest
  ): Promise<{ assignments: OptimizedAssignment[], unassignedJobs: Installation[] }> {
    const assignments: OptimizedAssignment[] = [];
    const unassignedJobs: Installation[] = [];

    for (const job of jobs) {
      const availableTeams = teams.filter(team => 
        this.canTeamHandleJob(team, job, request.constraints)
      );

      if (availableTeams.length === 0) {
        unassignedJobs.push(job);
        continue;
      }

      // Score teams based on customer satisfaction factors
      const scoredTeams = availableTeams.map(team => ({
        team,
        score: this.calculateCustomerSatisfactionScore(team, job, request)
      })).sort((a, b) => b.score - a.score);

      const assignment = this.createOptimizedAssignment(job, scoredTeams[0].team);
      assignments.push(assignment);
    }

    return { assignments, unassignedJobs };
  }

  /**
   * Hybrid Optimization Strategy
   * Balances multiple optimization goals
   */
  private async optimizeHybrid(
    jobs: Installation[],
    teams: TeamMember[],
    request: SchedulingRequest
  ): Promise<{ assignments: OptimizedAssignment[], unassignedJobs: Installation[] }> {
    const assignments: OptimizedAssignment[] = [];
    const unassignedJobs: Installation[] = [];

    // Apply weighted scoring across multiple factors
    for (const job of jobs) {
      const availableTeams = teams.filter(team => 
        this.canTeamHandleJob(team, job, request.constraints)
      );

      if (availableTeams.length === 0) {
        unassignedJobs.push(job);
        continue;
      }

      const scoredTeams = availableTeams.map(team => ({
        team,
        score: this.calculateHybridScore(team, job, request, assignments)
      })).sort((a, b) => b.score - a.score);

      const assignment = this.createOptimizedAssignment(job, scoredTeams[0].team);
      assignments.push(assignment);
    }

    return { assignments, unassignedJobs };
  }

  // Helper methods

  private validateJobs(jobs: Installation[]): Installation[] {
    return jobs.filter(job => 
      job.address && 
      job.address.street && 
      job.address.city && 
      job.address.state &&
      job.scheduledDate
    );
  }

  private filterAvailableTeams(teams: TeamMember[], jobs: Installation[]): TeamMember[] {
    return teams.filter(team => team.isActive && team.availability.length > 0);
  }

  private async buildDistanceMatrix(jobs: Installation[]): Promise<void> {
    this.distanceMatrix = {};
    
    for (let i = 0; i < jobs.length; i++) {
      const fromJob = jobs[i];
      this.distanceMatrix[fromJob.id] = {};
      
      for (let j = 0; j < jobs.length; j++) {
        if (i === j) continue;
        
        const toJob = jobs[j];
        const distance = calculateDistance(
          fromJob.address.coordinates || { lat: 0, lng: 0 },
          toJob.address.coordinates || { lat: 0, lng: 0 }
        );
        
        this.distanceMatrix[fromJob.id][toJob.id] = {
          distance,
          duration: distance * 2, // Rough estimate: 2 minutes per mile
          route: `${fromJob.address.city} to ${toJob.address.city}`
        };
      }
    }
  }

  private assignJobsToClusters(jobs: Installation[]): { [clusterId: string]: Installation[] } {
    const clusteredJobs: { [clusterId: string]: Installation[] } = {};
    
    for (const cluster of this.geographicClusters) {
      clusteredJobs[cluster.id] = cluster.jobs;
    }
    
    return clusteredJobs;
  }

  private findOptimalTeamForCluster(
    cluster: GeographicCluster, 
    teams: TeamMember[], 
    request: SchedulingRequest
  ): TeamMember | null {
    const availableTeams = teams.filter(team => {
      if (!team.coordinates) return false;
      
      const distanceToCluster = calculateDistance(team.coordinates, cluster.center);
      return distanceToCluster <= team.travelRadius;
    });

    if (availableTeams.length === 0) return null;

    // Select team with best combination of proximity and capacity
    return availableTeams.reduce((best, current) => {
      const bestDistance = calculateDistance(best.coordinates!, cluster.center);
      const currentDistance = calculateDistance(current.coordinates!, cluster.center);
      
      const bestScore = (best.capacity / bestDistance) || 0;
      const currentScore = (current.capacity / currentDistance) || 0;
      
      return currentScore > bestScore ? current : best;
    });
  }

  private createOptimizedAssignment(
    job: Installation,
    team: TeamMember,
    routePoint?: RoutePoint,
    previousPoint?: RoutePoint,
    nextPoint?: RoutePoint
  ): OptimizedAssignment {
    const baseAssignment = {
      id: `assignment_${job.id}_${team.id}_${Date.now()}`,
      installationId: job.id,
      leadId: team.role === 'lead' ? team.id : '',
      assistantId: team.role === 'assistant' ? team.id : '',
      assignedAt: new Date().toISOString(),
      assignedBy: 'system',
      status: 'assigned' as const
    };

    return {
      ...baseAssignment,
      estimatedTravelTime: routePoint?.travelTimeFromPrevious || 0,
      estimatedTravelDistance: routePoint?.distanceFromPrevious || 0,
      travelRoute: routePoint ? [routePoint] : undefined,
      previousJobId: previousPoint?.jobId,
      nextJobId: nextPoint?.jobId,
      bufferTime: 15, // 15 minutes default buffer
      workloadScore: this.calculateWorkloadScore(team, job),
      efficiencyScore: this.calculateEfficiencyScore(team, job)
    };
  }

  private canTeamHandleJob(team: TeamMember, job: Installation, constraints: any): boolean {
    // Check availability
    const jobDate = new Date(job.scheduledDate);
    const hasAvailability = team.availability.some(avail => {
      const startDate = new Date(avail.startDate);
      const endDate = new Date(avail.endDate);
      return avail.isAvailable && jobDate >= startDate && jobDate <= endDate;
    });
    
    if (!hasAvailability) return false;

    // Check specializations if required
    const requiredSpecs = constraints.requiredSpecializations[job.id];
    if (requiredSpecs && requiredSpecs.length > 0) {
      const hasRequiredSpec = requiredSpecs.some((spec: string) => 
        team.specializations.includes(spec)
      );
      if (!hasRequiredSpec) return false;
    }

    return true;
  }

  private canMeetDeadline(
    team: TeamMember, 
    job: Installation, 
    deadline: string, 
    existingAssignments: OptimizedAssignment[]
  ): boolean {
    const deadlineDate = new Date(deadline);
    const jobDate = new Date(job.scheduledDate);
    
    // Check if job date is before deadline
    if (jobDate > deadlineDate) return false;

    // Check team availability on that date
    return this.canTeamHandleJob(team, job, { requiredSpecializations: {} });
  }

  private calculateCustomerSatisfactionScore(
    team: TeamMember, 
    job: Installation, 
    request: SchedulingRequest
  ): number {
    let score = 0;

    // Performance metrics weight
    if (team.performanceMetrics) {
      score += team.performanceMetrics.customerSatisfaction * 0.4;
      score += team.performanceMetrics.completionRate * 0.3;
    }

    // Specialization match
    const requiredSpecs = request.constraints.requiredSpecializations[job.id] || [];
    const matchingSpecs = requiredSpecs.filter(spec => team.specializations.includes(spec));
    score += (matchingSpecs.length / Math.max(requiredSpecs.length, 1)) * 0.2;

    // Geographic proximity
    if (team.coordinates && job.address.coordinates) {
      const distance = calculateDistance(team.coordinates, job.address.coordinates);
      score += Math.max(0, (50 - distance) / 50) * 0.1; // Closer is better
    }

    return score;
  }

  private calculateHybridScore(
    team: TeamMember, 
    job: Installation, 
    request: SchedulingRequest,
    existingAssignments: OptimizedAssignment[]
  ): number {
    let score = 0;

    // Travel distance component (25%)
    if (team.coordinates && job.address.coordinates) {
      const distance = calculateDistance(team.coordinates, job.address.coordinates);
      score += Math.max(0, (100 - distance) / 100) * 0.25;
    }

    // Workload balance component (25%)
    const teamJobs = existingAssignments.filter(a => a.leadId === team.id || a.assistantId === team.id);
    const workloadScore = Math.max(0, (10 - teamJobs.length) / 10);
    score += workloadScore * 0.25;

    // Specialization match component (25%)
    const requiredSpecs = request.constraints.requiredSpecializations[job.id] || [];
    const matchingSpecs = requiredSpecs.filter(spec => team.specializations.includes(spec));
    score += (matchingSpecs.length / Math.max(requiredSpecs.length, 1)) * 0.25;

    // Performance component (25%)
    if (team.performanceMetrics) {
      const perfScore = (
        team.performanceMetrics.completionRate +
        team.performanceMetrics.customerSatisfaction +
        team.performanceMetrics.travelEfficiency
      ) / 3;
      score += perfScore * 0.25;
    }

    return score;
  }

  private calculateWorkloadScore(team: TeamMember, job: Installation): number {
    // Simple workload scoring based on job complexity and team capacity
    const jobComplexity = job.duration || 120; // minutes
    const baseScore = Math.min(jobComplexity / 240, 1); // normalize to 0-1
    return baseScore * (team.performanceMetrics?.completionRate || 0.8);
  }

  private calculateEfficiencyScore(team: TeamMember, job: Installation): number {
    // Efficiency scoring based on team performance and job requirements
    const baseEfficiency = team.performanceMetrics?.travelEfficiency || 0.7;
    const specializationBonus = team.specializations.length > 0 ? 0.1 : 0;
    return Math.min(baseEfficiency + specializationBonus, 1);
  }

  private calculateOptimizationMetrics(
    assignments: OptimizedAssignment[],
    unassignedJobs: Installation[],
    allJobs: Installation[],
    teams: TeamMember[]
  ): OptimizationMetrics {
    const totalTravelDistance = assignments.reduce((sum, a) => sum + a.estimatedTravelDistance, 0);
    const totalTravelTime = assignments.reduce((sum, a) => sum + a.estimatedTravelTime, 0);
    
    const jobsPerTeam = teams.map(team => 
      assignments.filter(a => a.leadId === team.id || a.assistantId === team.id).length
    );
    const averageJobsPerTeamMember = jobsPerTeam.reduce((sum, count) => sum + count, 0) / teams.length;
    const workloadVariance = this.calculateVariance(jobsPerTeam);
    
    return {
      totalTravelDistance,
      totalTravelTime,
      averageJobsPerTeamMember,
      workloadVariance,
      geographicEfficiency: Math.max(0, 1 - (totalTravelDistance / (allJobs.length * 50))),
      deadlineCompliance: assignments.length / allJobs.length,
      utilizationRate: assignments.length / (teams.length * 8), // Assuming 8 jobs max per day
      conflictRate: 0, // Will be updated after conflict detection
      improvementPercentage: 0 // Will be calculated against baseline
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private generateDailySchedules(assignments: OptimizedAssignment[]): { [date: string]: DailySchedule } {
    const schedulesByDate: { [date: string]: DailySchedule } = {};
    
    // Group assignments by date
    const assignmentsByDate = assignments.reduce((acc, assignment) => {
      // For now, we'll need to get the date from the associated job
      // This would need to be populated from the actual job data
      const date = new Date().toISOString().split('T')[0]; // Placeholder
      
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(assignment);
      return acc;
    }, {} as { [date: string]: OptimizedAssignment[] });

    // Create daily schedule objects
    Object.entries(assignmentsByDate).forEach(([date, dayAssignments]) => {
      const totalTravelDistance = dayAssignments.reduce((sum, a) => sum + a.estimatedTravelDistance, 0);
      const totalTravelTime = dayAssignments.reduce((sum, a) => sum + a.estimatedTravelTime, 0);
      
      const teamUtilization: { [teamMemberId: string]: number } = {};
      dayAssignments.forEach(assignment => {
        const teamId = assignment.leadId || assignment.assistantId || '';
        teamUtilization[teamId] = (teamUtilization[teamId] || 0) + 1;
      });

      schedulesByDate[date] = {
        date,
        assignments: dayAssignments,
        totalJobs: dayAssignments.length,
        totalTravelDistance,
        totalTravelTime,
        teamUtilization,
        warnings: []
      };
    });

    return schedulesByDate;
  }

  private generateRecommendations(
    assignments: OptimizedAssignment[],
    unassignedJobs: Installation[],
    conflicts: SchedulingConflict[],
    metrics: OptimizationMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (unassignedJobs.length > 0) {
      recommendations.push(`${unassignedJobs.length} jobs could not be assigned. Consider adding more team members or adjusting constraints.`);
    }

    if (conflicts.length > 0) {
      recommendations.push(`${conflicts.length} scheduling conflicts detected. Review and resolve conflicts for optimal schedule.`);
    }

    if (metrics.workloadVariance > 2) {
      recommendations.push('High workload variance detected. Consider redistributing jobs for better balance.');
    }

    if (metrics.geographicEfficiency < 0.7) {
      recommendations.push('Travel efficiency is below optimal. Consider geographic clustering of assignments.');
    }

    if (metrics.utilizationRate < 0.6) {
      recommendations.push('Team utilization is low. Consider increasing job assignments or reducing team size.');
    }

    return recommendations;
  }
}

export const schedulingEngine = new SchedulingEngine();