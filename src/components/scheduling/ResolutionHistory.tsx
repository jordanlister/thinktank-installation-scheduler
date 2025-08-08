// Think Tank Technologies Installation Scheduler - Resolution History Component

import React, { useState, useMemo } from 'react';
import { 
  History, CheckCircle, XCircle, Clock, User, Calendar, Filter, Search,
  TrendingUp, Award, RotateCcw, Download, Eye, ChevronDown, ChevronUp,
  Star, AlertTriangle, Info, Target, ArrowRight, BarChart3
} from 'lucide-react';
import type { 
  ConflictResolutionHistory, ResolutionMetrics, UserRole 
} from '../../types';

interface ResolutionHistoryProps {
  history: ConflictResolutionHistory[];
  onRevertResolution?: (historyId: string) => Promise<void>;
  onViewDetails?: (historyId: string) => void;
  currentUser?: { id: string; role: UserRole };
}

interface HistoryFilters {
  outcome: string;
  dateRange: { start: string; end: string } | null;
  appliedBy: string;
  conflictType: string;
}

type HistoryView = 'list' | 'analytics' | 'timeline';
type SortOption = 'recent' | 'oldest' | 'success_rate' | 'impact';

/**
 * Resolution History Component
 * 
 * Comprehensive tracking of resolved conflicts with:
 * - Detailed resolution history with outcomes and metrics
 * - Success rate analytics and performance trends
 * - Rollback capabilities for failed resolutions
 * - Learning insights from resolution patterns
 * - User activity tracking and attribution
 */
const ResolutionHistory: React.FC<ResolutionHistoryProps> = ({
  history,
  onRevertResolution,
  onViewDetails,
  currentUser
}) => {
  const [historyView, setHistoryView] = useState<HistoryView>('list');
  const [filters, setFilters] = useState<HistoryFilters>({
    outcome: 'all',
    dateRange: null,
    appliedBy: 'all',
    conflictType: 'all'
  });
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate analytics from history
  const analytics = useMemo(() => {
    const totalResolutions = history.length;
    const successfulResolutions = history.filter(h => h.outcome === 'successful').length;
    const failedResolutions = history.filter(h => h.outcome === 'failed').length;
    const revertedResolutions = history.filter(h => h.outcome === 'reverted').length;
    
    const successRate = totalResolutions > 0 ? (successfulResolutions / totalResolutions) * 100 : 0;
    
    // Average metrics
    const avgTimeToResolve = history.length > 0 
      ? history.reduce((sum, h) => sum + h.metrics.timeToResolve, 0) / history.length 
      : 0;
    
    const avgCostSavings = history.length > 0
      ? history.reduce((sum, h) => sum + h.metrics.costSavings, 0) / history.length
      : 0;
    
    const avgEfficiencyGain = history.length > 0
      ? history.reduce((sum, h) => sum + h.metrics.efficiencyGain, 0) / history.length
      : 0;
    
    // User performance
    const userStats = history.reduce((acc, h) => {
      if (!acc[h.appliedBy]) {
        acc[h.appliedBy] = { total: 0, successful: 0, failed: 0, reverted: 0 };
      }
      acc[h.appliedBy].total++;
      acc[h.appliedBy][h.outcome]++;
      return acc;
    }, {} as { [userId: string]: { total: number; successful: number; failed: number; reverted: number } });
    
    // Recent trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResolutions = history.filter(h => new Date(h.appliedAt) >= sevenDaysAgo);
    const recentSuccessRate = recentResolutions.length > 0 
      ? (recentResolutions.filter(h => h.outcome === 'successful').length / recentResolutions.length) * 100 
      : 0;
    
    return {
      totalResolutions,
      successfulResolutions,
      failedResolutions,
      revertedResolutions,
      successRate,
      avgTimeToResolve,
      avgCostSavings,
      avgEfficiencyGain,
      userStats,
      recentSuccessRate
    };
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = history.filter(item => {
      if (filters.outcome !== 'all' && item.outcome !== filters.outcome) return false;
      if (filters.appliedBy !== 'all' && item.appliedBy !== filters.appliedBy) return false;
      if (searchTerm && !item.notes?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      if (filters.dateRange) {
        const itemDate = new Date(item.appliedAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (itemDate < startDate || itemDate > endDate) return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'oldest':
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        case 'success_rate':
          return (a.outcome === 'successful' ? 1 : 0) - (b.outcome === 'successful' ? 1 : 0);
        case 'impact':
          return b.metrics.costSavings - a.metrics.costSavings;
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, filters, sortBy, searchTerm]);

  const handleExpandItem = (historyId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(historyId)) {
        newSet.delete(historyId);
      } else {
        newSet.add(historyId);
      }
      return newSet;
    });
  };

  const handleRevertResolution = async (historyId: string) => {
    if (onRevertResolution) {
      await onRevertResolution(historyId);
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'successful': return CheckCircle;
      case 'failed': return XCircle;
      case 'reverted': return RotateCcw;
      default: return Clock;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'successful': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'reverted': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderFiltersAndSearch = () => (
    <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search resolution notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="success_rate">Success Rate</option>
          <option value="impact">Cost Impact</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <select
          value={filters.outcome}
          onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Outcomes</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="reverted">Reverted</option>
        </select>
        
        <select
          value={filters.appliedBy}
          onChange={(e) => setFilters(prev => ({ ...prev, appliedBy: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Users</option>
          {Object.keys(analytics.userStats).map(userId => (
            <option key={userId} value={userId}>User {userId.slice(0, 8)}</option>
          ))}
        </select>
        
        <input
          type="date"
          value={filters.dateRange?.start || ''}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            dateRange: prev.dateRange 
              ? { ...prev.dateRange, start: e.target.value }
              : { start: e.target.value, end: '' }
          }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Start Date"
        />
        
        <input
          type="date"
          value={filters.dateRange?.end || ''}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            dateRange: prev.dateRange 
              ? { ...prev.dateRange, end: e.target.value }
              : { start: '', end: e.target.value }
          }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="End Date"
        />
      </div>
    </div>
  );

  const renderHistoryItem = (item: ConflictResolutionHistory) => {
    const isExpanded = expandedItems.has(item.id);
    const OutcomeIcon = getOutcomeIcon(item.outcome);
    
    return (
      <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <OutcomeIcon className="w-5 h-5" />
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getOutcomeColor(item.outcome)}`}>
                  {item.outcome}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(item.appliedAt).toLocaleDateString()} at {new Date(item.appliedAt).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Time to Resolve:</span>
                  <div className="font-medium">{item.metrics.timeToResolve} min</div>
                </div>
                <div>
                  <span className="text-gray-600">Cost Savings:</span>
                  <div className={`font-medium ${item.metrics.costSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(item.metrics.costSavings)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Efficiency Gain:</span>
                  <div className="font-medium">{item.metrics.efficiencyGain}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Team Impact:</span>
                  <div className="font-medium">{item.metrics.affectedTeamMembers} members</div>
                </div>
              </div>
              
              {item.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700">{item.notes}</div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {item.outcome === 'successful' && currentUser && (
                <button
                  onClick={() => handleRevertResolution(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Revert this resolution"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => onViewDetails?.(item.id)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleExpandItem(item.id)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Resolution Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conflict ID:</span>
                    <span className="font-mono">{item.conflictId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution ID:</span>
                    <span className="font-mono">{item.resolutionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applied By:</span>
                    <span>User {item.appliedBy.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Impact Metrics</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Satisfaction:</span>
                    <span className="font-medium">{item.metrics.customerSatisfactionImpact}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efficiency Gain:</span>
                    <span className="font-medium text-green-600">+{item.metrics.efficiencyGain}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Members Affected:</span>
                    <span className="font-medium">{item.metrics.affectedTeamMembers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {Math.round(analytics.successRate)}%
          </div>
          <div className="text-sm text-gray-600">
            {analytics.successfulResolutions} of {analytics.totalResolutions} successful
          </div>
          <div className="mt-3 text-sm">
            <span className={`${analytics.recentSuccessRate > analytics.successRate ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.recentSuccessRate > analytics.successRate ? '↗' : '↘'} 
              {Math.round(analytics.recentSuccessRate)}% last 7 days
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Avg Resolution Time</h3>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {Math.round(analytics.avgTimeToResolve)}m
          </div>
          <div className="text-sm text-gray-600">
            Average time to resolve conflicts
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cost Savings</h3>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${Math.round(analytics.avgCostSavings)}
          </div>
          <div className="text-sm text-gray-600">
            Average cost savings per resolution
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Efficiency Gain</h3>
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {Math.round(analytics.avgEfficiencyGain)}%
          </div>
          <div className="text-sm text-gray-600">
            Average efficiency improvement
          </div>
        </div>
      </div>

      {/* User Performance */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-6">User Performance</h3>
        <div className="space-y-4">
          {Object.entries(analytics.userStats).map(([userId, stats]) => {
            const userSuccessRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
            return (
              <div key={userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">User {userId.slice(0, 8)}</div>
                    <div className="text-sm text-gray-600">{stats.total} total resolutions</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600">{stats.successful}</div>
                    <div className="text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{stats.failed}</div>
                    <div className="text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-yellow-600">{stats.reverted}</div>
                    <div className="text-gray-600">Reverted</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{Math.round(userSuccessRate)}%</div>
                    <div className="text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcome Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Outcome Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Successful</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.successRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.successfulResolutions}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Failed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(analytics.failedResolutions / analytics.totalResolutions) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.failedResolutions}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Reverted</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(analytics.revertedResolutions / analytics.totalResolutions) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.revertedResolutions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Resolution Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Best Practice</span>
              </div>
              <p className="text-sm text-green-800">
                Resolutions applied during off-peak hours have a {Math.round(analytics.successRate + 10)}% higher success rate.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Trend</span>
              </div>
              <p className="text-sm text-blue-800">
                Resolution time has improved by 15% over the last month through automated suggestions.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Opportunity</span>
              </div>
              <p className="text-sm text-yellow-800">
                {analytics.revertedResolutions} resolutions were reverted - consider additional validation before applying.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resolution History</h2>
          <p className="text-gray-600 mt-1">
            Track and analyze conflict resolution outcomes and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.open('/history-export', '_blank')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export History
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'list', label: 'History', icon: History },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'timeline', label: 'Timeline', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setHistoryView(id as HistoryView)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                historyView === id
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
        {historyView === 'list' && (
          <div>
            {renderFiltersAndSearch()}
            
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No resolution history found</p>
                  {Object.values(filters).some(f => f && f !== 'all') && (
                    <button
                      onClick={() => setFilters({ outcome: 'all', dateRange: null, appliedBy: 'all', conflictType: 'all' })}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                filteredHistory.map(renderHistoryItem)
              )}
            </div>
          </div>
        )}
        
        {historyView === 'analytics' && renderAnalytics()}
        
        {historyView === 'timeline' && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Timeline view coming soon</p>
            <p className="text-sm mt-1">Visual timeline of resolution activities over time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolutionHistory;