// Think Tank Technologies - Hierarchical Settings Management System
// Manages settings inheritance and overrides across organization, project, and user levels

import type {
  Organization,
  Project,
  UserSettings,
  OrganizationSettings,
  ProjectSettings,
  NotificationSettings
} from '../types';

// Settings Level Hierarchy
export enum SettingsLevel {
  ORGANIZATION = 'organization',
  PROJECT = 'project', 
  USER = 'user'
}

// Settings Key Paths
export type SettingsPath = 
  | 'timezone'
  | 'currency'
  | 'dateFormat'
  | 'timeFormat'
  | 'language'
  | 'workingHours'
  | 'workingHours.start'
  | 'workingHours.end'
  | 'workingHours.days'
  | 'defaultJobDuration'
  | 'travelTimeBuffer'
  | 'maxJobsPerTeamMember'
  | 'autoAssignments'
  | 'enableOptimization'
  | 'optimizationGoal'
  | 'requireApprovalForChanges'
  | 'allowOvertimeAssignment'
  | 'weatherIntegration'
  | 'trafficIntegration'
  | 'customerPreferenceWeighting'
  | 'retentionDays'
  | 'auditLogging'
  | 'encryptSensitiveData'
  | 'theme'
  | 'notifications'
  | 'notifications.emailNotifications'
  | 'notifications.emailNotifications.enabled'
  | 'notifications.emailNotifications.scheduleChanges'
  | 'notifications.emailNotifications.newAssignments'
  | 'notifications.emailNotifications.deadlineReminders'
  | 'notifications.smsNotifications'
  | 'notifications.smsNotifications.enabled'
  | 'notifications.pushNotifications'
  | 'notifications.pushNotifications.enabled'
  | 'preferences.defaultView'
  | 'preferences.itemsPerPage'
  | 'preferences.showAvatars'
  | 'preferences.enableSounds'
  | 'preferences.autoRefresh'
  | 'preferences.refreshInterval';

// Settings Override Policy
export enum OverridePolicy {
  ALLOW = 'allow',           // Lower levels can override
  INHERIT = 'inherit',       // Lower levels inherit and cannot override
  SUGGEST = 'suggest',       // Lower levels get suggestion but can override
  ENFORCE = 'enforce'        // Lower levels must use this value
}

// Setting Definition
export interface SettingDefinition {
  key: SettingsPath;
  level: SettingsLevel[];
  overridePolicy: OverridePolicy;
  defaultValue: any;
  validation?: (value: any) => boolean | string;
  dependencies?: SettingsPath[];
  description: string;
  category: string;
}

// Settings Registry - Defines all available settings and their behavior
export class SettingsRegistry {
  private static instance: SettingsRegistry;
  private settings: Map<SettingsPath, SettingDefinition> = new Map();

  private constructor() {
    this.initializeSettings();
  }

  public static getInstance(): SettingsRegistry {
    if (!SettingsRegistry.instance) {
      SettingsRegistry.instance = new SettingsRegistry();
    }
    return SettingsRegistry.instance;
  }

  private initializeSettings(): void {
    const settings: SettingDefinition[] = [
      // Localization Settings
      {
        key: 'timezone',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 'UTC',
        validation: (value) => typeof value === 'string' && value.length > 0,
        description: 'Default timezone for dates and times',
        category: 'Localization'
      },
      {
        key: 'currency',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: 'USD',
        validation: (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value),
        description: 'Default currency for financial calculations',
        category: 'Localization'
      },
      {
        key: 'dateFormat',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 'MM/DD/YYYY',
        validation: (value) => ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(value),
        description: 'Format for displaying dates',
        category: 'Localization'
      },
      {
        key: 'timeFormat',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: '12h',
        validation: (value) => ['12h', '24h'].includes(value),
        description: 'Format for displaying times',
        category: 'Localization'
      },
      {
        key: 'language',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 'en',
        validation: (value) => typeof value === 'string' && value.length >= 2,
        description: 'Interface language',
        category: 'Localization'
      },

      // Working Hours Settings
      {
        key: 'workingHours.start',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: '08:00',
        validation: (value) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
        description: 'Default start time for working hours',
        category: 'Working Hours'
      },
      {
        key: 'workingHours.end',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: '17:00',
        validation: (value) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
        description: 'Default end time for working hours',
        category: 'Working Hours'
      },
      {
        key: 'workingHours.days',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: [1, 2, 3, 4, 5],
        validation: (value) => Array.isArray(value) && value.every(d => d >= 0 && d <= 6),
        description: 'Working days of the week (0=Sunday, 6=Saturday)',
        category: 'Working Hours'
      },

      // Job Settings
      {
        key: 'defaultJobDuration',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: 240,
        validation: (value) => typeof value === 'number' && value >= 30 && value <= 960,
        description: 'Default duration for installations in minutes',
        category: 'Job Settings'
      },
      {
        key: 'travelTimeBuffer',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: 30,
        validation: (value) => typeof value === 'number' && value >= 0 && value <= 120,
        description: 'Buffer time for travel between jobs in minutes',
        category: 'Job Settings'
      },
      {
        key: 'maxJobsPerTeamMember',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: 8,
        validation: (value) => typeof value === 'number' && value >= 1 && value <= 20,
        description: 'Maximum jobs per team member per day',
        category: 'Job Settings'
      },

      // Automation Settings
      {
        key: 'autoAssignments',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable automatic assignment of installations to team members',
        category: 'Automation'
      },
      {
        key: 'enableOptimization',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable route and schedule optimization',
        category: 'Automation'
      },
      {
        key: 'optimizationGoal',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: 'travel_distance',
        validation: (value) => ['travel_distance', 'workload_balance', 'deadline_priority'].includes(value),
        dependencies: ['enableOptimization'],
        description: 'Primary goal for optimization algorithms',
        category: 'Automation'
      },
      {
        key: 'requireApprovalForChanges',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.ENFORCE,
        defaultValue: false,
        validation: (value) => typeof value === 'boolean',
        description: 'Require approval for schedule changes',
        category: 'Automation'
      },
      {
        key: 'allowOvertimeAssignment',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.ENFORCE,
        defaultValue: false,
        validation: (value) => typeof value === 'boolean',
        description: 'Allow assignments that exceed normal working hours',
        category: 'Automation'
      },

      // Integration Settings
      {
        key: 'weatherIntegration',
        level: [SettingsLevel.ORGANIZATION],
        overridePolicy: OverridePolicy.INHERIT,
        defaultValue: false,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable weather integration for scheduling',
        category: 'Integration'
      },
      {
        key: 'trafficIntegration',
        level: [SettingsLevel.ORGANIZATION],
        overridePolicy: OverridePolicy.INHERIT,
        defaultValue: false,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable traffic integration for travel time estimation',
        category: 'Integration'
      },

      // Customer Settings
      {
        key: 'customerPreferenceWeighting',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT],
        overridePolicy: OverridePolicy.SUGGEST,
        defaultValue: 70,
        validation: (value) => typeof value === 'number' && value >= 0 && value <= 100,
        description: 'Weight given to customer preferences in scheduling (0-100%)',
        category: 'Customer'
      },

      // Security and Compliance Settings
      {
        key: 'retentionDays',
        level: [SettingsLevel.ORGANIZATION],
        overridePolicy: OverridePolicy.ENFORCE,
        defaultValue: 365,
        validation: (value) => typeof value === 'number' && value >= 1,
        description: 'Data retention period in days',
        category: 'Security'
      },
      {
        key: 'auditLogging',
        level: [SettingsLevel.ORGANIZATION],
        overridePolicy: OverridePolicy.ENFORCE,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable audit logging for all activities',
        category: 'Security'
      },
      {
        key: 'encryptSensitiveData',
        level: [SettingsLevel.ORGANIZATION],
        overridePolicy: OverridePolicy.ENFORCE,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Encrypt sensitive data at rest',
        category: 'Security'
      },

      // User Interface Settings
      {
        key: 'theme',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 'auto',
        validation: (value) => ['light', 'dark', 'auto'].includes(value),
        description: 'Interface theme preference',
        category: 'Interface'
      },
      {
        key: 'preferences.defaultView',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 'calendar',
        validation: (value) => ['calendar', 'list', 'map'].includes(value),
        description: 'Default view for installations',
        category: 'Interface'
      },
      {
        key: 'preferences.itemsPerPage',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 25,
        validation: (value) => typeof value === 'number' && [10, 25, 50, 100].includes(value),
        description: 'Number of items to show per page',
        category: 'Interface'
      },
      {
        key: 'preferences.showAvatars',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Show user avatars in the interface',
        category: 'Interface'
      },
      {
        key: 'preferences.enableSounds',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable notification sounds',
        category: 'Interface'
      },
      {
        key: 'preferences.autoRefresh',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Auto-refresh data in the interface',
        category: 'Interface'
      },
      {
        key: 'preferences.refreshInterval',
        level: [SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: 300,
        validation: (value) => typeof value === 'number' && value >= 30 && value <= 3600,
        dependencies: ['preferences.autoRefresh'],
        description: 'Auto-refresh interval in seconds',
        category: 'Interface'
      },

      // Notification Settings
      {
        key: 'notifications.emailNotifications.enabled',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable email notifications',
        category: 'Notifications'
      },
      {
        key: 'notifications.emailNotifications.scheduleChanges',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        dependencies: ['notifications.emailNotifications.enabled'],
        description: 'Email notifications for schedule changes',
        category: 'Notifications'
      },
      {
        key: 'notifications.emailNotifications.newAssignments',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        dependencies: ['notifications.emailNotifications.enabled'],
        description: 'Email notifications for new assignments',
        category: 'Notifications'
      },
      {
        key: 'notifications.emailNotifications.deadlineReminders',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        dependencies: ['notifications.emailNotifications.enabled'],
        description: 'Email notifications for upcoming deadlines',
        category: 'Notifications'
      },
      {
        key: 'notifications.smsNotifications.enabled',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: false,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable SMS notifications',
        category: 'Notifications'
      },
      {
        key: 'notifications.pushNotifications.enabled',
        level: [SettingsLevel.ORGANIZATION, SettingsLevel.USER],
        overridePolicy: OverridePolicy.ALLOW,
        defaultValue: true,
        validation: (value) => typeof value === 'boolean',
        description: 'Enable push notifications',
        category: 'Notifications'
      }
    ];

    // Register all settings
    settings.forEach(setting => {
      this.settings.set(setting.key, setting);
    });
  }

  public getSettingDefinition(key: SettingsPath): SettingDefinition | undefined {
    return this.settings.get(key);
  }

  public getAllSettings(): SettingDefinition[] {
    return Array.from(this.settings.values());
  }

  public getSettingsByCategory(category: string): SettingDefinition[] {
    return Array.from(this.settings.values()).filter(s => s.category === category);
  }

  public getSettingsByLevel(level: SettingsLevel): SettingDefinition[] {
    return Array.from(this.settings.values()).filter(s => s.level.includes(level));
  }

  public validateSetting(key: SettingsPath, value: any): boolean | string {
    const setting = this.getSettingDefinition(key);
    if (!setting) {
      return `Unknown setting: ${key}`;
    }

    if (setting.validation) {
      return setting.validation(value);
    }

    return true;
  }
}

// Settings Context - Manages the current resolved settings
export interface SettingsContext {
  organizationSettings?: OrganizationSettings;
  projectSettings?: ProjectSettings;
  userSettings?: UserSettings;
}

// Hierarchical Settings Manager
export class SettingsManager {
  private registry: SettingsRegistry;
  private context: SettingsContext;

  constructor(context: SettingsContext = {}) {
    this.registry = SettingsRegistry.getInstance();
    this.context = context;
  }

  // Update context
  public updateContext(context: Partial<SettingsContext>): void {
    this.context = { ...this.context, ...context };
  }

  // Get resolved value for a setting
  public getValue<T = any>(key: SettingsPath): T {
    const setting = this.registry.getSettingDefinition(key);
    if (!setting) {
      throw new Error(`Unknown setting: ${key}`);
    }

    // Start with default value
    let value = setting.defaultValue;

    // Apply hierarchy based on override policy and available levels
    const levels = [
      { level: SettingsLevel.ORGANIZATION, settings: this.context.organizationSettings },
      { level: SettingsLevel.PROJECT, settings: this.context.projectSettings },
      { level: SettingsLevel.USER, settings: this.context.userSettings }
    ];

    for (const { level, settings } of levels) {
      if (!setting.level.includes(level) || !settings) continue;

      const levelValue = this.getValueFromSettings(key, settings);
      if (levelValue !== undefined) {
        switch (setting.overridePolicy) {
          case OverridePolicy.ALLOW:
          case OverridePolicy.SUGGEST:
            value = levelValue;
            break;
          case OverridePolicy.INHERIT:
          case OverridePolicy.ENFORCE:
            if (level === SettingsLevel.ORGANIZATION) {
              value = levelValue;
            }
            break;
        }
      }
    }

    return value;
  }

  // Check if a setting can be overridden at a specific level
  public canOverrideAtLevel(key: SettingsPath, level: SettingsLevel): boolean {
    const setting = this.registry.getSettingDefinition(key);
    if (!setting || !setting.level.includes(level)) {
      return false;
    }

    switch (setting.overridePolicy) {
      case OverridePolicy.ALLOW:
      case OverridePolicy.SUGGEST:
        return true;
      case OverridePolicy.INHERIT:
        return level === SettingsLevel.ORGANIZATION;
      case OverridePolicy.ENFORCE:
        return level === SettingsLevel.ORGANIZATION;
      default:
        return false;
    }
  }

  // Get effective settings for a level (with inheritance)
  public getEffectiveSettings(level: SettingsLevel): Record<string, any> {
    const result: Record<string, any> = {};
    const relevantSettings = this.registry.getSettingsByLevel(level);

    for (const setting of relevantSettings) {
      result[setting.key] = this.getValue(setting.key);
    }

    return result;
  }

  // Validate a setting value
  public validateValue(key: SettingsPath, value: any): boolean | string {
    return this.registry.validateSetting(key, value);
  }

  // Get setting definition
  public getDefinition(key: SettingsPath): SettingDefinition | undefined {
    return this.registry.getSettingDefinition(key);
  }

  // Get all available categories
  public getCategories(): string[] {
    const categories = new Set<string>();
    this.registry.getAllSettings().forEach(s => categories.add(s.category));
    return Array.from(categories).sort();
  }

  // Get settings override status
  public getOverrideStatus(key: SettingsPath): {
    isOverridden: boolean;
    overriddenAt: SettingsLevel | null;
    canOverride: Record<SettingsLevel, boolean>;
    inheritedValue: any;
    currentValue: any;
  } {
    const setting = this.registry.getSettingDefinition(key);
    if (!setting) {
      throw new Error(`Unknown setting: ${key}`);
    }

    const levels = [SettingsLevel.ORGANIZATION, SettingsLevel.PROJECT, SettingsLevel.USER];
    let overriddenAt: SettingsLevel | null = null;
    let inheritedValue = setting.defaultValue;
    const currentValue = this.getValue(key);

    // Find where the setting is overridden
    for (const level of levels) {
      if (!setting.level.includes(level)) continue;

      const levelSettings = this.getLevelSettings(level);
      if (levelSettings && this.getValueFromSettings(key, levelSettings) !== undefined) {
        overriddenAt = level;
      }
    }

    // Check what can be overridden
    const canOverride = {
      [SettingsLevel.ORGANIZATION]: this.canOverrideAtLevel(key, SettingsLevel.ORGANIZATION),
      [SettingsLevel.PROJECT]: this.canOverrideAtLevel(key, SettingsLevel.PROJECT),
      [SettingsLevel.USER]: this.canOverrideAtLevel(key, SettingsLevel.USER)
    };

    return {
      isOverridden: overriddenAt !== null,
      overriddenAt,
      canOverride,
      inheritedValue,
      currentValue
    };
  }

  // Helper: Get value from nested settings object
  private getValueFromSettings(key: SettingsPath, settings: any): any {
    const path = key.split('.');
    let value = settings;

    for (const segment of path) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // Helper: Get settings object for a level
  private getLevelSettings(level: SettingsLevel): any {
    switch (level) {
      case SettingsLevel.ORGANIZATION:
        return this.context.organizationSettings;
      case SettingsLevel.PROJECT:
        return this.context.projectSettings;
      case SettingsLevel.USER:
        return this.context.userSettings;
      default:
        return null;
    }
  }
}

// Settings Service - High-level interface for components
export class SettingsService {
  private manager: SettingsManager;

  constructor() {
    this.manager = new SettingsManager();
  }

  // Initialize with context
  public initialize(context: SettingsContext): void {
    this.manager.updateContext(context);
  }

  // Update context
  public updateContext(context: Partial<SettingsContext>): void {
    this.manager.updateContext(context);
  }

  // Get setting value
  public get<T = any>(key: SettingsPath): T {
    return this.manager.getValue<T>(key);
  }

  // Get multiple settings
  public getMultiple(keys: SettingsPath[]): Record<string, any> {
    const result: Record<string, any> = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  // Get settings by category
  public getByCategory(category: string): Record<string, any> {
    const settings = this.manager.getCategories().includes(category) 
      ? this.manager.registry.getSettingsByCategory(category)
      : [];
    
    const result: Record<string, any> = {};
    settings.forEach(setting => {
      result[setting.key] = this.get(setting.key);
    });
    return result;
  }

  // Check if user can modify a setting
  public canModify(key: SettingsPath, level: SettingsLevel): boolean {
    return this.manager.canOverrideAtLevel(key, level);
  }

  // Get all categories
  public getCategories(): string[] {
    return this.manager.getCategories();
  }

  // Validate setting
  public validate(key: SettingsPath, value: any): boolean | string {
    return this.manager.validateValue(key, value);
  }

  // Get setting metadata
  public getMetadata(key: SettingsPath) {
    const definition = this.manager.getDefinition(key);
    if (!definition) return null;

    const overrideStatus = this.manager.getOverrideStatus(key);

    return {
      definition,
      ...overrideStatus
    };
  }

  // Export resolved settings
  public exportSettings(level?: SettingsLevel): Record<string, any> {
    if (level) {
      return this.manager.getEffectiveSettings(level);
    }

    // Export all settings
    const allSettings = this.manager.registry.getAllSettings();
    const result: Record<string, any> = {};
    
    allSettings.forEach(setting => {
      result[setting.key] = this.get(setting.key);
    });

    return result;
  }
}

// Global settings service instance
export const settingsService = new SettingsService();

// React Hook for using settings
import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationProvider';
import { useProject } from '../contexts/ProjectProvider';

export function useSettings() {
  const { organization, userRole } = useOrganization();
  const { project } = useProject();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (organization) {
      const context: SettingsContext = {
        organizationSettings: organization.settings,
        projectSettings: project?.settings,
        userSettings: undefined // Would be loaded from user context
      };

      settingsService.updateContext(context);
      setIsInitialized(true);
    }
  }, [organization, project]);

  return {
    get: settingsService.get.bind(settingsService),
    getMultiple: settingsService.getMultiple.bind(settingsService),
    getByCategory: settingsService.getByCategory.bind(settingsService),
    canModify: settingsService.canModify.bind(settingsService),
    getCategories: settingsService.getCategories.bind(settingsService),
    validate: settingsService.validate.bind(settingsService),
    getMetadata: settingsService.getMetadata.bind(settingsService),
    exportSettings: settingsService.exportSettings.bind(settingsService),
    isInitialized
  };
}

export default {
  SettingsRegistry,
  SettingsManager,
  SettingsService,
  settingsService,
  SettingsLevel,
  OverridePolicy
};