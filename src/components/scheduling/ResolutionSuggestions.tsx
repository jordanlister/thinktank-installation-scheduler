// Think Tank Technologies Installation Scheduler - AI-Powered Resolution Suggestions Component

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Brain, CheckCircle, AlertTriangle, Info, Clock, Users, MapPin,
  TrendingUp, Shield, Star, ThumbsUp, ThumbsDown, Lightbulb,
  Settings, RefreshCw, Play, Pause, ChevronDown, ChevronUp
} from 'lucide-react';
import type { 
  SchedulingConflict, ConflictResolution, ResolutionImpact, TeamMember 
} from '../../types';

interface ResolutionSuggestionsProps {
  conflicts: SchedulingConflict[];
  onApply: (resolutions: ConflictResolution[]) => Promise<void>;
  teams?: TeamMember[];
  autoSuggest?: boolean;
}

interface SuggestionRating {
  resolutionId: string;
  rating: 'positive' | 'negative';
  feedback?: string;
}

interface AIRecommendation {
  id: string;
  conflictIds: string[];
  type: 'bulk_resolution' | 'preventive_measure' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  estimatedBenefit: string;
  complexity: 'low' | 'medium' | 'high';
  suggestedActions: string[];
}

/**
 * AI-Powered Resolution Suggestions Component
 * 
 * Provides intelligent conflict resolution recommendations with:
 * - AI-powered resolution suggestions with confidence scores
 * - Multiple resolution strategies per conflict
 * - Impact assessment and cost-benefit analysis
 * - Learning from user feedback
 * - Bulk resolution recommendations
 */
const ResolutionSuggestions: React.FC<ResolutionSuggestionsProps> = ({
  conflicts,
  onApply,
  teams = [],
  autoSuggest = true
}) => {
  const [selectedResolutions, setSelectedResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionRatings, setSuggestionRatings] = useState<Map<string, SuggestionRating>>(new Map());
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [sortBy, setSortBy] = useState<'confidence' | 'impact' | 'complexity'>('confidence');

  // Generate resolution suggestions for each conflict
  const resolutionSuggestions = useMemo(() => {
    const suggestions = new Map<string, ConflictResolution[]>();
    
    conflicts.forEach(conflict => {
      const resolutions = generateResolutionSuggestions(conflict, teams);
      suggestions.set(conflict.id, resolutions);
    });
    
    return suggestions;
  }, [conflicts, teams]);

  // Generate AI recommendations for optimization
  useEffect(() => {
    if (autoSuggest && conflicts.length > 0) {
      generateAIRecommendations();
    }
  }, [conflicts, autoSuggest]);

  const generateAIRecommendations = async () => {
    setIsGeneratingSuggestions(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const recommendations: AIRecommendation[] = [];
      
      // Bulk resolution recommendations
      const timeOverlapConflicts = conflicts.filter(c => c.type === 'time_overlap');
      if (timeOverlapConflicts.length > 2) {
        recommendations.push({
          id: 'bulk-time-overlap',
          conflictIds: timeOverlapConflicts.map(c => c.id),
          type: 'bulk_resolution',
          title: 'Bulk Time Conflict Resolution',
          description: 'Automatically resolve multiple time overlap conflicts by redistributing workloads',
          confidence: 85,
          estimatedBenefit: '2-3 hours saved, improved team utilization',
          complexity: 'medium',
          suggestedActions: [
            'Identify team members with available capacity',
            'Redistribute overlapping assignments',
            'Add buffer times between assignments'
          ]
        });
      }
      
      // Prevention recommendations
      const capacityConflicts = conflicts.filter(c => c.type === 'capacity_exceeded');
      if (capacityConflicts.length > 1) {
        recommendations.push({
          id: 'prevent-capacity',
          conflictIds: capacityConflicts.map(c => c.id),
          type: 'preventive_measure',
          title: 'Capacity Management Improvement',
          description: 'Implement proactive capacity monitoring to prevent overallocation',
          confidence: 92,
          estimatedBenefit: 'Reduce future capacity conflicts by 60%',
          complexity: 'low',
          suggestedActions: [
            'Set up automated capacity alerts',
            'Review team member workload limits',
            'Implement dynamic capacity adjustment'
          ]
        });
      }
      
      // Geographic optimization
      const travelConflicts = conflicts.filter(c => c.type === 'travel_distance');
      if (travelConflicts.length > 1) {
        recommendations.push({
          id: 'geo-optimize',
          conflictIds: travelConflicts.map(c => c.id),
          type: 'optimization',
          title: 'Geographic Route Optimization',
          description: 'Optimize assignment distribution based on geographic clustering',
          confidence: 78,
          estimatedBenefit: '25% reduction in travel time and costs',
          complexity: 'high',
          suggestedActions: [
            'Analyze geographic distribution patterns',
            'Implement clustering algorithms',
            'Reassign based on proximity optimization'
          ]
        });
      }
      
      setAiRecommendations(recommendations.sort((a, b) => b.confidence - a.confidence));
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleResolutionSelect = (conflictId: string, resolution: ConflictResolution) => {
    setSelectedResolutions(prev => {
      const newMap = new Map(prev);
      if (newMap.get(conflictId)?.id === resolution.id) {
        newMap.delete(conflictId);
      } else {
        newMap.set(conflictId, resolution);
      }
      return newMap;
    });
  };

  const handleRateResolution = (resolutionId: string, rating: 'positive' | 'negative', feedback?: string) => {
    setSuggestionRatings(prev => new Map(prev.set(resolutionId, { resolutionId, rating, feedback })));
  };

  const handleApplySelected = async () => {
    const resolutions = Array.from(selectedResolutions.values());
    if (resolutions.length === 0) return;
    
    try {
      await onApply(resolutions);
      setSelectedResolutions(new Map());
    } catch (error) {
      console.error('Failed to apply resolutions:', error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'none': return 'text-green-600 bg-green-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderResolutionCard = (conflict: SchedulingConflict, resolution: ConflictResolution) => {
    const isSelected = selectedResolutions.get(conflict.id)?.id === resolution.id;
    const rating = suggestionRatings.get(resolution.id);
    
    return (
      <div
        key={resolution.id}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
        onClick={() => handleResolutionSelect(conflict.id, resolution)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">{resolution.confidence}% confidence</span>
              </div>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {resolution.type}
              </span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">{resolution.description}</h4>
            
            {/* Impact Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Customer Impact:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getImpactColor(resolution.impact.customerImpact)}`}>
                  {resolution.impact.customerImpact}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Team Impact:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getImpactColor(resolution.impact.teamImpact)}`}>
                  {resolution.impact.teamImpact}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Time Impact:</span>
                <span className="ml-2 font-medium">{resolution.impact.timeImpact} min</span>
              </div>
              <div>
                <span className="text-gray-600">Cost Impact:</span>
                <span className="ml-2 font-medium">${Math.abs(resolution.impact.costImpact)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRateResolution(resolution.id, 'positive');
              }}
              className={`p-2 rounded-lg ${
                rating?.rating === 'positive'
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRateResolution(resolution.id, 'negative');
              }}
              className={`p-2 rounded-lg ${
                rating?.rating === 'negative'
                  ? 'bg-red-100 text-red-600'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Proposed Changes */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Proposed Changes:</h5>
          <ul className="space-y-1">
            {resolution.proposedChanges.slice(0, 2).map((change, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                <span>{change.reason}</span>
              </li>
            ))}
            {resolution.proposedChanges.length > 2 && (
              <li className="text-sm text-gray-500">
                +{resolution.proposedChanges.length - 2} more changes
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderConflictSection = (conflict: SchedulingConflict) => {
    const suggestions = resolutionSuggestions.get(conflict.id) || [];
    const isExpanded = expandedConflicts.has(conflict.id);
    const selectedResolution = selectedResolutions.get(conflict.id);
    
    // Filter suggestions by confidence threshold
    const filteredSuggestions = suggestions.filter(s => s.confidence >= confidenceThreshold);
    
    return (
      <div key={conflict.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="font-medium text-gray-900">{conflict.description}</h3>
                {selectedResolution && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Resolution Selected
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{conflict.severity} severity</span>
                <span>{conflict.affectedJobs.length} jobs affected</span>
                <span>{filteredSuggestions.length} AI suggestions</span>
              </div>
            </div>
            <button
              onClick={() => setExpandedConflicts(prev => {
                const newSet = new Set(prev);
                if (newSet.has(conflict.id)) {
                  newSet.delete(conflict.id);
                } else {
                  newSet.add(conflict.id);
                }
                return newSet;
              })}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions meet the current confidence threshold.</p>
                <p className="text-sm mt-1">Try lowering the threshold or check back later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map(resolution => renderResolutionCard(conflict, resolution))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAIRecommendations = () => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Strategic Recommendations</h3>
          {isGeneratingSuggestions && (
            <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
          )}
        </div>
        <button
          onClick={generateAIRecommendations}
          disabled={isGeneratingSuggestions}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {aiRecommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Analyzing conflict patterns...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {aiRecommendations.map(recommendation => (
            <div key={recommendation.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                      {recommendation.confidence}% confidence
                    </span>
                    <span className={`text-xs font-medium ${getComplexityColor(recommendation.complexity)}`}>
                      {recommendation.complexity} complexity
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{recommendation.description}</p>
                  <div className="text-sm text-green-600 font-medium">
                    Expected benefit: {recommendation.estimatedBenefit}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Suggested Actions:</h5>
                <ul className="space-y-1">
                  {recommendation.suggestedActions.map((action, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Resolution Suggestions</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Zap className="w-4 h-4" />
            <span>{Array.from(selectedResolutions.values()).length} selected</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Confidence Threshold */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Min Confidence:</label>
            <select
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value={50}>50%</option>
              <option value={60}>60%</option>
              <option value={70}>70%</option>
              <option value={80}>80%</option>
              <option value={90}>90%</option>
            </select>
          </div>
          
          {/* Apply Button */}
          <button
            onClick={handleApplySelected}
            disabled={selectedResolutions.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            Apply Selected ({selectedResolutions.size})
          </button>
        </div>
      </div>
      
      {/* AI Strategic Recommendations */}
      {renderAIRecommendations()}
      
      {/* Individual Conflict Suggestions */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Individual Conflict Resolutions</h4>
        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No conflicts found. Great job!</p>
          </div>
        ) : (
          conflicts.map(renderConflictSection)
        )}
      </div>
    </div>
  );
};

// Helper function to generate resolution suggestions for a conflict
function generateResolutionSuggestions(conflict: SchedulingConflict, teams: TeamMember[]): ConflictResolution[] {
  const suggestions: ConflictResolution[] = [];
  
  switch (conflict.type) {
    case 'time_overlap':
      suggestions.push({
        id: `reschedule-${conflict.id}`,
        type: 'reschedule',
        description: 'Reschedule one of the overlapping assignments to a different time slot',
        confidence: 85,
        impact: {
          affectedAssignments: conflict.affectedJobs.length,
          customerImpact: 'low',
          teamImpact: 'low',
          costImpact: 0,
          timeImpact: 15
        },
        proposedChanges: [
          {
            type: 'reschedule',
            installationId: conflict.affectedJobs[0],
            currentValue: 'Current time slot',
            proposedValue: 'Alternative time slot',
            reason: 'Move to next available slot to avoid overlap'
          }
        ]
      });
      
      if (teams.length > 1) {
        suggestions.push({
          id: `reassign-${conflict.id}`,
          type: 'reassign',
          description: 'Reassign one assignment to a different available team member',
          confidence: 78,
          impact: {
            affectedAssignments: 1,
            customerImpact: 'none',
            teamImpact: 'low',
            costImpact: 0,
            timeImpact: 10
          },
          proposedChanges: [
            {
              type: 'reassign',
              installationId: conflict.affectedJobs[0],
              currentValue: 'Current team member',
              proposedValue: 'Alternative team member',
              reason: 'Reassign to team member with available capacity'
            }
          ]
        });
      }
      break;
      
    case 'capacity_exceeded':
      suggestions.push({
        id: `redistribute-${conflict.id}`,
        type: 'reassign',
        description: 'Redistribute excess assignments to team members with available capacity',
        confidence: 92,
        impact: {
          affectedAssignments: Math.ceil(conflict.affectedJobs.length / 2),
          customerImpact: 'none',
          teamImpact: 'medium',
          costImpact: 0,
          timeImpact: 5
        },
        proposedChanges: [
          {
            type: 'reassign',
            installationId: conflict.affectedJobs[0],
            currentValue: 'Overloaded team member',
            proposedValue: 'Team member with capacity',
            reason: 'Balance workload across available team members'
          }
        ]
      });
      break;
      
    case 'travel_distance':
      suggestions.push({
        id: `reassign-closer-${conflict.id}`,
        type: 'reassign',
        description: 'Reassign to team member located closer to the job site',
        confidence: 88,
        impact: {
          affectedAssignments: 1,
          customerImpact: 'none',
          teamImpact: 'low',
          costImpact: -50, // Cost savings
          timeImpact: -30  // Time savings
        },
        proposedChanges: [
          {
            type: 'reassign',
            installationId: conflict.affectedJobs[0],
            currentValue: 'Current team member',
            proposedValue: 'Geographically closer team member',
            reason: 'Reduce travel time and costs'
          }
        ]
      });
      break;
      
    default:
      suggestions.push({
        id: `generic-${conflict.id}`,
        type: 'reschedule',
        description: 'Manual review and resolution required',
        confidence: 60,
        impact: {
          affectedAssignments: conflict.affectedJobs.length,
          customerImpact: 'low',
          teamImpact: 'low',
          costImpact: 0,
          timeImpact: 20
        },
        proposedChanges: [
          {
            type: 'modify',
            installationId: conflict.affectedJobs[0],
            currentValue: 'Current configuration',
            proposedValue: 'Manual adjustment needed',
            reason: 'Requires human review for optimal resolution'
          }
        ]
      });
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

export default ResolutionSuggestions;