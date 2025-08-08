// Think Tank Technologies - User Preferences Panel

import React from 'react';
import {
  User,
  Palette,
  Globe,
  Calendar,
  Clock,
  Eye,
  Volume2,
  RefreshCw,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { useAppStore, useUserPreferences } from '../../stores/useAppStore';
import type { UserPreferences } from '../../types';

interface UserPreferencesPanelProps {
  onChanged: () => void;
}

const UserPreferencesPanel: React.FC<UserPreferencesPanelProps> = ({ onChanged }) => {
  const userPreferences = useUserPreferences();
  const { updateUserPreferences } = useAppStore();

  const handleUpdatePreference = (field: keyof UserPreferences, value: any) => {
    updateUserPreferences({ [field]: value });
    onChanged();
  };

  const timezones = Intl.supportedValuesOf('timeZone').slice(0, 20); // Show first 20 common timezones
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-primary-900 mb-6 flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>User Preferences</span>
        </h2>
        <p className="text-primary-600 mb-8">
          Customize your personal experience with the Think Tank Technologies Installation Scheduler.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Theme Settings */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'auto', label: 'Auto', icon: Monitor }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleUpdatePreference('theme', value as 'light' | 'dark' | 'auto')}
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-colors ${
                        userPreferences.theme === value
                          ? 'border-accent-500 bg-accent-50 text-accent-700'
                          : 'border-primary-200 bg-white text-primary-600 hover:border-primary-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userPreferences.showAvatars}
                    onChange={(e) => handleUpdatePreference('showAvatars', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600"
                  />
                  <span className="text-sm text-primary-700">Show user avatars</span>
                </label>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Display</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Default View
                </label>
                <select
                  value={userPreferences.defaultView}
                  onChange={(e) => handleUpdatePreference('defaultView', e.target.value as 'calendar' | 'list' | 'map')}
                  className="form-input w-full"
                >
                  <option value="calendar">Calendar View</option>
                  <option value="list">List View</option>
                  <option value="map">Map View</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Items Per Page
                </label>
                <select
                  value={userPreferences.itemsPerPage}
                  onChange={(e) => handleUpdatePreference('itemsPerPage', parseInt(e.target.value))}
                  className="form-input w-full"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Localization Settings */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Localization</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Language
                </label>
                <select
                  value={userPreferences.language}
                  onChange={(e) => handleUpdatePreference('language', e.target.value)}
                  className="form-input w-full"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Timezone
                </label>
                <select
                  value={userPreferences.timezone}
                  onChange={(e) => handleUpdatePreference('timezone', e.target.value)}
                  className="form-input w-full"
                >
                  {timezones.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone} ({Intl.DateTimeFormat('en', { timeZone: timezone, timeZoneName: 'short' }).formatToParts().find(part => part.type === 'timeZoneName')?.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date and Time Format */}
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Date & Time Format</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Date Format
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dateFormat"
                        value={value}
                        checked={userPreferences.dateFormat === value}
                        onChange={(e) => handleUpdatePreference('dateFormat', e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD')}
                        className="form-radio text-accent-600"
                      />
                      <span className="text-sm text-primary-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Time Format
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: '12h', label: '12-hour (2:30 PM)' },
                    { value: '24h', label: '24-hour (14:30)' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="timeFormat"
                        value={value}
                        checked={userPreferences.timeFormat === value}
                        onChange={(e) => handleUpdatePreference('timeFormat', e.target.value as '12h' | '24h')}
                        className="form-radio text-accent-600"
                      />
                      <span className="text-sm text-primary-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Behavior */}
      <div className="border-t border-primary-200 pt-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>System Behavior</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={userPreferences.autoRefresh}
                  onChange={(e) => handleUpdatePreference('autoRefresh', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-accent-600"
                />
                <span className="text-sm font-medium text-primary-700">Auto-refresh data</span>
              </label>
              <p className="text-xs text-primary-500 ml-6">
                Automatically refresh data every few minutes
              </p>
            </div>

            {userPreferences.autoRefresh && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Refresh Interval
                </label>
                <select
                  value={userPreferences.refreshInterval}
                  onChange={(e) => handleUpdatePreference('refreshInterval', parseInt(e.target.value))}
                  className="form-input w-full"
                >
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={900}>15 minutes</option>
                  <option value={1800}>30 minutes</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={userPreferences.enableSounds}
                  onChange={(e) => handleUpdatePreference('enableSounds', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-accent-600"
                />
                <span className="text-sm font-medium text-primary-700 flex items-center space-x-1">
                  <Volume2 className="h-4 w-4" />
                  <span>Enable sound notifications</span>
                </span>
              </label>
              <p className="text-xs text-primary-500 ml-6">
                Play sounds for important notifications and alerts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesPanel;