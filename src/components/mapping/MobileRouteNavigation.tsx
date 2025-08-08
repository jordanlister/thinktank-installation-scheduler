// Think Tank Technologies Installation Scheduler - Mobile Route Navigation

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navigation,
  Clock,
  Phone,
  Share2,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Settings
} from 'lucide-react';
import type { 
  RoutePoint, 
  Installation, 
  TeamMember,
  TravelOptimization 
} from '../../types';

interface MobileRouteNavigationProps {
  route: RoutePoint[];
  teamMember: TeamMember;
  jobs: Installation[];
  optimization?: TravelOptimization;
  onJobComplete?: (jobId: string) => void;
  onNavigateToJob?: (job: Installation) => void;
  onCallCustomer?: (phone: string) => void;
  className?: string;
}

interface JobStatus {
  [jobId: string]: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

/**
 * Mobile Route Navigation Component
 * 
 * Features:
 * - Mobile-optimized route display
 * - Turn-by-turn navigation integration
 * - Job completion tracking
 * - Customer contact integration
 * - Route sharing and export
 * - Offline capability support
 * - Real-time ETA updates
 */
const MobileRouteNavigation: React.FC<MobileRouteNavigationProps> = ({
  route,
  teamMember,
  jobs,
  optimization,
  onJobComplete,
  onNavigateToJob,
  onCallCustomer,
  className = ''
}) => {
  const [jobStatuses, setJobStatuses] = useState<JobStatus>({});
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [navigationApp, setNavigationApp] = useState<'google' | 'apple' | 'waze'>('google');
  const [showJobDetails, setShowJobDetails] = useState<string | null>(null);

  // Initialize job statuses
  useEffect(() => {
    const initialStatuses: JobStatus = {};
    route.forEach(point => {
      initialStatuses[point.jobId] = 'pending';
    });
    setJobStatuses(initialStatuses);
  }, [route]);

  // Handle job completion
  const handleJobComplete = useCallback((jobId: string) => {
    setJobStatuses(prev => ({
      ...prev,
      [jobId]: 'completed'
    }));
    
    // Move to next pending job
    const currentIndex = route.findIndex(point => point.jobId === jobId);
    const nextPendingIndex = route.findIndex(
      (point, index) => index > currentIndex && jobStatuses[point.jobId] !== 'completed'
    );
    
    if (nextPendingIndex !== -1) {
      setCurrentJobIndex(nextPendingIndex);
    }
    
    onJobComplete?.(jobId);
  }, [route, jobStatuses, onJobComplete]);

  // Handle job skip
  const handleJobSkip = useCallback((jobId: string) => {
    setJobStatuses(prev => ({
      ...prev,
      [jobId]: 'skipped'
    }));
  }, []);

  // Navigate to job using external app
  const navigateToJob = useCallback((job: Installation) => {
    if (!job.address.coordinates) return;

    const { lat, lng } = job.address.coordinates;
    
    let url = '';
    switch (navigationApp) {
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?daddr=${lat},${lng}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
    
    onNavigateToJob?.(job);
  }, [navigationApp, onNavigateToJob]);

  // Share route
  const shareRoute = useCallback(async () => {
    const routeText = route.map((point, index) => {
      const job = jobs.find(j => j.id === point.jobId);
      return `${index + 1}. ${job?.customerName || 'Unknown'} - ${point.address.street}, ${point.address.city}`;
    }).join('\n');

    const shareData = {
      title: `Route for ${teamMember.firstName} ${teamMember.lastName}`,
      text: `Daily route with ${route.length} stops:\n\n${routeText}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(shareData.text);
      alert('Route copied to clipboard!');
    }
  }, [route, jobs, teamMember]);

  // Export route as various formats
  const exportRoute = useCallback((format: 'json' | 'csv' | 'txt') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    const routeData = route.map((point, index) => {
      const job = jobs.find(j => j.id === point.jobId);
      return {
        sequence: index + 1,
        jobId: point.jobId,
        customerName: job?.customerName || 'Unknown',
        phone: job?.customerPhone || '',
        address: `${point.address.street}, ${point.address.city}, ${point.address.state}`,
        arrivalTime: new Date(point.estimatedArrival).toLocaleTimeString(),
        departureTime: new Date(point.estimatedDeparture).toLocaleTimeString(),
        travelDistance: point.distanceFromPrevious,
        travelTime: point.travelTimeFromPrevious,
        status: jobStatuses[point.jobId] || 'pending'
      };
    });

    switch (format) {
      case 'json':
        content = JSON.stringify({
          teamMember: `${teamMember.firstName} ${teamMember.lastName}`,
          date: new Date().toISOString().split('T')[0],
          route: routeData,
          summary: optimization && {
            totalDistance: optimization.totalDistance,
            totalTime: optimization.totalTime,
            savings: optimization.savings
          }
        }, null, 2);
        filename = `route-${teamMember.firstName}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
        
      case 'csv':
        const headers = 'Sequence,Job ID,Customer,Phone,Address,Arrival,Departure,Distance,Travel Time,Status\n';
        const rows = routeData.map(item => 
          `${item.sequence},"${item.jobId}","${item.customerName}","${item.phone}","${item.address}","${item.arrivalTime}","${item.departureTime}",${item.travelDistance},${item.travelTime},${item.status}`
        ).join('\n');
        content = headers + rows;
        filename = `route-${teamMember.firstName}-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'txt':
        content = `Route for ${teamMember.firstName} ${teamMember.lastName}\n`;
        content += `Date: ${new Date().toLocaleDateString()}\n`;
        content += `Total Jobs: ${route.length}\n\n`;
        content += routeData.map(item => 
          `${item.sequence}. ${item.customerName}\n` +
          `   Address: ${item.address}\n` +
          `   Phone: ${item.phone}\n` +
          `   Arrival: ${item.arrivalTime}\n` +
          `   Status: ${item.status}\n`
        ).join('\n');
        filename = `route-${teamMember.firstName}-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [route, jobs, teamMember, jobStatuses, optimization]);

  // Calculate progress
  const completedJobs = Object.values(jobStatuses).filter(status => status === 'completed').length;
  const progressPercentage = route.length > 0 ? (completedJobs / route.length) * 100 : 0;

  // Get current job
  const currentJob = route[currentJobIndex] ? jobs.find(j => j.id === route[currentJobIndex].jobId) : null;

  if (route.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 text-center ${className}`}>
        <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Available</h3>
        <p className="text-gray-600">No jobs assigned for navigation.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Navigation className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-semibold">Route Navigation</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={shareRoute}
              className="p-2 hover:bg-blue-700 rounded"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-blue-700 rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="text-sm opacity-90">
          {teamMember.firstName} {teamMember.lastName} • {teamMember.region}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span>{completedJobs} of {route.length} completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="bg-blue-500 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Navigation Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Navigation App
              </label>
              <select
                value={navigationApp}
                onChange={(e) => setNavigationApp(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="google">Google Maps</option>
                <option value="apple">Apple Maps</option>
                <option value="waze">Waze</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Route
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportRoute('json')}
                  className="btn-small btn-ghost"
                >
                  JSON
                </button>
                <button
                  onClick={() => exportRoute('csv')}
                  className="btn-small btn-ghost"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportRoute('txt')}
                  className="btn-small btn-ghost"
                >
                  TXT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Job Card */}
      {currentJob && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                {currentJobIndex + 1}
              </div>
              <span className="font-medium text-green-900">Current Job</span>
            </div>
            <span className="text-sm text-green-600">
              ETA: {new Date(route[currentJobIndex].estimatedArrival).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="text-lg font-semibold text-gray-900 mb-1">
            {currentJob.customerName}
          </div>
          <div className="text-sm text-gray-600 mb-3">
            {currentJob.address.street}, {currentJob.address.city}, {currentJob.address.state}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => navigateToJob(currentJob)}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigate
            </button>
            
            {currentJob.customerPhone && (
              <button
                onClick={() => onCallCustomer?.(currentJob.customerPhone)}
                className="btn-success flex items-center justify-center"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => handleJobComplete(currentJob.id)}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-medium flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Route List */}
      <div className="max-h-96 overflow-y-auto">
        {route.map((point, index) => {
          const job = jobs.find(j => j.id === point.jobId);
          const status = jobStatuses[point.jobId] || 'pending';
          const isCurrent = index === currentJobIndex;
          
          return (
            <div
              key={point.jobId}
              className={`border-b border-gray-200 p-4 ${
                isCurrent ? 'bg-blue-50' : status === 'completed' ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'skipped' ? 'bg-yellow-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                     status === 'skipped' ? <AlertCircle className="w-4 h-4" /> :
                     index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {job?.customerName || 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {point.address.street}, {point.address.city}
                    </div>
                    
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(point.estimatedArrival).toLocaleTimeString()}
                      </span>
                      {point.distanceFromPrevious > 0 && (
                        <span>
                          {point.distanceFromPrevious.toFixed(1)} mi
                        </span>
                      )}
                      {point.travelTimeFromPrevious > 0 && (
                        <span>
                          {Math.round(point.travelTimeFromPrevious)} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {job?.customerPhone && (
                    <button
                      onClick={() => onCallCustomer?.(job.customerPhone)}
                      className="p-2 text-gray-400 hover:text-green-600"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowJobDetails(showJobDetails === point.jobId ? null : point.jobId)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Job Details */}
              {showJobDetails === point.jobId && job && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                  <div><strong>Phone:</strong> {job.customerPhone || 'N/A'}</div>
                  <div><strong>Duration:</strong> {job.duration} minutes</div>
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
                  {job.notes && (
                    <div><strong>Notes:</strong> {job.notes}</div>
                  )}
                  
                  <div className="flex space-x-2 mt-3">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleJobComplete(point.jobId)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleJobSkip(point.jobId)}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                        >
                          Skip
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => job && navigateToJob(job)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      Navigate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {optimization && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-900">
                {Math.round(optimization.totalDistance * 100) / 100}
              </div>
              <div className="text-gray-600">Total Miles</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {Math.round(optimization.totalTime / 60 * 100) / 100}
              </div>
              <div className="text-gray-600">Total Hours</div>
            </div>
            <div>
              <div className="font-semibold text-green-900">
                {optimization.savings.percentageImprovement.toFixed(1)}%
              </div>
              <div className="text-green-600">Optimized</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileRouteNavigation;