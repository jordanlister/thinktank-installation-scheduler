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
      color: 'from-accent-500/20 to-accent-600/10', 
      iconColor: 'text-accent-400' 
    },
    { 
      title: 'Available Today', 
      value: availableToday.toString(), 
      icon: Users, 
      color: 'from-success-500/20 to-success-600/10', 
      iconColor: 'text-success-400' 
    },
    { 
      title: 'On Assignment', 
      value: onAssignment.toString(), 
      icon: AlertTriangle, 
      color: 'from-warning-500/20 to-warning-600/10', 
      iconColor: 'text-warning-400' 
    },
    { 
      title: 'Avg Performance', 
      value: `${avgPerformance}%`, 
      icon: Users, 
      color: 'from-purple-500/20 to-purple-600/10', 
      iconColor: 'text-purple-400' 
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
          <div key={stat.title} className="card-stat group rounded-xl transition-all duration-300">
            <div className="card-body p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/70 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`h-14 w-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                </div>
              </div>
              
              {/* Subtle glow effect on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          </div>
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
                className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {teamMembers.length > 0 ? (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div 
                  key={member.id}
                  className="glass-subtle p-6 rounded-xl hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 cursor-pointer flex-1" onClick={() => handleViewMember(member)}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                        member.isActive ? 'bg-success-500/20 border border-success-500/30' : 'bg-white/10 border border-white/20'
                      }`}>
                        <span className="text-lg font-semibold text-white">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">
                            {member.firstName} {member.lastName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.isActive 
                              ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                              : 'bg-white/10 text-white/70 border border-white/20'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)} • {member.region}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-white/60">
                          <span>Skills: {member.skills.length}</span>
                          <span>Certifications: {member.certifications.length}</span>
                          <span>Capacity: {member.capacity}/day</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.performanceMetrics && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {Math.round(member.performanceMetrics.completionRate * 100)}% completion
                          </p>
                          <p className="text-xs text-white/60">
                            {member.performanceMetrics.totalJobs} jobs completed
                          </p>
                        </div>
                      )}
                      <button 
                        onClick={() => handleEditMember(member)}
                        className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                        title="Edit Member"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleMemberSchedule(member)}
                        className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                        title="Manage Schedule"
                        disabled={isUpdating}
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Specializations */}
                  {member.specializations.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {member.specializations.map((spec, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-accent-500/20 text-accent-300 border border-accent-500/30 rounded-full text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white/40" />
              </div>
              <p className="text-white/80 text-lg mb-2">
                No team members found
              </p>
              <p className="text-white/50">
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

export default TeamManagement;