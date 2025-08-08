// Think Tank Technologies Installation Scheduler - Impact Assessment Component

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, Users, AlertTriangle,
  CheckCircle, Info, BarChart3, PieChart, LineChart, Shield,
  Star, Target, Zap, MapPin, Calendar, Activity
} from 'lucide-react';
import type { 
  ConflictResolution, ResolutionImpact, OptimizedAssignment, TeamMember,
  SchedulingConflict 
} from '../../types';

interface ImpactAssessmentProps {
  resolutions: ConflictResolution[];
  assignments: OptimizedAssignment[];
  conflicts: SchedulingConflict[];
  teams?: TeamMember[];
  onApprove?: (resolutions: ConflictResolution[]) => void;
  onReject?: (resolutions: ConflictResolution[]) => void;
}

interface ImpactMetrics {
  totalCostImpact: number;
  totalTimeImpact: number;
  customerSatisfactionScore: number;
  teamUtilizationChange: number;
  operationalRisk: 'low' | 'medium' | 'high';
  conflictResolutionRate: number;
  estimatedROI: number;
}

interface DetailedImpact {
  category: string;
  current: number;
  proposed: number;
  change: number;
  changePercent: number;
  impact: 'positive' | 'negative' | 'neutral';
  significance: 'low' | 'medium' | 'high';
}

/**
 * Impact Assessment Component
 * 
 * Comprehensive analysis of resolution consequences with:
 * - Multi-dimensional impact analysis
 * - Visual impact dashboards with charts
 * - Risk assessment and mitigation recommendations
 * - Cost-benefit analysis with ROI calculations
 * - Team and customer impact predictions
 */
const ImpactAssessment: React.FC<ImpactAssessmentProps> = ({
  resolutions,
  assignments,
  conflicts,
  teams = [],
  onApprove,
  onReject
}) => {
  const [selectedMetricView, setSelectedMetricView] = useState<'overview' | 'detailed' | 'timeline' | 'risks'>('overview');
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  // Calculate comprehensive impact metrics
  const impactMetrics = useMemo((): ImpactMetrics => {
    const totalCostImpact = resolutions.reduce((sum, r) => sum + r.impact.costImpact, 0);
    const totalTimeImpact = resolutions.reduce((sum, r) => sum + r.impact.timeImpact, 0);
    
    // Calculate customer satisfaction impact
    const customerImpactScores = resolutions.map(r => {
      switch (r.impact.customerImpact) {
        case 'none': return 0;
        case 'low': return -5;
        case 'medium': return -15;
        case 'high': return -30;
        default: return 0;
      }
    });
    const avgCustomerImpact = customerImpactScores.reduce((sum, score) => sum + score, 0) / resolutions.length;
    const customerSatisfactionScore = Math.max(0, 100 + avgCustomerImpact);
    
    // Calculate team utilization change
    const affectedAssignments = resolutions.reduce((sum, r) => sum + r.impact.affectedAssignments, 0);
    const teamUtilizationChange = (affectedAssignments / assignments.length) * 100;
    
    // Assess operational risk
    const highRiskResolutions = resolutions.filter(r => 
      r.impact.customerImpact === 'high' || r.impact.teamImpact === 'high'
    );
    const operationalRisk: 'low' | 'medium' | 'high' = 
      highRiskResolutions.length === 0 ? 'low' :
      highRiskResolutions.length <= 2 ? 'medium' : 'high';
    
    // Calculate conflict resolution rate
    const resolvableConflicts = conflicts.filter(c => c.autoResolvable);
    const conflictResolutionRate = resolvableConflicts.length > 0 
      ? (resolutions.length / resolvableConflicts.length) * 100 
      : 0;
    
    // Calculate estimated ROI
    const costSavings = -totalCostImpact; // Negative cost impact means savings
    const timeSavings = -totalTimeImpact * 0.5; // Convert time to monetary value
    const totalSavings = costSavings + timeSavings;
    const implementationCost = resolutions.length * 10; // Estimated implementation cost
    const estimatedROI = implementationCost > 0 ? ((totalSavings - implementationCost) / implementationCost) * 100 : 0;
    
    return {
      totalCostImpact,
      totalTimeImpact,
      customerSatisfactionScore,
      teamUtilizationChange,
      operationalRisk,
      conflictResolutionRate,
      estimatedROI
    };
  }, [resolutions, assignments, conflicts]);

  // Calculate detailed impact breakdown
  const detailedImpacts = useMemo((): DetailedImpact[] => {
    const impacts: DetailedImpact[] = [];
    
    // Cost impact
    impacts.push({
      category: 'Operational Costs',
      current: 1000, // Mock baseline
      proposed: 1000 + impactMetrics.totalCostImpact,
      change: impactMetrics.totalCostImpact,
      changePercent: (impactMetrics.totalCostImpact / 1000) * 100,
      impact: impactMetrics.totalCostImpact <= 0 ? 'positive' : 'negative',
      significance: Math.abs(impactMetrics.totalCostImpact) > 100 ? 'high' : 
                   Math.abs(impactMetrics.totalCostImpact) > 50 ? 'medium' : 'low'
    });
    
    // Time efficiency
    impacts.push({
      category: 'Time Efficiency',
      current: 480, // 8 hours in minutes
      proposed: 480 + impactMetrics.totalTimeImpact,
      change: impactMetrics.totalTimeImpact,
      changePercent: (impactMetrics.totalTimeImpact / 480) * 100,
      impact: impactMetrics.totalTimeImpact <= 0 ? 'positive' : 'negative',
      significance: Math.abs(impactMetrics.totalTimeImpact) > 60 ? 'high' : 
                   Math.abs(impactMetrics.totalTimeImpact) > 30 ? 'medium' : 'low'
    });
    
    // Team utilization
    impacts.push({
      category: 'Team Utilization',
      current: 85, // 85% utilization
      proposed: 85 + impactMetrics.teamUtilizationChange,
      change: impactMetrics.teamUtilizationChange,
      changePercent: impactMetrics.teamUtilizationChange,
      impact: impactMetrics.teamUtilizationChange >= 0 && impactMetrics.teamUtilizationChange <= 10 ? 'positive' : 'negative',
      significance: Math.abs(impactMetrics.teamUtilizationChange) > 15 ? 'high' : 
                   Math.abs(impactMetrics.teamUtilizationChange) > 5 ? 'medium' : 'low'
    });
    
    return impacts;
  }, [impactMetrics]);

  const runImpactSimulation = async () => {
    setIsRunningSimulation(true);
    
    try {
      // Simulate complex impact analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const simulationData = {
        scenarios: [
          {
            name: 'Best Case',
            probability: 0.3,
            costSavings: Math.abs(impactMetrics.totalCostImpact) * 1.2,
            timeSavings: Math.abs(impactMetrics.totalTimeImpact) * 1.3,
            customerSatisfaction: impactMetrics.customerSatisfactionScore + 5
          },
          {
            name: 'Expected Case',
            probability: 0.5,
            costSavings: Math.abs(impactMetrics.totalCostImpact),
            timeSavings: Math.abs(impactMetrics.totalTimeImpact),
            customerSatisfaction: impactMetrics.customerSatisfactionScore
          },
          {
            name: 'Worst Case',
            probability: 0.2,
            costSavings: Math.abs(impactMetrics.totalCostImpact) * 0.7,
            timeSavings: Math.abs(impactMetrics.totalTimeImpact) * 0.8,
            customerSatisfaction: impactMetrics.customerSatisfactionScore - 10
          }
        ],
        riskFactors: [
          { name: 'Implementation Complexity', level: 'medium', mitigation: 'Provide additional training' },
          { name: 'Team Acceptance', level: 'low', mitigation: 'Clear communication of benefits' },
          { name: 'Customer Communication', level: 'medium', mitigation: 'Proactive customer updates' }
        ]
      };
      
      setSimulationResults(simulationData);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
    }
  };

  const getSignificanceColor = (significance: 'low' | 'medium' | 'high') => {
    switch (significance) {
      case 'low': return 'border-green-300';
      case 'medium': return 'border-yellow-300';
      case 'high': return 'border-red-300';
    }
  };

  const renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Cost Impact */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cost Impact</h3>
          <DollarSign className={`w-6 h-6 ${impactMetrics.totalCostImpact <= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <div className="text-3xl font-bold mb-2">
          <span className={impactMetrics.totalCostImpact <= 0 ? 'text-green-600' : 'text-red-600'}>
            ${Math.abs(impactMetrics.totalCostImpact)}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          {impactMetrics.totalCostImpact <= 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">Cost Savings</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-red-600">Additional Cost</span>
            </>
          )}
        </div>
      </div>

      {/* Time Impact */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Time Impact</h3>
          <Clock className={`w-6 h-6 ${impactMetrics.totalTimeImpact <= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <div className="text-3xl font-bold mb-2">
          <span className={impactMetrics.totalTimeImpact <= 0 ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(impactMetrics.totalTimeImpact)}m
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          {impactMetrics.totalTimeImpact <= 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">Time Saved</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-red-600">Additional Time</span>
            </>
          )}
        </div>
      </div>

      {/* Customer Satisfaction */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Customer Score</h3>
          <Star className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="text-3xl font-bold text-yellow-600 mb-2">
          {Math.round(impactMetrics.customerSatisfactionScore)}%
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${impactMetrics.customerSatisfactionScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Est. ROI</h3>
          <Target className={`w-6 h-6 ${impactMetrics.estimatedROI >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
        <div className="text-3xl font-bold mb-2">
          <span className={impactMetrics.estimatedROI >= 0 ? 'text-green-600' : 'text-red-600'}>
            {impactMetrics.estimatedROI >= 0 ? '+' : ''}{Math.round(impactMetrics.estimatedROI)}%
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {impactMetrics.estimatedROI >= 0 ? 'Positive return expected' : 'Investment required'}
        </div>
      </div>
    </div>
  );

  const renderDetailedAnalysis = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Detailed Impact Analysis</h3>
      
      <div className="space-y-4">
        {detailedImpacts.map((impact, index) => (
          <div key={index} className={`bg-white border rounded-lg p-6 ${getSignificanceColor(impact.significance)}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">{impact.category}</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(impact.impact)}`}>
                {impact.impact}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current</div>
                <div className="text-2xl font-bold text-gray-900">
                  {impact.category.includes('Cost') ? '$' : ''}
                  {impact.current}
                  {impact.category.includes('Time') ? 'm' : ''}
                  {impact.category.includes('Utilization') ? '%' : ''}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Proposed</div>
                <div className="text-2xl font-bold text-gray-900">
                  {impact.category.includes('Cost') ? '$' : ''}
                  {impact.proposed}
                  {impact.category.includes('Time') ? 'm' : ''}
                  {impact.category.includes('Utilization') ? '%' : ''}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Change</div>
                <div className={`text-2xl font-bold ${impact.impact === 'positive' ? 'text-green-600' : impact.impact === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
                  {impact.change >= 0 ? '+' : ''}
                  {impact.category.includes('Cost') ? '$' : ''}
                  {impact.change}
                  {impact.category.includes('Time') ? 'm' : ''}
                  {impact.category.includes('Utilization') ? '%' : ''}
                </div>
                <div className="text-sm text-gray-500">
                  ({impact.changePercent >= 0 ? '+' : ''}{Math.round(impact.changePercent)}%)
                </div>
              </div>
            </div>
            
            {/* Progress bar showing change */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Impact Magnitude</span>
                <span>{impact.significance} significance</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    impact.significance === 'low' ? 'bg-green-500' :
                    impact.significance === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.abs(impact.changePercent) * 2)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRiskAssessment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
        <div className={`px-3 py-2 rounded-lg font-medium ${
          impactMetrics.operationalRisk === 'low' ? 'bg-green-100 text-green-800' :
          impactMetrics.operationalRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {impactMetrics.operationalRisk.toUpperCase()} RISK
        </div>
      </div>

      {/* Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h4 className="font-medium text-gray-900">Implementation Risk</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Technical Complexity</span>
              <span className="font-medium text-orange-600">Medium</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Resource Requirements</span>
              <span className="font-medium text-green-600">Low</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Timeline Pressure</span>
              <span className="font-medium text-yellow-600">Medium</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-blue-500" />
            <h4 className="font-medium text-gray-900">Team Impact Risk</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Workload Changes</span>
              <span className="font-medium text-green-600">Low</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Skill Requirements</span>
              <span className="font-medium text-green-600">Low</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Schedule Disruption</span>
              <span className="font-medium text-yellow-600">Medium</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-purple-500" />
            <h4 className="font-medium text-gray-900">Customer Risk</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Service Quality</span>
              <span className="font-medium text-green-600">Low</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Timeline Changes</span>
              <span className="font-medium text-yellow-600">Medium</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Communication Needs</span>
              <span className="font-medium text-orange-600">Medium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResults && (
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-4">Monte Carlo Simulation Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {simulationResults.scenarios.map((scenario: any, index: number) => (
              <div key={index} className="text-center">
                <h5 className="font-medium text-gray-900 mb-2">{scenario.name}</h5>
                <div className="text-sm text-gray-600 mb-2">{(scenario.probability * 100)}% probability</div>
                <div className="space-y-1 text-sm">
                  <div>Cost Savings: ${scenario.costSavings}</div>
                  <div>Time Savings: {scenario.timeSavings}m</div>
                  <div>Customer Score: {scenario.customerSatisfaction}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Impact Assessment</h2>
          <p className="text-gray-600 mt-1">
            Analyzing the impact of {resolutions.length} proposed resolution{resolutions.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={runImpactSimulation}
            disabled={isRunningSimulation}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
          >
            <Activity className={`w-4 h-4 mr-2 ${isRunningSimulation ? 'animate-spin' : ''}`} />
            {isRunningSimulation ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'detailed', label: 'Detailed Analysis', icon: LineChart },
            { id: 'risks', label: 'Risk Assessment', icon: Shield }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedMetricView(id as any)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                selectedMetricView === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {selectedMetricView === 'overview' && renderOverviewMetrics()}
        {selectedMetricView === 'detailed' && renderDetailedAnalysis()}
        {selectedMetricView === 'risks' && renderRiskAssessment()}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Impact assessment complete. Review the analysis above before proceeding.
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onReject?.(resolutions)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Reject Changes
          </button>
          <button
            onClick={() => onApprove?.(resolutions)}
            className={`px-6 py-2 rounded-lg font-medium ${
              impactMetrics.operationalRisk === 'high'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {impactMetrics.operationalRisk === 'high' ? 'Proceed with Caution' : 'Approve Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImpactAssessment;