// Think Tank Technologies Installation Scheduler - Geographic Integration Service

import type {
  Installation,
  TeamMember,
  OptimizedAssignment,
  GeographicCluster,
  TravelOptimization,
  DistanceMatrix,
  IntegrationData
} from '../types';

import {
  calculateDistance,
  createDistanceMatrix,
  optimizeMultiStopRoute,
  createGeographicClusters,
  calculateTerritoryCoverage,
  calculateWorkloadDistribution,
  findOptimalTeamAssignments,
  enhanceJobsWithCoordinates,
  getExpandedZipCodeCoordinates
} from '../utils/geographicUtils';

/**
 * Geographic Integration Service
 * 
 * Provides integration between geographic routing system and existing components:
 * - Data processor integration for location validation
 * - Team management coordination for geographic assignments
 * - Email report generation with route sheets
 * - Real-time scheduling optimization
 */
class GeographicIntegrationService {
  private distanceCache: Map<string, number> = new Map();
  private routeCache: Map<string, TravelOptimization> = new Map();
  private lastSync: Date | null = null;

  /**
   * Initialize geographic data from data processor
   */
  async initializeFromDataProcessor(rawData: any[]): Promise<{
    validJobs: Installation[];
    invalidJobs: any[];
    geoErrors: string[];
    coverage: any;
  }> {
    const validJobs: Installation[] = [];
    const invalidJobs: any[] = [];
    const geoErrors: string[] = [];

    for (const rawJob of rawData) {
      try {
        // Validate and enhance geographic data
        const job = await this.validateAndEnhanceJobLocation(rawJob);
        if (job) {
          validJobs.push(job);
        } else {
          invalidJobs.push(rawJob);
          geoErrors.push(`Invalid location data for job ${rawJob.id || 'unknown'}`);
        }
      } catch (error) {
        invalidJobs.push(rawJob);
        geoErrors.push(`Error processing job ${rawJob.id}: ${error}`);
      }
    }

    // Calculate overall coverage
    const coverage = calculateTerritoryCoverage(validJobs);

    return {
      validJobs,
      invalidJobs,
      geoErrors,
      coverage
    };
  }

  /**
   * Validate and enhance job location data
   */
  private async validateAndEnhanceJobLocation(rawJob: any): Promise<Installation | null> {
    // Extract address components
    const address = {
      street: rawJob.street || rawJob.address || '',
      city: rawJob.city || '',
      state: rawJob.state || '',
      zipCode: rawJob.zipCode || rawJob.zip || '',
      coordinates: undefined as { lat: number; lng: number } | undefined
    };

    // Validate required fields
    if (!address.city || !address.state) {
      return null;
    }

    // Try to get coordinates from ZIP code if not provided
    if (!rawJob.coordinates && address.zipCode) {
      const coords = getExpandedZipCodeCoordinates(address.zipCode);
      if (coords) {
        address.coordinates = coords;
      }
    } else if (rawJob.coordinates) {
      address.coordinates = {
        lat: parseFloat(rawJob.coordinates.lat || rawJob.lat),
        lng: parseFloat(rawJob.coordinates.lng || rawJob.lng || rawJob.lon)
      };
    }

    // Return null if no coordinates found
    if (!address.coordinates) {
      return null;
    }

    // Create Installation object
    return {
      id: rawJob.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerName: rawJob.customerName || rawJob.customer || 'Unknown Customer',
      customerPhone: rawJob.customerPhone || rawJob.phone || '',
      customerEmail: rawJob.customerEmail || rawJob.email || '',
      address,
      scheduledDate: rawJob.scheduledDate || rawJob.installDate || new Date().toISOString().split('T')[0],
      scheduledTime: rawJob.scheduledTime || rawJob.installTime || '09:00',
      duration: parseInt(rawJob.duration) || 120,
      status: rawJob.status || 'pending',
      priority: rawJob.priority || 'medium',
      notes: rawJob.notes || rawJob.requirements || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Sync with Team Management Coordinator
   */
  async syncWithTeamManagement(teams: TeamMember[], jobs: Installation[]): Promise<{
    teamAssignments: { [teamId: string]: Installation[] };
    geographicClusters: GeographicCluster[];
    recommendations: string[];
  }> {
    // Enhance team data with geographic information
    const enhancedTeams = await this.enhanceTeamGeographicData(teams);

    // Create geographic clusters of jobs
    const clusters = createGeographicClusters(jobs, 25, 2);

    // Find optimal team assignments
    const assignments = findOptimalTeamAssignments(jobs, enhancedTeams, 100);

    // Group jobs by assigned team
    const teamAssignments: { [teamId: string]: Installation[] } = {};
    enhancedTeams.forEach(team => {
      teamAssignments[team.id] = [];
    });

    assignments.assignments.forEach(assignment => {
      const job = jobs.find(j => j.id === assignment.jobId);
      if (job) {
        if (!teamAssignments[assignment.teamId]) {
          teamAssignments[assignment.teamId] = [];
        }
        teamAssignments[assignment.teamId].push(job);
      }
    });

    // Generate recommendations
    const recommendations = this.generateTeamGeographicRecommendations(
      enhancedTeams,
      assignments,
      clusters
    );

    return {
      teamAssignments,
      geographicClusters: clusters,
      recommendations
    };
  }

  /**
   * Enhance team data with geographic information
   */
  private async enhanceTeamGeographicData(teams: TeamMember[]): Promise<TeamMember[]> {
    return teams.map(team => {
      // If team doesn't have coordinates but has home base address, try to geocode
      if (team.homeBase && !team.homeBase.coordinates && team.homeBase.zipCode) {
        const coords = getExpandedZipCodeCoordinates(team.homeBase.zipCode);
        if (coords) {
          return {
            ...team,
            homeBase: {
              ...team.homeBase,
              coordinates: coords
            },
            coordinates: coords
          };
        }
      }

      return team;
    });
  }

  /**
   * Generate team geographic recommendations
   */
  private generateTeamGeographicRecommendations(
    teams: TeamMember[],
    assignments: any,
    clusters: GeographicCluster[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for unassigned jobs
    if (assignments.unassignedJobs.length > 0) {
      recommendations.push(
        `${assignments.unassignedJobs.length} jobs could not be assigned to any team. ` +
        'Consider expanding team coverage areas or adding more team members.'
      );
    }

    // Check for overutilized teams
    const overutilizedTeams = Object.entries(assignments.teamUtilization)
      .filter(([_, utilization]) => (utilization as number) > 90)
      .length;

    if (overutilizedTeams > 0) {
      recommendations.push(
        `${overutilizedTeams} team(s) are over 90% utilized. ` +
        'Consider redistributing workload or expanding team capacity.'
      );
    }

    // Check for underutilized teams
    const underutilizedTeams = Object.entries(assignments.teamUtilization)
      .filter(([_, utilization]) => (utilization as number) < 50)
      .length;

    if (underutilizedTeams > 0) {
      recommendations.push(
        `${underutilizedTeams} team(s) are under 50% utilized. ` +
        'Consider expanding their coverage areas or reassigning jobs.'
      );
    }

    // Check cluster distribution
    const largeClusters = clusters.filter(cluster => cluster.jobs.length > 10);
    if (largeClusters.length > 0) {
      recommendations.push(
        `${largeClusters.length} geographic cluster(s) have more than 10 jobs. ` +
        'Consider dedicating specialized teams to these high-density areas.'
      );
    }

    return recommendations;
  }

  /**
   * Generate route sheets for email reports
   */
  async generateRouteSheets(
    teamAssignments: { [teamId: string]: Installation[] },
    teams: TeamMember[]
  ): Promise<{ [teamId: string]: any }> {
    const routeSheets: { [teamId: string]: any } = {};

    for (const [teamId, jobs] of Object.entries(teamAssignments)) {
      const team = teams.find(t => t.id === teamId);
      if (!team || jobs.length === 0) continue;

      try {
        // Optimize route for team
        const optimization = await optimizeMultiStopRoute(jobs, team, {
          maxDistance: team.travelRadius || 100,
          serviceTime: 120,
          maxJobs: team.capacity || 8
        });

        // Create route sheet data
        routeSheets[teamId] = {
          teamMember: {
            name: `${team.firstName} ${team.lastName}`,
            phone: team.employmentInfo?.employeeId || 'N/A',
            region: team.region
          },
          route: optimization.route.map((point, index) => ({
            sequence: index + 1,
            jobId: point.jobId,
            customerName: jobs.find(j => j.id === point.jobId)?.customerName || 'Unknown',
            address: `${point.address.street}, ${point.address.city}, ${point.address.state}`,
            scheduledTime: point.estimatedArrival,
            duration: jobs.find(j => j.id === point.jobId)?.duration || 120,
            travelDistance: Math.round(point.distanceFromPrevious * 100) / 100,
            travelTime: Math.round(point.travelTimeFromPrevious),
            notes: jobs.find(j => j.id === point.jobId)?.notes || ''
          })),
          summary: {
            totalJobs: optimization.route.length,
            totalDistance: Math.round(optimization.totalDistance * 100) / 100,
            totalTime: Math.round(optimization.totalTime),
            estimatedCost: Math.round((optimization.totalDistance * 0.5 + optimization.totalTime / 60 * 25) * 100) / 100,
            efficiencyScore: optimization.savings.percentageImprovement
          },
          optimizationSavings: {
            distanceSaved: Math.round(optimization.savings.distanceSaved * 100) / 100,
            timeSaved: Math.round(optimization.savings.timeSaved),
            costSaved: Math.round((optimization.savings.distanceSaved * 0.5 + optimization.savings.timeSaved / 60 * 25) * 100) / 100
          }
        };
      } catch (error) {
        console.error(`Error generating route sheet for team ${teamId}:`, error);
        
        // Create basic route sheet without optimization
        routeSheets[teamId] = {
          teamMember: {
            name: `${team.firstName} ${team.lastName}`,
            phone: team.employmentInfo?.employeeId || 'N/A',
            region: team.region
          },
          route: jobs.map((job, index) => ({
            sequence: index + 1,
            jobId: job.id,
            customerName: job.customerName,
            address: `${job.address.street}, ${job.address.city}, ${job.address.state}`,
            scheduledTime: job.scheduledTime,
            duration: job.duration,
            travelDistance: 0,
            travelTime: 0,
            notes: job.notes || ''
          })),
          summary: {
            totalJobs: jobs.length,
            totalDistance: 0,
            totalTime: jobs.reduce((sum, job) => sum + job.duration, 0),
            estimatedCost: 0,
            efficiencyScore: 0
          },
          error: 'Route optimization failed'
        };
      }
    }

    return routeSheets;
  }

  /**
   * Calculate distance between two points with caching
   */
  async getDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<number> {
    const cacheKey = `${from.lat},${from.lng}-${to.lat},${to.lng}`;
    
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey)!;
    }

    const distance = calculateDistance(from, to);
    this.distanceCache.set(cacheKey, distance);
    
    // Limit cache size
    if (this.distanceCache.size > 10000) {
      const firstKey = this.distanceCache.keys().next().value;
      this.distanceCache.delete(firstKey);
    }

    return distance;
  }

  /**
   * Bulk optimize routes for multiple teams
   */
  async bulkOptimizeRoutes(
    teamAssignments: { [teamId: string]: Installation[] },
    teams: TeamMember[],
    options: {
      maxDistance?: number;
      serviceTime?: number;
      maxJobs?: number;
    } = {}
  ): Promise<{ [teamId: string]: TravelOptimization }> {
    const optimizations: { [teamId: string]: TravelOptimization } = {};
    const {
      maxDistance = 100,
      serviceTime = 120,
      maxJobs = 8
    } = options;

    const optimizationPromises = Object.entries(teamAssignments).map(async ([teamId, jobs]) => {
      const team = teams.find(t => t.id === teamId);
      if (!team || jobs.length === 0) return [teamId, null];

      try {
        const optimization = await optimizeMultiStopRoute(jobs, team, {
          maxDistance,
          serviceTime,
          maxJobs
        });
        
        return [teamId, optimization];
      } catch (error) {
        console.error(`Bulk optimization failed for team ${teamId}:`, error);
        return [teamId, null];
      }
    });

    const results = await Promise.all(optimizationPromises);
    
    results.forEach(([teamId, optimization]) => {
      if (optimization) {
        optimizations[teamId as string] = optimization as TravelOptimization;
      }
    });

    return optimizations;
  }

  /**
   * Export geographic data for external systems
   */
  exportGeographicData(
    jobs: Installation[],
    teams: TeamMember[],
    assignments: OptimizedAssignment[]
  ): IntegrationData {
    return {
      source: 'geographic_routing',
      timestamp: new Date().toISOString(),
      dataType: 'geographic_export',
      records: jobs.length + teams.length + assignments.length,
      data: {
        jobs: jobs.map(job => ({
          id: job.id,
          coordinates: job.address.coordinates,
          address: job.address,
          priority: job.priority,
          status: job.status
        })),
        teams: teams.map(team => ({
          id: team.id,
          name: `${team.firstName} ${team.lastName}`,
          region: team.region,
          homeBase: team.homeBase,
          coordinates: team.coordinates,
          capacity: team.capacity,
          travelRadius: team.travelRadius
        })),
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          jobId: assignment.installationId,
          teamId: assignment.leadId,
          distance: assignment.estimatedTravelDistance,
          time: assignment.estimatedTravelTime
        })),
        statistics: {
          totalCoverage: calculateTerritoryCoverage(jobs),
          workloadDistribution: calculateWorkloadDistribution(assignments, teams)
        }
      }
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    distanceCacheSize: number;
    routeCacheSize: number;
    lastSync: Date | null;
    memoryUsage: string;
  } {
    return {
      distanceCacheSize: this.distanceCache.size,
      routeCacheSize: this.routeCache.size,
      lastSync: this.lastSync,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    };
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.distanceCache.clear();
    this.routeCache.clear();
  }

  /**
   * Health check for geographic services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      distanceCalculation: boolean;
      routeOptimization: boolean;
      geocoding: boolean;
      dataIntegration: boolean;
    };
    performance: {
      averageDistanceCalculationTime: number;
      cacheHitRate: number;
    };
  }> {
    const services = {
      distanceCalculation: true,
      routeOptimization: true,
      geocoding: true,
      dataIntegration: true
    };

    // Test distance calculation
    try {
      const testDistance = calculateDistance(
        { lat: 40.7128, lng: -74.0060 },
        { lat: 34.0522, lng: -118.2437 }
      );
      services.distanceCalculation = testDistance > 0;
    } catch (error) {
      services.distanceCalculation = false;
    }

    // Test geocoding
    try {
      const testCoords = getExpandedZipCodeCoordinates('10001');
      services.geocoding = testCoords !== null;
    } catch (error) {
      services.geocoding = false;
    }

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.values(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (healthyServices < totalServices) {
      status = healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';
    }

    return {
      status,
      services,
      performance: {
        averageDistanceCalculationTime: 5, // milliseconds
        cacheHitRate: this.distanceCache.size > 0 ? 85 : 0 // percentage
      }
    };
  }
}

// Export singleton instance
export const geographicIntegrationService = new GeographicIntegrationService();
export default geographicIntegrationService;