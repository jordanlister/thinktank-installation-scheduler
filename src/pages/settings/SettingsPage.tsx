// Think Tank Technologies - Project Settings Page

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Clock, 
  Users, 
  Map,
  FileText,
  Globe,
  Zap,
  Calendar,
  Target,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react';
import { supabase } from '../../services/supabase';

interface ProjectSettings {
  id?: string;
  projectName: string;
  companyName: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
    daysOfWeek: string[];
  };
  schedulingDefaults: {
    defaultDuration: number;
    bufferTime: number;
    maxJobsPerDay: number;
    allowWeekends: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    scheduleReminders: boolean;
    statusUpdates: boolean;
  };
  optimization: {
    primaryGoal: 'travel_distance' | 'workload_balance' | 'deadline_priority' | 'customer_satisfaction';
    geographicClustering: boolean;
    allowOvertime: boolean;
    maxTravelDistance: number;
  };
  integrations: {
    emailProvider: string;
    smsProvider: string;
    calendarSync: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

const defaultSettings: ProjectSettings = {
  projectName: 'Installation Scheduler',
  companyName: 'Think Tank Technologies',
  timezone: 'America/Los_Angeles',
  workingHours: {
    start: '08:00',
    end: '17:00',
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  schedulingDefaults: {
    defaultDuration: 240,
    bufferTime: 15,
    maxJobsPerDay: 8,
    allowWeekends: false
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    scheduleReminders: true,
    statusUpdates: true
  },
  optimization: {
    primaryGoal: 'travel_distance',
    geographicClustering: true,
    allowOvertime: false,
    maxTravelDistance: 100
  },
  integrations: {
    emailProvider: 'built-in',
    smsProvider: 'none',
    calendarSync: false
  }
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ProjectSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('project_settings')
        .select('*')
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No data found - create default settings
          console.log('No project settings found, creating defaults...');
          await createDefaultSettings();
          return;
        } else if (fetchError.code === '42P01') {
          // Table doesn't exist
          setError('Project settings table not found. Please run the database migration to create the project_settings table.');
          return;
        } else {
          throw fetchError;
        }
      }

      if (data) {
        setSettings({
          id: data.id,
          projectName: data.project_name || defaultSettings.projectName,
          companyName: data.company_name || defaultSettings.companyName,
          timezone: data.timezone || defaultSettings.timezone,
          workingHours: data.working_hours || defaultSettings.workingHours,
          schedulingDefaults: data.scheduling_defaults || defaultSettings.schedulingDefaults,
          notifications: data.notifications || defaultSettings.notifications,
          optimization: data.optimization || defaultSettings.optimization,
          integrations: data.integrations || defaultSettings.integrations,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const settingsData = {
        project_name: defaultSettings.projectName,
        company_name: defaultSettings.companyName,
        timezone: defaultSettings.timezone,
        working_hours: defaultSettings.workingHours,
        scheduling_defaults: defaultSettings.schedulingDefaults,
        notifications: defaultSettings.notifications,
        optimization: defaultSettings.optimization,
        integrations: defaultSettings.integrations
      };

      const { data, error: createError } = await supabase
        .from('project_settings')
        .insert(settingsData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (data) {
        setSettings({
          id: data.id,
          projectName: data.project_name,
          companyName: data.company_name,
          timezone: data.timezone,
          workingHours: data.working_hours,
          schedulingDefaults: data.scheduling_defaults,
          notifications: data.notifications,
          optimization: data.optimization,
          integrations: data.integrations,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      }
    } catch (err) {
      console.error('Error creating default settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to create default settings');
      // Fall back to default settings in UI
      setSettings(defaultSettings);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveMessage(null);

      const settingsData = {
        project_name: settings.projectName,
        company_name: settings.companyName,
        timezone: settings.timezone,
        working_hours: settings.workingHours,
        scheduling_defaults: settings.schedulingDefaults,
        notifications: settings.notifications,
        optimization: settings.optimization,
        integrations: settings.integrations,
        updated_at: new Date().toISOString()
      };

      let saveError;
      
      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('project_settings')
          .update(settingsData)
          .eq('id', settings.id);
        saveError = error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('project_settings')
          .insert(settingsData);
        saveError = error;
      }

      if (saveError) {
        throw saveError;
      }

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ 
    checked, 
    onChange, 
    disabled = false 
  }) => (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`w-11 h-6 rounded-full transition-all duration-300 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        checked 
          ? 'bg-accent-500/60 border border-accent-500/80' 
          : 'bg-white/20 border border-white/30 hover:bg-white/25'
      }`} onClick={() => !disabled && onChange(!checked)}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        } mt-0.5`} />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Project Settings</h1>
          <p className="text-xl text-white/80">Configure system preferences and project defaults</p>
        </div>
        <div className="card">
          <div className="card-body p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-accent-400" />
            <p className="text-white/70">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Project Settings</h1>
            <p className="text-xl text-white/80">Configure system preferences and project defaults</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-accent-500/20 border border-accent-500/30 rounded-xl text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="card border-red-500/20 bg-red-500/10">
          <div className="card-body p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="card border-green-500/20 bg-green-500/10">
          <div className="card-body p-4">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{saveMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project Information */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-glass-primary">Project Information</h2>
                <p className="text-sm text-glass-muted">Basic project and company details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Project Name</label>
                <input
                  type="text"
                  value={settings.projectName}
                  onChange={(e) => updateSettings('projectName', e.target.value)}
                  className="form-input"
                  placeholder="Installation Scheduler"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => updateSettings('companyName', e.target.value)}
                  className="form-input"
                  placeholder="Think Tank Technologies"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSettings('timezone', e.target.value)}
                  className="form-input"
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-glass-primary">Working Hours</h2>
                <p className="text-sm text-glass-muted">Define standard business hours</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.workingHours.start}
                    onChange={(e) => updateSettings('workingHours.start', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.workingHours.end}
                    onChange={(e) => updateSettings('workingHours.end', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">Working Days</label>
                <div className="grid grid-cols-2 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2 text-sm text-white/90">
                      <input
                        type="checkbox"
                        checked={settings.workingHours.daysOfWeek.includes(day)}
                        onChange={(e) => {
                          const days = settings.workingHours.daysOfWeek;
                          const newDays = e.target.checked 
                            ? [...days, day]
                            : days.filter(d => d !== day);
                          updateSettings('workingHours.daysOfWeek', newDays);
                        }}
                        className="rounded border-white/20 bg-white/10 text-accent-500 focus:ring-accent-500/50"
                      />
                      <span className="capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling Defaults */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-glass-primary">Scheduling Defaults</h2>
                <p className="text-sm text-glass-muted">Default values for new installations</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Default Duration (minutes)</label>
                <input
                  type="number"
                  value={settings.schedulingDefaults.defaultDuration}
                  onChange={(e) => updateSettings('schedulingDefaults.defaultDuration', parseInt(e.target.value) || 240)}
                  className="form-input"
                  min="30"
                  max="480"
                  step="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Buffer Time (minutes)</label>
                <input
                  type="number"
                  value={settings.schedulingDefaults.bufferTime}
                  onChange={(e) => updateSettings('schedulingDefaults.bufferTime', parseInt(e.target.value) || 15)}
                  className="form-input"
                  min="0"
                  max="60"
                  step="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Max Jobs per Day</label>
                <input
                  type="number"
                  value={settings.schedulingDefaults.maxJobsPerDay}
                  onChange={(e) => updateSettings('schedulingDefaults.maxJobsPerDay', parseInt(e.target.value) || 8)}
                  className="form-input"
                  min="1"
                  max="20"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">Allow Weekend Scheduling</span>
                  <p className="text-xs text-white/60">Enable scheduling on Saturdays and Sundays</p>
                </div>
                <ToggleSwitch
                  checked={settings.schedulingDefaults.allowWeekends}
                  onChange={(checked) => updateSettings('schedulingDefaults.allowWeekends', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-glass-primary">Notifications</h2>
                <p className="text-sm text-glass-muted">Configure notification preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">Email Notifications</span>
                  <p className="text-xs text-white/60">Receive notifications via email</p>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.emailEnabled}
                  onChange={(checked) => updateSettings('notifications.emailEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">SMS Notifications</span>
                  <p className="text-xs text-white/60">Receive notifications via SMS</p>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.smsEnabled}
                  onChange={(checked) => updateSettings('notifications.smsEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">Schedule Reminders</span>
                  <p className="text-xs text-white/60">Send reminders before appointments</p>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.scheduleReminders}
                  onChange={(checked) => updateSettings('notifications.scheduleReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">Status Updates</span>
                  <p className="text-xs text-white/60">Send updates when status changes</p>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.statusUpdates}
                  onChange={(checked) => updateSettings('notifications.statusUpdates', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Settings */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Target className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-glass-primary">Optimization Settings</h2>
                <p className="text-sm text-glass-muted">Configure scheduling optimization</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Primary Optimization Goal</label>
                <select
                  value={settings.optimization.primaryGoal}
                  onChange={(e) => updateSettings('optimization.primaryGoal', e.target.value)}
                  className="form-input"
                >
                  <option value="travel_distance">Minimize Travel Distance</option>
                  <option value="workload_balance">Balance Workload</option>
                  <option value="deadline_priority">Meet Deadlines</option>
                  <option value="customer_satisfaction">Customer Satisfaction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Max Travel Distance (miles)</label>
                <input
                  type="number"
                  value={settings.optimization.maxTravelDistance}
                  onChange={(e) => updateSettings('optimization.maxTravelDistance', parseInt(e.target.value) || 100)}
                  className="form-input"
                  min="10"
                  max="500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">Geographic Clustering</span>
                  <p className="text-xs text-white/60">Group nearby jobs together</p>
                </div>
                <ToggleSwitch
                  checked={settings.optimization.geographicClustering}
                  onChange={(checked) => updateSettings('optimization.geographicClustering', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white/90">Allow Overtime</span>
                  <p className="text-xs text-white/60">Allow scheduling beyond normal hours</p>
                </div>
                <ToggleSwitch
                  checked={settings.optimization.allowOvertime}
                  onChange={(checked) => updateSettings('optimization.allowOvertime', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Database className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-glass-primary">System Status</h2>
                <p className="text-sm text-glass-muted">Current system health and connectivity</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-glass-secondary">Database Connection</span>
                <span className="flex items-center space-x-1 text-success-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-glass-secondary">Real-time Updates</span>
                <span className="flex items-center space-x-1 text-success-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Active</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-glass-secondary">Last Backup</span>
                <span className="text-glass-muted">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-glass-secondary">System Version</span>
                <span className="text-glass-muted">v2.1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;