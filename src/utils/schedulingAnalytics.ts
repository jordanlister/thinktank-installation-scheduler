// Think Tank Technologies Installation Scheduler - Analytics and Reporting Service

import type {
  OptimizedAssignment,
  TeamMember,
  SchedulingAnalytics,
  TeamPerformanceReport,
  RegionAnalysisReport,
  EfficiencyMetrics,
  TrendData,
  AnalyticsRecommendation,
  Installation,
  OptimizationMetrics
} from '../types';

/**
 * Scheduling Analytics Service
 * 
 * Provides comprehensive analytics and reporting capabilities including:
 * - Team performance analysis
 * - Regional efficiency metrics
 * - Trend analysis and forecasting
 * - Optimization recommendations
 * - KPI calculations and benchmarking
 */
export class SchedulingAnalyticsService {
  
  /**
   * Generate comprehensive scheduling analytics for a given period
   */
  generateAnalytics(
    assignments: OptimizedAssignment[],
    teams: TeamMember[],
    installations: Installation[],
    startDate: string,
    endDate: string
  ): SchedulingAnalytics {
    const period = { start: startDate, end: endDate };
    
    // Generate team performance reports
    const teamPerformance = this.generateTeamPerformanceReports(assignments, teams);
    
    // Generate region analysis
    const regionAnalysis = this.generateRegionAnalysis(assignments, teams, installations);
    
    // Calculate efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(assignments, teams, installations);
    
    // Generate trend data
    const trendData = this.generateTrendData(assignments, teams, startDate, endDate);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      assignments, teams, efficiencyMetrics, regionAnalysis
    );
    
    return {
      period,
      teamPerformance,
      regionAnalysis,
      efficiencyMetrics,
      trendData,
      recommendations
    };
  }

  /**
   * Generate detailed performance reports for each team member
   */
  private generateTeamPerformanceReports(
    assignments: OptimizedAssignment[],
    teams: TeamMember[]
  ): TeamPerformanceReport[] {
    return teams.map(team => {
      const teamAssignments = assignments.filter(
        assignment => assignment.leadId === team.id || assignment.assistantId === team.id
      );

      // Current metrics
      const totalJobs = teamAssignments.length;
      const completedJobs = teamAssignments.filter(a => a.status === 'completed').length;
      const totalTravelDistance = teamAssignments.reduce((sum, a) => sum + a.estimatedTravelDistance, 0);
      const averageTravelDistance = totalJobs > 0 ? totalTravelDistance / totalJobs : 0;
      const utilizationRate = team.capacity > 0 ? totalJobs / team.capacity : 0;
      
      // Efficiency calculations
      const efficiencyScore = teamAssignments.length > 0
        ? teamAssignments.reduce((sum, a) => sum + a.efficiencyScore, 0) / teamAssignments.length
        : 0;

      // Performance metrics from team data or calculated
      const customerSatisfactionAvg = team.performanceMetrics?.customerSatisfaction || 4.0;

      // Mock trend data (in production, this would come from historical data)
      const trends = {
        jobVolumeChange: Math.random() * 20 - 10, // -10% to +10%
        efficiencyChange: Math.random() * 10 - 5, // -5% to +5%
        utilizationChange: Math.random() * 15 - 7.5 // -7.5% to +7.5%
      };

      return {
        teamMemberId: team.id,
        teamMemberName: `${team.firstName} ${team.lastName}`,
        role: team.role,
        region: team.region,
        metrics: {
          totalJobs,
          completedJobs,
          averageJobsPerDay: totalJobs / 30, // Assuming 30-day period
          totalTravelDistance: Math.round(totalTravelDistance),
          averageTravelDistance: Math.round(averageTravelDistance),
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          efficiencyScore: Math.round(efficiencyScore * 100) / 100,
          customerSatisfactionAvg: Math.round(customerSatisfactionAvg * 10) / 10
        },
        trends
      };
    });
  }

  /**
   * Generate analysis reports for each operational region
   */
  private generateRegionAnalysis(
    assignments: OptimizedAssignment[],
    teams: TeamMember[],
    installations: Installation[]
  ): RegionAnalysisReport[] {
    // Group teams by region
    const regionTeams = teams.reduce((acc, team) => {
      if (!acc[team.region]) {
        acc[team.region] = [];
      }
      acc[team.region].push(team);
      return acc;
    }, {} as { [region: string]: TeamMember[] });

    return Object.entries(regionTeams).map(([region, regionTeamList]) => {
      // Get assignments for this region's teams
      const regionAssignments = assignments.filter(assignment =>
        regionTeamList.some(team => 
          team.id === assignment.leadId || team.id === assignment.assistantId
        )
      );

      // Calculate region metrics
      const totalJobs = regionAssignments.length;
      const teamCount = regionTeamList.length;
      const averageResponse = this.calculateAverageResponseTime(regionAssignments);
      const geographicSpread = this.calculateGeographicSpread(regionAssignments);
      const utilizationRate = this.calculateRegionUtilization(regionAssignments, regionTeamList);
      const conflictRate = this.calculateConflictRate(regionAssignments);

      // Generate recommendations
      const recommendations = this.generateRegionRecommendations(
        region, totalJobs, teamCount, utilizationRate, conflictRate
      );

      return {
        region,
        totalJobs,
        teamCount,
        averageResponse,
        geographicSpread,
        utilizationRate,
        conflictRate,
        recommendations
      };
    });
  }

  /**
   * Calculate overall efficiency metrics across the organization
   */
  private calculateEfficiencyMetrics(
    assignments: OptimizedAssignment[],
    teams: TeamMember[],
    installations: Installation[]
  ): EfficiencyMetrics {
    const totalCapacity = teams.reduce((sum, team) => sum + team.capacity, 0);
    const totalAssignments = assignments.length;
    
    const overallUtilization = totalCapacity > 0 ? totalAssignments / totalCapacity : 0;
    
    const totalTravelDistance = assignments.reduce((sum, a) => sum + a.estimatedTravelDistance, 0);
    const optimalTravelDistance = this.calculateOptimalTravelDistance(assignments);
    const travelOptimization = optimalTravelDistance > 0 ? 
      1 - ((totalTravelDistance - optimalTravelDistance) / optimalTravelDistance) : 1;
    
    const workloadBalance = this.calculateWorkloadBalance(assignments, teams);
    const deadlineCompliance = this.calculateDeadlineCompliance(assignments);
    
    // Cost and time estimates (mock data - would be calculated from actual data)
    const costPerJob = 150 + (totalTravelDistance / assignments.length) * 0.5; // Base cost + travel
    const timePerJob = 120 + (assignments.reduce((sum, a) => sum + a.estimatedTravelTime, 0) / assignments.length);
    
    const customerSatisfaction = teams.reduce((sum, team) => 
      sum + (team.performanceMetrics?.customerSatisfaction || 4.0), 0
    ) / teams.length;

    return {
      overallUtilization: Math.round(overallUtilization * 100) / 100,
      travelOptimization: Math.round(Math.max(0, Math.min(1, travelOptimization)) * 100) / 100,
      workloadBalance: Math.round(workloadBalance * 100) / 100,
      deadlineCompliance: Math.round(deadlineCompliance * 100) / 100,
      costPerJob: Math.round(costPerJob),
      timePerJob: Math.round(timePerJob),
      customerSatisfaction: Math.round(customerSatisfaction * 10) / 10
    };
  }

  /**
   * Generate trend data for visualization and forecasting
   */
  private generateTrendData(
    assignments: OptimizedAssignment[],
    teams: TeamMember[],
    startDate: string,
    endDate: string
  ): TrendData[] {
    const trendData: TrendData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Generate daily trend data (mock data for demonstration)
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Mock trend calculations (in production, this would be based on actual historical data)
      const baseUtilization = 0.75;
      const utilizationVariation = Math.sin((i / days) * Math.PI * 2) * 0.15;
      const utilization = Math.max(0, Math.min(1, baseUtilization + utilizationVariation));

      const baseEfficiency = 0.82;
      const efficiencyVariation = Math.cos((i / days) * Math.PI * 4) * 0.08;
      const efficiency = Math.max(0, Math.min(1, baseEfficiency + efficiencyVariation));

      trendData.push(
        {
          date: dateStr,
          metric: 'utilization',
          value: Math.round(utilization * 100) / 100,
          target: 0.80
        },
        {
          date: dateStr,
          metric: 'efficiency',
          value: Math.round(efficiency * 100) / 100,
          target: 0.85
        },
        {
          date: dateStr,
          metric: 'assignments',
          value: Math.round(assignments.length / days * (1 + Math.random() * 0.2 - 0.1))
        }
      );
    }

    return trendData;
  }

  /**
   * Generate actionable recommendations based on analytics
   */
  private generateRecommendations(
    assignments: OptimizedAssignment[],
    teams: TeamMember[],
    efficiency: EfficiencyMetrics,
    regions: RegionAnalysisReport[]
  ): AnalyticsRecommendation[] {
    const recommendations: AnalyticsRecommendation[] = [];

    // Utilization recommendations
    if (efficiency.overallUtilization < 0.6) {
      recommendations.push({
        type: 'capacity_change',
        priority: 'medium',
        description: 'Team utilization is below optimal levels',
        expectedImpact: 'Reduce operational costs by 15-20%',
        actionItems: [
          'Consider reducing team size or increasing job volume',
          'Reassign team members to higher-demand regions',
          'Implement cross-training to improve flexibility'
        ]
      });
    } else if (efficiency.overallUtilization > 0.9) {
      recommendations.push({
        type: 'team_adjustment',
        priority: 'high',
        description: 'Team capacity is near maximum, risk of burnout',
        expectedImpact: 'Maintain service quality and team satisfaction',
        actionItems: [
          'Add additional team members to high-demand regions',
          'Distribute workload more evenly across regions',
          'Consider temporary contractor support during peak periods'
        ]
      });
    }

    // Travel optimization recommendations
    if (efficiency.travelOptimization < 0.7) {
      recommendations.push({
        type: 'route_optimization',
        priority: 'high',
        description: 'Travel efficiency is below target, increasing operational costs',
        expectedImpact: 'Reduce travel costs by 20-30%',
        actionItems: [
          'Implement advanced route optimization algorithms',
          'Increase geographic clustering of assignments',
          'Consider opening satellite offices in high-density areas'
        ]
      });
    }

    // Workload balance recommendations
    if (efficiency.workloadBalance < 0.8) {
      recommendations.push({
        type: 'team_adjustment',
        priority: 'medium',
        description: 'Workload distribution is uneven across team members',
        expectedImpact: 'Improve team satisfaction and efficiency by 10-15%',
        actionItems: [
          'Redistribute assignments to balance workload',
          'Provide additional training for underutilized team members',
          'Review team specializations and adjust assignments accordingly'
        ]
      });
    }

    // Regional recommendations
    regions.forEach(region => {
      if (region.conflictRate > 0.1) {
        recommendations.push({
          type: 'specialization_training',
          priority: 'medium',
          description: `High conflict rate in ${region.region} region`,
          expectedImpact: 'Reduce scheduling conflicts by 40-50%',
          actionItems: [
            `Add specialized team members to ${region.region}`,
            'Improve availability tracking and management',
            'Implement proactive conflict prevention measures'
          ]
        });
      }
    });

    return recommendations;
  }

  // Helper methods for calculations

  private calculateAverageResponseTime(assignments: OptimizedAssignment[]): number {
    // Mock calculation - would be based on actual response time data
    return Math.round(45 + Math.random() * 30); // 45-75 minutes average
  }

  private calculateGeographicSpread(assignments: OptimizedAssignment[]): number {
    // Mock calculation - would calculate actual geographic spread
    return Math.round(50 + Math.random() * 100); // 50-150 miles
  }

  private calculateRegionUtilization(
    assignments: OptimizedAssignment[],
    teams: TeamMember[]
  ): number {
    const totalCapacity = teams.reduce((sum, team) => sum + team.capacity, 0);
    return totalCapacity > 0 ? assignments.length / totalCapacity : 0;
  }

  private calculateConflictRate(assignments: OptimizedAssignment[]): number {
    // Mock calculation - would be based on actual conflict data
    return Math.random() * 0.15; // 0-15% conflict rate
  }

  private generateRegionRecommendations(
    region: string,
    totalJobs: number,
    teamCount: number,
    utilizationRate: number,
    conflictRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (utilizationRate > 0.9) {
      recommendations.push(`Consider adding team members to ${region} region`);
    }
    
    if (conflictRate > 0.1) {
      recommendations.push(`Improve scheduling processes in ${region}`);
    }
    
    if (totalJobs / teamCount > 8) {
      recommendations.push(`Workload per team member is high in ${region}`);
    }

    return recommendations;
  }

  private calculateOptimalTravelDistance(assignments: OptimizedAssignment[]): number {
    // Simplified calculation - would use more sophisticated algorithms
    const totalDistance = assignments.reduce((sum, a) => sum + a.estimatedTravelDistance, 0);
    return totalDistance * 0.8; // Assume 20% improvement is possible
  }

  private calculateWorkloadBalance(
    assignments: OptimizedAssignment[],
    teams: TeamMember[]
  ): number {
    const jobsPerTeam = teams.map(team => 
      assignments.filter(a => a.leadId === team.id || a.assistantId === team.id).length
    );
    
    const mean = jobsPerTeam.reduce((sum, jobs) => sum + jobs, 0) / jobsPerTeam.length;
    const variance = jobsPerTeam.reduce((sum, jobs) => sum + Math.pow(jobs - mean, 2), 0) / jobsPerTeam.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Return balance score (higher is better)
    return Math.max(0, 1 - (standardDeviation / (mean || 1)));
  }

  private calculateDeadlineCompliance(assignments: OptimizedAssignment[]): number {
    // Mock calculation - would be based on actual deadline data
    return 0.85 + Math.random() * 0.1; // 85-95% compliance
  }
}

export const schedulingAnalytics = new SchedulingAnalyticsService();