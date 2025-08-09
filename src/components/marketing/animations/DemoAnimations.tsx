/**
 * Interactive Demo Animations
 * Sophisticated visualizations for platform capabilities
 * Includes scheduling, route optimization, and data processing animations
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// SCHEDULING OPTIMIZATION DEMO
// ============================================================================

interface SchedulingDemoProps {
  className?: string;
  autoPlay?: boolean;
}

export const SchedulingDemo: React.FC<SchedulingDemoProps> = ({
  className,
  autoPlay = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const steps = [
    { title: 'Unoptimized Schedule', description: 'Random assignments, conflicts present' },
    { title: 'AI Analysis', description: 'Analyzing skills, locations, availability' },
    { title: 'Optimization', description: 'Applying intelligent algorithms' },
    { title: 'Optimized Result', description: '40% more efficient, zero conflicts' },
  ];

  useEffect(() => {
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 2500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep, isPlaying, steps.length]);

  // Mock schedule data
  const scheduleItems = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    technician: `Tech ${i + 1}`,
    installations: Math.floor(Math.random() * 6) + 2,
    conflicts: currentStep < 3 ? Math.floor(Math.random() * 3) : 0,
    efficiency: currentStep < 3 ? Math.random() * 0.4 + 0.4 : Math.random() * 0.2 + 0.8,
  }));

  return (
    <div className={cn('relative p-6 bg-surface-glass backdrop-blur-sm rounded-xl border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {steps[currentStep].title}
          </h3>
          <p className="text-sm text-text-secondary">
            {steps[currentStep].description}
          </p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l8-5-8-5z" />
            </svg>
          )}
        </button>
      </div>

      {/* Schedule Visualization */}
      <div className="grid gap-3">
        {scheduleItems.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-surface-elevated transition-all duration-500"
            style={{
              transform: currentStep === 1 ? 'scale(1.02)' : 'scale(1)',
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Technician */}
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-medium">
              T{item.id + 1}
            </div>

            {/* Schedule Bar */}
            <div className="flex-1 relative h-6 bg-surface rounded-full overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-1000',
                  item.conflicts > 0 && currentStep < 3
                    ? 'bg-gradient-to-r from-error to-warning'
                    : 'bg-gradient-to-r from-brand-primary to-success'
                )}
                style={{
                  width: `${item.efficiency * 100}%`,
                  animationDelay: `${index * 100}ms`,
                }}
              />
              
              {/* Conflict indicators */}
              {item.conflicts > 0 && currentStep < 3 && (
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="text-sm text-text-secondary min-w-[60px]">
              {item.installations} jobs
            </div>

            {/* Efficiency */}
            <div className="text-sm font-medium min-w-[50px]">
              <span className={cn(
                'transition-colors duration-500',
                item.efficiency > 0.7 ? 'text-success' : 'text-warning'
              )}>
                {Math.round(item.efficiency * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center mt-6 gap-2">
        {steps.map((_, index) => (
          <button
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              currentStep === index
                ? 'bg-brand-primary scale-125'
                : 'bg-border hover:bg-border-light'
            )}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </div>

      {/* AI Processing Overlay */}
      {currentStep === 1 && (
        <div className="absolute inset-0 rounded-xl bg-brand-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm font-medium text-brand-primary">AI Processing...</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ROUTE OPTIMIZATION DEMO
// ============================================================================

export const RouteOptimizationDemo: React.FC<{ className?: string }> = ({ className }) => {
  const [optimized, setOptimized] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock route data
  const locations = [
    { x: 50, y: 80, name: 'Start' },
    { x: 150, y: 120, name: 'Location A' },
    { x: 280, y: 60, name: 'Location B' },
    { x: 320, y: 180, name: 'Location C' },
    { x: 200, y: 200, name: 'Location D' },
    { x: 80, y: 160, name: 'Location E' },
  ];

  const unoptimizedRoute = [0, 1, 3, 2, 4, 5, 0];
  const optimizedRoute = [0, 1, 2, 3, 4, 5, 0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawRoute = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const route = optimized ? optimizedRoute : unoptimizedRoute;
      const color = optimized ? '#10b981' : '#ef4444';

      // Draw connections
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(optimized ? [] : [5, 5]);
      
      ctx.beginPath();
      for (let i = 0; i < route.length - 1; i++) {
        const current = locations[route[i]];
        const next = locations[route[i + 1]];
        
        if (i === 0) {
          ctx.moveTo(current.x, current.y);
        }
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();

      // Draw locations
      locations.forEach((location, index) => {
        ctx.fillStyle = index === 0 ? '#4299e1' : color;
        ctx.beginPath();
        ctx.arc(location.x, location.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Draw labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(location.name, location.x, location.y - 15);
      });
    };

    drawRoute();
  }, [optimized]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOptimized(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const distance = optimized ? 520 : 780;
  const savings = Math.round((1 - distance / 780) * 100);

  return (
    <div className={cn('relative p-6 bg-surface-glass backdrop-blur-sm rounded-xl border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Route Optimization
          </h3>
          <p className="text-sm text-text-secondary">
            {optimized ? 'Optimized route' : 'Original route'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-primary">
            {savings}%
          </div>
          <div className="text-xs text-text-secondary">savings</div>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="relative bg-surface rounded-lg p-4 mb-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={250}
          className="w-full h-auto"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-lg font-semibold text-text-primary">
            {distance}mi
          </div>
          <div className="text-xs text-text-secondary">Total Distance</div>
        </div>
        <div className="text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-lg font-semibold text-text-primary">
            {Math.round(distance / 35)}h
          </div>
          <div className="text-xs text-text-secondary">Travel Time</div>
        </div>
        <div className="text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-lg font-semibold text-success">
            ${Math.round(savings * 2.5)}
          </div>
          <div className="text-xs text-text-secondary">Fuel Saved</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DATA PROCESSING FLOW DEMO
// ============================================================================

export const DataProcessingDemo: React.FC<{ className?: string }> = ({ className }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'CSV Upload', icon: '📄', status: 'complete' },
    { label: 'Column Mapping', icon: '🔗', status: 'processing' },
    { label: 'Data Validation', icon: '✅', status: 'pending' },
    { label: 'Import Complete', icon: '🎉', status: 'pending' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('relative p-6 bg-surface-glass backdrop-blur-sm rounded-xl border border-border', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Smart Data Processing
        </h3>
        <p className="text-sm text-text-secondary">
          Automatic column mapping with intelligent validation
        </p>
      </div>

      {/* Processing Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-4">
            {/* Step Icon */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500',
              index <= currentStep
                ? 'bg-brand-primary/20 scale-110'
                : 'bg-surface-elevated scale-100'
            )}>
              {step.icon}
            </div>

            {/* Step Info */}
            <div className="flex-1">
              <div className={cn(
                'font-medium transition-colors duration-300',
                index <= currentStep ? 'text-text-primary' : 'text-text-muted'
              )}>
                {step.label}
              </div>
              {index === currentStep && (
                <div className="text-xs text-brand-primary animate-pulse">
                  Processing...
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-500',
              index < currentStep
                ? 'bg-success border-success'
                : index === currentStep
                ? 'border-brand-primary animate-pulse'
                : 'border-border'
            )}>
              {index < currentStep && (
                <svg className="w-2 h-2 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sample Data Preview */}
      <div className="bg-surface rounded-lg p-4 font-mono text-xs">
        <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border text-text-secondary">
          <div>Name</div>
          <div>Address</div>
          <div>Service</div>
          <div>Date</div>
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={cn(
            'grid grid-cols-4 gap-4 py-2 transition-all duration-300',
            currentStep >= 2 ? 'text-success' : 'text-text-primary',
            currentStep === 1 && 'animate-pulse'
          )}>
            <div>John Smith {i + 1}</div>
            <div>123 Main St</div>
            <div>HVAC Install</div>
            <div>2024-01-{15 + i}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Processing Progress</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-2">
          <div
            className="bg-gradient-to-r from-brand-primary to-success h-2 rounded-full transition-all duration-500 progress-fill"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TEAM WORKLOAD VISUALIZATION
// ============================================================================

export const TeamWorkloadDemo: React.FC<{ className?: string }> = ({ className }) => {
  const [selectedMember, setSelectedMember] = useState(0);

  const teamMembers = [
    { name: 'Alice', skills: ['HVAC', 'Electrical'], workload: 85, efficiency: 92 },
    { name: 'Bob', skills: ['Solar', 'Roofing'], workload: 72, efficiency: 88 },
    { name: 'Charlie', skills: ['Plumbing'], workload: 45, efficiency: 94 },
    { name: 'Diana', skills: ['HVAC', 'Solar'], workload: 90, efficiency: 96 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedMember(prev => (prev + 1) % teamMembers.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('relative p-6 bg-surface-glass backdrop-blur-sm rounded-xl border border-border', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Team Workload Balance
        </h3>
        <p className="text-sm text-text-secondary">
          Real-time capacity and performance tracking
        </p>
      </div>

      {/* Team Members */}
      <div className="space-y-3 mb-6">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className={cn(
              'p-4 rounded-lg transition-all duration-300 cursor-pointer',
              selectedMember === index
                ? 'bg-brand-primary/10 border-2 border-brand-primary/30'
                : 'bg-surface-elevated border-2 border-transparent hover:border-border-light'
            )}
            onClick={() => setSelectedMember(index)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-medium">
                  {member.name[0]}
                </div>
                <div>
                  <div className="font-medium text-text-primary">{member.name}</div>
                  <div className="text-xs text-text-secondary">
                    {member.skills.join(', ')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">
                  {member.efficiency}%
                </div>
                <div className="text-xs text-text-secondary">efficiency</div>
              </div>
            </div>

            {/* Workload Bar */}
            <div className="relative">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>Workload</span>
                <span>{member.workload}%</span>
              </div>
              <div className="w-full bg-surface rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-700',
                    member.workload > 80
                      ? 'bg-gradient-to-r from-warning to-error'
                      : member.workload > 60
                      ? 'bg-gradient-to-r from-brand-primary to-warning'
                      : 'bg-gradient-to-r from-success to-brand-primary'
                  )}
                  style={{
                    width: `${member.workload}%`,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-lg font-semibold text-success">
            {Math.round(teamMembers.reduce((sum, m) => sum + m.efficiency, 0) / teamMembers.length)}%
          </div>
          <div className="text-xs text-text-secondary">Avg Efficiency</div>
        </div>
        <div className="text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-lg font-semibold text-text-primary">
            {teamMembers.filter(m => m.workload < 80).length}
          </div>
          <div className="text-xs text-text-secondary">Available</div>
        </div>
        <div className="text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-lg font-semibold text-brand-primary">
            {teamMembers.reduce((sum, m) => sum + m.skills.length, 0)}
          </div>
          <div className="text-xs text-text-secondary">Total Skills</div>
        </div>
      </div>
    </div>
  );
};

// Components are individually exported above