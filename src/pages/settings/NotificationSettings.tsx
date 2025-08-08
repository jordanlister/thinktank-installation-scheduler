// Think Tank Technologies - Enhanced Notification Settings Panel
// Comprehensive notification management with real-time preferences

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  Volume2,
  VolumeX,
  Settings2,
  Save,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import { useNotificationService } from '../../hooks/useNotificationService';
import { useUser } from '../../stores/useAppStore';
import type { 
  NotificationPreferences, 
  AppNotificationType, 
  NotificationPriority,
  NotificationChannel,
  NotificationFrequency 
} from '../../types';

interface NotificationSettingsPanelProps {
  onChanged: () => void;
}

const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({ onChanged }) => {
  const user = useUser();
  const { preferences, fetchPreferences, updatePreferences, loading } = useNotificationService(user?.id);
  const [localSettings, setLocalSettings] = useState<Partial<NotificationPreferences> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (user?.id && !preferences) {
      fetchPreferences();
    }
  }, [user?.id, preferences, fetchPreferences]);

  // Update local settings when preferences change
  useEffect(() => {
    if (preferences) {
      setLocalSettings(preferences);
    }
  }, [preferences]);

  // Save settings
  const handleSave = async () => {
    if (!localSettings || !user?.id) return;

    try {
      setSaving(true);
      await updatePreferences(localSettings);
      setSaved(true);
      onChanged();
      
      // Clear saved indicator after 2 seconds
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update local setting
  const updateSetting = (path: string, value: any) => {
    if (!localSettings) return;

    setLocalSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current = newSettings as any;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  // Get setting value
  const getSetting = (path: string): any => {
    if (!localSettings) return undefined;
    
    const keys = path.split('.');
    let current = localSettings as any;
    
    for (const key of keys) {
      if (current?.[key] === undefined) return undefined;
      current = current[key];
    }
    
    return current;
  };

  if (loading || !localSettings) {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
        <p className="text-white/60">Loading notification settings...</p>
      </div>
    );
  }

  const notificationTypes: { type: AppNotificationType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      type: 'installation_assigned',
      label: 'New Assignments',
      description: 'When you are assigned to a new installation',
      icon: <Calendar className="h-5 w-5 text-blue-400" />
    },
    {
      type: 'schedule_changed',
      label: 'Schedule Changes',
      description: 'When your schedule is updated',
      icon: <Clock className="h-5 w-5 text-orange-400" />
    },
    {
      type: 'conflict_detected',
      label: 'Schedule Conflicts',
      description: 'When scheduling conflicts are detected',
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />
    },
    {
      type: 'team_status_changed',
      label: 'Team Updates',
      description: 'When team member status changes',
      icon: <Users className="h-5 w-5 text-green-400" />
    },
    {
      type: 'system_maintenance',
      label: 'System Alerts',
      description: 'System maintenance and important updates',
      icon: <Shield className="h-5 w-5 text-purple-400" />
    },
    {
      type: 'performance_alert',
      label: 'Performance Reports',
      description: 'Performance metrics and alerts',
      icon: <TrendingUp className="h-5 w-5 text-yellow-400" />
    },
  ];

  const priorities: { priority: NotificationPriority; label: string; color: string }[] = [
    { priority: 'low', label: 'Low', color: 'text-gray-400' },
    { priority: 'medium', label: 'Medium', color: 'text-blue-400' },
    { priority: 'high', label: 'High', color: 'text-orange-400' },
    { priority: 'urgent', label: 'Urgent', color: 'text-red-400' },
  ];

  const channels: { channel: NotificationChannel; label: string; icon: React.ReactNode; description: string }[] = [
    {
      channel: 'in_app',
      label: 'In-App',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Show notifications within the application'
    },
    {
      channel: 'email',
      label: 'Email',
      icon: <Mail className="h-5 w-5" />,
      description: 'Send notifications via email'
    },
    {
      channel: 'push',
      label: 'Push',
      icon: <Bell className="h-5 w-5" />,
      description: 'Browser push notifications'
    },
    {
      channel: 'sms',
      label: 'SMS',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Text message notifications'
    },
  ];

  const frequencies: { frequency: NotificationFrequency; label: string; description: string }[] = [
    { frequency: 'immediate', label: 'Immediate', description: 'Send notifications right away' },
    { frequency: 'daily', label: 'Daily Digest', description: 'Once per day summary' },
    { frequency: 'weekly', label: 'Weekly Digest', description: 'Once per week summary' },
    { frequency: 'never', label: 'Never', description: 'Disable all notifications' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Notification Settings</h2>
          <p className="text-white/60">Manage how and when you receive notifications</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            saved 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
          } backdrop-filter backdrop-blur-md`}
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Global Settings */}
      <div className="bg-white/5 backdrop-filter backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Settings2 className="h-5 w-5 text-blue-400" />
          <span>General Settings</span>
        </h3>

        <div className="space-y-6">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Enable Notifications</label>
              <p className="text-white/60 text-sm">Turn all notifications on or off</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={getSetting('enabled') ?? true}
                onChange={(e) => updateSetting('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <label className="text-white font-medium">Quiet Hours</label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getSetting('quietHoursEnabled') ?? false}
                  onChange={(e) => updateSetting('quietHoursEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {getSetting('quietHoursEnabled') && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <div>
                  <label className="block text-sm text-white/80 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={getSetting('quietHoursStart') ?? '22:00'}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">End Time</label>
                  <input
                    type="time"
                    value={getSetting('quietHoursEnd') ?? '07:00'}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channel Settings */}
      <div className="bg-white/5 backdrop-filter backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-400" />
          <span>Notification Channels</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => (
            <div key={channel.channel} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  {channel.icon}
                </div>
                <div>
                  <div className="text-white font-medium">{channel.label}</div>
                  <div className="text-white/60 text-sm">{channel.description}</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getSetting(`${channel.channel}Enabled`) ?? true}
                  onChange={(e) => updateSetting(`${channel.channel}Enabled`, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Email Frequency */}
        {getSetting('emailEnabled') && (
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <label className="block text-white font-medium mb-3">Email Frequency</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {frequencies.map((freq) => (
                <button
                  key={freq.frequency}
                  onClick={() => updateSetting('emailFrequency', freq.frequency)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    getSetting('emailFrequency') === freq.frequency
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium text-sm">{freq.label}</div>
                  <div className="text-xs opacity-80">{freq.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SMS Phone Number */}
        {getSetting('smsEnabled') && (
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <label className="block text-white font-medium mb-2">SMS Phone Number</label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={getSetting('smsPhone') ?? ''}
              onChange={(e) => updateSetting('smsPhone', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="bg-white/5 backdrop-filter backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Types</h3>

        <div className="space-y-4">
          {notificationTypes.map((notifType) => {
            const typeSettings = getSetting('typePreferences')?.[notifType.type] || { enabled: true, channels: ['in_app'], priority: 'medium' };
            
            return (
              <div key={notifType.type} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {notifType.icon}
                    <div>
                      <div className="text-white font-medium">{notifType.label}</div>
                      <div className="text-white/60 text-sm">{notifType.description}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeSettings.enabled ?? true}
                      onChange={(e) => updateSetting(`typePreferences.${notifType.type}.enabled`, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                {typeSettings.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    {/* Priority */}
                    <div>
                      <label className="block text-sm text-white/80 mb-2">Priority</label>
                      <select
                        value={typeSettings.priority ?? 'medium'}
                        onChange={(e) => updateSetting(`typePreferences.${notifType.type}.priority`, e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.priority} value={priority.priority} className="bg-gray-800">
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Channels */}
                    <div>
                      <label className="block text-sm text-white/80 mb-2">Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {channels.map((channel) => {
                          const isSelected = typeSettings.channels?.includes(channel.channel) ?? false;
                          return (
                            <button
                              key={channel.channel}
                              onClick={() => {
                                const currentChannels = typeSettings.channels || ['in_app'];
                                const newChannels = isSelected
                                  ? currentChannels.filter((c: string) => c !== channel.channel)
                                  : [...currentChannels, channel.channel];
                                updateSetting(`typePreferences.${notifType.type}.channels`, newChannels);
                              }}
                              className={`px-3 py-1 rounded-md text-xs transition-all ${
                                isSelected
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                              }`}
                            >
                              {channel.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Settings */}
      <div className="bg-white/5 backdrop-filter backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          <span>Priority Settings</span>
        </h3>
        <p className="text-white/60 text-sm mb-4">Configure how different priority levels are handled</p>

        <div className="space-y-4">
          {priorities.map((priority) => {
            const prioritySettings = getSetting('prioritySettings')?.[priority.priority] || { enabled: true, channels: ['in_app'] };
            
            return (
              <div key={priority.priority} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-current ${priority.color}`}></div>
                  <span className="text-white font-medium">{priority.label} Priority</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prioritySettings.enabled ?? true}
                    onChange={(e) => updateSetting(`prioritySettings.${priority.priority}.enabled`, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPanel;