// Think Tank Technologies Installation Scheduler - Notification Triggers
// Automated notification triggers for installations, assignments, and schedules

import { getNotificationService } from './NotificationService';
import type { 
  Installation, 
  Assignment, 
  TeamMember, 
  AppNotificationType,
  NotificationPriority,
  AssignmentConflict 
} from '../types';

export interface TriggerContext {
  userId?: string;
  actorId?: string; // Who triggered the action
  metadata?: Record<string, any>;
  suppressNotifications?: boolean;
}

export class NotificationTriggers {
  private notificationService = getNotificationService();

  // Installation-related triggers
  async onInstallationCreated(
    installation: Installation,
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify schedulers and admins about new installation
      const targetRoles = ['admin', 'scheduler'];
      const users = await this.getUsersByRoles(targetRoles);

      for (const user of users) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'installation_created',
          templateData: {
            customer_name: installation.customerName,
            scheduled_date: installation.scheduledDate || 'Not scheduled',
            address: this.formatAddress(installation.address),
            installation_id: installation.id,
          },
          overrides: {
            priority: installation.priority as NotificationPriority,
            relatedEntityType: 'installation',
            relatedEntityId: installation.id,
            actions: [
              {
                id: 'view_installation',
                label: 'View Details',
                action: 'navigate',
                parameters: { route: `/installations/${installation.id}` },
                style: 'primary',
              },
              {
                id: 'schedule_installation',
                label: 'Schedule',
                action: 'navigate',
                parameters: { route: `/schedules/create?installation=${installation.id}` },
                style: 'secondary',
              },
            ],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send installation created notifications:', error);
    }
  }

  async onInstallationAssigned(
    installation: Installation,
    assignment: Assignment,
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify assigned team members
      const teamMemberIds = [assignment.leadId, assignment.assistantId].filter(Boolean);

      for (const teamMemberId of teamMemberIds) {
        if (teamMemberId) {
          await this.notificationService.createInstallationAssignedNotification(
            teamMemberId,
            installation,
            assignment
          );
        }
      }

      // Notify supervisors if different from assignees
      const supervisorIds = await this.getSupervisorIds(teamMemberIds);
      for (const supervisorId of supervisorIds) {
        if (!teamMemberIds.includes(supervisorId)) {
          await this.notificationService.createNotification({
            userId: supervisorId,
            type: 'assignment_created',
            templateData: {
              customer_name: installation.customerName,
              scheduled_date: installation.scheduledDate || 'TBD',
              team_members: await this.getTeamMemberNames(teamMemberIds),
              installation_id: installation.id,
            },
            overrides: {
              priority: 'medium',
              relatedEntityType: 'assignment',
              relatedEntityId: assignment.id,
              actions: [
                {
                  id: 'view_assignment',
                  label: 'View Assignment',
                  action: 'navigate',
                  parameters: { route: `/assignments/${assignment.id}` },
                  style: 'primary',
                },
              ],
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to send installation assignment notifications:', error);
    }
  }

  async onInstallationCompleted(
    installation: Installation,
    completionData: {
      completedBy: string;
      completionTime: Date;
      customerSatisfaction?: number;
      notes?: string;
    },
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify schedulers and supervisors
      const notificationTargets = await this.getNotificationTargets(['admin', 'scheduler']);
      const completedBy = await this.getTeamMemberNames([completionData.completedBy]);

      for (const user of notificationTargets) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'installation_completed',
          templateData: {
            customer_name: installation.customerName,
            completed_by: completedBy[0] || 'Unknown',
            completion_time: completionData.completionTime.toISOString(),
            customer_satisfaction: completionData.customerSatisfaction || 'Not provided',
            installation_id: installation.id,
          },
          overrides: {
            priority: 'low',
            relatedEntityType: 'installation',
            relatedEntityId: installation.id,
            actions: [
              {
                id: 'view_report',
                label: 'View Report',
                action: 'navigate',
                parameters: { route: `/installations/${installation.id}/report` },
                style: 'primary',
              },
            ],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send installation completion notifications:', error);
    }
  }

  // Schedule-related triggers
  async onScheduleChanged(
    changes: {
      type: 'created' | 'updated' | 'cancelled';
      affectedInstallations: Installation[];
      affectedTeamMembers: string[];
      changeDescription: string;
      date?: Date;
    },
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify affected team members
      for (const teamMemberId of changes.affectedTeamMembers) {
        await this.notificationService.createScheduleChangedNotification(
          teamMemberId,
          changes.changeDescription,
          changes.date?.toISOString()
        );
      }

      // Notify supervisors if major changes
      if (changes.affectedInstallations.length > 1) {
        const supervisorIds = await this.getSupervisorIds(changes.affectedTeamMembers);
        for (const supervisorId of supervisorIds) {
          await this.notificationService.createNotification({
            userId: supervisorId,
            type: 'schedule_changed',
            templateData: {
              change_description: `${changes.affectedInstallations.length} installations affected: ${changes.changeDescription}`,
              affected_count: changes.affectedInstallations.length,
              date: changes.date?.toISOString(),
            },
            overrides: {
              priority: 'medium',
              relatedEntityType: 'schedule',
              actions: [
                {
                  id: 'view_schedule',
                  label: 'View Schedule',
                  action: 'navigate',
                  parameters: { route: '/schedules' },
                  style: 'primary',
                },
              ],
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to send schedule change notifications:', error);
    }
  }

  // Conflict-related triggers
  async onConflictDetected(
    conflict: AssignmentConflict,
    installation: Installation,
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify affected team members
      for (const teamMemberId of conflict.affectedTeamMembers) {
        await this.notificationService.createConflictDetectedNotification(
          teamMemberId,
          conflict,
          installation
        );
      }

      // Always notify schedulers and supervisors for conflicts
      const notificationTargets = await this.getNotificationTargets(['admin', 'scheduler']);
      for (const user of notificationTargets) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'conflict_detected',
          templateData: {
            customer_name: installation.customerName,
            conflict_description: conflict.description,
            conflict_type: conflict.type,
            affected_count: conflict.affectedTeamMembers.length,
            conflict_id: conflict.id,
          },
          overrides: {
            priority: 'urgent',
            relatedEntityType: 'conflict',
            relatedEntityId: conflict.id,
            actions: [
              {
                id: 'resolve_conflict',
                label: 'Resolve Conflict',
                action: 'navigate',
                parameters: { route: `/assignments/conflicts/${conflict.id}` },
                style: 'primary',
              },
              {
                id: 'view_schedule',
                label: 'View Schedule',
                action: 'navigate',
                parameters: { route: '/schedules' },
                style: 'secondary',
              },
            ],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send conflict detection notifications:', error);
    }
  }

  async onConflictResolved(
    conflict: AssignmentConflict,
    resolution: {
      resolvedBy: string;
      resolutionMethod: string;
      notes?: string;
    },
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify affected team members
      for (const teamMemberId of conflict.affectedTeamMembers) {
        await this.notificationService.createNotification({
          userId: teamMemberId,
          type: 'conflict_resolved',
          templateData: {
            conflict_type: conflict.type,
            resolution_method: resolution.resolutionMethod,
            resolved_by: await this.getTeamMemberName(resolution.resolvedBy),
            conflict_id: conflict.id,
          },
          overrides: {
            priority: 'medium',
            relatedEntityType: 'conflict',
            relatedEntityId: conflict.id,
            actions: [
              {
                id: 'view_schedule',
                label: 'View Updated Schedule',
                action: 'navigate',
                parameters: { route: '/schedules' },
                style: 'primary',
              },
            ],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send conflict resolution notifications:', error);
    }
  }

  // Team-related triggers
  async onTeamStatusChanged(
    teamMember: TeamMember,
    changes: {
      oldStatus: string;
      newStatus: string;
      reason?: string;
    },
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify supervisors and schedulers
      const notificationTargets = await this.getNotificationTargets(['admin', 'scheduler']);
      
      // Add team member's supervisor if different
      if (teamMember.supervisorId) {
        const supervisor = await this.getTeamMember(teamMember.supervisorId);
        if (supervisor && !notificationTargets.find(u => u.id === supervisor.id)) {
          notificationTargets.push({ id: supervisor.id, role: supervisor.role });
        }
      }

      for (const user of notificationTargets) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'team_status_changed',
          templateData: {
            team_member_name: `${teamMember.firstName} ${teamMember.lastName}`,
            old_status: changes.oldStatus,
            new_status: changes.newStatus,
            reason: changes.reason || 'No reason provided',
          },
          overrides: {
            priority: changes.newStatus === 'unavailable' ? 'high' : 'low',
            relatedEntityType: 'team_member',
            relatedEntityId: teamMember.id,
            actions: [
              {
                id: 'view_team_member',
                label: 'View Team Member',
                action: 'navigate',
                parameters: { route: `/team/${teamMember.id}` },
                style: 'primary',
              },
            ],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send team status change notifications:', error);
    }
  }

  // Deadline and reminder triggers
  async onDeadlineReminder(
    installations: Installation[],
    reminderType: 'upcoming' | 'overdue',
    hoursUntilDeadline?: number,
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Group installations by assigned team members
      const installationsByTeamMember = new Map<string, Installation[]>();

      for (const installation of installations) {
        // Get assignments for this installation
        const assignments = await this.getInstallationAssignments(installation.id);
        
        for (const assignment of assignments) {
          const teamMemberIds = [assignment.leadId, assignment.assistantId].filter(Boolean);
          
          for (const teamMemberId of teamMemberIds) {
            if (teamMemberId) {
              if (!installationsByTeamMember.has(teamMemberId)) {
                installationsByTeamMember.set(teamMemberId, []);
              }
              installationsByTeamMember.get(teamMemberId)!.push(installation);
            }
          }
        }
      }

      // Send reminders to each team member
      for (const [teamMemberId, memberInstallations] of installationsByTeamMember) {
        const priority: NotificationPriority = reminderType === 'overdue' ? 'urgent' : 'medium';
        
        if (memberInstallations.length === 1) {
          const installation = memberInstallations[0];
          await this.notificationService.createNotification({
            userId: teamMemberId,
            type: 'deadline_reminder',
            templateData: {
              customer_name: installation.customerName,
              scheduled_date: installation.scheduledDate || 'TBD',
              hours_until: hoursUntilDeadline || 0,
              reminder_type: reminderType,
            },
            overrides: {
              priority,
              relatedEntityType: 'installation',
              relatedEntityId: installation.id,
            },
          });
        } else {
          // Multiple installations - send summary
          await this.notificationService.createNotification({
            userId: teamMemberId,
            type: 'deadline_reminder',
            templateData: {
              installation_count: memberInstallations.length,
              reminder_type: reminderType,
              hours_until: hoursUntilDeadline || 0,
            },
            overrides: {
              priority,
              title: `${memberInstallations.length} ${reminderType === 'overdue' ? 'Overdue' : 'Upcoming'} Installations`,
              message: `You have ${memberInstallations.length} installations that are ${reminderType === 'overdue' ? 'overdue' : 'coming up'}`,
              actions: [
                {
                  id: 'view_schedule',
                  label: 'View Schedule',
                  action: 'navigate',
                  parameters: { route: '/schedules' },
                  style: 'primary',
                },
              ],
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to send deadline reminder notifications:', error);
    }
  }

  // System and maintenance triggers
  async onSystemMaintenance(
    maintenance: {
      title: string;
      message: string;
      scheduledTime: Date;
      duration: string;
      affectedServices: string[];
    },
    context: TriggerContext = {}
  ): Promise<void> {
    if (context.suppressNotifications) return;

    try {
      // Notify all active users
      const allUsers = await this.getAllActiveUsers();

      for (const user of allUsers) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'system_maintenance',
          templateData: {
            title: maintenance.title,
            message: maintenance.message,
            scheduled_time: maintenance.scheduledTime.toISOString(),
            duration: maintenance.duration,
            affected_services: maintenance.affectedServices.join(', '),
          },
          overrides: {
            priority: 'medium',
            channels: ['in_app', 'email'],
          },
        });
      }
    } catch (error) {
      console.error('Failed to send system maintenance notifications:', error);
    }
  }

  // Utility methods
  private async getUsersByRoles(roles: string[]): Promise<Array<{ id: string; role: string }>> {
    // This would fetch users from your database
    // Placeholder implementation
    return [];
  }

  private async getNotificationTargets(roles: string[]): Promise<Array<{ id: string; role: string }>> {
    return this.getUsersByRoles(roles);
  }

  private async getSupervisorIds(teamMemberIds: string[]): Promise<string[]> {
    // This would fetch supervisor IDs for the given team members
    return [];
  }

  private async getTeamMemberNames(teamMemberIds: string[]): Promise<string[]> {
    // This would fetch team member names
    return teamMemberIds.map(id => `Team Member ${id}`);
  }

  private async getTeamMemberName(teamMemberId: string): Promise<string> {
    const names = await this.getTeamMemberNames([teamMemberId]);
    return names[0] || 'Unknown';
  }

  private async getTeamMember(teamMemberId: string): Promise<TeamMember | null> {
    // This would fetch team member details
    return null;
  }

  private async getInstallationAssignments(installationId: string): Promise<Assignment[]> {
    // This would fetch assignments for an installation
    return [];
  }

  private async getAllActiveUsers(): Promise<Array<{ id: string; role: string }>> {
    // This would fetch all active users
    return [];
  }

  private formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    if (address?.street && address?.city) {
      return `${address.street}, ${address.city}${address.state ? `, ${address.state}` : ''}`;
    }
    return 'Address not provided';
  }
}

// Singleton instance
let notificationTriggers: NotificationTriggers | null = null;

export function getNotificationTriggers(): NotificationTriggers {
  if (!notificationTriggers) {
    notificationTriggers = new NotificationTriggers();
  }
  return notificationTriggers;
}

export default NotificationTriggers;