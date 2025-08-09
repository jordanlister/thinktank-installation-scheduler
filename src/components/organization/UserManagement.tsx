// Think Tank Technologies Installation Scheduler - User Management Component
// Comprehensive user management with RBAC, invitations, and security features

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  Send
} from 'lucide-react';
import { useOrganization, useOrganizationMembers, useOrganizationPermissions } from '../../contexts/OrganizationProvider';
import { invitationService } from '../../services/invitationService';
import { securityService, SecurityEventType } from '../../services/securityService';
import {
  AuthUser,
  UserInvitation,
  OrganizationRole,
  ProjectRole,
  Project
} from '../../types';

// Component interfaces
interface UserManagementProps {
  className?: string;
}

interface UserListItemProps {
  user: AuthUser;
  currentUser: AuthUser;
  onEditUser: (user: AuthUser) => void;
  onRemoveUser: (user: AuthUser) => void;
  onChangeRole: (user: AuthUser, newRole: OrganizationRole) => void;
  canEdit: boolean;
  canDelete: boolean;
}

interface InvitationListItemProps {
  invitation: UserInvitation;
  onResend: (invitation: UserInvitation) => void;
  onCancel: (invitation: UserInvitation) => void;
  canManage: boolean;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteUserData) => Promise<void>;
  projects: Project[];
}

interface InviteUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationRole: OrganizationRole;
  projectId?: string;
  projectRole?: ProjectRole;
  message?: string;
}

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkInvite: (data: BulkInviteData) => Promise<void>;
  projects: Project[];
}

interface BulkInviteData {
  emails: string[];
  organizationRole: OrganizationRole;
  projectId?: string;
  projectRole?: ProjectRole;
  message?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const { state, refreshOrganizationData, hasPermission } = useOrganization();
  const { organizationMembers, pendingInvitations, inviteUser } = useOrganizationMembers();
  const { hasOrganizationRole } = useOrganizationPermissions();
  
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<OrganizationRole | 'all'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission checks
  const canInviteUsers = hasPermission('users', 'create');
  const canEditUsers = hasPermission('users', 'update');
  const canDeleteUsers = hasPermission('users', 'delete');
  const canViewInvitations = hasPermission('invitations', 'read');
  const isAdmin = hasOrganizationRole(OrganizationRole.ADMIN) || hasOrganizationRole(OrganizationRole.OWNER);

  // Filter users based on search and role
  const filteredMembers = useMemo(() => {
    return organizationMembers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.organizationRole === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [organizationMembers, searchTerm, roleFilter]);

  // Handle invite user
  const handleInviteUser = async (data: InviteUserData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await inviteUser(
        data.email,
        data.organizationRole,
        data.projectId,
        data.projectRole
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Log security event
      await securityService.logSecurityEvent(
        state.organization!.id,
        SecurityEventType.INVITATION_SENT,
        {
          metadata: {
            inviteeEmail: data.email,
            organizationRole: data.organizationRole,
            projectId: data.projectId,
            projectRole: data.projectRole
          }
        },
        'low',
        state.currentUser?.id
      );

      setShowInviteModal(false);
      await refreshOrganizationData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk invite
  const handleBulkInvite = async (data: BulkInviteData) => {
    try {
      setIsLoading(true);
      setError(null);

      const bulkData = {
        invitations: data.emails.map(email => ({
          email,
          organizationRole: data.organizationRole,
          projectId: data.projectId,
          projectRole: data.projectRole,
          message: data.message
        })),
        organizationRole: data.organizationRole,
        projectId: data.projectId,
        projectRole: data.projectRole
      };

      const result = await invitationService.createBulkInvitations(
        state.organization!.id,
        state.currentUser!.id,
        bulkData
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setShowBulkInviteModal(false);
      await refreshOrganizationData();

      // Show results
      if (result.results) {
        const { successful, failed, errors } = result.results;
        if (failed > 0) {
          setError(`${successful} invitations sent successfully, ${failed} failed. Errors: ${errors.join(', ')}`);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send bulk invitations');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user role change
  const handleChangeUserRole = async (user: AuthUser, newRole: OrganizationRole) => {
    try {
      setIsLoading(true);
      
      // Check privilege escalation
      const escalationCheck = await securityService.checkPrivilegeEscalation(
        state.organization!.id,
        state.currentUser!.id,
        user.id,
        user.organizationRole,
        newRole
      );

      if (!escalationCheck.allowed) {
        throw new Error(escalationCheck.reason);
      }

      // TODO: Implement role change API call
      // await userService.updateUserRole(user.id, newRole);
      
      await refreshOrganizationData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change user role');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (invitation: UserInvitation) => {
    try {
      setIsLoading(true);
      const result = await invitationService.resendInvitation(invitation.id, state.currentUser!.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      await refreshOrganizationData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel invitation
  const handleCancelInvitation = async (invitation: UserInvitation) => {
    try {
      setIsLoading(true);
      const result = await invitationService.cancelInvitation(invitation.id, state.currentUser!.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      await refreshOrganizationData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!state.currentUser || !state.organization) {
    return <div className="loading-spinner">Loading user management...</div>;
  }

  return (
    <div className={`user-management ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-glass-primary">User Management</h2>
          <p className="text-glass-secondary mt-1">
            Manage organization members and invitations
          </p>
        </div>
        
        {canInviteUsers && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBulkInviteModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Bulk Invite</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite User</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-glass alert-error mb-6">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-error-300 hover:text-error-200"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-accent-500 text-white'
              : 'text-glass-secondary hover:text-glass-primary hover:bg-glass-hover'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Members ({organizationMembers.length})
        </button>
        {canViewInvitations && (
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'bg-accent-500 text-white'
                : 'text-glass-secondary hover:text-glass-primary hover:bg-glass-hover'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Invitations ({pendingInvitations.length})
          </button>
        )}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-muted h-4 w-4" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as OrganizationRole | 'all')}
              className="form-input min-w-48"
            >
              <option value="all">All Roles</option>
              <option value={OrganizationRole.OWNER}>Owner</option>
              <option value={OrganizationRole.ADMIN}>Admin</option>
              <option value={OrganizationRole.MANAGER}>Manager</option>
              <option value={OrganizationRole.MEMBER}>Member</option>
            </select>

            <button className="btn-secondary flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {filteredMembers.map(user => (
              <UserListItem
                key={user.id}
                user={user}
                currentUser={state.currentUser!}
                onEditUser={() => {/* TODO: Implement edit modal */}}
                onRemoveUser={() => {/* TODO: Implement remove confirmation */}}
                onChangeRole={handleChangeUserRole}
                canEdit={canEditUsers}
                canDelete={canDeleteUsers}
              />
            ))}

            {filteredMembers.length === 0 && (
              <div className="text-center py-12 text-glass-muted">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && canViewInvitations && (
        <div className="space-y-6">
          <div className="space-y-3">
            {pendingInvitations.map(invitation => (
              <InvitationListItem
                key={invitation.id}
                invitation={invitation}
                onResend={handleResendInvitation}
                onCancel={handleCancelInvitation}
                canManage={canInviteUsers}
              />
            ))}

            {pendingInvitations.length === 0 && (
              <div className="text-center py-12 text-glass-muted">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending invitations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
          projects={state.projects}
        />
      )}

      {showBulkInviteModal && (
        <BulkInviteModal
          isOpen={showBulkInviteModal}
          onClose={() => setShowBulkInviteModal(false)}
          onBulkInvite={handleBulkInvite}
          projects={state.projects}
        />
      )}
    </div>
  );
};

// User List Item Component
const UserListItem: React.FC<UserListItemProps> = ({
  user,
  currentUser,
  onEditUser,
  onRemoveUser,
  onChangeRole,
  canEdit,
  canDelete
}) => {
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = user.id === currentUser.id;

  const getRoleBadgeColor = (role: OrganizationRole) => {
    switch (role) {
      case OrganizationRole.OWNER: return 'bg-purple-100 text-purple-800';
      case OrganizationRole.ADMIN: return 'bg-red-100 text-red-800';
      case OrganizationRole.MANAGER: return 'bg-blue-100 text-blue-800';
      case OrganizationRole.MEMBER: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card-glass p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-accent-500 flex items-center justify-center text-white font-medium">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-glass-primary">
                {user.firstName} {user.lastName}
                {isCurrentUser && <span className="text-glass-muted text-sm ml-2">(You)</span>}
              </h3>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.organizationRole)}`}>
                {user.organizationRole}
              </span>
            </div>
            
            <p className="text-glass-secondary text-sm">{user.email}</p>
            
            {user.projects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.projects.slice(0, 3).map(project => (
                  <span key={project.projectId} className="px-2 py-1 bg-glass-subtle rounded text-xs text-glass-secondary">
                    {project.projectName} ({project.role})
                  </span>
                ))}
                {user.projects.length > 3 && (
                  <span className="px-2 py-1 bg-glass-subtle rounded text-xs text-glass-muted">
                    +{user.projects.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-sm">
            <p className="text-glass-secondary">
              Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
            </p>
            <p className="text-glass-muted">
              Joined: {new Date(user.settings?.joinedAt || user.createdAt).toLocaleDateString()}
            </p>
          </div>

          {(canEdit || canDelete) && !isCurrentUser && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="btn-secondary p-2"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-glass-border z-10">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          onEditUser(user);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-glass-primary hover:bg-glass-hover flex items-center space-x-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit User</span>
                      </button>
                      
                      <div className="px-4 py-2 border-b border-glass-border">
                        <label className="block text-xs text-glass-secondary mb-1">Change Role</label>
                        <select
                          value={user.organizationRole}
                          onChange={(e) => onChangeRole(user, e.target.value as OrganizationRole)}
                          className="form-input text-sm"
                        >
                          <option value={OrganizationRole.MEMBER}>Member</option>
                          <option value={OrganizationRole.MANAGER}>Manager</option>
                          <option value={OrganizationRole.ADMIN}>Admin</option>
                          {currentUser.organizationRole === OrganizationRole.OWNER && (
                            <option value={OrganizationRole.OWNER}>Owner</option>
                          )}
                        </select>
                      </div>
                    </>
                  )}
                  
                  {canDelete && (
                    <button
                      onClick={() => {
                        onRemoveUser(user);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove User</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Invitation List Item Component
const InvitationListItem: React.FC<InvitationListItemProps> = ({
  invitation,
  onResend,
  onCancel,
  canManage
}) => {
  const isExpired = new Date(invitation.expiresAt) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(invitation.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card-glass p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-glass-subtle flex items-center justify-center">
            <Mail className="h-5 w-5 text-glass-muted" />
          </div>
          
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-glass-primary">{invitation.email}</h3>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isExpired ? 'Expired' : 'Pending'}
              </span>
            </div>
            
            <p className="text-glass-secondary text-sm">
              Role: {invitation.organizationRole}
              {invitation.projectRole && ` • Project: ${invitation.projectRole}`}
            </p>
            
            <p className="text-glass-muted text-sm">
              {isExpired ? 'Expired' : `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-sm">
            <p className="text-glass-secondary">
              Invited: {new Date(invitation.createdAt).toLocaleDateString()}
            </p>
            <p className="text-glass-muted">
              By: {invitation.metadata.inviterName || 'System'}
            </p>
          </div>

          {canManage && (
            <div className="flex space-x-2">
              {!isExpired && (
                <button
                  onClick={() => onResend(invitation)}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Send className="h-3 w-3" />
                  <span>Resend</span>
                </button>
              )}
              
              <button
                onClick={() => onCancel(invitation)}
                className="btn-danger text-sm flex items-center space-x-1"
              >
                <XCircle className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Invite User Modal Component (simplified - would be more complex in real implementation)
const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onInvite, projects }) => {
  const [formData, setFormData] = useState<InviteUserData>({
    email: '',
    organizationRole: OrganizationRole.MEMBER
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="text-lg font-semibold mb-4">Invite User</h3>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onInvite(formData);
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-glass-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-glass-secondary mb-1">
                Organization Role
              </label>
              <select
                value={formData.organizationRole}
                onChange={(e) => setFormData({ ...formData, organizationRole: e.target.value as OrganizationRole })}
                className="form-input"
              >
                <option value={OrganizationRole.MEMBER}>Member</option>
                <option value={OrganizationRole.MANAGER}>Manager</option>
                <option value={OrganizationRole.ADMIN}>Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Send Invitation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bulk Invite Modal Component (simplified)
const BulkInviteModal: React.FC<BulkInviteModalProps> = ({ isOpen, onClose, onBulkInvite, projects }) => {
  const [emails, setEmails] = useState('');
  const [organizationRole, setOrganizationRole] = useState<OrganizationRole>(OrganizationRole.MEMBER);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="text-lg font-semibold mb-4">Bulk Invite Users</h3>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const emailList = emails.split('\n').map(e => e.trim()).filter(e => e);
          onBulkInvite({ emails: emailList, organizationRole });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-glass-secondary mb-1">
                Email Addresses (one per line)
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={8}
                className="form-input"
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-glass-secondary mb-1">
                Organization Role
              </label>
              <select
                value={organizationRole}
                onChange={(e) => setOrganizationRole(e.target.value as OrganizationRole)}
                className="form-input"
              >
                <option value={OrganizationRole.MEMBER}>Member</option>
                <option value={OrganizationRole.MANAGER}>Manager</option>
                <option value={OrganizationRole.ADMIN}>Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Send Invitations
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;