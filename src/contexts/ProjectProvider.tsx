// Think Tank Technologies - Project Context Provider
// Project-specific state management and functionality

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useOrganization } from './OrganizationProvider';
import type { 
  Project,
  ProjectRole,
  ProjectSettings,
  OrganizationMember,
  ProjectContextType,
  Installation,
  TeamMember,
  Assignment,
  ProjectMembership,
  Permission
} from '../types';

// Create the context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Custom hook to use the project context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// Project Provider Props
interface ProjectProviderProps {
  children: ReactNode;
}

// Project Service Class
class ProjectService {
  async getProjectDetails(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Error fetching project details:', error);
        return null;
      }

      return data as Project;
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  }

  async getProjectMembers(projectId: string): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          *,
          users!inner(
            id,
            email,
            first_name,
            last_name,
            role,
            is_active,
            settings
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching project members:', error);
        return [];
      }

      // Transform the data to match OrganizationMember interface
      const members: OrganizationMember[] = data.map(item => ({
        id: item.users.id,
        userId: item.users.id,
        organizationId: '', // Will be filled from organization context
        email: item.users.email,
        firstName: item.users.first_name,
        lastName: item.users.last_name,
        role: item.users.role,
        isActive: item.users.is_active,
        settings: item.users.settings || {},
        projects: [{
          projectId: projectId,
          projectName: '', // Will be filled later
          role: item.role,
          assignedBy: item.assigned_by,
          assignedAt: item.assigned_at,
          isActive: item.is_active
        }]
      }));

      return members;
    } catch (error) {
      console.error('Error fetching project members:', error);
      return [];
    }
  }

  async updateProjectSettings(projectId: string, settings: Partial<ProjectSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) {
        throw new Error(`Failed to update project settings: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      throw error;
    }
  }

  async assignMember(projectId: string, userId: string, role: ProjectRole, assignedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_users')
        .upsert({
          project_id: projectId,
          user_id: userId,
          role,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          is_active: true
        });

      if (error) {
        throw new Error(`Failed to assign member: ${error.message}`);
      }
    } catch (error) {
      console.error('Error assigning member:', error);
      throw error;
    }
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_users')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update member role: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove member: ${error.message}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  async getProjectInstallations(projectId: string): Promise<Installation[]> {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project installations:', error);
        return [];
      }

      return data as Installation[];
    } catch (error) {
      console.error('Error fetching project installations:', error);
      return [];
    }
  }

  async getProjectTeamMembers(projectId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('employment_status', 'active')
        .order('created_at');

      if (error) {
        console.error('Error fetching project team members:', error);
        return [];
      }

      return data as TeamMember[];
    } catch (error) {
      console.error('Error fetching project team members:', error);
      return [];
    }
  }

  async getProjectAssignments(projectId: string): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project assignments:', error);
        return [];
      }

      return data as Assignment[];
    } catch (error) {
      console.error('Error fetching project assignments:', error);
      return [];
    }
  }
}

// Project Provider Component
export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  // Get organization context
  const { currentProject: organizationCurrentProject, organization } = useOrganization();

  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<OrganizationMember[]>([]);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Service instance
  const projectService = new ProjectService();

  // Get current user
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, []);

  // Load project data
  const loadProjectData = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);

      // Get project details
      const projectDetails = await projectService.getProjectDetails(projectId);
      if (!projectDetails) {
        setProject(null);
        return;
      }

      setProject(projectDetails);
      setProjectSettings(projectDetails.settings || {});

      // Load members
      await loadProjectMembers(projectId);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectService]);

  // Load project members
  const loadProjectMembers = useCallback(async (projectId: string) => {
    try {
      setIsMembersLoading(true);
      const members = await projectService.getProjectMembers(projectId);
      
      // Add organization context to members
      if (organization) {
        const membersWithOrgContext = members.map(member => ({
          ...member,
          organizationId: organization.id,
          projects: member.projects.map(p => ({
            ...p,
            projectName: project?.name || ''
          }))
        }));
        setProjectMembers(membersWithOrgContext);
      } else {
        setProjectMembers(members);
      }
    } catch (error) {
      console.error('Error loading project members:', error);
    } finally {
      setIsMembersLoading(false);
    }
  }, [projectService, organization, project]);

  // Refresh project
  const refreshProject = useCallback(async (): Promise<void> => {
    try {
      if (!project) return;
      
      const refreshedProject = await projectService.getProjectDetails(project.id);
      if (refreshedProject) {
        setProject(refreshedProject);
        setProjectSettings(refreshedProject.settings || {});
      }
    } catch (error) {
      console.error('Error refreshing project:', error);
    }
  }, [project, projectService]);

  // Refresh members
  const refreshMembers = useCallback(async (): Promise<void> => {
    try {
      if (!project) return;
      await loadProjectMembers(project.id);
    } catch (error) {
      console.error('Error refreshing members:', error);
    }
  }, [project, loadProjectMembers]);

  // Update project
  const updateProject = useCallback(async (updates: Partial<Project>): Promise<void> => {
    try {
      if (!project) throw new Error('No project loaded');

      const { error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
      }

      await refreshProject();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [project, refreshProject]);

  // Update project settings
  const updateProjectSettingsCallback = useCallback(async (settings: Partial<ProjectSettings>): Promise<void> => {
    try {
      if (!project) throw new Error('No project loaded');

      const updatedSettings = { ...projectSettings, ...settings };
      await projectService.updateProjectSettings(project.id, updatedSettings);
      setProjectSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating project settings:', error);
      throw error;
    }
  }, [project, projectSettings, projectService]);

  // Assign member
  const assignMember = useCallback(async (userId: string, role: ProjectRole): Promise<void> => {
    try {
      if (!project) throw new Error('No project loaded');

      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      await projectService.assignMember(project.id, userId, role, user.id);
      await refreshMembers();
    } catch (error) {
      console.error('Error assigning member:', error);
      throw error;
    }
  }, [project, getCurrentUser, projectService, refreshMembers]);

  // Update member role
  const updateMemberRole = useCallback(async (userId: string, role: ProjectRole): Promise<void> => {
    try {
      if (!project) throw new Error('No project loaded');

      await projectService.updateMemberRole(project.id, userId, role);
      await refreshMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }, [project, projectService, refreshMembers]);

  // Remove member
  const removeMember = useCallback(async (userId: string): Promise<void> => {
    try {
      if (!project) throw new Error('No project loaded');

      await projectService.removeMember(project.id, userId);
      await refreshMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }, [project, projectService, refreshMembers]);

  // Get project installations
  const getProjectInstallations = useCallback(async (): Promise<Installation[]> => {
    try {
      if (!project) return [];
      return await projectService.getProjectInstallations(project.id);
    } catch (error) {
      console.error('Error getting project installations:', error);
      return [];
    }
  }, [project, projectService]);

  // Get project team members
  const getProjectTeamMembers = useCallback(async (): Promise<TeamMember[]> => {
    try {
      if (!project) return [];
      return await projectService.getProjectTeamMembers(project.id);
    } catch (error) {
      console.error('Error getting project team members:', error);
      return [];
    }
  }, [project, projectService]);

  // Get project assignments
  const getProjectAssignments = useCallback(async (): Promise<Assignment[]> => {
    try {
      if (!project) return [];
      return await projectService.getProjectAssignments(project.id);
    } catch (error) {
      console.error('Error getting project assignments:', error);
      return [];
    }
  }, [project, projectService]);

  // Load project when organization's current project changes
  useEffect(() => {
    if (organizationCurrentProject && organizationCurrentProject.id !== project?.id) {
      loadProjectData(organizationCurrentProject.id);
    } else if (!organizationCurrentProject) {
      setProject(null);
      setProjectMembers([]);
      setProjectSettings({});
    }
  }, [organizationCurrentProject, project, loadProjectData]);

  // Context value
  const contextValue: ProjectContextType = {
    // Current state
    project,
    projectMembers,
    projectSettings,
    
    // Loading states
    isLoading,
    isMembersLoading,
    
    // Actions
    refreshProject,
    refreshMembers,
    
    // Project management
    updateProject,
    updateProjectSettings: updateProjectSettingsCallback,
    
    // Member management
    assignMember,
    updateMemberRole,
    removeMember,
    
    // Project-specific data
    getProjectInstallations,
    getProjectTeamMembers,
    getProjectAssignments
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Utility hook for project permissions
export const useProjectPermissions = () => {
  const { project, projectMembers } = useProject();
  const { userRole, permissions } = useOrganization();

  // Get current user
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, []);

  // Get current user's project role
  const getCurrentUserProjectRole = useCallback(async (): Promise<ProjectRole | null> => {
    try {
      const user = await getCurrentUser();
      if (!user || !project) return null;

      const member = projectMembers.find(m => m.userId === user.id);
      if (!member || !member.projects.length) return null;

      const projectMembership = member.projects.find(p => p.projectId === project.id);
      return projectMembership?.role || null;
    } catch (error) {
      console.error('Error getting current user project role:', error);
      return null;
    }
  }, [getCurrentUser, project, projectMembers]);

  // Project-specific permissions
  const canEditProject = useCallback(async (): Promise<boolean> => {
    // Organization owners/admins can always edit
    if (userRole === 'owner' || userRole === 'admin') return true;

    // Check project-specific role
    const projectRole = await getCurrentUserProjectRole();
    return projectRole === 'admin' || projectRole === 'manager';
  }, [userRole, getCurrentUserProjectRole]);

  const canManageProjectMembers = useCallback(async (): Promise<boolean> => {
    // Organization owners/admins can always manage
    if (userRole === 'owner' || userRole === 'admin') return true;

    // Check project-specific role
    const projectRole = await getCurrentUserProjectRole();
    return projectRole === 'admin';
  }, [userRole, getCurrentUserProjectRole]);

  const canViewProject = useCallback(async (): Promise<boolean> => {
    // Organization members can always view projects they're assigned to
    if (userRole && ['owner', 'admin', 'manager', 'member'].includes(userRole)) {
      const projectRole = await getCurrentUserProjectRole();
      return projectRole !== null;
    }
    return false;
  }, [userRole, getCurrentUserProjectRole]);

  const canScheduleInstallations = useCallback(async (): Promise<boolean> => {
    // Check if user can schedule installations
    const projectRole = await getCurrentUserProjectRole();
    return projectRole === 'admin' || 
           projectRole === 'manager' || 
           projectRole === 'scheduler';
  }, [getCurrentUserProjectRole]);

  const canManageTeam = useCallback(async (): Promise<boolean> => {
    const projectRole = await getCurrentUserProjectRole();
    return projectRole === 'admin' || 
           projectRole === 'manager';
  }, [getCurrentUserProjectRole]);

  return {
    getCurrentUserProjectRole,
    canEditProject,
    canManageProjectMembers,
    canViewProject,
    canScheduleInstallations,
    canManageTeam
  };
};

export default ProjectProvider;