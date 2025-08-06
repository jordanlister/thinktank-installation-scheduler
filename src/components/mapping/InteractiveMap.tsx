// Think Tank Technologies Installation Scheduler - Interactive Mapping Component

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLng, LatLngBounds } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { 
  MapPin, 
  Navigation, 
  Route, 
  Users, 
  Layers,
  Download
} from 'lucide-react';
import type { 
  Installation, 
  TeamMember, 
  RoutePoint, 
  OptimizedAssignment,
  GeographicCluster 
} from '../../types';
import { 
  createGeographicClusters,
  optimizeMultiStopRoute 
} from '../../utils/geographicUtils';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface InteractiveMapProps {
  jobs: Installation[];
  teams: TeamMember[];
  assignments?: OptimizedAssignment[];
  selectedTeam?: string;
  onJobSelect?: (job: Installation) => void;
  onTeamSelect?: (team: TeamMember) => void;
  onRouteOptimize?: (teamId: string, jobs: Installation[]) => void;
  className?: string;
}

interface MapControls {
  showJobs: boolean;
  showRoutes: boolean;
  showTeams: boolean;
  showClusters: boolean;
  selectedLayers: string[];
}

/**
 * Interactive Mapping Component for Geographic Visualization
 * 
 * Features:
 * - Clustered job markers with tooltips
 * - Team member locations and coverage areas
 * - Optimized route visualization
 * - Interactive controls for layer management
 * - Mobile-friendly responsive design
 * - Real-time distance and time calculations
 */
const InteractiveMap: React.FC<InteractiveMapProps> = ({
  jobs,
  teams,
  assignments = [],
  selectedTeam: _,
  onJobSelect,
  onTeamSelect,
  onRouteOptimize,
  className = ''
}) => {
  const mapRef = useRef<any>(null);
  const [mapControls, setMapControls] = useState<MapControls>({
    showJobs: true,
    showRoutes: true,
    showTeams: true,
    showClusters: true,
    selectedLayers: ['jobs', 'routes', 'teams']
  });

  const [_clusters, setClusters] = useState<GeographicCluster[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<{ [teamId: string]: RoutePoint[] }>({});
  const [mapStats, setMapStats] = useState({
    totalJobs: 0,
    totalDistance: 0,
    totalTeams: 0,
    averageDistance: 0
  });

  // Custom icons for different marker types
  const createCustomIcon = (type: 'job' | 'team' | 'cluster', priority?: string, number?: number) => {
    const getColor = () => {
      switch (type) {
        case 'job':
          return priority === 'urgent' ? '#ef4444' : 
                 priority === 'high' ? '#f97316' :
                 priority === 'medium' ? '#eab308' : '#10b981';
        case 'team':
          return '#3b82f6';
        case 'cluster':
          return '#8b5cf6';
        default:
          return '#6b7280';
      }
    };

    const iconHtml = `
      <div style="
        background-color: ${getColor()};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${number || (type === 'job' ? 'J' : type === 'team' ? 'T' : 'C')}
      </div>
    `;

    return new Icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <foreignObject width="32" height="32">
            <div xmlns="http://www.w3.org/1999/xhtml">${iconHtml}</div>
          </foreignObject>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // Calculate map statistics
  useEffect(() => {
    const validJobs = jobs.filter(job => job.address.coordinates);
    const totalDistance = assignments.reduce((sum, assignment) => 
      sum + (assignment.estimatedTravelDistance || 0), 0
    );

    setMapStats({
      totalJobs: validJobs.length,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTeams: teams.length,
      averageDistance: validJobs.length > 0 ? 
        Math.round((totalDistance / validJobs.length) * 100) / 100 : 0
    });
  }, [jobs, teams, assignments]);

  // Create geographic clusters
  useEffect(() => {
    if (jobs.length > 0 && mapControls.showClusters) {
      const jobClusters = createGeographicClusters(jobs, 25, 2);
      setClusters(jobClusters);
    } else {
      setClusters([]);
    }
  }, [jobs, mapControls.showClusters]);

  // Optimize routes for teams
  const handleRouteOptimization = useCallback(async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const teamJobs = assignments
      .filter(a => a.leadId === teamId || a.assistantId === teamId)
      .map(a => jobs.find(j => j.id === a.installationId))
      .filter((job): job is Installation => job !== undefined);

    if (teamJobs.length > 1) {
      try {
        const optimization = await optimizeMultiStopRoute(teamJobs, team);
        setOptimizedRoutes(prev => ({
          ...prev,
          [teamId]: optimization.route
        }));
        
        if (onRouteOptimize) {
          onRouteOptimize(teamId, teamJobs);
        }
      } catch (error) {
        console.error('Route optimization failed:', error);
      }
    }
  }, [teams, assignments, jobs, onRouteOptimize]);

  // Toggle map control layers
  const toggleMapControl = (control: keyof Omit<MapControls, 'selectedLayers'>) => {
    setMapControls(prev => ({
      ...prev,
      [control]: !prev[control]
    }));
  };

  // Fit map bounds to show all markers
  const fitBounds = useCallback(() => {
    if (!mapRef.current) return;

    const validCoordinates = jobs
      .map(job => job.address.coordinates)
      .filter((coord): coord is { lat: number; lng: number } => coord !== undefined);

    if (validCoordinates.length === 0) return;

    const bounds = new LatLngBounds(
      validCoordinates.map(coord => new LatLng(coord.lat, coord.lng))
    );

    mapRef.current.fitBounds(bounds, { padding: [20, 20] });
  }, [jobs]);

  // Auto-fit bounds when jobs change
  useEffect(() => {
    const timer = setTimeout(fitBounds, 500);
    return () => clearTimeout(timer);
  }, [jobs, fitBounds]);

  // Export map data
  const exportMapData = () => {
    const exportData = {
      jobs: jobs.map(job => ({
        id: job.id,
        customerName: job.customerName,
        address: job.address,
        priority: job.priority,
        status: job.status
      })),
      teams: teams.map(team => ({
        id: team.id,
        name: `${team.firstName} ${team.lastName}`,
        region: team.region,
        homeBase: team.homeBase
      })),
      statistics: mapStats,
      routes: optimizedRoutes
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `map-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // Get route polyline points
  const getRoutePolylinePoints = (route: RoutePoint[]): [number, number][] => {
    return route
      .map(point => point.address.coordinates)
      .filter((coord): coord is { lat: number; lng: number } => coord !== undefined)
      .map(coord => [coord.lat, coord.lng] as [number, number]);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Controls Panel */}
      <div className="absolute top-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Map Controls
          </h3>
          <button
            onClick={exportMapData}
            className="p-1 hover:bg-gray-100 rounded"
            title="Export Map Data"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={mapControls.showJobs}
              onChange={() => toggleMapControl('showJobs')}
              className="mr-2"
            />
            <MapPin className="w-4 h-4 mr-1" />
            Job Locations ({mapStats.totalJobs})
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={mapControls.showRoutes}
              onChange={() => toggleMapControl('showRoutes')}
              className="mr-2"
            />
            <Route className="w-4 h-4 mr-1" />
            Optimized Routes
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={mapControls.showTeams}
              onChange={() => toggleMapControl('showTeams')}
              className="mr-2"
            />
            <Users className="w-4 h-4 mr-1" />
            Team Locations ({mapStats.totalTeams})
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={mapControls.showClusters}
              onChange={() => toggleMapControl('showClusters')}
              className="mr-2"
            />
            <Navigation className="w-4 h-4 mr-1" />
            Geographic Clusters
          </label>
        </div>

        {/* Map Statistics */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Total Distance:</span>
              <span className="font-medium">{mapStats.totalDistance} mi</span>
            </div>
            <div className="flex justify-between">
              <span>Avg per Job:</span>
              <span className="font-medium">{mapStats.averageDistance} mi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={[39.8283, -98.5795]} // Geographic center of US
        zoom={4}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Job Markers with Clustering */}
        {mapControls.showJobs && (
          <MarkerClusterGroup chunkedLoading>
            {jobs
              .filter(job => job.address.coordinates)
              .map((job, index) => (
                <Marker
                  key={job.id}
                  position={[job.address.coordinates!.lat, job.address.coordinates!.lng]}
                  icon={createCustomIcon('job', job.priority, index + 1)}
                  eventHandlers={{
                    click: () => onJobSelect?.(job)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-64">
                      <div className="font-semibold text-gray-900 mb-2">
                        {job.customerName}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Address:</strong> {job.address.street}, {job.address.city}, {job.address.state}</div>
                        <div><strong>Priority:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                            job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            job.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {job.priority}
                          </span>
                        </div>
                        <div><strong>Date:</strong> {new Date(job.scheduledDate).toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {job.scheduledTime}</div>
                        <div><strong>Duration:</strong> {job.duration} minutes</div>
                        {job.notes && <div><strong>Notes:</strong> {job.notes}</div>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            }
          </MarkerClusterGroup>
        )}

        {/* Team Member Markers */}
        {mapControls.showTeams && teams
          .filter(team => team.homeBase?.coordinates)
          .map(team => (
            <Marker
              key={team.id}
              position={[team.homeBase!.coordinates!.lat, team.homeBase!.coordinates!.lng]}
              icon={createCustomIcon('team')}
              eventHandlers={{
                click: () => onTeamSelect?.(team)
              }}
            >
              <Popup>
                <div className="p-2 min-w-64">
                  <div className="font-semibold text-gray-900 mb-2">
                    {team.firstName} {team.lastName}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Role:</strong> {team.role}</div>
                    <div><strong>Region:</strong> {team.region}</div>
                    <div><strong>Specializations:</strong> {team.specializations.join(', ')}</div>
                    <div><strong>Capacity:</strong> {team.capacity} jobs/day</div>
                    <div><strong>Travel Radius:</strong> {team.travelRadius} miles</div>
                    {team.homeBase && (
                      <div><strong>Home Base:</strong> {team.homeBase.city}, {team.homeBase.state}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRouteOptimization(team.id)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Optimize Route
                  </button>
                </div>
              </Popup>
            </Marker>
          ))
        }

        {/* Optimized Route Lines */}
        {mapControls.showRoutes && Object.entries(optimizedRoutes).map(([teamId, route]) => {
          const team = teams.find(t => t.id === teamId);
          if (!team || route.length < 2) return null;

          const routePoints = getRoutePolylinePoints(route);
          if (routePoints.length < 2) return null;

          return (
            <Polyline
              key={`route-${teamId}`}
              positions={routePoints}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
              dashArray="5, 10"
            >
              <Popup>
                <div className="p-2">
                  <div className="font-semibold text-gray-900 mb-2">
                    Route for {team.firstName} {team.lastName}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Jobs:</strong> {route.length}</div>
                    <div><strong>Total Distance:</strong> {
                      Math.round(route.reduce((sum, point) => sum + point.distanceFromPrevious, 0) * 100) / 100
                    } miles</div>
                    <div><strong>Est. Travel Time:</strong> {
                      Math.round(route.reduce((sum, point) => sum + point.travelTimeFromPrevious, 0))
                    } minutes</div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>

      {/* Loading State */}
      {jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading map data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;