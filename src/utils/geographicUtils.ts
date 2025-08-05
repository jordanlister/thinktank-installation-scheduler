// Think Tank Technologies Installation Scheduler - Geographic Optimization Utilities

import type {
  Installation,
  TeamMember,
  GeographicCluster,
  TravelOptimization,
  RoutePoint,
  Address,
  DistanceMatrix,
  OptimizedAssignment
} from '../types';

import * as geolib from 'geolib';
import * as turf from '@turf/turf';
import { around } from 'geokdbush';

/**
 * Geographic Clustering and Distance Calculation Utilities
 * 
 * Provides functionality for:
 * - Haversine distance calculations between coordinates
 * - Geographic clustering of jobs for optimal routing
 * - Route optimization using nearest neighbor and 2-opt algorithms
 * - Travel time estimation based on distance and traffic patterns
 */

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in miles
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance and road conditions
 * @param distance Distance in miles
 * @param isUrban Whether the route is primarily urban (affects speed)
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTime(distance: number, isUrban: boolean = true): number {
  // Urban: average 25 mph, Rural: average 45 mph
  const averageSpeed = isUrban ? 25 : 45;
  const timeInHours = distance / averageSpeed;
  
  // Add buffer for traffic and route complexity
  const bufferMultiplier = isUrban ? 1.3 : 1.1;
  
  return Math.round(timeInHours * 60 * bufferMultiplier);
}

/**
 * Create geographic clusters of jobs for optimal routing
 * Uses DBSCAN-inspired clustering algorithm
 */
export function createGeographicClusters(
  jobs: Installation[],
  maxClusterRadius: number = 25, // miles
  minJobsPerCluster: number = 2
): GeographicCluster[] {
  const clusters: GeographicCluster[] = [];
  const processedJobs = new Set<string>();
  
  for (const job of jobs) {
    if (processedJobs.has(job.id) || !job.address.coordinates) continue;
    
    const clusterJobs = [job];
    processedJobs.add(job.id);
    
    // Find nearby jobs within cluster radius
    for (const otherJob of jobs) {
      if (processedJobs.has(otherJob.id) || !otherJob.address.coordinates) continue;
      
      const distance = calculateDistance(
        job.address.coordinates,
        otherJob.address.coordinates
      );
      
      if (distance <= maxClusterRadius) {
        clusterJobs.push(otherJob);
        processedJobs.add(otherJob.id);
      }
    }
    
    // Only create cluster if it meets minimum size requirement
    if (clusterJobs.length >= minJobsPerCluster) {
      const center = calculateClusterCenter(clusterJobs);
      const radius = calculateClusterRadius(clusterJobs, center);
      const density = clusterJobs.length / (Math.PI * radius * radius);
      
      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        center,
        jobs: clusterJobs,
        radius,
        density
      });
    } else {
      // If cluster is too small, create individual clusters
      clusterJobs.forEach(singleJob => {
        if (singleJob.address.coordinates) {
          clusters.push({
            id: `cluster_single_${singleJob.id}`,
            center: singleJob.address.coordinates,
            jobs: [singleJob],
            radius: 0,
            density: 1
          });
        }
      });
    }
  }
  
  return clusters;
}

/**
 * Calculate the geographic center of a cluster of jobs
 */
function calculateClusterCenter(jobs: Installation[]): { lat: number; lng: number } {
  const validCoords = jobs
    .map(job => job.address.coordinates)
    .filter((coord): coord is { lat: number; lng: number } => coord !== undefined);
    
  if (validCoords.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const avgLat = validCoords.reduce((sum, coord) => sum + coord.lat, 0) / validCoords.length;
  const avgLng = validCoords.reduce((sum, coord) => sum + coord.lng, 0) / validCoords.length;
  
  return { lat: avgLat, lng: avgLng };
}

/**
 * Calculate the radius of a cluster (maximum distance from center)
 */
function calculateClusterRadius(
  jobs: Installation[], 
  center: { lat: number; lng: number }
): number {
  const distances = jobs
    .map(job => job.address.coordinates)
    .filter((coord): coord is { lat: number; lng: number } => coord !== undefined)
    .map(coord => calculateDistance(center, coord));
    
  return Math.max(...distances, 0);
}

/**
 * Optimize route for a team member visiting multiple jobs
 * Uses nearest neighbor algorithm with 2-opt improvement
 */
export async function optimizeRoute(
  jobs: Installation[],
  teamMember: TeamMember
): Promise<TravelOptimization> {
  if (jobs.length <= 1) {
    return {
      route: jobs.map(job => createRoutePoint(job, 0, 0)),
      totalDistance: 0,
      totalTime: 0,
      savings: { distanceSaved: 0, timeSaved: 0, percentageImprovement: 0 }
    };
  }
  
  // Start from team member's home base or first job
  const startPoint = teamMember.homeBase || jobs[0].address;
  const unvisitedJobs = [...jobs];
  const route: RoutePoint[] = [];
  
  let currentPosition = startPoint.coordinates || { lat: 0, lng: 0 };
  let totalDistance = 0;
  let totalTime = 0;
  
  // Nearest neighbor algorithm
  while (unvisitedJobs.length > 0) {
    let nearestJobIndex = 0;
    let nearestDistance = Infinity;
    
    // Find nearest unvisited job
    for (let i = 0; i < unvisitedJobs.length; i++) {
      const job = unvisitedJobs[i];
      if (!job.address.coordinates) continue;
      
      const distance = calculateDistance(currentPosition, job.address.coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestJobIndex = i;
      }
    }
    
    // Add nearest job to route
    const nearestJob = unvisitedJobs[nearestJobIndex];
    const travelTime = estimateTravelTime(nearestDistance, isUrbanArea(nearestJob.address));
    
    route.push(createRoutePoint(nearestJob, nearestDistance, travelTime));
    
    // Update position and totals
    currentPosition = nearestJob.address.coordinates || currentPosition;
    totalDistance += nearestDistance;
    totalTime += travelTime + (nearestJob.duration || 120); // Include job duration
    
    // Remove job from unvisited list
    unvisitedJobs.splice(nearestJobIndex, 1);
  }
  
  // Apply 2-opt optimization for improvement
  const optimizedRoute = apply2OptOptimization(route);
  const optimizedMetrics = recalculateRouteMetrics(optimizedRoute);
  
  // Calculate savings compared to naive route
  const naiveDistance = calculateNaiveRouteDistance(jobs);
  const savings = {
    distanceSaved: Math.max(0, naiveDistance - optimizedMetrics.totalDistance),
    timeSaved: Math.max(0, estimateTravelTime(naiveDistance) - optimizedMetrics.totalTime),
    percentageImprovement: naiveDistance > 0 ? 
      ((naiveDistance - optimizedMetrics.totalDistance) / naiveDistance) * 100 : 0
  };
  
  return {
    route: optimizedRoute,
    totalDistance: optimizedMetrics.totalDistance,
    totalTime: optimizedMetrics.totalTime,
    savings
  };
}

/**
 * Create a route point with estimated arrival and departure times
 */
function createRoutePoint(
  job: Installation, 
  distanceFromPrevious: number, 
  travelTimeFromPrevious: number
): RoutePoint {
  const jobDuration = job.duration || 120; // Default 2 hours
  const arrivalTime = new Date();
  const departureTime = new Date(arrivalTime.getTime() + jobDuration * 60000);
  
  return {
    jobId: job.id,
    address: job.address,
    estimatedArrival: arrivalTime.toISOString(),
    estimatedDeparture: departureTime.toISOString(),
    distanceFromPrevious,
    travelTimeFromPrevious
  };
}

/**
 * Determine if an address is in an urban area based on city/state data
 */
function isUrbanArea(address: Address): boolean {
  // Simple heuristic - could be enhanced with actual urban area data
  const urbanCities = [
    'new york', 'los angeles', 'chicago', 'houston', 'phoenix',
    'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose',
    'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte',
    'san francisco', 'indianapolis', 'seattle', 'denver', 'washington',
    'boston', 'detroit', 'nashville', 'memphis', 'portland',
    'oklahoma city', 'las vegas', 'louisville', 'baltimore', 'milwaukee',
    'albuquerque', 'tucson', 'fresno', 'sacramento', 'kansas city',
    'mesa', 'atlanta', 'omaha', 'colorado springs', 'raleigh'
  ];
  
  return urbanCities.includes(address.city.toLowerCase());
}

/**
 * Apply 2-opt optimization to improve route efficiency
 */
function apply2OptOptimization(route: RoutePoint[]): RoutePoint[] {
  if (route.length <= 2) return route;
  
  let improved = true;
  let optimizedRoute = [...route];
  
  while (improved) {
    improved = false;
    
    for (let i = 1; i < optimizedRoute.length - 2; i++) {
      for (let j = i + 1; j < optimizedRoute.length - 1; j++) {
        // Calculate current distance
        const currentDistance = 
          calculateDistanceBetweenRoutePoints(optimizedRoute[i - 1], optimizedRoute[i]) +
          calculateDistanceBetweenRoutePoints(optimizedRoute[j], optimizedRoute[j + 1]);
        
        // Calculate distance if we reverse the segment
        const newDistance = 
          calculateDistanceBetweenRoutePoints(optimizedRoute[i - 1], optimizedRoute[j]) +
          calculateDistanceBetweenRoutePoints(optimizedRoute[i], optimizedRoute[j + 1]);
        
        if (newDistance < currentDistance) {
          // Reverse the segment from i to j
          const newRoute = [
            ...optimizedRoute.slice(0, i),
            ...optimizedRoute.slice(i, j + 1).reverse(),
            ...optimizedRoute.slice(j + 1)
          ];
          optimizedRoute = newRoute;
          improved = true;
        }
      }
    }
  }
  
  return optimizedRoute;
}

/**
 * Calculate distance between two route points
 */
function calculateDistanceBetweenRoutePoints(point1: RoutePoint, point2: RoutePoint): number {
  const coord1 = point1.address.coordinates;
  const coord2 = point2.address.coordinates;
  
  if (!coord1 || !coord2) return 0;
  
  return calculateDistance(coord1, coord2);
}

/**
 * Recalculate route metrics after optimization
 */
function recalculateRouteMetrics(route: RoutePoint[]): { totalDistance: number; totalTime: number } {
  let totalDistance = 0;
  let totalTime = 0;
  
  for (let i = 1; i < route.length; i++) {
    const distance = calculateDistanceBetweenRoutePoints(route[i - 1], route[i]);
    const time = estimateTravelTime(distance, isUrbanArea(route[i].address));
    
    totalDistance += distance;
    totalTime += time;
  }
  
  return { totalDistance, totalTime };
}

/**
 * Calculate naive route distance (visiting jobs in original order)
 */
function calculateNaiveRouteDistance(jobs: Installation[]): number {
  let totalDistance = 0;
  
  for (let i = 1; i < jobs.length; i++) {
    const prev = jobs[i - 1].address.coordinates;
    const current = jobs[i].address.coordinates;
    
    if (prev && current) {
      totalDistance += calculateDistance(prev, current);
    }
  }
  
  return totalDistance;
}

/**
 * Get ZIP code coordinates using approximate mapping
 * This is a simplified version - in production, you'd use a proper geocoding service
 */
export function getZipCodeCoordinates(zipCode: string): { lat: number; lng: number } | null {
  // Sample ZIP code to coordinate mapping (very limited set for demo)
  const zipToCoords: { [zip: string]: { lat: number; lng: number } } = {
    '10001': { lat: 40.7505, lng: -73.9971 }, // NYC
    '90210': { lat: 34.0901, lng: -118.4065 }, // Beverly Hills
    '60601': { lat: 41.8827, lng: -87.6233 }, // Chicago
    '77001': { lat: 29.7349, lng: -95.3885 }, // Houston
    '85001': { lat: 33.4487, lng: -112.0740 }, // Phoenix
    '30301': { lat: 33.7537, lng: -84.3863 }, // Atlanta
    '98101': { lat: 47.6062, lng: -122.3321 }, // Seattle
    '02101': { lat: 42.3584, lng: -71.0598 }, // Boston
    '80201': { lat: 39.7547, lng: -104.9969 }, // Denver
    '33101': { lat: 25.7741, lng: -80.1937 }  // Miami
  };
  
  return zipToCoords[zipCode] || null;
}

/**
 * Enhanced ZIP code coordinate lookup with expanded coverage
 * In production, this would connect to a comprehensive geocoding service
 */
export function getExpandedZipCodeCoordinates(zipCode: string): { lat: number; lng: number } | null {
  // Expanded ZIP code mapping for better coverage
  const expandedZipToCoords: { [zip: string]: { lat: number; lng: number } } = {
    // Major cities
    '10001': { lat: 40.7505, lng: -73.9971 }, // NYC
    '90210': { lat: 34.0901, lng: -118.4065 }, // Beverly Hills
    '60601': { lat: 41.8827, lng: -87.6233 }, // Chicago
    '77001': { lat: 29.7349, lng: -95.3885 }, // Houston
    '85001': { lat: 33.4487, lng: -112.0740 }, // Phoenix
    '30301': { lat: 33.7537, lng: -84.3863 }, // Atlanta
    '98101': { lat: 47.6062, lng: -122.3321 }, // Seattle
    '02101': { lat: 42.3584, lng: -71.0598 }, // Boston
    '80201': { lat: 39.7547, lng: -104.9969 }, // Denver
    '33101': { lat: 25.7741, lng: -80.1937 }, // Miami
    
    // Additional West Coast
    '94102': { lat: 37.7749, lng: -122.4194 }, // San Francisco
    '97201': { lat: 45.5152, lng: -122.6784 }, // Portland
    '98660': { lat: 45.6387, lng: -122.6615 }, // Vancouver, WA
    '99201': { lat: 47.6587, lng: -117.4260 }, // Spokane
    '83701': { lat: 43.6150, lng: -116.2023 }, // Boise
    '92101': { lat: 32.7157, lng: -117.1611 }, // San Diego
    '95814': { lat: 38.5816, lng: -121.4944 }, // Sacramento
    '93701': { lat: 36.7378, lng: -119.7871 }, // Fresno
    
    // Texas
    '75201': { lat: 32.7767, lng: -96.7970 }, // Dallas
    '78701': { lat: 30.2672, lng: -97.7431 }, // Austin
    '78201': { lat: 29.4241, lng: -98.4936 }, // San Antonio
    
    // Florida
    '32801': { lat: 28.5383, lng: -81.3792 }, // Orlando
    '33102': { lat: 25.7617, lng: -80.1918 }, // Miami Beach
    '33602': { lat: 27.9506, lng: -82.4572 }, // Tampa
    
    // Additional states
    '89101': { lat: 36.1699, lng: -115.1398 }, // Las Vegas
    '87101': { lat: 35.0844, lng: -106.6504 }, // Albuquerque
    '84101': { lat: 40.7608, lng: -111.8910 }, // Salt Lake City
    '37201': { lat: 36.1627, lng: -86.7816 }, // Nashville
    '40201': { lat: 38.2527, lng: -85.7585 }, // Louisville
    '64108': { lat: 39.0997, lng: -94.5786 }, // Kansas City
    '55401': { lat: 44.9778, lng: -93.2650 }, // Minneapolis
    '53202': { lat: 43.0389, lng: -87.9065 }, // Milwaukee
    '68102': { lat: 41.2565, lng: -95.9345 } // Omaha
  };
  
  return expandedZipToCoords[zipCode] || null;
}

/**
 * Create distance matrix for multiple locations
 * Essential for route optimization calculations
 */
export function createDistanceMatrix(
  locations: { id: string; coordinates: { lat: number; lng: number } }[]
): DistanceMatrix {
  const matrix: DistanceMatrix = {};
  
  for (const from of locations) {
    if (!from.coordinates) continue;
    matrix[from.id] = {};
    
    for (const to of locations) {
      if (!to.coordinates) continue;
      
      const distance = calculateDistance(from.coordinates, to.coordinates);
      const duration = estimateTravelTime(distance, isUrbanByCoordinates(from.coordinates));
      
      matrix[from.id][to.id] = {
        distance,
        duration,
        route: `${from.id}-${to.id}`
      };
    }
  }
  
  return matrix;
}

/**
 * Determine if coordinates are in urban area using geographic analysis
 */
function isUrbanByCoordinates(coordinates: { lat: number; lng: number }): boolean {
  // Major urban area bounding boxes (simplified)
  const urbanAreas = [
    { name: 'NYC Metro', bounds: { north: 40.9176, south: 40.4774, east: -73.7004, west: -74.2591 } },
    { name: 'LA Metro', bounds: { north: 34.3373, south: 33.7037, east: -117.6462, west: -118.6682 } },
    { name: 'Chicago Metro', bounds: { north: 42.0231, south: 41.6445, east: -87.5244, west: -87.9401 } },
    { name: 'Houston Metro', bounds: { north: 30.1107, south: 29.5226, east: -95.0139, west: -95.8236 } },
    { name: 'Phoenix Metro', bounds: { north: 33.8122, south: 33.2477, east: -111.5967, west: -112.8275 } },
    { name: 'SF Bay Area', bounds: { north: 37.9298, south: 37.1839, east: -121.4944, west: -123.5331 } },
    { name: 'Seattle Metro', bounds: { north: 47.7511, south: 47.4815, east: -122.2244, west: -122.4594 } },
    { name: 'Denver Metro', bounds: { north: 39.9142, south: 39.5501, east: -104.6091, west: -105.2368 } }
  ];
  
  return urbanAreas.some(area => 
    coordinates.lat >= area.bounds.south &&
    coordinates.lat <= area.bounds.north &&
    coordinates.lng >= area.bounds.west &&
    coordinates.lng <= area.bounds.east
  );
}

/**
 * Advanced multi-stop route optimization using genetic algorithm principles
 */
export async function optimizeMultiStopRoute(
  jobs: Installation[],
  teamMember: TeamMember,
  constraints: {
    maxDistance?: number;
    timeWindows?: { [jobId: string]: { start: string; end: string } };
    serviceTime?: number;
    maxJobs?: number;
  } = {}
): Promise<TravelOptimization> {
  if (jobs.length <= 1) {
    return optimizeRoute(jobs, teamMember);
  }
  
  const {
    maxDistance = 500,
    timeWindows = {},
    serviceTime = 120,
    maxJobs = 10
  } = constraints;
  
  // Filter jobs by constraints
  const validJobs = jobs.slice(0, maxJobs).filter(job => {
    if (!job.address.coordinates) return false;
    
    // Check maximum distance constraint
    if (teamMember.homeBase?.coordinates) {
      const distanceFromBase = calculateDistance(
        teamMember.homeBase.coordinates,
        job.address.coordinates
      );
      return distanceFromBase <= maxDistance;
    }
    
    return true;
  });
  
  if (validJobs.length === 0) {
    return {
      route: [],
      totalDistance: 0,
      totalTime: 0,
      savings: { distanceSaved: 0, timeSaved: 0, percentageImprovement: 0 }
    };
  }
  
  // Create distance matrix for optimization
  const locations = validJobs.map(job => ({
    id: job.id,
    coordinates: job.address.coordinates!
  }));
  
  // Add team member home base if available
  if (teamMember.homeBase?.coordinates) {
    locations.unshift({
      id: 'home',
      coordinates: teamMember.homeBase.coordinates
    });
  }
  
  const distanceMatrix = createDistanceMatrix(locations);
  
  // Use genetic algorithm for optimization
  const optimizedOrder = await geneticAlgorithmOptimization(
    validJobs,
    distanceMatrix,
    teamMember,
    timeWindows,
    serviceTime
  );
  
  // Convert to route points
  const route = optimizedOrder.map((job, index) => {
    const prevJobId = index > 0 ? optimizedOrder[index - 1].id : 'home';
    const distance = distanceMatrix[prevJobId]?.[job.id]?.distance || 0;
    const travelTime = distanceMatrix[prevJobId]?.[job.id]?.duration || 0;
    
    return createRoutePoint(job, distance, travelTime);
  });
  
  // Calculate totals
  const totalDistance = route.reduce((sum, point) => sum + point.distanceFromPrevious, 0);
  const totalTime = route.reduce((sum, point) => sum + point.travelTimeFromPrevious + serviceTime, 0);
  
  // Calculate savings compared to naive route
  const naiveDistance = calculateNaiveRouteDistance(validJobs);
  const savings = {
    distanceSaved: Math.max(0, naiveDistance - totalDistance),
    timeSaved: Math.max(0, estimateTravelTime(naiveDistance) - totalTime),
    percentageImprovement: naiveDistance > 0 ? 
      ((naiveDistance - totalDistance) / naiveDistance) * 100 : 0
  };
  
  return {
    route,
    totalDistance,
    totalTime,
    savings
  };
}

/**
 * Genetic algorithm for route optimization
 */
async function geneticAlgorithmOptimization(
  jobs: Installation[],
  distanceMatrix: DistanceMatrix,
  teamMember: TeamMember,
  timeWindows: { [jobId: string]: { start: string; end: string } },
  serviceTime: number,
  populationSize: number = 50,
  generations: number = 100
): Promise<Installation[]> {
  // Initialize population with random permutations
  let population = Array.from({ length: populationSize }, () => 
    shuffleArray([...jobs])
  );
  
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness of each route
    const fitness = population.map(route => 
      evaluateRouteFitness(route, distanceMatrix, timeWindows, serviceTime)
    );
    
    // Select best routes for breeding
    const selected = selectBestRoutes(population, fitness, populationSize / 2);
    
    // Create new generation through crossover and mutation
    const newGeneration = [];
    
    // Keep best routes (elitism)
    newGeneration.push(...selected.slice(0, 10));
    
    // Generate offspring
    while (newGeneration.length < populationSize) {
      const parent1 = selected[Math.floor(Math.random() * selected.length)];
      const parent2 = selected[Math.floor(Math.random() * selected.length)];
      
      const offspring = crossoverRoutes(parent1, parent2);
      const mutatedOffspring = mutateRoute(offspring, 0.1);
      
      newGeneration.push(mutatedOffspring);
    }
    
    population = newGeneration;
  }
  
  // Return best route from final generation
  const finalFitness = population.map(route => 
    evaluateRouteFitness(route, distanceMatrix, timeWindows, serviceTime)
  );
  
  const bestIndex = finalFitness.indexOf(Math.min(...finalFitness));
  return population[bestIndex];
}

/**
 * Evaluate fitness of a route (lower is better)
 */
function evaluateRouteFitness(
  route: Installation[],
  distanceMatrix: DistanceMatrix,
  timeWindows: { [jobId: string]: { start: string; end: string } },
  serviceTime: number
): number {
  let totalDistance = 0;
  let totalTime = 0;
  let timeWindowPenalty = 0;
  
  for (let i = 0; i < route.length; i++) {
    const currentJob = route[i];
    const prevJobId = i > 0 ? route[i - 1].id : 'home';
    
    const distance = distanceMatrix[prevJobId]?.[currentJob.id]?.distance || 0;
    const duration = distanceMatrix[prevJobId]?.[currentJob.id]?.duration || 0;
    
    totalDistance += distance;
    totalTime += duration + serviceTime;
    
    // Apply time window penalty
    if (timeWindows[currentJob.id]) {
      const window = timeWindows[currentJob.id];
      const arrivalTime = new Date(Date.now() + totalTime * 60000);
      const windowStart = new Date(window.start);
      const windowEnd = new Date(window.end);
      
      if (arrivalTime < windowStart || arrivalTime > windowEnd) {
        timeWindowPenalty += 1000; // Heavy penalty for time window violations
      }
    }
  }
  
  return totalDistance + timeWindowPenalty;
}

/**
 * Select best routes based on fitness
 */
function selectBestRoutes(
  population: Installation[][],
  fitness: number[],
  count: number
): Installation[][] {
  const indexed = population.map((route, index) => ({ route, fitness: fitness[index] }));
  indexed.sort((a, b) => a.fitness - b.fitness);
  return indexed.slice(0, count).map(item => item.route);
}

/**
 * Crossover two routes to create offspring
 */
function crossoverRoutes(
  parent1: Installation[],
  parent2: Installation[]
): Installation[] {
  const length = parent1.length;
  const start = Math.floor(Math.random() * length);
  const end = Math.floor(Math.random() * (length - start)) + start;
  
  const offspring = new Array(length);
  
  // Copy segment from parent1
  for (let i = start; i < end; i++) {
    offspring[i] = parent1[i];
  }
  
  // Fill remaining positions with parent2 (avoiding duplicates)
  const usedJobs = new Set(offspring.filter(Boolean).map(job => job.id));
  let parent2Index = 0;
  
  for (let i = 0; i < length; i++) {
    if (!offspring[i]) {
      while (parent2Index < parent2.length && usedJobs.has(parent2[parent2Index].id)) {
        parent2Index++;
      }
      if (parent2Index < parent2.length) {
        offspring[i] = parent2[parent2Index];
        usedJobs.add(parent2[parent2Index].id);
        parent2Index++;
      }
    }
  }
  
  return offspring.filter(Boolean);
}

/**
 * Mutate route by swapping random positions
 */
function mutateRoute(route: Installation[], mutationRate: number): Installation[] {
  const mutated = [...route];
  
  for (let i = 0; i < mutated.length; i++) {
    if (Math.random() < mutationRate) {
      const j = Math.floor(Math.random() * mutated.length);
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    }
  }
  
  return mutated;
}

/**
 * Utility function to shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate territory coverage area using convex hull
 */
export function calculateTerritoryCoverage(
  jobs: Installation[]
): {
  area: number; // in square miles
  perimeter: number; // in miles
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
} {
  const validCoords = jobs
    .map(job => job.address.coordinates)
    .filter((coord): coord is { lat: number; lng: number } => coord !== undefined);
    
  if (validCoords.length === 0) {
    return {
      area: 0,
      perimeter: 0,
      center: { lat: 0, lng: 0 },
      bounds: { north: 0, south: 0, east: 0, west: 0 }
    };
  }
  
  // Convert to turf points
  const points = validCoords.map(coord => turf.point([coord.lng, coord.lat]));
  const features = turf.featureCollection(points);
  
  // Calculate convex hull
  const hull = turf.convex(features);
  
  if (!hull) {
    return {
      area: 0,
      perimeter: 0,
      center: validCoords[0],
      bounds: {
        north: validCoords[0].lat,
        south: validCoords[0].lat,
        east: validCoords[0].lng,
        west: validCoords[0].lng
      }
    };
  }
  
  // Calculate area in square miles
  const areaInSquareMeters = turf.area(hull);
  const areaInSquareMiles = areaInSquareMeters * 3.861e-7;
  
  // Calculate perimeter in miles
  const perimeterInMeters = turf.length(hull, { units: 'meters' });
  const perimeterInMiles = perimeterInMeters * 0.000621371;
  
  // Calculate center
  const center = turf.centroid(hull);
  
  // Calculate bounds
  const bbox = turf.bbox(hull);
  
  return {
    area: Math.round(areaInSquareMiles * 100) / 100,
    perimeter: Math.round(perimeterInMiles * 100) / 100,
    center: { lat: center.geometry.coordinates[1], lng: center.geometry.coordinates[0] },
    bounds: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3]
    }
  };
}

/**
 * Calculate team workload distribution metrics
 */
export function calculateWorkloadDistribution(
  assignments: OptimizedAssignment[],
  teams: TeamMember[]
): {
  teamWorkloads: { [teamId: string]: {
    jobCount: number;
    totalDistance: number;
    totalTime: number;
    utilizationPercentage: number;
    efficiencyScore: number;
  } };
  averageUtilization: number;
  workloadVariance: number;
  recommendations: string[];
} {
  const teamWorkloads: { [teamId: string]: any } = {};
  const recommendations: string[] = [];
  
  // Initialize team workloads
  teams.forEach(team => {
    teamWorkloads[team.id] = {
      jobCount: 0,
      totalDistance: 0,
      totalTime: 0,
      utilizationPercentage: 0,
      efficiencyScore: 0
    };
  });
  
  // Calculate workloads from assignments
  assignments.forEach(assignment => {
    const leadWorkload = teamWorkloads[assignment.leadId];
    if (leadWorkload) {
      leadWorkload.jobCount++;
      leadWorkload.totalDistance += assignment.estimatedTravelDistance || 0;
      leadWorkload.totalTime += assignment.estimatedTravelTime || 0;
    }
    
    if (assignment.assistantId) {
      const assistantWorkload = teamWorkloads[assignment.assistantId];
      if (assistantWorkload) {
        assistantWorkload.jobCount++;
        assistantWorkload.totalDistance += assignment.estimatedTravelDistance || 0;
        assistantWorkload.totalTime += assignment.estimatedTravelTime || 0;
      }
    }
  });
  
  // Calculate utilization and efficiency
  const utilizationValues: number[] = [];
  
  Object.keys(teamWorkloads).forEach(teamId => {
    const team = teams.find(t => t.id === teamId);
    const workload = teamWorkloads[teamId];
    
    if (team) {
      const maxDailyCapacity = team.capacity || 8; // Default 8 jobs per day
      workload.utilizationPercentage = (workload.jobCount / maxDailyCapacity) * 100;
      
      // Efficiency based on distance vs time ratio
      workload.efficiencyScore = workload.totalTime > 0 ? 
        (workload.totalDistance / workload.totalTime) * 100 : 0;
      
      utilizationValues.push(workload.utilizationPercentage);
    }
  });
  
  // Calculate statistics
  const averageUtilization = utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length || 0;
  const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - averageUtilization, 2), 0) / utilizationValues.length || 0;
  
  // Generate recommendations
  if (variance > 400) { // High variance (20% std dev)
    recommendations.push('High workload imbalance detected. Consider redistributing assignments.');
  }
  
  if (averageUtilization < 60) {
    recommendations.push('Team utilization is below optimal. Consider increasing job assignments.');
  } else if (averageUtilization > 90) {
    recommendations.push('Team utilization is very high. Consider adding more team members or extending work hours.');
  }
  
  const underutilizedTeams = Object.keys(teamWorkloads).filter(
    teamId => teamWorkloads[teamId].utilizationPercentage < 50
  );
  
  if (underutilizedTeams.length > 0) {
    recommendations.push(`${underutilizedTeams.length} team member(s) are underutilized and could take on more work.`);
  }
  
  return {
    teamWorkloads,
    averageUtilization: Math.round(averageUtilization * 100) / 100,
    workloadVariance: Math.round(variance * 100) / 100,
    recommendations
  };
}

/**
 * Find optimal team assignments using geographic clustering
 */
export function findOptimalTeamAssignments(
  jobs: Installation[],
  teams: TeamMember[],
  maxTravelDistance: number = 100
): {
  assignments: { jobId: string; teamId: string; distance: number; score: number }[];
  unassignedJobs: Installation[];
  teamUtilization: { [teamId: string]: number };
} {
  const assignments: { jobId: string; teamId: string; distance: number; score: number }[] = [];
  const unassignedJobs: Installation[] = [];
  const teamJobCounts: { [teamId: string]: number } = {};
  
  // Initialize team job counts
  teams.forEach(team => {
    teamJobCounts[team.id] = 0;
  });
  
  // For each job, find the best team assignment
  jobs.forEach(job => {
    if (!job.address.coordinates) {
      unassignedJobs.push(job);
      return;
    }
    
    let bestAssignment: { teamId: string; distance: number; score: number } | null = null;
    
    teams.forEach(team => {
      // Skip if team is at capacity
      if (teamJobCounts[team.id] >= (team.capacity || 8)) {
        return;
      }
      
      // Calculate distance from team's home base or region center
      let distance = 0;
      if (team.homeBase?.coordinates) {
        distance = calculateDistance(team.homeBase.coordinates, job.address.coordinates!);
      } else {
        // Use region-based approximation if no home base
        distance = 50; // Default moderate distance
      }
      
      // Skip if too far
      if (distance > maxTravelDistance) {
        return;
      }
      
      // Calculate assignment score (lower is better)
      let score = distance; // Base score on distance
      
      // Bonus for matching region
      if (team.region === job.address.state || team.subRegions?.includes(job.address.state)) {
        score *= 0.8; // 20% bonus
      }
      
      // Bonus for matching specializations
      const jobType = (job as any).installationType || 'general';
      if (team.specializations.includes(jobType)) {
        score *= 0.9; // 10% bonus
      }
      
      // Penalty for current workload
      score *= (1 + teamJobCounts[team.id] * 0.1);
      
      if (!bestAssignment || score < bestAssignment.score) {
        bestAssignment = { teamId: team.id, distance, score };
      }
    });
    
    if (bestAssignment) {
      assignments.push({
        jobId: job.id,
        teamId: bestAssignment.teamId,
        distance: bestAssignment.distance,
        score: bestAssignment.score
      });
      teamJobCounts[bestAssignment.teamId]++;
    } else {
      unassignedJobs.push(job);
    }
  });
  
  // Calculate team utilization
  const teamUtilization: { [teamId: string]: number } = {};
  teams.forEach(team => {
    const maxCapacity = team.capacity || 8;
    teamUtilization[team.id] = (teamJobCounts[team.id] / maxCapacity) * 100;
  });
  
  return {
    assignments,
    unassignedJobs,
    teamUtilization
  };
}

/**
 * Enhance job addresses with coordinates if missing
 */
export function enhanceJobsWithCoordinates(jobs: Installation[]): Installation[] {
  return jobs.map(job => {
    if (!job.address.coordinates && job.address.zipCode) {
      const coords = getZipCodeCoordinates(job.address.zipCode);
      if (coords) {
        return {
          ...job,
          address: {
            ...job.address,
            coordinates: coords
          }
        };
      }
    }
    return job;
  });
}

/**
 * Group jobs by state for multi-state optimization
 */
export function groupJobsByState(jobs: Installation[]): { [state: string]: Installation[] } {
  return jobs.reduce((groups, job) => {
    const state = job.address.state.toUpperCase();
    if (!groups[state]) {
      groups[state] = [];
    }
    groups[state].push(job);
    return groups;
  }, {} as { [state: string]: Installation[] });
}

/**
 * Calculate geographic spread of jobs (used for analytics)
 */
export function calculateGeographicSpread(jobs: Installation[]): number {
  const validCoords = jobs
    .map(job => job.address.coordinates)
    .filter((coord): coord is { lat: number; lng: number } => coord !== undefined);
    
  if (validCoords.length <= 1) return 0;
  
  let maxDistance = 0;
  
  for (let i = 0; i < validCoords.length; i++) {
    for (let j = i + 1; j < validCoords.length; j++) {
      const distance = calculateDistance(validCoords[i], validCoords[j]);
      maxDistance = Math.max(maxDistance, distance);
    }
  }
  
  return maxDistance;
}