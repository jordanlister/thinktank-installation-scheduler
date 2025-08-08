// Think Tank Technologies - System Configuration Panel

import React from 'react';
import {
  Sliders,
  Clock,
  Users,
  MapPin,
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Car,
  Cloud,
  Target
} from 'lucide-react';
import { useAppStore, useSystemConfig } from '../../stores/useAppStore';
import type { SystemConfig } from '../../types';

interface SystemConfigPanelProps {
  onChanged: () => void;
}

const SystemConfigPanel: React.FC<SystemConfigPanelProps> = ({ onChanged }) => {
  const systemConfig = useSystemConfig();
  const { updateSystemConfig } = useAppStore();

  const handleUpdateConfig = (field: keyof SystemConfig, value: any) => {
    updateSystemConfig({ [field]: value });
    onChanged();
  };

  const handleWorkingHoursChange = (field: 'start' | 'end', value: string) => {
    handleUpdateConfig('workingHours', {
      ...systemConfig.workingHours,
      [field]: value
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-primary-900 mb-6 flex items-center space-x-2">
          <Sliders className="h-5 w-5" />
          <span>System Configuration</span>
        </h2>
        <p className="text-primary-600 mb-8">
          Configure system-wide settings that affect all users and scheduling operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Working Hours & Scheduling */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Working Hours & Time Management</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Work Day Start
                  </label>
                  <input
                    type="time"
                    value={systemConfig.workingHours.start}
                    onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Work Day End
                  </label>
                  <input
                    type="time"
                    value={systemConfig.workingHours.end}
                    onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Default Job Duration (minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={systemConfig.defaultJobDuration}
                    onChange={(e) => handleUpdateConfig('defaultJobDuration', parseInt(e.target.value))}
                    className="form-input w-full pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-primary-500 text-sm">
                      {Math.floor(systemConfig.defaultJobDuration / 60)}h {systemConfig.defaultJobDuration % 60}m
                    </span>
                  </div>
                </div>
                <p className="text-xs text-primary-500 mt-1">
                  Standard time allocated for new installations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Travel Time Buffer (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  value={systemConfig.travelTimeBuffer}
                  onChange={(e) => handleUpdateConfig('travelTimeBuffer', parseInt(e.target.value))}
                  className="form-input w-full"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Extra time added between jobs for travel
                </p>
              </div>
            </div>
          </div>

          {/* Capacity Limits */}
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Capacity Management</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Maximum Jobs Per Day (System-wide)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={systemConfig.maxJobsPerDay}
                  onChange={(e) => handleUpdateConfig('maxJobsPerDay', parseInt(e.target.value))}
                  className="form-input w-full"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Total daily capacity across all team members
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Maximum Jobs Per Team Member
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={systemConfig.maxJobsPerTeamMember}
                  onChange={(e) => handleUpdateConfig('maxJobsPerTeamMember', parseInt(e.target.value))}
                  className="form-input w-full"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Individual daily job limit per technician
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={systemConfig.allowOvertimeAssignment}
                    onChange={(e) => handleUpdateConfig('allowOvertimeAssignment', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600"
                  />
                  <span className="text-sm font-medium text-primary-700">Allow overtime assignments</span>
                </label>
                <p className="text-xs text-primary-500 ml-6">
                  Permit job assignments beyond regular working hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Automation & Optimization */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Automation & Optimization</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={systemConfig.autoAssignments}
                    onChange={(e) => handleUpdateConfig('autoAssignments', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600"
                  />
                  <span className="text-sm font-medium text-primary-700">Enable automatic assignments</span>
                </label>
                <p className="text-xs text-primary-500 ml-6">
                  Automatically assign jobs to available team members
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={systemConfig.enableOptimization}
                    onChange={(e) => handleUpdateConfig('enableOptimization', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600"
                  />
                  <span className="text-sm font-medium text-primary-700">Enable route optimization</span>
                </label>
                <p className="text-xs text-primary-500 ml-6">
                  Optimize routes for minimal travel time and distance
                </p>
              </div>

              {systemConfig.enableOptimization && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Optimization Priority
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'travel_distance', label: 'Minimize travel distance', icon: MapPin },
                      { value: 'workload_balance', label: 'Balance team workload', icon: Users },
                      { value: 'deadline_priority', label: 'Prioritize urgent deadlines', icon: AlertTriangle }
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="optimizationGoal"
                          value={value}
                          checked={systemConfig.optimizationGoal === value}
                          onChange={(e) => handleUpdateConfig('optimizationGoal', e.target.value as 'travel_distance' | 'workload_balance' | 'deadline_priority')}
                          className="form-radio text-accent-600"
                        />
                        <Icon className="h-4 w-4 text-primary-400" />
                        <span className="text-sm text-primary-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Customer Preference Weighting (%)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={systemConfig.customerPreferenceWeighting}
                    onChange={(e) => handleUpdateConfig('customerPreferenceWeighting', parseInt(e.target.value))}
                    className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-primary-500 mt-1">
                    <span>0%</span>
                    <span className="font-medium text-accent-600">{systemConfig.customerPreferenceWeighting}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-xs text-primary-500 mt-1">
                  How much to prioritize customer time preferences in scheduling
                </p>
              </div>
            </div>
          </div>

          {/* Quality & Safety */}
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Quality & Safety</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={systemConfig.backupTechnicianRequired}
                    onChange={(e) => handleUpdateConfig('backupTechnicianRequired', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600"
                  />
                  <span className="text-sm font-medium text-primary-700">Require backup technician assignment</span>
                </label>
                <p className="text-xs text-primary-500 ml-6">
                  Ensure a backup technician is always designated for each job
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={systemConfig.requireApprovalForChanges}
                    onChange={(e) => handleUpdateConfig('requireApprovalForChanges', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600"
                  />
                  <span className="text-sm font-medium text-primary-700">Require approval for schedule changes</span>
                </label>
                <p className="text-xs text-primary-500 ml-6">
                  Manager approval required for significant schedule modifications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Integrations */}
      <div className="border-t border-primary-200 pt-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>External Integrations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={systemConfig.weatherIntegration}
                  onChange={(e) => handleUpdateConfig('weatherIntegration', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-accent-600"
                />
                <span className="text-sm font-medium text-primary-700 flex items-center space-x-1">
                  <Cloud className="h-4 w-4" />
                  <span>Enable weather integration</span>
                </span>
              </label>
              <p className="text-xs text-primary-500 ml-6">
                Consider weather conditions when scheduling outdoor installations
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={systemConfig.trafficIntegration}
                  onChange={(e) => handleUpdateConfig('trafficIntegration', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-accent-600"
                />
                <span className="text-sm font-medium text-primary-700 flex items-center space-x-1">
                  <Car className="h-4 w-4" />
                  <span>Enable traffic integration</span>
                </span>
              </label>
              <p className="text-xs text-primary-500 ml-6">
                Use real-time traffic data for travel time calculations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="border-t border-primary-200 pt-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
          <Target className="h-4 w-4" />
          <span>Current Configuration Summary</span>
        </h3>

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-primary-700">Working Hours:</span>
              <div className="text-primary-600">
                {systemConfig.workingHours.start} - {systemConfig.workingHours.end}
              </div>
            </div>
            <div>
              <span className="font-medium text-primary-700">Default Job Duration:</span>
              <div className="text-primary-600">
                {Math.floor(systemConfig.defaultJobDuration / 60)}h {systemConfig.defaultJobDuration % 60}m
              </div>
            </div>
            <div>
              <span className="font-medium text-primary-700">Daily Capacity:</span>
              <div className="text-primary-600">
                {systemConfig.maxJobsPerDay} jobs total, {systemConfig.maxJobsPerTeamMember} per technician
              </div>
            </div>
            <div>
              <span className="font-medium text-primary-700">Automation:</span>
              <div className="text-primary-600">
                {systemConfig.autoAssignments ? 'Auto-assign enabled' : 'Manual assignment'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPanel;