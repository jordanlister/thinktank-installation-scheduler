// Think Tank Technologies Installation Scheduler - Conflict Preview Component

import React, { useState, useMemo } from 'react';
import { 
  Eye, Calendar, Clock, Users, MapPin, ArrowRight, CheckCircle, 
  AlertTriangle, RefreshCw, Download, Maximize2, Minimize2,
  Filter, Search, ChevronDown, ChevronUp, Play, Pause, RotateCcw
} from 'lucide-react';
import type { 
  SchedulingConflict, OptimizedAssignment, TeamMember, Installation 
} from '../../types';

interface ConflictPreviewProps {
  conflicts: SchedulingConflict[];
  assignments: OptimizedAssignment[];
  teams?: TeamMember[];
  onApplyChanges?: (changes: PreviewChange[]) => Promise<void>;
  onRevertChanges?: () => void;
}

interface PreviewChange {
  id: string;
  type: 'assignment_change' | 'schedule_change' | 'team_change';
  conflictId: string;
  installationId: string;
  description: string;
  before: any;
  after: any;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface PreviewState {
  showBefore: boolean;
  showAfter: boolean;
  highlightChanges: boolean;
  selectedChange: string | null;
}

type PreviewView = 'changes' | 'schedule' | 'workload' | 'timeline';

/**
 * Conflict Preview Component
 * 
 * Preview changes before applying with:
 * - Side-by-side before/after comparison
 * - Interactive schedule preview with changes highlighted
 * - Workload impact visualization
 * - Change timeline and rollback capabilities
 * - Export and sharing capabilities
 */
const ConflictPreview: React.FC<ConflictPreviewProps> = ({
  conflicts,
  assignments,
  teams = [],
  onApplyChanges,
  onRevertChanges
}) => {
  const [previewView, setPreviewView] = useState<PreviewView>('changes');
  const [previewState, setPreviewState] = useState<PreviewState>({
    showBefore: true,
    showAfter: true,
    highlightChanges: true,
    selectedChange: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAnimatingChanges, setIsAnimatingChanges] = useState(false);

  // Generate preview changes based on conflicts and proposed resolutions
  const previewChanges = useMemo((): PreviewChange[] => {
    const changes: PreviewChange[] = [];
    
    conflicts.forEach(conflict => {
      // Generate mock changes - in real app this would come from resolution engine
      switch (conflict.type) {
        case 'time_overlap':
          changes.push({
            id: `time-change-${conflict.id}`,
            type: 'schedule_change',
            conflictId: conflict.id,
            installationId: conflict.affectedJobs[0],
            description: 'Reschedule installation to avoid time overlap',
            before: { time: '10:00 AM', date: '2024-01-15' },
            after: { time: '2:00 PM', date: '2024-01-15' },
            impact: 'positive',
            confidence: 85
          });
          break;
          
        case 'capacity_exceeded':
          changes.push({
            id: `capacity-change-${conflict.id}`,
            type: 'assignment_change',
            conflictId: conflict.id,
            installationId: conflict.affectedJobs[0],
            description: 'Reassign to team member with available capacity',
            before: { teamMember: 'John Smith', workload: '120%' },
            after: { teamMember: 'Sarah Johnson', workload: '85%' },
            impact: 'positive',
            confidence: 92
          });
          break;
          
        case 'travel_distance':
          changes.push({
            id: `travel-change-${conflict.id}`,
            type: 'team_change',
            conflictId: conflict.id,
            installationId: conflict.affectedJobs[0],
            description: 'Assign to geographically closer team member',
            before: { teamMember: 'Mike Wilson', distance: '45 miles' },
            after: { teamMember: 'Lisa Chen', distance: '12 miles' },
            impact: 'positive',
            confidence: 78
          });
          break;
          
        default:
          changes.push({
            id: `generic-change-${conflict.id}`,
            type: 'assignment_change',
            conflictId: conflict.id,
            installationId: conflict.affectedJobs[0],
            description: 'Manual resolution required',
            before: { status: 'Conflicted' },
            after: { status: 'Resolved' },
            impact: 'neutral',
            confidence: 60
          });
      }
    });
    
    return changes;
  }, [conflicts]);

  // Filter changes based on search and filter criteria
  const filteredChanges = useMemo(() => {
    return previewChanges.filter(change => {
      if (searchTerm && !change.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (filterType !== 'all' && change.type !== filterType) {
        return false;
      }
      
      return true;
    });
  }, [previewChanges, searchTerm, filterType]);

  const handleAnimateChanges = async () => {
    setIsAnimatingChanges(true);
    
    // Simulate step-by-step change preview
    for (let i = 0; i < filteredChanges.length; i++) {
      setPreviewState(prev => ({ ...prev, selectedChange: filteredChanges[i].id }));
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setPreviewState(prev => ({ ...prev, selectedChange: null }));
    setIsAnimatingChanges(false);
  };

  const handleApplyChanges = async () => {
    if (onApplyChanges) {
      await onApplyChanges(filteredChanges);
    }
  };

  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderPreviewControls = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-gray-900">Change Preview</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Eye className="w-4 h-4" />
          <span>{filteredChanges.length} changes to review</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={previewState.showBefore}
              onChange={(e) => setPreviewState(prev => ({ ...prev, showBefore: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            Before
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={previewState.showAfter}
              onChange={(e) => setPreviewState(prev => ({ ...prev, showAfter: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            After
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={previewState.highlightChanges}
              onChange={(e) => setPreviewState(prev => ({ ...prev, highlightChanges: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            Highlight Changes
          </label>
        </div>
        
        {/* Animation Controls */}
        <button
          onClick={handleAnimateChanges}
          disabled={isAnimatingChanges}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm"
        >
          {isAnimatingChanges ? (
            <Pause className="w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isAnimatingChanges ? 'Playing...' : 'Preview Animation'}
        </button>
        
        <button
          onClick={() => window.open('/preview-export', '_blank')}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search changes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="all">All Changes</option>
        <option value="assignment_change">Assignment Changes</option>
        <option value="schedule_change">Schedule Changes</option>
        <option value="team_change">Team Changes</option>
      </select>
    </div>
  );

  const renderChangeCard = (change: PreviewChange) => {
    const isSelected = previewState.selectedChange === change.id;
    
    return (
      <div
        key={change.id}
        className={`border rounded-lg overflow-hidden transition-all duration-300 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        } ${previewState.highlightChanges && isSelected ? 'animate-pulse' : ''}`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getImpactColor(change.impact)}`}>
                  {change.impact}
                </div>
                <div className="text-sm text-gray-600">
                  {change.type.replace('_', ' ')} • {change.confidence}% confidence
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{change.description}</h4>
              <div className="text-sm text-gray-600">
                Installation: {change.installationId.slice(0, 8)}...
              </div>
            </div>
            
            <button
              onClick={() => setPreviewState(prev => ({
                ...prev,
                selectedChange: prev.selectedChange === change.id ? null : change.id
              }))}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              {isSelected ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {previewState.showBefore && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  Before
                </h5>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  {Object.entries(change.before).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {previewState.showAfter && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  After
                </h5>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  {Object.entries(change.after).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Visual Change Arrow */}
          {previewState.showBefore && previewState.showAfter && (
            <div className="flex justify-center my-4">
              <ArrowRight className="w-8 h-8 text-blue-500" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSchedulePreview = () => (
    <div className="space-y-6">
      <h4 className="font-medium text-gray-900">Schedule Preview</h4>
      
      {/* Mock schedule grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  9:00 AM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  12:00 PM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  3:00 PM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  6:00 PM
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.slice(0, 5).map((team, index) => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.firstName} {team.lastName}
                  </td>
                  {[9, 12, 15, 18].map(hour => (
                    <td key={hour} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className={`p-2 rounded text-center ${
                        Math.random() > 0.5 
                          ? 'bg-blue-100 text-blue-800' 
                          : previewState.highlightChanges && Math.random() > 0.7
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {Math.random() > 0.5 ? 'Job #1234' : 'Available'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWorkloadPreview = () => (
    <div className="space-y-6">
      <h4 className="font-medium text-gray-900">Workload Impact Preview</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.slice(0, 4).map((team, index) => {
          const beforeLoad = 70 + (index * 15);
          const afterLoad = beforeLoad + (Math.random() > 0.5 ? -10 : 5);
          const hasChange = filteredChanges.some(c => 
            c.before?.teamMember?.includes(team.firstName) || 
            c.after?.teamMember?.includes(team.firstName)
          );
          
          return (
            <div key={team.id} className={`p-6 border rounded-lg ${hasChange && previewState.highlightChanges ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-gray-900">
                  {team.firstName} {team.lastName}
                </h5>
                {hasChange && (
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Changed
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Before: {beforeLoad}%</span>
                    <span>After: {afterLoad}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${beforeLoad > 90 ? 'bg-red-500' : beforeLoad > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${beforeLoad}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div 
                      className={`h-3 rounded-full ${afterLoad > 90 ? 'bg-red-500' : afterLoad > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${afterLoad}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Change:</span>
                    <span className={`font-medium ${afterLoad - beforeLoad > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {afterLoad - beforeLoad > 0 ? '+' : ''}{afterLoad - beforeLoad}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderPreviewControls()}
      {renderFilters()}
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'changes', label: 'Changes', icon: RefreshCw },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'workload', label: 'Workload', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPreviewView(id as PreviewView)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                previewView === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Content */}
      <div>
        {previewView === 'changes' && (
          <div className="space-y-4">
            {filteredChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No changes to preview</p>
              </div>
            ) : (
              filteredChanges.map(renderChangeCard)
            )}
          </div>
        )}
        
        {previewView === 'schedule' && renderSchedulePreview()}
        {previewView === 'workload' && renderWorkloadPreview()}
        
        {previewView === 'timeline' && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Timeline view coming soon</p>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {filteredChanges.length} changes ready to apply
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onRevertChanges}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Revert All
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={filteredChanges.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Changes ({filteredChanges.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictPreview;