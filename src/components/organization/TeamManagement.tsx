// Think Tank Technologies - Team Management Interface
// Comprehensive team member management with roles and project assignments

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useOrganization, usePermissions } from '../../contexts/OrganizationProvider';
import { supabase } from '../../services/supabase';
import type {
  OrganizationMember,
  OrganizationRole,
  ProjectRole,
  Project,
  UserInvitation,
  InvitationFormData
} from '../../types';

// Props
interface TeamManagementProps {
  className?: string;
}

// Member Actions Modal
const MemberActionsModal: React.FC<{
  member: OrganizationMember | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, role: OrganizationRole) => void;
  onRemoveMember: (userId: string) => void;
  onAssignToProject: (userId: string, projectId: string, role: ProjectRole) => void;
  onRemoveFromProject: (userId: string, projectId: string) => void;
}> = ({
  member,
  projects,
  isOpen,
  onClose,
  onUpdateRole,
  onRemoveMember,
  onAssignToProject,
  onRemoveFromProject
}) => {
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>('member');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectRole, setSelectedProjectRole] = useState<ProjectRole>('viewer');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  if (!member) return null;

  const assignedProjectIds = member.projects.filter(p => p.isActive).map(p => p.projectId);
  const availableProjects = projects.filter(p => !assignedProjectIds.includes(p.id));

  const handleRoleUpdate = () => {
    if (selectedRole !== member.role) {
      onUpdateRole(member.userId, selectedRole);
    }
    onClose();
  };

  const handleProjectAssign = () => {
    if (selectedProject && selectedProjectRole) {
      onAssignToProject(member.userId, selectedProject, selectedProjectRole);
      setSelectedProject('');
      setSelectedProjectRole('viewer');
    }
  };

  const handleRemoveMember = () => {
    onRemoveMember(member.userId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Team Member">
      <div className="space-y-6">
        {/* Member Info */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {member.firstName[0]}{member.lastName[0]}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-gray-600">{member.email}</p>
            <p className="text-sm text-gray-500">
              Joined {new Date(member.joinedAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Organization Role */}
        <div>
          <label htmlFor="orgRole" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Role
          </label>
          <select
            id="orgRole"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as OrganizationRole)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <div className="mt-2 text-sm text-gray-500">
            {selectedRole === 'owner' && 'Full access to everything including billing'}
            {selectedRole === 'admin' && 'Full access to organization and project management'}
            {selectedRole === 'manager' && 'Can manage projects and team members within projects'}
            {selectedRole === 'member' && 'Can view and work on assigned projects'}
          </div>
        </div>

        {/* Project Assignments */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Project Assignments</h4>
          
          {/* Current Assignments */}
          {member.projects.filter(p => p.isActive).length > 0 ? (
            <div className="space-y-2 mb-4">
              {member.projects.filter(p => p.isActive).map((projectMembership) => (
                <div key={projectMembership.projectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{projectMembership.projectName}</span>
                    <span className="ml-2 text-sm text-gray-500">({projectMembership.role})</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemoveFromProject(member.userId, projectMembership.projectId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Not assigned to any projects</p>
          )}

          {/* Add to Project */}
          {availableProjects.length > 0 && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select project...</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <select
                value={selectedProjectRole}
                onChange={(e) => setSelectedProjectRole(e.target.value as ProjectRole)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="assistant">Assistant</option>
                <option value="lead">Lead</option>
                <option value="scheduler">Scheduler</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                onClick={handleProjectAssign}
                disabled={!selectedProject}
                size="sm"
              >
                Add
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="secondary"
            onClick={() => setShowRemoveConfirm(true)}
            className="text-red-600 hover:text-red-700"
          >
            Remove Member
          </Button>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleRoleUpdate}>
              Save Changes
            </Button>
          </div>
        </div>

        {/* Remove Confirmation */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Team Member</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove {member.firstName} {member.lastName} from the organization? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRemoveMember}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Invite Member Modal
const InviteMemberModal: React.FC<{
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InvitationFormData) => void;
}> = ({ projects, isOpen, onClose, onInvite }) => {
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    organizationRole: 'member',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onInvite(formData);
    setFormData({
      email: '',
      organizationRole: 'member',
      message: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="colleague@company.com"
            error={errors.email}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="orgRole" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Role
          </label>
          <select
            id="orgRole"
            value={formData.organizationRole}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationRole: e.target.value as OrganizationRole }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Project (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              id="project"
              value={formData.projectId || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                projectId: e.target.value || undefined,
                projectRole: e.target.value ? prev.projectRole || 'viewer' : undefined
              }))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No project assignment</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {formData.projectId && (
              <select
                value={formData.projectRole || 'viewer'}
                onChange={(e) => setFormData(prev => ({ ...prev, projectRole: e.target.value as ProjectRole }))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="assistant">Assistant</option>
                <option value="lead">Lead</option>
                <option value="scheduler">Scheduler</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Welcome Message (Optional)
          </label>
          <textarea
            id="message"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Welcome to our team! We're excited to work with you."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Send Invitation
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Main Team Management Component
export const TeamManagement: React.FC<TeamManagementProps> = ({ className = '' }) => {
  const { organization, projects, inviteUser, updateMemberRole, removeMember, assignUserToProject, removeUserFromProject } = useOrganization();
  const { canManageMembers } = usePermissions();

  // State
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<UserInvitation[]>([]);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<OrganizationRole | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // Check permissions
  useEffect(() => {
    canManageMembers().then(setHasPermission);
  }, [canManageMembers]);

  // Load team data
  const loadTeamData = useCallback(async () => {
    if (!organization) return;

    try {
      setIsLoading(true);

      // Load organization members
      const { data: membersData, error: membersError } = await supabase
        .from('users')
        .select(`
          *,
          project_users!inner(
            project_id,
            role,
            assigned_by,
            assigned_at,
            is_active,
            projects!inner(
              id,
              name
            )
          )
        `)
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (membersError) {
        console.error('Error loading members:', membersError);
      } else {
        // Transform data to match OrganizationMember interface
        const transformedMembers: OrganizationMember[] = (membersData || []).map(user => ({
          id: user.id,
          userId: user.id,
          organizationId: user.organization_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          invitedBy: user.invited_by,
          invitedAt: user.invited_at,
          joinedAt: user.joined_at,
          lastLoginAt: user.last_login_at,
          settings: user.settings || {},
          projects: (user.project_users || []).map((pu: any) => ({
            projectId: pu.project_id,
            projectName: pu.projects?.name || '',
            role: pu.role,
            assignedBy: pu.assigned_by,
            assignedAt: pu.assigned_at,
            isActive: pu.is_active
          }))
        }));

        setMembers(transformedMembers);
      }

      // Load pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('organization_id', organization.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError);
      } else {
        setPendingInvitations(invitationsData || []);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery === '' || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Handle member actions
  const handleMemberClick = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleInviteMember = async (invitationData: InvitationFormData) => {
    try {
      await inviteUser({
        organizationId: organization!.id,
        projectId: invitationData.projectId,
        email: invitationData.email,
        organizationRole: invitationData.organizationRole,
        projectRole: invitationData.projectRole,
        invitedBy: '', // Will be filled by the service
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata: {
          message: invitationData.message
        }
      });
      
      await loadTeamData(); // Refresh data
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleUpdateRole = async (userId: string, role: OrganizationRole) => {
    try {
      await updateMemberRole(userId, role);
      await loadTeamData(); // Refresh data
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(userId);
      await loadTeamData(); // Refresh data
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleAssignToProject = async (userId: string, projectId: string, role: ProjectRole) => {
    try {
      await assignUserToProject(userId, projectId, role);
      await loadTeamData(); // Refresh data
    } catch (error) {
      console.error('Error assigning to project:', error);
    }
  };

  const handleRemoveFromProject = async (userId: string, projectId: string) => {
    try {
      await removeUserFromProject(userId, projectId);
      await loadTeamData(); // Refresh data
    } catch (error) {
      console.error('Error removing from project:', error);
    }
  };

  if (!organization) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No organization loaded</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">You don't have permission to manage team members</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage team members, roles, and project assignments
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          Invite Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{members.length}</div>
          <div className="text-sm text-gray-600">Total Members</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
          </div>
          <div className="text-sm text-gray-600">Admins</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {members.filter(m => m.projects.some(p => p.isActive)).length}
          </div>
          <div className="text-sm text-gray-600">Assigned to Projects</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{pendingInvitations.length}</div>
          <div className="text-sm text-gray-600">Pending Invitations</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as OrganizationRole | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Team Members List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
        </div>
        
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No team members found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleMemberClick(member)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                      {member.lastLoginAt && (
                        <div className="text-xs text-gray-500">
                          Last active: {new Date(member.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {member.role}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.projects.filter(p => p.isActive).length} projects
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {member.projects.filter(p => p.isActive).slice(0, 2).map((project) => (
                        <span
                          key={project.projectId}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {project.projectName}
                        </span>
                      ))}
                      {member.projects.filter(p => p.isActive).length > 2 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{member.projects.filter(p => p.isActive).length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Invitations</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                    <div className="text-sm text-gray-600">
                      Invited as {invitation.organizationRole}
                      {invitation.projectRole && ` • ${invitation.projectRole} role in project`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement resend invitation
                        console.log('Resend invitation:', invitation.id);
                      }}
                    >
                      Resend
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      <MemberActionsModal
        member={selectedMember}
        projects={projects}
        isOpen={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setSelectedMember(null);
        }}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
        onAssignToProject={handleAssignToProject}
        onRemoveFromProject={handleRemoveFromProject}
      />

      <InviteMemberModal
        projects={projects}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
      />
    </div>
  );
};

export default TeamManagement;