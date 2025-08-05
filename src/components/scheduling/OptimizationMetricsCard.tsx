// Think Tank Technologies Installation Scheduler - Optimization Metrics Card

import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface OptimizationMetricsCardProps {
  title: string;
  value: string | number;
  total?: number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * Optimization Metrics Card Component
 * 
 * Displays key scheduling optimization metrics in a card format
 * with color-coded indicators and trend information
 */
const OptimizationMetricsCard: React.FC<OptimizationMetricsCardProps> = ({
  title,
  value,
  total,
  subtitle,
  icon: Icon,
  color,
  trend
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-900',
      progress: 'bg-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-900',
      progress: 'bg-green-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-900',
      progress: 'bg-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      text: 'text-purple-900',
      progress: 'bg-purple-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-100 text-yellow-600',
      text: 'text-yellow-900',
      progress: 'bg-yellow-200'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} border border-gray-200 rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${classes.icon} rounded-lg p-2`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {trend && (
          <div className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className={`text-2xl font-bold ${classes.text}`}>
          {value}
          {total && (
            <span className="text-base font-normal text-gray-500">
              /{total}
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
      </div>
      
      {subtitle && (
        <div className="text-sm text-gray-500">{subtitle}</div>
      )}
      
      {total && typeof value === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round((value / total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${classes.progress} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min((value / total) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizationMetricsCard;