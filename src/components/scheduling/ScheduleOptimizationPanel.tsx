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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-glass rounded-xl shadow-xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto backdrop-filter backdrop-blur-md custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-accent-500/30 to-accent-600/20 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-accent-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Optimization Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Optimization Goal */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Primary Optimization Goal
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'travel_distance', label: 'Reduce Travel', icon: Target, desc: 'Reduce total travel distance' },
                { value: 'workload_balance', label: 'Distribute Jobs', icon: Users, desc: 'Distribute jobs evenly' },
                { value: 'deadline_priority', label: 'Meet Deadlines', icon: Clock, desc: 'Prioritize urgent jobs' },
                { value: 'customer_satisfaction', label: 'Optimize Quality', icon: Zap, desc: 'Optimize for quality' }
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setOptimizationGoal(value as any)}
                  className={`p-4 border rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                    optimizationGoal === value
                      ? 'border-accent-500/50 bg-accent-500/20 text-accent-100 shadow-lg shadow-accent-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10 text-white/90'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className={`w-4 h-4 ${
                      optimizationGoal === value ? 'text-accent-400' : 'text-white/60'
                    }`} />
                    <span className="font-medium">{label}</span>
                  </div>
                  <p className="text-sm text-white/60">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/90">Scheduling Constraints</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Max Jobs per Day
                </label>
                <input
                  type="text"
                  value={maxDailyJobs}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const numValue = parseInt(value) || 8;
                    setMaxDailyJobs(Math.min(Math.max(numValue, 1), 20));
                  }}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-accent-500/50 focus:ring-accent-500/20 focus:bg-white/15 transition-all"
                  placeholder="8"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Max Travel Distance (miles)
                </label>
                <input
                  type="text"
                  value={maxTravelDistance}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const numValue = parseInt(value) || 100;
                    setMaxTravelDistance(Math.min(Math.max(numValue, 10), 500));
                  }}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-accent-500/50 focus:ring-accent-500/20 focus:bg-white/15 transition-all"
                  placeholder="100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Buffer Time Between Jobs (minutes)
              </label>
              <input
                type="text"
                value={bufferTime}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const numValue = parseInt(value) || 15;
                  setBufferTime(Math.min(Math.max(numValue, 0), 60));
                }}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-accent-500/50 focus:ring-accent-500/20 focus:bg-white/15 transition-all"
                placeholder="15"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/90">Optimization Preferences</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-medium text-white/90">Allow Overtime Assignments</span>
                  <p className="text-xs text-white/60">Team members can exceed normal capacity</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={allowOvertime}
                    onChange={(e) => setAllowOvertime(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-all duration-300 ${
                    allowOvertime 
                      ? 'bg-accent-500/60 border border-accent-500/80' 
                      : 'bg-white/20 border border-white/30 group-hover:bg-white/25'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                      allowOvertime ? 'translate-x-6' : 'translate-x-1'
                    } mt-0.5`} />
                  </div>
                </div>
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-medium text-white/90">Enable Geographic Clustering</span>
                  <p className="text-xs text-white/60">Group nearby jobs for better routing</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={geographicClustering}
                    onChange={(e) => setGeographicClustering(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-all duration-300 ${
                    geographicClustering 
                      ? 'bg-accent-500/60 border border-accent-500/80' 
                      : 'bg-white/20 border border-white/30 group-hover:bg-white/25'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                      geographicClustering ? 'translate-x-6' : 'translate-x-1'
                    } mt-0.5`} />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white/90 mb-2">Optimization Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Jobs to schedule:</span>
                <span className="font-medium ml-2 text-white/90">{installations.length}</span>
              </div>
              <div>
                <span className="text-white/60">Available teams:</span>
                <span className="font-medium ml-2 text-white/90">{teams.length}</span>
              </div>
              <div>
                <span className="text-white/60">Goal:</span>
                <span className="font-medium ml-2 text-white/90">
                  {optimizationGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div>
                <span className="text-white/60">Max daily jobs:</span>
                <span className="font-medium ml-2 text-white/90">{maxDailyJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-white/90 hover:bg-white/15 transition-all duration-200 min-w-[140px]"
          >
            Cancel
          </button>
          <button
            onClick={handleOptimize}
            className="flex items-center justify-center px-6 py-2 bg-accent-500/20 border border-accent-500/30 rounded-xl text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md shadow-lg shadow-accent-500/10 min-w-[140px]"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOptimizationPanel;