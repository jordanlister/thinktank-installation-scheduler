// Think Tank Technologies Installation Scheduler - Optimization Panel

import React, { useState } from 'react';
import { X, Settings, Zap, Target, Users, Clock } from 'lucide-react';
import type { TeamMember, Installation } from '../../types';

interface ScheduleOptimizationPanelProps {
  onClose: () => void;
  onOptimize: () => void;
  teams: TeamMember[];
  installations: Installation[];
}

/**
 * Schedule Optimization Panel Component
 * 
 * Provides controls for configuring scheduling optimization parameters
 * including goals, constraints, and preferences
 */
const ScheduleOptimizationPanel: React.FC<ScheduleOptimizationPanelProps> = ({
  onClose,
  onOptimize,
  teams,
  installations
}) => {
  const [optimizationGoal, setOptimizationGoal] = useState<'travel_distance' | 'workload_balance' | 'deadline_priority' | 'customer_satisfaction'>('travel_distance');
  const [maxDailyJobs, setMaxDailyJobs] = useState(8);
  const [maxTravelDistance, setMaxTravelDistance] = useState(100);
  const [bufferTime, setBufferTime] = useState(15);
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [geographicClustering, setGeographicClustering] = useState(true);

  const handleOptimize = () => {
    onOptimize();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Optimization Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Optimization Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Primary Optimization Goal
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'travel_distance', label: 'Minimize Travel', icon: Target, desc: 'Reduce total travel distance' },
                { value: 'workload_balance', label: 'Balance Workload', icon: Users, desc: 'Distribute jobs evenly' },
                { value: 'deadline_priority', label: 'Meet Deadlines', icon: Clock, desc: 'Prioritize urgent jobs' },
                { value: 'customer_satisfaction', label: 'Customer Focus', icon: Zap, desc: 'Optimize for quality' }
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setOptimizationGoal(value as any)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    optimizationGoal === value
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className={`w-4 h-4 ${
                      optimizationGoal === value ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">{label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Scheduling Constraints</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Max Jobs per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxDailyJobs}
                  onChange={(e) => setMaxDailyJobs(parseInt(e.target.value) || 8)}
                  className="form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Max Travel Distance (miles)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={maxTravelDistance}
                  onChange={(e) => setMaxTravelDistance(parseInt(e.target.value) || 100)}
                  className="form-input w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Buffer Time Between Jobs (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={bufferTime}
                onChange={(e) => setBufferTime(parseInt(e.target.value) || 15)}
                className="form-input w-full"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Optimization Preferences</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={allowOvertime}
                  onChange={(e) => setAllowOvertime(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Allow Overtime Assignments</span>
                  <p className="text-xs text-gray-500">Team members can exceed normal capacity</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={geographicClustering}
                  onChange={(e) => setGeographicClustering(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Enable Geographic Clustering</span>
                  <p className="text-xs text-gray-500">Group nearby jobs for better routing</p>
                </div>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Optimization Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Jobs to schedule:</span>
                <span className="font-medium ml-2">{installations.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Available teams:</span>
                <span className="font-medium ml-2">{teams.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Goal:</span>
                <span className="font-medium ml-2">
                  {optimizationGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Max daily jobs:</span>
                <span className="font-medium ml-2">{maxDailyJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleOptimize}
            className="btn-primary"
          >
            <Zap className="w-4 h-4 mr-2" />
            Run Optimization
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOptimizationPanel;