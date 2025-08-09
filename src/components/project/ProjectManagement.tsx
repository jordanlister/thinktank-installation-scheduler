// Think Tank Technologies - Project Management System
// Comprehensive project creation, settings, and team assignment interface

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useOrganization } from '../../contexts/OrganizationProvider';
import { useProject, useProjectPermissions } from '../../contexts/ProjectProvider';
import { supabase } from '../../services/supabase';
import type {
  Project,
  ProjectFormData,
  ProjectSettings,
  ProjectRole,
  OrganizationMember,
  ProjectCustomField,
  ProjectTemplate
} from '../../types';

// Props
interface ProjectManagementProps {
  className?: string;
}

// Create Project Modal
const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: ProjectFormData) => void;
}> = ({ isOpen, onClose, onCreateProject }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    settings: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Project name must be between 2 and 100 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreateProject(formData);
    setFormData({ name: '', description: '', settings: {} });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <div className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <Input
            id="projectName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Installation Project Alpha"
            error={errors.name}
            className="w-full"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="projectDescription"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose and scope of this project..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900">What happens next?</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>You'll be assigned as project admin</li>
            <li>You can invite team members and assign roles</li>
            <li>Configure project-specific settings</li>
            <li>Start creating installations and schedules</li>
          </ul>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Project
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Project Settings Component
const ProjectSettingsSection: React.FC<{
  project: Project;
  onUpdate: (settings: Partial<ProjectSettings>) => void;
  isLoading: boolean;
}> = ({ project, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState<ProjectSettings>(
    project.settings || {
      workingHours: {
        start: '08:00',
        end: '17:00',
        days: [1, 2, 3, 4, 5]
      },
      defaultJobDuration: 240,
      travelTimeBuffer: 30,
      maxJobsPerTeamMember: 8,
      autoAssignments: true,
      requireApproval: false,
      allowOvertimeAssignment: false
    }
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(project.settings || {});
    setHasChanges(hasFormChanges);
  }, [formData, project.settings]);

  const updateField = <K extends keyof ProjectSettings>(field: K, value: ProjectSettings[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(formData);
    setHasChanges(false);
  };

  const daysOfWeek = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
  ];

  const toggleWorkingDay = (dayId: number) => {
    const currentDays = formData.workingHours?.days || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId].sort((a, b) => a - b);
    
    updateField('workingHours', {
      ...formData.workingHours,
      days: newDays
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Settings</h3>
      
      <div className="space-y-6">
        {/* Working Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Working Hours</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="workStart" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <Input
                id="workStart"
                type="time"
                value={formData.workingHours?.start || '08:00'}
                onChange={(e) => updateField('workingHours', {
                  ...formData.workingHours,
                  start: e.target.value
                })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="workEnd" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <Input
                id="workEnd"
                type="time"
                value={formData.workingHours?.end || '17:00'}
                onChange={(e) => updateField('workingHours', {
                  ...formData.workingHours,
                  end: e.target.value
                })}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleWorkingDay(day.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border ${
                    formData.workingHours?.days?.includes(day.id)
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Job Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Installation Defaults</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="defaultDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Default Duration (minutes)
              </label>
              <Input
                id="defaultDuration"
                type="number"
                min="30"
                max="960"
                value={formData.defaultJobDuration?.toString() || '240'}
                onChange={(e) => updateField('defaultJobDuration', parseInt(e.target.value) || 240)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="travelBuffer" className="block text-sm font-medium text-gray-700 mb-2">
                Travel Buffer (minutes)
              </label>
              <Input
                id="travelBuffer"
                type="number"
                min="0"
                max="120"
                value={formData.travelTimeBuffer?.toString() || '30'}
                onChange={(e) => updateField('travelTimeBuffer', parseInt(e.target.value) || 30)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="maxJobs" className="block text-sm font-medium text-gray-700 mb-2">
                Max Jobs per Team Member
              </label>
              <Input
                id="maxJobs"
                type="number"
                min="1"
                max="20"
                value={formData.maxJobsPerTeamMember?.toString() || '8'}
                onChange={(e) => updateField('maxJobsPerTeamMember', parseInt(e.target.value) || 8)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Automation & Approval</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoAssignments || false}
                onChange={(e) => updateField('autoAssignments', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-900">Enable automatic assignments</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requireApproval || false}
                onChange={(e) => updateField('requireApproval', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-900">Require approval for schedule changes</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowOvertimeAssignment || false}
                onChange={(e) => updateField('allowOvertimeAssignment', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-900">Allow overtime assignments</span>
            </label>
          </div>
        </div>

        {/* Geographic Bounds */}
        {formData.geographicBounds && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Geographic Boundaries</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  North Latitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.geographicBounds.north}
                  onChange={(e) => updateField('geographicBounds', {
                    ...formData.geographicBounds!,
                    north: parseFloat(e.target.value)
                  })}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  South Latitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.geographicBounds.south}
                  onChange={(e) => updateField('geographicBounds', {
                    ...formData.geographicBounds!,
                    south: parseFloat(e.target.value)
                  })}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  East Longitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.geographicBounds.east}
                  onChange={(e) => updateField('geographicBounds', {
                    ...formData.geographicBounds!,
                    east: parseFloat(e.target.value)
                  })}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  West Longitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.geographicBounds.west}
                  onChange={(e) => updateField('geographicBounds', {
                    ...formData.geographicBounds!,
                    west: parseFloat(e.target.value)
                  })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            loading={isLoading}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Project Team Management Component
const ProjectTeamSection: React.FC<{
  project: Project;
  projectMembers: OrganizationMember[];
  organizationMembers: OrganizationMember[];
  onAssignMember: (userId: string, role: ProjectRole) => void;
  onUpdateMemberRole: (userId: string, role: ProjectRole) => void;
  onRemoveMember: (userId: string) => void;
  isLoading: boolean;
}> = ({ 
  project, 
  projectMembers, 
  organizationMembers, 
  onAssignMember, 
  onUpdateMemberRole, 
  onRemoveMember,
  isLoading 
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('viewer');

  const availableMembers = organizationMembers.filter(
    orgMember => !projectMembers.some(projMember => projMember.userId === orgMember.userId)
  );

  const handleAssignMember = () => {
    if (selectedUserId && selectedRole) {
      onAssignMember(selectedUserId, selectedRole);
      setSelectedUserId('');
      setSelectedRole('viewer');
    }
  };

  const getRoleColor = (role: ProjectRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      scheduler: 'bg-blue-100 text-blue-800',
      lead: 'bg-green-100 text-green-800',
      assistant: 'bg-yellow-100 text-yellow-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.viewer;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Project Team</h3>
        <div className="text-sm text-gray-500">
          {projectMembers.length} members
        </div>
      </div>

      {/* Assign New Member */}
      {availableMembers.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Assign Team Member</h4>
          <div className="flex items-center space-x-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Select member...</option>
              {availableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.firstName} {member.lastName} ({member.email})
                </option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="viewer">Viewer</option>
              <option value="assistant">Assistant</option>
              <option value="lead">Lead</option>
              <option value="scheduler">Scheduler</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              onClick={handleAssignMember}
              disabled={!selectedUserId || isLoading}
              size="sm"
            >
              Assign
            </Button>
          </div>
        </div>
      )}

      {/* Current Team Members */}
      {projectMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No team members assigned to this project
        </div>
      ) : (
        <div className="space-y-3">
          {projectMembers.map((member) => {
            const projectMembership = member.projects.find(p => p.projectId === project.id && p.isActive);
            const role = projectMembership?.role || 'viewer';
            
            return (
              <div key={member.userId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
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
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={role}
                    onChange={(e) => onUpdateMemberRole(member.userId, e.target.value as ProjectRole)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="assistant">Assistant</option>
                    <option value="lead">Lead</option>
                    <option value="scheduler">Scheduler</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                    {role}
                  </span>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemoveMember(member.userId)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

// Main Project Management Component
export const ProjectManagement: React.FC<ProjectManagementProps> = ({ className = '' }) => {
  const { organization, projects, createProject, updateProject, deleteProject } = useOrganization();
  const { project, projectMembers, updateProjectSettings, assignMember, updateMemberRole, removeMember } = useProject();
  const { canEditProject, canManageProjectMembers } = useProjectPermissions();

  // State
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'team' | 'templates'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [hasTeamPermission, setHasTeamPermission] = useState(false);

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      setHasEditPermission(await canEditProject());
      setHasTeamPermission(await canManageProjectMembers());
    };
    checkPermissions();
  }, [canEditProject, canManageProjectMembers]);

  // Load organization members
  useEffect(() => {
    const loadOrganizationMembers = async () => {
      if (!organization) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error loading organization members:', error);
          return;
        }

        const members: OrganizationMember[] = data.map(user => ({
          id: user.id,
          userId: user.id,
          organizationId: user.organization_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          settings: user.settings || {},
          projects: [] // Will be populated if needed
        }));

        setOrganizationMembers(members);
      } catch (error) {
        console.error('Error loading organization members:', error);
      }
    };

    loadOrganizationMembers();
  }, [organization]);

  // Handle project creation
  const handleCreateProject = async (projectData: ProjectFormData) => {
    try {
      setIsLoading(true);
      await createProject({
        name: projectData.name,
        description: projectData.description,
        settings: projectData.settings || {},
        isActive: true,
        createdBy: '' // Will be filled by the service
      });
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle project settings update
  const handleUpdateSettings = async (settings: Partial<ProjectSettings>) => {
    try {
      setIsLoading(true);
      await updateProjectSettings(settings);
    } catch (error) {
      console.error('Error updating project settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle team member assignment
  const handleAssignMember = async (userId: string, role: ProjectRole) => {
    try {
      setIsLoading(true);
      await assignMember(userId, role);
    } catch (error) {
      console.error('Error assigning member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role update
  const handleUpdateMemberRole = async (userId: string, role: ProjectRole) => {
    try {
      setIsLoading(true);
      await updateMemberRole(userId, role);
    } catch (error) {
      console.error('Error updating member role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    try {
      setIsLoading(true);
      await removeMember(userId);
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!organization) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No organization loaded</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', description: 'Project dashboard and metrics' },
    { id: 'settings' as const, label: 'Settings', description: 'Project configuration' },
    { id: 'team' as const, label: 'Team', description: 'Team member assignments' },
    { id: 'templates' as const, label: 'Templates', description: 'Installation templates' }
  ];

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">
            {project ? `Managing ${project.name}` : 'Create and manage projects'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary"
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Projects Overview */}
      {!project && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {projects.map((proj) => (
            <Card key={proj.id} className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{proj.name}</h3>
              {proj.description && (
                <p className="text-gray-600 text-sm mb-4">{proj.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Members:</span>
                  <span className="font-medium">{proj.memberCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Installations:</span>
                  <span className="font-medium">{proj.installationCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{new Date(proj.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage Project
                </Button>
              </div>
            </Card>
          ))}
          
          <Card className="p-6 border-dashed border-2 border-gray-300 flex flex-col items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Create New Project</h3>
              <p className="text-sm text-gray-500 mb-4">Organize your installations and team</p>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                Create Project
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Project Detail View */}
      {project && (
        <>
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{tab.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="text-2xl font-bold text-gray-900">{project.memberCount || 0}</div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </Card>
                <Card className="p-6">
                  <div className="text-2xl font-bold text-gray-900">{project.installationCount || 0}</div>
                  <div className="text-sm text-gray-600">Total Installations</div>
                </Card>
                <Card className="p-6">
                  <div className="text-2xl font-bold text-gray-900">{project.completedInstallations || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && hasEditPermission && (
              <ProjectSettingsSection
                project={project}
                onUpdate={handleUpdateSettings}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'team' && hasTeamPermission && (
              <ProjectTeamSection
                project={project}
                projectMembers={projectMembers}
                organizationMembers={organizationMembers}
                onAssignMember={handleAssignMember}
                onUpdateMemberRole={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'templates' && hasEditPermission && (
              <Card className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>Installation templates coming soon</p>
                  <p className="text-sm mt-2">Create reusable templates for common installation types</p>
                </div>
              </Card>
            )}

            {!hasEditPermission && (activeTab === 'settings' || activeTab === 'templates') && (
              <Card className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have permission to manage project settings</p>
                </div>
              </Card>
            )}

            {!hasTeamPermission && activeTab === 'team' && (
              <Card className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have permission to manage project team</p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default ProjectManagement;