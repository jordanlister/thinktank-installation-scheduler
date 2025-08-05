// Think Tank Technologies - Team Management Main Page

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Download, 
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Shield,
  Tool,
  MapPin,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { useTeamStore } from '../../stores/useTeamStore';
import TeamMemberDirectory from '../../components/team/TeamMemberDirectory';
import TeamMemberModal from '../../components/team/TeamMemberModal';
import AvailabilityCalendar from '../../components/team/AvailabilityCalendar';
import { TeamPairingEngine, WorkloadBalancer, SkillsManager, PerformanceAnalytics } from '../../utils/teamManagement';
import type { TeamMember, TeamAnalytics } from '../../types';

const TeamManagement: React.FC = () => {
  const {
    teamMembers,
    selectedTeamMember,
    teamAnalytics,
    expiringCertifications,
    pendingTimeOffRequests,
    isLoading,
    error,
    setSelectedTeamMember,
    generateTeamAnalytics,
    checkExpiringCertifications,
    findOptimalPairings
  } = useTeamStore();

  const [activeTab, setActiveTab] = useState<'directory' | 'availability' | 'analytics' | 'pairings'>('directory');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Load initial data
  useEffect(() => {
    checkExpiringCertifications();
    generateTeamAnalytics({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  }, []);

  // Calculate key metrics
  const keyMetrics = React.useMemo(() => {
    const activeMembers = teamMembers.filter(m => m.isActive);
    const availableToday = activeMembers.filter(member => {
      const today = new Date().toISOString().split('T')[0];
      return member.availability.some(avail => 
        avail.isAvailable && 
        today >= avail.startDate && 
        today <= avail.endDate
      );
    });

    const avgPerformance = activeMembers.reduce((sum, member) => {
      if (!member.performanceMetrics) return sum;
      return sum + (
        member.performanceMetrics.completionRate * 0.3 +
        member.performanceMetrics.customerSatisfaction * 0.3 +
        member.performanceMetrics.qualityScore * 0.4
      );
    }, 0) / activeMembers.length;

    const totalCapacity = activeMembers.reduce((sum, member) => sum + member.capacity, 0);

    return {
      totalMembers: teamMembers.length,
      activeMembers: activeMembers.length,
      availableToday: availableToday.length,
      avgPerformance: avgPerformance || 0,
      totalCapacity,
      expiringCerts: expiringCertifications.length,
      pendingTimeOff: pendingTimeOffRequests.length
    };
  }, [teamMembers, expiringCertifications, pendingTimeOffRequests]);

  const handleAddMember = () => {
    setSelectedTeamMember(null);
    setModalMode('create');
    setShowMemberModal(true);
  };

  const handleViewMember = (member: TeamMember) => {
    setSelectedTeamMember(member);
    setModalMode('view');
    setShowMemberModal(true);
  };

  const handleOptimizePairings = () => {
    const pairings = findOptimalPairings(selectedRegion || undefined);
    console.log('Optimal pairings generated:', pairings);
    // This would integrate with the scheduling system
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading team data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">
            Manage your installation team members, schedules, and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Regions</option>
              {[...new Set(teamMembers.map(m => m.region))].map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleAddMember}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <MetricCard
          title="Total Members"
          value={keyMetrics.totalMembers}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Members"
          value={keyMetrics.activeMembers}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Available Today"
          value={keyMetrics.availableToday}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Avg Performance"
          value={keyMetrics.avgPerformance.toFixed(1)}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Total Capacity"
          value={`${keyMetrics.totalCapacity}/day`}
          icon={BarChart3}
          color="indigo"
        />
        <MetricCard
          title="Expiring Certs"
          value={keyMetrics.expiringCerts}
          icon={AlertTriangle}
          color="red"
          alert={keyMetrics.expiringCerts > 0}
        />
        <MetricCard
          title="Pending Time Off"
          value={keyMetrics.pendingTimeOff}
          icon={Calendar}
          color="gray"
          alert={keyMetrics.pendingTimeOff > 0}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOptimizePairings}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Users className="h-3 w-3" />
              <span>Optimize Pairings</span>
            </button>
            
            <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <Download className="h-3 w-3" />
              <span>Export Team Data</span>
            </button>
            
            <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <Upload className="h-3 w-3" />
              <span>Import Team Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(keyMetrics.expiringCerts > 0 || keyMetrics.pendingTimeOff > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Attention Required</h3>
              <div className="mt-1 text-sm text-yellow-700">
                {keyMetrics.expiringCerts > 0 && (
                  <p>• {keyMetrics.expiringCerts} certifications are expiring soon</p>
                )}
                {keyMetrics.pendingTimeOff > 0 && (
                  <p>• {keyMetrics.pendingTimeOff} time-off requests need approval</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'directory', label: 'Team Directory', icon: Users },
            { id: 'availability', label: 'Availability', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'pairings', label: 'Team Pairings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'directory' && (
          <TeamMemberDirectory />
        )}
        
        {activeTab === 'availability' && (
          <AvailabilityCalendar 
            selectedRegion={selectedRegion}
          />
        )}
        
        {activeTab === 'analytics' && (
          <TeamAnalyticsPanel 
            analytics={teamAnalytics}
            teamMembers={teamMembers}
            selectedRegion={selectedRegion}
          />
        )}
        
        {activeTab === 'pairings' && (
          <TeamPairingsPanel 
            teamMembers={teamMembers}
            selectedRegion={selectedRegion}
          />
        )}
      </div>

      {/* Team Member Modal */}
      {showMemberModal && (
        <TeamMemberModal
          member={selectedTeamMember}
          isOpen={showMemberModal}
          onClose={() => setShowMemberModal(false)}
          mode={modalMode}
        />
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  alert?: boolean;
}> = ({ title, value, icon: Icon, color, alert }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className={`bg-white border rounded-lg p-4 ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${alert ? 'text-red-600' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${alert ? 'text-red-900' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          alert ? 'bg-red-100 text-red-600' : colorClasses[color as keyof typeof colorClasses]
        }`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

// Team Analytics Panel Component (simplified)
const TeamAnalyticsPanel: React.FC<{
  analytics: TeamAnalytics | null;
  teamMembers: TeamMember[];
  selectedRegion: string;
}> = ({ analytics, teamMembers, selectedRegion }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
        
        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.teamMetrics.overallUtilization.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Utilization</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.teamMetrics.performanceScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Performance Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.teamMetrics.totalCertifications}
              </div>
              <div className="text-sm text-gray-600">Active Certifications</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Analytics data is being generated...</p>
          </div>
        )}
      </div>

      {/* Skills Gap Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Gap Analysis</h3>
        <div className="text-center py-8 text-gray-500">
          <Award className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Skills gap analysis would be displayed here</p>
        </div>
      </div>

      {/* Regional Performance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Performance</h3>
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Regional performance metrics would be displayed here</p>
        </div>
      </div>
    </div>
  );
};

// Team Pairings Panel Component (simplified)
const TeamPairingsPanel: React.FC<{
  teamMembers: TeamMember[];
  selectedRegion: string;
}> = ({ teamMembers, selectedRegion }) => {
  const [pairings, setPairings] = useState<any[]>([]);

  const generatePairings = () => {
    const optimalPairings = TeamPairingEngine.findOptimalPairings(teamMembers, selectedRegion || undefined);
    setPairings(optimalPairings);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Optimal Team Pairings</h3>
          <button
            onClick={generatePairings}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Generate Pairings</span>
          </button>
        </div>

        {pairings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairings.map((pairing, index) => {
              const lead = teamMembers.find(m => m.id === pairing.leadId);
              const assistant = teamMembers.find(m => m.id === pairing.assistantId);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Pairing #{index + 1}</span>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {pairing.compatibilityScore.toFixed(0)}% Match
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Lead:</span> {lead?.firstName} {lead?.lastName}
                    </div>
                    <div>
                      <span className="text-gray-600">Assistant:</span> {assistant?.firstName} {assistant?.lastName}
                    </div>
                    <div>
                      <span className="text-gray-600">Region:</span> {pairing.region}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Click "Generate Pairings" to see optimal team combinations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;