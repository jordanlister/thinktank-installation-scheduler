// Think Tank Technologies - Team Management Utilities

import type {
  TeamMember,
  TeamPairing,
  WorkloadAssignment,
  Installation,
  Skill,
  Certification,
  Equipment,
  UserRole,
  SkillLevel,
  CertificationStatus,
  EquipmentStatus,
  PairingStatus,
  WorkloadStatus,
  TeamAnalytics,
  SkillGapReport,
  WorkloadDistributionReport
} from '../types';

// Team Pairing Algorithms
export class TeamPairingEngine {
  static calculateCompatibilityScore(lead: TeamMember, assistant: TeamMember): number {
    let score = 0;
    const weights = {
      geographic: 0.3,
      skills: 0.25,
      experience: 0.2,
      preferences: 0.15,
      performance: 0.1
    };

    // Geographic compatibility
    score += this.calculateGeographicScore(lead, assistant) * weights.geographic;
    
    // Skill complementarity
    score += this.calculateSkillScore(lead, assistant) * weights.skills;
    
    // Experience compatibility
    score += this.calculateExperienceScore(lead, assistant) * weights.experience;
    
    // Preference matching
    score += this.calculatePreferenceScore(lead, assistant) * weights.preferences;
    
    // Performance compatibility
    score += this.calculatePerformanceScore(lead, assistant) * weights.performance;

    return Math.round(score * 100) / 100;
  }

  private static calculateGeographicScore(lead: TeamMember, assistant: TeamMember): number {
    // Same primary region = 100 points
    if (lead.region === assistant.region) return 100;
    
    // Assistant in lead's sub-regions = 80 points
    if (lead.subRegions.includes(assistant.region)) return 80;
    
    // Lead in assistant's sub-regions = 70 points
    if (assistant.subRegions.includes(lead.region)) return 70;
    
    // Calculate distance if coordinates available
    if (lead.coordinates && assistant.coordinates) {
      const distance = this.calculateDistance(lead.coordinates, assistant.coordinates);
      if (distance <= 50) return 60; // Within 50 miles
      if (distance <= 100) return 40; // Within 100 miles
      if (distance <= 200) return 20; // Within 200 miles
    }
    
    return 0;
  }

  private static calculateSkillScore(lead: TeamMember, assistant: TeamMember): number {
    const leadSkills = new Set(lead.skills.map(s => s.name.toLowerCase()));
    const assistantSkills = new Set(assistant.skills.map(s => s.name.toLowerCase()));
    
    // Calculate skill overlap (some overlap is good, too much might be redundant)
    const overlap = Array.from(leadSkills).filter(skill => assistantSkills.has(skill)).length;
    const totalUniqueSkills = new Set([...leadSkills, ...assistantSkills]).size;
    
    // Optimal overlap is around 30-50% of total skills
    const overlapRatio = overlap / totalUniqueSkills;
    if (overlapRatio >= 0.3 && overlapRatio <= 0.5) return 100;
    if (overlapRatio >= 0.2 && overlapRatio <= 0.6) return 80;
    if (overlapRatio >= 0.1 && overlapRatio <= 0.7) return 60;
    
    return Math.max(40, 100 - Math.abs(overlapRatio - 0.4) * 200);
  }

  private static calculateExperienceScore(lead: TeamMember, assistant: TeamMember): number {
    if (!lead.performanceMetrics || !assistant.performanceMetrics) return 50;
    
    const leadJobs = lead.performanceMetrics.totalJobs || 0;
    const assistantJobs = assistant.performanceMetrics.totalJobs || 0;
    
    // Lead should have more experience than assistant
    if (leadJobs > assistantJobs * 1.5) return 100;
    if (leadJobs > assistantJobs) return 80;
    if (leadJobs === assistantJobs) return 60;
    
    return 30; // Assistant has more experience than lead
  }

  private static calculatePreferenceScore(lead: TeamMember, assistant: TeamMember): number {
    let score = 50; // Base score
    
    // Check mutual preferences
    if (lead.preferredPartners?.includes(assistant.id)) score += 25;
    if (assistant.preferredPartners?.includes(lead.id)) score += 25;
    
    // Check work preferences compatibility
    const leadPrefs = lead.workPreferences;
    const assistantPrefs = assistant.workPreferences;
    
    // Check schedule compatibility
    if (leadPrefs.preferredStartTime === assistantPrefs.preferredStartTime) score += 10;
    if (leadPrefs.weekendsAvailable === assistantPrefs.weekendsAvailable) score += 5;
    if (leadPrefs.overtimeAvailable === assistantPrefs.overtimeAvailable) score += 5;
    
    return Math.min(score, 100);
  }

  private static calculatePerformanceScore(lead: TeamMember, assistant: TeamMember): number {
    if (!lead.performanceMetrics || !assistant.performanceMetrics) return 50;
    
    const leadScore = (
      lead.performanceMetrics.completionRate * 0.3 +
      lead.performanceMetrics.customerSatisfaction * 0.3 +
      lead.performanceMetrics.qualityScore * 0.2 +
      lead.performanceMetrics.safetyScore * 0.2
    );
    
    const assistantScore = (
      assistant.performanceMetrics.completionRate * 0.3 +
      assistant.performanceMetrics.customerSatisfaction * 0.3 +
      assistant.performanceMetrics.qualityScore * 0.2 +
      assistant.performanceMetrics.safetyScore * 0.2
    );
    
    // Both should have good performance scores
    const avgScore = (leadScore + assistantScore) / 2;
    if (avgScore >= 9) return 100;
    if (avgScore >= 8) return 80;
    if (avgScore >= 7) return 60;
    if (avgScore >= 6) return 40;
    
    return 20;
  }

  private static calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static findOptimalPairings(teamMembers: TeamMember[], region?: string): TeamPairing[] {
    const leads = teamMembers.filter(m => 
      m.role === 'lead' && 
      m.isActive && 
      (!region || m.region === region || m.subRegions.includes(region))
    );
    
    const assistants = teamMembers.filter(m => 
      m.role === 'assistant' && 
      m.isActive && 
      (!region || m.region === region || m.subRegions.includes(region))
    );

    const pairings: TeamPairing[] = [];
    const usedAssistants = new Set<string>();

    // Sort leads by priority (performance, availability, etc.)
    const sortedLeads = leads.sort((a, b) => {
      const aScore = a.performanceMetrics?.completionRate || 0;
      const bScore = b.performanceMetrics?.completionRate || 0;
      return bScore - aScore;
    });

    for (const lead of sortedLeads) {
      let bestAssistant: TeamMember | null = null;
      let bestScore = 0;

      for (const assistant of assistants) {
        if (usedAssistants.has(assistant.id)) continue;

        const score = this.calculateCompatibilityScore(lead, assistant);
        if (score > bestScore && score >= 60) { // Minimum compatibility threshold
          bestScore = score;
          bestAssistant = assistant;
        }
      }

      if (bestAssistant) {
        usedAssistants.add(bestAssistant.id);
        
        pairings.push({
          id: `pairing_${lead.id}_${bestAssistant.id}_${Date.now()}`,
          leadId: lead.id,
          assistantId: bestAssistant.id,
          region: region || lead.region,
          compatibilityScore: bestScore,
          pairingDate: new Date().toISOString(),
          totalJobsCompleted: 0,
          averagePerformance: 0,
          status: 'active',
          notes: `Auto-generated pairing with ${bestScore}% compatibility`
        });
      }
    }

    return pairings;
  }
}

// Workload Balancing System
export class WorkloadBalancer {
  static balanceTeamWorkload(
    teamMembers: TeamMember[],
    installations: Installation[],
    region?: string,
    dateRange?: { start: string; end: string }
  ): WorkloadAssignment[] {
    const relevantMembers = teamMembers.filter(member => 
      member.isActive && 
      (!region || member.region === region || member.subRegions.includes(region))
    );

    const relevantInstallations = installations.filter(installation => {
      if (dateRange) {
        return installation.scheduledDate >= dateRange.start && 
               installation.scheduledDate <= dateRange.end;
      }
      return true;
    });

    const assignments: WorkloadAssignment[] = [];
    
    // Group installations by date
    const installationsByDate = this.groupInstallationsByDate(relevantInstallations);
    
    Object.entries(installationsByDate).forEach(([date, dayInstallations]) => {
      const dayAssignments = this.balanceDailyWorkload(relevantMembers, dayInstallations, date);
      assignments.push(...dayAssignments);
    });

    return assignments;
  }

  private static groupInstallationsByDate(installations: Installation[]): { [date: string]: Installation[] } {
    return installations.reduce((groups, installation) => {
      const date = installation.scheduledDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(installation);
      return groups;
    }, {} as { [date: string]: Installation[] });
  }

  private static balanceDailyWorkload(
    teamMembers: TeamMember[],
    installations: Installation[],
    date: string
  ): WorkloadAssignment[] {
    const assignments: WorkloadAssignment[] = [];
    
    // Calculate each team member's capacity for the day
    const memberCapacities = teamMembers.map(member => ({
      id: member.id,
      capacity: member.capacity,
      currentLoad: 0,
      assignedJobs: [] as string[]
    }));

    // Sort installations by priority and complexity
    const sortedInstallations = installations.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] || 1;
      const bPriority = priorityWeight[b.priority] || 1;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.duration - a.duration; // More complex jobs first
    });

    // Assign installations to team members
    for (const installation of sortedInstallations) {
      // Find the best available team member
      const availableMember = memberCapacities
        .filter(mc => mc.currentLoad < mc.capacity)
        .sort((a, b) => a.currentLoad - b.currentLoad)[0];

      if (availableMember) {
        availableMember.currentLoad += 1;
        availableMember.assignedJobs.push(installation.id);
      }
    }

    // Create workload assignments
    memberCapacities.forEach(mc => {
      if (mc.assignedJobs.length > 0) {
        const estimatedHours = mc.assignedJobs.length * 2; // Estimated 2 hours per job
        const utilizationPercentage = (mc.currentLoad / mc.capacity) * 100;
        
        let status: WorkloadStatus = 'optimal';
        if (utilizationPercentage > 90) status = 'overloaded';
        else if (utilizationPercentage > 100) status = 'critical';
        else if (utilizationPercentage < 60) status = 'underutilized';

        assignments.push({
          teamMemberId: mc.id,
          date,
          scheduledJobs: mc.assignedJobs,
          estimatedHours,
          travelTime: mc.assignedJobs.length * 30, // Estimated 30min travel per job
          utilizationPercentage,
          workloadScore: this.calculateWorkloadScore(utilizationPercentage),
          status
        });
      }
    });

    return assignments;
  }

  private static calculateWorkloadScore(utilizationPercentage: number): number {
    // Optimal utilization is around 75-85%
    const optimal = 80;
    const difference = Math.abs(utilizationPercentage - optimal);
    
    if (difference <= 5) return 100;
    if (difference <= 10) return 90;
    if (difference <= 15) return 80;
    if (difference <= 20) return 70;
    
    return Math.max(50, 70 - difference);
  }

  static identifyWorkloadImbalances(assignments: WorkloadAssignment[]): {
    overloaded: WorkloadAssignment[];
    underutilized: WorkloadAssignment[];
    recommendations: string[];
  } {
    const overloaded = assignments.filter(a => a.status === 'overloaded' || a.status === 'critical');
    const underutilized = assignments.filter(a => a.status === 'underutilized');
    
    const recommendations: string[] = [];
    
    if (overloaded.length > 0) {
      recommendations.push(`${overloaded.length} team members are overloaded and may need job redistribution`);
    }
    
    if (underutilized.length > 0) {
      recommendations.push(`${underutilized.length} team members are underutilized and could take on additional work`);
    }
    
    if (overloaded.length > 0 && underutilized.length > 0) {
      recommendations.push('Consider redistributing work from overloaded to underutilized team members');
    }

    return {
      overloaded,
      underutilized,
      recommendations
    };
  }
}

// Skills and Certification Management
export class SkillsManager {
  static analyzeSkillGaps(teamMembers: TeamMember[], requiredSkills: string[]): SkillGapReport[] {
    const reports: SkillGapReport[] = [];
    
    requiredSkills.forEach(skillName => {
      const membersWithSkill = teamMembers.filter(member =>
        member.skills.some(skill => 
          skill.name.toLowerCase() === skillName.toLowerCase() && 
          ['intermediate', 'advanced', 'expert', 'master'].includes(skill.level)
        )
      );
      
      const currentCapacity = membersWithSkill.length;
      const requiredCapacity = Math.ceil(teamMembers.length * 0.3); // 30% should have each critical skill
      const gap = Math.max(0, requiredCapacity - currentCapacity);
      
      if (gap > 0) {
        const affectedRegions = [...new Set(teamMembers.map(m => m.region))];
        
        reports.push({
          skill: skillName,
          category: 'technical', // Would be determined based on skill mapping
          currentCapacity,
          requiredCapacity,
          gap,
          affectedRegions,
          trainingRecommendations: [
            `Train ${gap} additional team members in ${skillName}`,
            `Focus on team members in regions: ${affectedRegions.join(', ')}`,
            'Consider external training providers or internal mentorship programs'
          ]
        });
      }
    });
    
    return reports;
  }

  static getExpiredCertifications(teamMembers: TeamMember[]): Certification[] {
    const expired: Certification[] = [];
    const now = new Date();
    
    teamMembers.forEach(member => {
      member.certifications.forEach(cert => {
        if (cert.expirationDate && new Date(cert.expirationDate) < now) {
          expired.push(cert);
        }
      });
    });
    
    return expired;
  }

  static getExpiringCertifications(teamMembers: TeamMember[], daysAhead: number = 30): Certification[] {
    const expiring: Certification[] = [];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    teamMembers.forEach(member => {
      member.certifications.forEach(cert => {
        if (cert.expirationDate) {
          const expirationDate = new Date(cert.expirationDate);
          if (expirationDate <= targetDate && expirationDate > new Date()) {
            expiring.push(cert);
          }
        }
      });
    });
    
    return expiring.sort((a, b) => 
      new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime()
    );
  }

  static calculateCertificationRenewalCost(certifications: Certification[]): number {
    return certifications.reduce((total, cert) => total + (cert.cost || 0), 0);
  }
}

// Equipment Management
export class EquipmentManager {
  static getAvailableEquipment(teamMembers: TeamMember[], equipmentType?: string): Equipment[] {
    const available: Equipment[] = [];
    
    teamMembers.forEach(member => {
      member.equipment.forEach(eq => {
        if (eq.status === 'available' && (!equipmentType || eq.type === equipmentType)) {
          available.push(eq);
        }
      });
    });
    
    return available;
  }

  static getEquipmentNeedingMaintenance(teamMembers: TeamMember[]): Equipment[] {
    const needsMaintenance: Equipment[] = [];
    const today = new Date();
    
    teamMembers.forEach(member => {
      member.equipment.forEach(eq => {
        if (eq.nextInspectionDue && new Date(eq.nextInspectionDue) <= today) {
          needsMaintenance.push(eq);
        }
        if (eq.condition === 'poor' || eq.condition === 'needs_replacement') {
          needsMaintenance.push(eq);
        }
      });
    });
    
    return needsMaintenance;
  }

  static calculateEquipmentUtilization(teamMembers: TeamMember[]): { [type: string]: number } {
    const utilization: { [type: string]: { assigned: number; total: number } } = {};
    
    teamMembers.forEach(member => {
      member.equipment.forEach(eq => {
        if (!utilization[eq.type]) {
          utilization[eq.type] = { assigned: 0, total: 0 };
        }
        
        utilization[eq.type].total++;
        if (eq.status === 'assigned') {
          utilization[eq.type].assigned++;
        }
      });
    });
    
    const utilizationRates: { [type: string]: number } = {};
    Object.entries(utilization).forEach(([type, data]) => {
      utilizationRates[type] = data.total > 0 ? (data.assigned / data.total) * 100 : 0;
    });
    
    return utilizationRates;
  }
}

// Performance Analytics
export class PerformanceAnalytics {
  static calculateTeamPerformanceScore(teamMembers: TeamMember[]): number {
    if (teamMembers.length === 0) return 0;
    
    const scores = teamMembers
      .filter(member => member.performanceMetrics)
      .map(member => {
        const metrics = member.performanceMetrics!;
        return (
          metrics.completionRate * 0.25 +
          metrics.customerSatisfaction * 0.25 +
          metrics.qualityScore * 0.2 +
          metrics.safetyScore * 0.15 +
          metrics.punctualityScore * 0.1 +
          metrics.communicationScore * 0.05
        );
      });
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  static identifyTopPerformers(teamMembers: TeamMember[], limit: number = 5): TeamMember[] {
    return teamMembers
      .filter(member => member.performanceMetrics)
      .sort((a, b) => {
        const aScore = this.calculateIndividualScore(a);
        const bScore = this.calculateIndividualScore(b);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  static identifyUnderperformers(teamMembers: TeamMember[], threshold: number = 6): TeamMember[] {
    return teamMembers
      .filter(member => member.performanceMetrics)
      .filter(member => this.calculateIndividualScore(member) < threshold);
  }

  static calculateIndividualScore(member: TeamMember): number {
    if (!member.performanceMetrics) return 0;
    
    const metrics = member.performanceMetrics;
    return (
      metrics.completionRate * 0.25 +
      metrics.customerSatisfaction * 0.25 +
      metrics.qualityScore * 0.2 +
      metrics.safetyScore * 0.15 +
      metrics.punctualityScore * 0.1 +
      metrics.communicationScore * 0.05
    );
  }

  static generatePerformanceTrends(
    teamMembers: TeamMember[],
    historicalData: { [teamMemberId: string]: any[] }
  ): { [teamMemberId: string]: { trend: 'improving' | 'declining' | 'stable'; change: number } } {
    const trends: { [teamMemberId: string]: { trend: 'improving' | 'declining' | 'stable'; change: number } } = {};
    
    teamMembers.forEach(member => {
      const history = historicalData[member.id] || [];
      if (history.length >= 2) {
        const recent = history[history.length - 1];
        const previous = history[history.length - 2];
        
        const recentScore = this.calculateScoreFromMetrics(recent);
        const previousScore = this.calculateScoreFromMetrics(previous);
        
        const change = recentScore - previousScore;
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        
        if (change > 0.5) trend = 'improving';
        else if (change < -0.5) trend = 'declining';
        
        trends[member.id] = { trend, change };
      }
    });
    
    return trends;
  }

  private static calculateScoreFromMetrics(metrics: any): number {
    return (
      metrics.completionRate * 0.25 +
      metrics.customerSatisfaction * 0.25 +
      metrics.qualityScore * 0.2 +
      metrics.safetyScore * 0.15 +
      metrics.punctualityScore * 0.1 +
      metrics.communicationScore * 0.05
    );
  }
}

// Data Import/Export Utilities
export class TeamDataManager {
  static exportTeamMembersToCSV(teamMembers: TeamMember[]): string {
    const headers = [
      'ID', 'Name', 'Email', 'Role', 'Region', 'Active',
      'Skills Count', 'Certifications Count', 'Equipment Count',
      'Capacity', 'Travel Radius', 'Performance Score'
    ];
    
    const rows = teamMembers.map(member => [
      member.id,
      `${member.firstName} ${member.lastName}`,
      member.email,
      member.role,
      member.region,
      member.isActive ? 'Yes' : 'No',
      member.skills.length,
      member.certifications.length,
      member.equipment.length,
      member.capacity,
      member.travelRadius,
      member.performanceMetrics 
        ? PerformanceAnalytics.calculateIndividualScore(member).toFixed(2)
        : 'N/A'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  static parseTeamMembersFromCSV(csvContent: string): Partial<TeamMember>[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const member: Partial<TeamMember> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'name':
            const [firstName, ...lastNameParts] = value.split(' ');
            member.firstName = firstName;
            member.lastName = lastNameParts.join(' ');
            break;
          case 'email':
            member.email = value;
            break;
          case 'role':
            member.role = value as UserRole;
            break;
          case 'region':
            member.region = value;
            break;
          case 'active':
            member.isActive = value.toLowerCase() === 'yes';
            break;
          case 'capacity':
            member.capacity = parseInt(value) || 1;
            break;
          case 'travel radius':
            member.travelRadius = parseInt(value) || 50;
            break;
        }
      });
      
      return member;
    });
  }
}

// Integration Helper Functions
export class TeamIntegrationAPI {
  static getTeamMemberAvailability(
    teamMembers: TeamMember[],
    date: string,
    region?: string
  ): { leadId: string; assistantId?: string; region: string }[] {
    const availableMembers = teamMembers.filter(member => {
      const regionMatch = !region || member.region === region || member.subRegions.includes(region);
      const availabilityMatch = member.availability.some(avail => 
        avail.isAvailable && 
        date >= avail.startDate && 
        date <= avail.endDate
      );
      return regionMatch && availabilityMatch && member.isActive;
    });

    const leads = availableMembers.filter(m => m.role === 'lead');
    const assistants = availableMembers.filter(m => m.role === 'assistant');
    
    const assignments: { leadId: string; assistantId?: string; region: string }[] = [];
    
    leads.forEach(lead => {
      // Find best assistant for this lead
      const bestAssistant = assistants.find(assistant => 
        TeamPairingEngine.calculateCompatibilityScore(lead, assistant) >= 70
      );
      
      assignments.push({
        leadId: lead.id,
        assistantId: bestAssistant?.id,
        region: lead.region
      });
    });
    
    return assignments;
  }

  static validateTeamAssignment(
    leadId: string,
    assistantId: string | undefined,
    teamMembers: TeamMember[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const lead = teamMembers.find(m => m.id === leadId);
    if (!lead) {
      errors.push('Lead team member not found');
    } else if (lead.role !== 'lead') {
      errors.push('Team member is not a lead');
    } else if (!lead.isActive) {
      errors.push('Lead team member is not active');
    }
    
    if (assistantId) {
      const assistant = teamMembers.find(m => m.id === assistantId);
      if (!assistant) {
        errors.push('Assistant team member not found');
      } else if (assistant.role !== 'assistant') {
        errors.push('Team member is not an assistant');
      } else if (!assistant.isActive) {
        errors.push('Assistant team member is not active');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static getTeamCapacityForRegion(
    teamMembers: TeamMember[],
    region: string,
    date: string
  ): { totalCapacity: number; availableCapacity: number; utilization: number } {
    const regionMembers = teamMembers.filter(member =>
      (member.region === region || member.subRegions.includes(region)) &&
      member.isActive
    );
    
    const totalCapacity = regionMembers.reduce((sum, member) => sum + member.capacity, 0);
    
    // This would integrate with actual scheduling data
    const availableCapacity = totalCapacity; // Simplified - would check actual assignments
    const utilization = totalCapacity > 0 ? ((totalCapacity - availableCapacity) / totalCapacity) * 100 : 0;
    
    return {
      totalCapacity,
      availableCapacity,
      utilization
    };
  }
}