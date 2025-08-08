// Lead Route - Team Management Main Page

import React, { useState } from 'react';
import { Users, AlertTriangle, RefreshCw, Plus, Calendar, Edit } from 'lucide-react';
import { useTeamMembers } from '../../hooks/useTeamData';
import { teamService } from '../../services/teamService';
import TeamMemberModal from '../../components/team/TeamMemberModal';
import ScheduleManagementModal from '../../components/team/ScheduleManagementModal';
import type { TeamMember } from '../../types';

const TeamManagement: React.FC = () => {
  const { teamMembers, isLoading, error, refetch } = useTeamMembers();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSelectedMember, setScheduleSelectedMember] = useState<TeamMember | null>(null);

  // Handle Add Member click
  const handleAddMember = () => {
    setSelectedMember(null);
    setModalMode('create');
    setShowAddMemberModal(true);
  };

  // Handle View Member click
  const handleViewMember = (member: TeamMember) => {
    setSelectedMember(member);
    setModalMode('view');
    setShowAddMemberModal(true);
  };

  // Handle Edit Member click
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setModalMode('edit');
    setShowAddMemberModal(true);
  };

  // Handle Schedule Management for a team member
  const handleMemberSchedule = (member: TeamMember) => {
    setScheduleSelectedMember(member);
    setShowScheduleModal(true);
  };

  // Handle schedule update callback
  const handleScheduleUpdated = () => {
    refetch(); // Refresh team data to get updated schedules
  };

  // Calculate team statistics from real data
  const totalTeamMembers = teamMembers.length;
  const availableToday = teamMembers.filter(tm => tm.isActive).length;
  const onAssignment = teamMembers.filter(tm => 
    tm.isActive && tm.workPreferences.maxDailyJobs > 0
  ).length;
  const avgPerformance = teamMembers.length > 0 
    ? Math.round(
        teamMembers
          .filter(tm => tm.performanceMetrics)
          .reduce((sum, tm) => sum + (tm.performanceMetrics?.completionRate || 0), 0) / 
        Math.max(teamMembers.filter(tm => tm.performanceMetrics).length, 1) * 100
      )
    : 0;

  const teamStats = [
    { 
      title: 'Total Team Members', 
      value: totalTeamMembers.toString(), 
      icon: Users, 
      color: 'blue'
    },
    { 
      title: 'Available Today', 
      value: availableToday.toString(), 
      icon: Users, 
      color: 'green'
    },
    { 
      title: 'On Assignment', 
      value: onAssignment.toString(), 
      icon: AlertTriangle, 
      color: 'yellow'
    },
    { 
      title: 'Avg Performance', 
      value: `${avgPerformance}%`, 
      icon: Users, 
      color: 'purple'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass rounded-xl p-8 flex items-center space-x-4">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-400" />
          <span className="text-lg text-white/80">Loading team data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="glass-strong border border-error-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 bg-error-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-error-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">Error Loading Team Data</h3>
              <p className="mt-2 text-white/70">{error}</p>
              <button
                onClick={refetch}
                className="mt-4 btn-primary"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Team Management</h1>
        <p className="text-xl text-white/80">Manage team members, schedules, and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {teamStats.map((stat, index) => (
          <MetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Team Members List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-accent-500/30 to-accent-600/20 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-accent-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Team Members
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={refetch}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button 
                onClick={handleAddMember}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {teamMembers.length > 0 ? (
            <div className="divide-y divide-white/10 pt-6">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id}
                  className="p-6 hover:bg-white/5"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      member.isActive ? 'bg-success-500/20 border border-success-500/30' : 'bg-white/10 border border-white/20'
                    }`}>
                      <span className="text-sm font-semibold text-white">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-white">
                              {member.firstName} {member.lastName}
                            </p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              member.isActive 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-white/70">
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)} • {member.region}
                          </p>
                        </div>
                        
                        {member.performanceMetrics && (
                          <div className="text-right">
                            <p className="text-sm text-white/70">
                              {Math.round(member.performanceMetrics.completionRate * 100)}% completion
                            </p>
                            <p className="text-xs text-white/50">
                              {member.performanceMetrics.totalJobs} jobs completed
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Metrics */}
                      <div className="flex items-center space-x-6 text-sm text-white/70">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Skills:</span>
                          <span className="text-white/60">{member.skills.length}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Certifications:</span>
                          <span className="text-white/60">{member.certifications.length}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Capacity:</span>
                          <span className="text-white/60">{member.capacity}/day</span>
                        </div>
                      </div>
                      
                      {/* Specializations */}
                      {member.specializations.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.specializations.map((spec, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-accent-500/20 text-accent-300 border border-accent-500/30 rounded text-xs"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button 
                        onClick={() => handleEditMember(member)}
                        className="text-white/50 hover:text-white/80"
                        title="Edit Member"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleMemberSchedule(member)}
                        className="text-white/50 hover:text-white/80"
                        title="Manage Schedule"
                        disabled={isUpdating}
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No Team Members Found</h3>
              <p className="text-white/70 text-center max-w-md">
                Add team members to get started with team management
              </p>
            </div>
          )}
        </div>
      </div>


      {/* Team Member Modal */}
      <TeamMemberModal
        member={selectedMember}
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSelectedMember(null);
          refetch(); // Refresh data after modal closes
        }}
        mode={modalMode}
      />

      {/* Schedule Management Modal */}
      <ScheduleManagementModal
        member={scheduleSelectedMember}
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setScheduleSelectedMember(null);
        }}
        onScheduleUpdated={handleScheduleUpdated}
      />
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
  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    indigo: 'text-indigo-400',
    gray: 'text-white/60'
  };

  const actualColor = alert ? 'red' : color;

  return (
    <div className="card group rounded-xl transition-all duration-300 min-w-0">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/70 mb-1 leading-tight">
              {title}
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {value}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColors[actualColor as keyof typeof iconColors]}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;