// Think Tank Technologies - Team Management Integration API

import type {
  TeamMember,
  Installation,
  TeamPairing,
  WorkloadAssignment,
  Availability,
  Skill,
  Certification,
  Equipment,
  UserRole,
  IntegrationData,
  OptimizedAssignment
} from '../types';

// Integration API for Scheduling System
export class SchedulingIntegrationAPI {
  /**
   * Get available team members for a specific date and region
   */
  static getAvailableTeamMembers(
    teamMembers: TeamMember[],
    date: string,
    region?: string,
    requiredSkills?: string[]
  ): {
    leads: TeamMember[];
    assistants: TeamMember[];
    availabilityDetails: { [teamMemberId: string]: any };
  } {
    const availableMembers = teamMembers.filter(member => {
      // Check if member is active
      if (!member.isActive) return false;
      
      // Check region compatibility
      if (region && member.region !== region && !member.subRegions.includes(region)) {
        return false;
      }
      
      // Check availability for the date
      const isAvailable = member.availability.some(avail => 
        avail.isAvailable && 
        date >= avail.startDate && 
        date <= avail.endDate &&
        (!avail.isRecurring || this.isDateInRecurringAvailability(date, avail))
      );
      
      if (!isAvailable) return false;
      
      // Check required skills if specified
      if (requiredSkills && requiredSkills.length > 0) {
        const memberSkills = member.skills.map(s => s.name.toLowerCase());
        const hasRequiredSkills = requiredSkills.some(skill => 
          memberSkills.includes(skill.toLowerCase())
        );
        if (!hasRequiredSkills) return false;
      }
      
      return true;
    });

    const leads = availableMembers.filter(m => m.role === 'lead');
    const assistants = availableMembers.filter(m => m.role === 'assistant');
    
    // Get detailed availability information
    const availabilityDetails: { [teamMemberId: string]: any } = {};
    availableMembers.forEach(member => {
      const dayAvailability = member.availability.find(avail => 
        avail.isAvailable && 
        date >= avail.startDate && 
        date <= avail.endDate
      );
      
      availabilityDetails[member.id] = {
        workingHours: {
          start: dayAvailability?.startTime || member.workPreferences.preferredStartTime,
          end: dayAvailability?.endTime || member.workPreferences.preferredEndTime
        },
        capacity: member.capacity,
        currentWorkload: 0, // Would be calculated from actual assignments
        travelRadius: member.travelRadius,
        preferredPartners: member.preferredPartners || []
      };
    });

    return {
      leads,
      assistants,
      availabilityDetails
    };
  }

  private static isDateInRecurringAvailability(date: string, availability: Availability): boolean {
    if (!availability.isRecurring || !availability.recurringDays) return true;
    
    const dayOfWeek = new Date(date).getDay();
    return availability.recurringDays.includes(dayOfWeek);
  }

  /**
   * Find optimal team assignments for a set of installations
   */
  static findOptimalAssignments(
    installations: Installation[],
    teamMembers: TeamMember[],
    existingPairings?: TeamPairing[]
  ): OptimizedAssignment[] {
    const assignments: OptimizedAssignment[] = [];
    
    // Group installations by date
    const installationsByDate = this.groupInstallationsByDate(installations);
    
    Object.entries(installationsByDate).forEach(([date, dayInstallations]) => {
      const { leads, assistants } = this.getAvailableTeamMembers(teamMembers, date);
      
      // Sort installations by priority and complexity
      const sortedInstallations = dayInstallations.sort((a, b) => {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.priority] || 1;
        const bPriority = priorityWeight[b.priority] || 1;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.duration - a.duration;
      });
      
      // Assign installations to available teams
      sortedInstallations.forEach(installation => {
        const assignment = this.assignInstallationToTeam(
          installation,
          leads,
          assistants,
          existingPairings || []
        );
        
        if (assignment) {
          assignments.push(assignment);
          
          // Update availability (simplified - would track actual capacity)
          const leadIndex = leads.findIndex(l => l.id === assignment.leadId);
          if (leadIndex >= 0) {
            leads[leadIndex] = { ...leads[leadIndex], capacity: leads[leadIndex].capacity - 1 };
          }
        }
      });
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

  private static assignInstallationToTeam(
    installation: Installation,
    availableLeads: TeamMember[],
    availableAssistants: TeamMember[],
    existingPairings: TeamPairing[]
  ): OptimizedAssignment | null {
    // Find the best lead for this installation
    const bestLead = this.findBestLeadForInstallation(installation, availableLeads);
    if (!bestLead) return null;
    
    // Find the best assistant for this lead
    const bestAssistant = this.findBestAssistantForLead(
      bestLead,
      availableAssistants,
      existingPairings
    );
    
    return {
      id: `assignment_${installation.id}_${Date.now()}`,
      installationId: installation.id,
      leadId: bestLead.id,
      assistantId: bestAssistant?.id,
      assignedAt: new Date().toISOString(),
      assignedBy: 'system',
      status: 'assigned',
      estimatedTravelTime: 30, // Would be calculated from actual routing
      estimatedTravelDistance: 25, // Would be calculated from actual routing
      bufferTime: 15,
      workloadScore: 85,
      efficiencyScore: 90
    };
  }

  private static findBestLeadForInstallation(
    installation: Installation,
    availableLeads: TeamMember[]
  ): TeamMember | null {
    if (availableLeads.length === 0) return null;
    
    // Score leads based on various factors
    const scoredLeads = availableLeads.map(lead => {
      let score = 0;
      
      // Region compatibility
      if (installation.address.state === lead.region) score += 50;
      else if (lead.subRegions.includes(installation.address.state)) score += 30;
      
      // Performance score
      if (lead.performanceMetrics) {
        score += lead.performanceMetrics.completionRate * 0.3;
        score += lead.performanceMetrics.customerSatisfaction * 0.2;
      }
      
      // Capacity availability
      if (lead.capacity > 0) score += 20;
      
      return { lead, score };
    });
    
    // Return the highest scoring lead
    scoredLeads.sort((a, b) => b.score - a.score);
    return scoredLeads[0].lead;
  }

  private static findBestAssistantForLead(
    lead: TeamMember,
    availableAssistants: TeamMember[],
    existingPairings: TeamPairing[]
  ): TeamMember | null {
    if (availableAssistants.length === 0) return null;
    
    // Check for existing preferred pairings
    const preferredPairing = existingPairings.find(p => 
      p.leadId === lead.id && 
      p.status === 'active' &&
      availableAssistants.some(a => a.id === p.assistantId)
    );
    
    if (preferredPairing) {
      return availableAssistants.find(a => a.id === preferredPairing.assistantId) || null;
    }
    
    // Score assistants based on compatibility with the lead
    const scoredAssistants = availableAssistants.map(assistant => {
      let score = 0;
      
      // Region compatibility
      if (assistant.region === lead.region) score += 40;
      else if (assistant.subRegions.includes(lead.region) || lead.subRegions.includes(assistant.region)) {
        score += 20;
      }
      
      // Preferred partners
      if (lead.preferredPartners?.includes(assistant.id)) score += 30;
      if (assistant.preferredPartners?.includes(lead.id)) score += 30;
      
      // Performance compatibility
      if (lead.performanceMetrics && assistant.performanceMetrics) {
        const leadPerf = lead.performanceMetrics.completionRate;
        const assistantPerf = assistant.performanceMetrics.completionRate;
        const perfDiff = Math.abs(leadPerf - assistantPerf);
        score += Math.max(0, 20 - perfDiff); // Closer performance scores are better
      }
      
      return { assistant, score };
    });
    
    scoredAssistants.sort((a, b) => b.score - a.score);
    return scoredAssistants[0].assistant;
  }

  /**
   * Validate team assignment before scheduling
   */
  static validateTeamAssignment(
    installation: Installation,
    leadId: string,
    assistantId: string | undefined,
    teamMembers: TeamMember[]
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const lead = teamMembers.find(m => m.id === leadId);
    const assistant = assistantId ? teamMembers.find(m => m.id === assistantId) : undefined;
    
    // Validate lead
    if (!lead) {
      errors.push('Lead team member not found');
    } else {
      if (lead.role !== 'lead') errors.push('Selected team member is not a lead');
      if (!lead.isActive) errors.push('Lead team member is not active');
      
      // Check availability
      const date = installation.scheduledDate;
      const isAvailable = lead.availability.some(avail => 
        avail.isAvailable && 
        date >= avail.startDate && 
        date <= avail.endDate
      );
      
      if (!isAvailable) errors.push('Lead is not available on the scheduled date');
      
      // Check travel radius
      if (lead.coordinates && installation.address.coordinates) {
        const distance = this.calculateDistance(lead.coordinates, installation.address.coordinates);
        if (distance > lead.travelRadius) {
          warnings.push(`Installation is ${distance.toFixed(1)} miles from lead's location (max: ${lead.travelRadius} miles)`);
        }
      }
    }
    
    // Validate assistant if provided
    if (assistantId && assistant) {
      if (assistant.role !== 'assistant') errors.push('Selected team member is not an assistant');
      if (!assistant.isActive) errors.push('Assistant team member is not active');
      
      const date = installation.scheduledDate;
      const isAvailable = assistant.availability.some(avail => 
        avail.isAvailable && 
        date >= avail.startDate && 
        date <= avail.endDate
      );
      
      if (!isAvailable) errors.push('Assistant is not available on the scheduled date');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Integration API for Data Processing System
export class DataProcessingIntegrationAPI {
  /**
   * Process team member data from imported files
   */
  static processTeamMemberImport(rawData: any[]): {
    validMembers: Partial<TeamMember>[];
    errors: { row: number; message: string }[];
    summary: {
      totalRows: number;
      validRows: number;
      errorRows: number;
      duplicates: number;
    };
  } {
    const validMembers: Partial<TeamMember>[] = [];
    const errors: { row: number; message: string }[] = [];
    const emailSet = new Set<string>();
    let duplicates = 0;
    
    rawData.forEach((row, index) => {
      const rowNumber = index + 1;
      const member: Partial<TeamMember> = {};
      
      try {
        // Basic validation and mapping
        if (!row.firstName && !row['First Name']) {
          errors.push({ row: rowNumber, message: 'First name is required' });
          return;
        }
        member.firstName = row.firstName || row['First Name'];
        
        if (!row.lastName && !row['Last Name']) {
          errors.push({ row: rowNumber, message: 'Last name is required' });
          return;
        }
        member.lastName = row.lastName || row['Last Name'];
        
        if (!row.email && !row['Email']) {
          errors.push({ row: rowNumber, message: 'Email is required' });
          return;
        }
        
        const email = row.email || row['Email'];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push({ row: rowNumber, message: 'Invalid email format' });
          return;
        }
        
        if (emailSet.has(email.toLowerCase())) {
          duplicates++;
          errors.push({ row: rowNumber, message: 'Duplicate email address' });
          return;
        }
        
        emailSet.add(email.toLowerCase());
        member.email = email;
        
        // Role validation
        const role = (row.role || row['Role'] || 'assistant').toLowerCase();
        if (!['lead', 'assistant', 'admin', 'scheduler'].includes(role)) {
          errors.push({ row: rowNumber, message: 'Invalid role. Must be lead, assistant, admin, or scheduler' });
          return;
        }
        member.role = role as UserRole;
        
        // Region
        if (!row.region && !row['Region']) {
          errors.push({ row: rowNumber, message: 'Region is required' });
          return;
        }
        member.region = row.region || row['Region'];
        
        // Optional fields with defaults
        member.isActive = row.active !== undefined ? row.active : (row['Active'] === 'Yes' || row['Active'] === true);
        member.capacity = parseInt(row.capacity || row['Capacity']) || 3;
        member.travelRadius = parseInt(row.travelRadius || row['Travel Radius']) || 50;
        member.subRegions = [];
        member.specializations = [];
        
        // Parse sub-regions if provided
        const subRegions = row.subRegions || row['Sub Regions'] || '';
        if (subRegions) {
          member.subRegions = subRegions.split(',').map((r: string) => r.trim()).filter(Boolean);
        }
        
        // Parse specializations if provided
        const specializations = row.specializations || row['Specializations'] || '';
        if (specializations) {
          member.specializations = specializations.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        
        validMembers.push(member);
        
      } catch (error) {
        errors.push({ row: rowNumber, message: `Processing error: ${error}` });
      }
    });
    
    return {
      validMembers,
      errors,
      summary: {
        totalRows: rawData.length,
        validRows: validMembers.length,
        errorRows: errors.length,
        duplicates
      }
    };
  }

  /**
   * Export team data for integration with other systems
   */
  static exportTeamDataForIntegration(
    teamMembers: TeamMember[],
    format: 'json' | 'csv' | 'xml' = 'json'
  ): {
    data: string;
    metadata: {
      exportedAt: string;
      recordCount: number;
      format: string;
      version: string;
    };
  } {
    const exportData = teamMembers.map(member => ({
      id: member.id,
      employeeId: member.employmentInfo?.employeeId || '',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      region: member.region,
      subRegions: member.subRegions,
      isActive: member.isActive,
      capacity: member.capacity,
      travelRadius: member.travelRadius,
      skills: member.skills?.map(skill => ({
        name: skill.name,
        category: skill.category,
        level: skill.level
      })) || [],
      certifications: member.certifications?.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        status: cert.status,
        expirationDate: cert.expirationDate
      })) || [],
      performance: member.performanceMetrics ? {
        completionRate: member.performanceMetrics.completionRate,
        customerSatisfaction: member.performanceMetrics.customerSatisfaction,
        qualityScore: member.performanceMetrics.qualityScore
      } : null,
      lastUpdated: member.updatedAt
    }));
    
    let formattedData: string;
    
    switch (format) {
      case 'csv':
        formattedData = this.convertToCSV(exportData);
        break;
      case 'xml':
        formattedData = this.convertToXML(exportData);
        break;
      default:
        formattedData = JSON.stringify(exportData, null, 2);
    }
    
    return {
      data: formattedData,
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: teamMembers.length,
        format,
        version: '1.0'
      }
    };
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  private static convertToXML(data: any[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<teamMembers>\n';
    
    data.forEach(member => {
      xml += '  <teamMember>\n';
      Object.entries(member).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          xml += `    <${key}>${value}</${key}>\n`;
        }
      });
      xml += '  </teamMember>\n';
    });
    
    xml += '</teamMembers>';
    return xml;
  }
}

// Integration API for Geographic Routing System
export class GeographicIntegrationAPI {
  /**
   * Get team member coverage areas for routing optimization
   */
  static getTeamCoverageAreas(teamMembers: TeamMember[]): {
    regions: { [region: string]: TeamMember[] };
    coverageMap: { [region: string]: { leads: number; assistants: number; totalCapacity: number } };
    gaps: string[];
  } {
    const regions: { [region: string]: TeamMember[] } = {};
    const coverageMap: { [region: string]: { leads: number; assistants: number; totalCapacity: number } } = {};
    
    // Group team members by region
    teamMembers.forEach(member => {
      if (!member.isActive) return;
      
      // Primary region
      if (!regions[member.region]) {
        regions[member.region] = [];
      }
      regions[member.region].push(member);
      
      // Sub-regions
      member.subRegions.forEach(subRegion => {
        if (!regions[subRegion]) {
          regions[subRegion] = [];
        }
        regions[subRegion].push(member);
      });
    });
    
    // Calculate coverage statistics
    Object.entries(regions).forEach(([region, members]) => {
      const leads = members.filter(m => m.role === 'lead').length;
      const assistants = members.filter(m => m.role === 'assistant').length;
      const totalCapacity = members.reduce((sum, m) => sum + m.capacity, 0);
      
      coverageMap[region] = { leads, assistants, totalCapacity };
    });
    
    // Identify coverage gaps (regions with no leads or insufficient coverage)
    const gaps = Object.entries(coverageMap)
      .filter(([region, coverage]) => coverage.leads === 0 || coverage.totalCapacity < 5)
      .map(([region]) => region);
    
    return { regions, coverageMap, gaps };
  }

  /**
   * Calculate travel distances and optimize routes for team assignments
   */
  static calculateOptimalRoutes(
    assignments: OptimizedAssignment[],
    installations: Installation[],
    teamMembers: TeamMember[]
  ): {
    optimizedRoutes: { [teamMemberId: string]: any };
    totalDistance: number;
    totalTime: number;
    suggestions: string[];
  } {
    const optimizedRoutes: { [teamMemberId: string]: any } = {};
    let totalDistance = 0;
    let totalTime = 0;
    const suggestions: string[] = [];
    
    // Group assignments by team member and date
    const assignmentsByMember: { [memberId: string]: { [date: string]: OptimizedAssignment[] } } = {};
    
    assignments.forEach(assignment => {
      const installation = installations.find(i => i.id === assignment.installationId);
      if (!installation) return;
      
      const date = installation.scheduledDate;
      
      if (!assignmentsByMember[assignment.leadId]) {
        assignmentsByMember[assignment.leadId] = {};
      }
      
      if (!assignmentsByMember[assignment.leadId][date]) {
        assignmentsByMember[assignment.leadId][date] = [];
      }
      
      assignmentsByMember[assignment.leadId][date].push(assignment);
    });
    
    // Calculate routes for each team member on each day
    Object.entries(assignmentsByMember).forEach(([memberId, dateAssignments]) => {
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) return;
      
      optimizedRoutes[memberId] = {};
      
      Object.entries(dateAssignments).forEach(([date, dayAssignments]) => {
        const dayInstallations = dayAssignments
          .map(a => installations.find(i => i.id === a.installationId))
          .filter(Boolean) as Installation[];
        
        // Simple route optimization (in real implementation, would use proper routing API)
        const route = this.optimizeRoute(member, dayInstallations);
        
        optimizedRoutes[memberId][date] = route;
        totalDistance += route.totalDistance;
        totalTime += route.totalTime;
        
        // Generate suggestions for optimization
        if (route.totalDistance > member.travelRadius * 2) {
          suggestions.push(`${member.firstName} ${member.lastName} has excessive travel distance on ${date}`);
        }
        
        if (dayInstallations.length > member.capacity) {
          suggestions.push(`${member.firstName} ${member.lastName} is overloaded on ${date}`);
        }
      });
    });
    
    return {
      optimizedRoutes,
      totalDistance,
      totalTime,
      suggestions
    };
  }

  private static optimizeRoute(member: TeamMember, installations: Installation[]): {
    route: Installation[];
    totalDistance: number;
    totalTime: number;
    efficiency: number;
  } {
    // Simple nearest neighbor algorithm (in production, would use more sophisticated routing)
    if (installations.length === 0) {
      return { route: [], totalDistance: 0, totalTime: 0, efficiency: 100 };
    }
    
    if (installations.length === 1) {
      return { 
        route: installations, 
        totalDistance: 50, // Estimated distance from base
        totalTime: 60, // Estimated time
        efficiency: 95 
      };
    }
    
    // Sort by priority and estimated distance (simplified)
    const sortedInstallations = installations.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] || 1;
      const bPriority = priorityWeight[b.priority] || 1;
      return bPriority - aPriority;
    });
    
    // Estimate total distance and time
    const totalDistance = sortedInstallations.length * 25; // Estimated 25 miles per installation
    const totalTime = sortedInstallations.reduce((sum, inst) => sum + inst.duration, 0) + 
                     (sortedInstallations.length - 1) * 30; // 30 min travel between jobs
    
    const efficiency = Math.max(50, 100 - (totalDistance / member.travelRadius) * 10);
    
    return {
      route: sortedInstallations,
      totalDistance,
      totalTime,
      efficiency
    };
  }
}

// Integration API for Email Report Generation
export class EmailReportIntegrationAPI {
  /**
   * Generate team performance data for email reports
   */
  static generateTeamPerformanceReport(
    teamMembers: TeamMember[],
    period: { start: string; end: string }
  ): {
    summary: any;
    memberDetails: any[];
    alerts: any[];
    recommendations: string[];
  } {
    const activeMembers = teamMembers.filter(m => m.isActive);
    
    // Calculate summary metrics
    const summary = {
      totalMembers: activeMembers.length,
      leadCount: activeMembers.filter(m => m.role === 'lead').length,
      assistantCount: activeMembers.filter(m => m.role === 'assistant').length,
      averagePerformance: this.calculateAveragePerformance(activeMembers),
      totalCapacity: activeMembers.reduce((sum, m) => sum + m.capacity, 0),
      certificationStatus: this.getCertificationStatus(activeMembers),
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date().toISOString()
    };
    
    // Generate member details
    const memberDetails = activeMembers.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      role: member.role,
      region: member.region,
      performance: member.performanceMetrics ? {
        completionRate: member.performanceMetrics.completionRate,
        customerSatisfaction: member.performanceMetrics.customerSatisfaction,
        qualityScore: member.performanceMetrics.qualityScore
      } : null,
      skills: member.skills?.length || 0,
      certifications: member.certifications?.length || 0,
      lastUpdated: member.updatedAt
    }));
    
    // Generate alerts
    const alerts: any[] = [];
    
    // Check for expiring certifications
    const expiringCerts = this.getExpiringCertifications(activeMembers, 30);
    if (expiringCerts.length > 0) {
      alerts.push({
        type: 'certification_expiring',
        severity: 'warning',
        count: expiringCerts.length,
        message: `${expiringCerts.length} certifications expire within 30 days`
      });
    }
    
    // Check for low performers
    const lowPerformers = activeMembers.filter(member => {
      if (!member.performanceMetrics) return false;
      const score = (
        member.performanceMetrics.completionRate * 0.3 +
        member.performanceMetrics.customerSatisfaction * 0.3 +
        member.performanceMetrics.qualityScore * 0.4
      );
      return score < 7;
    });
    
    if (lowPerformers.length > 0) {
      alerts.push({
        type: 'performance_low',
        severity: 'warning',
        count: lowPerformers.length,
        message: `${lowPerformers.length} team members have performance scores below 7.0`
      });
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (summary.leadCount < summary.assistantCount / 3) {
      recommendations.push('Consider promoting qualified assistants to lead positions');
    }
    
    if (expiringCerts.length > 0) {
      recommendations.push('Schedule certification renewal training sessions');
    }
    
    if (lowPerformers.length > 0) {
      recommendations.push('Implement performance improvement plans for underperforming team members');
    }
    
    return {
      summary,
      memberDetails,
      alerts,
      recommendations
    };
  }

  private static calculateAveragePerformance(members: TeamMember[]): number {
    const performanceScores = members
      .filter(m => m.performanceMetrics)
      .map(m => {
        const metrics = m.performanceMetrics!;
        return (
          metrics.completionRate * 0.3 +
          metrics.customerSatisfaction * 0.3 +
          metrics.qualityScore * 0.4
        );
      });
    
    return performanceScores.length > 0 
      ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
      : 0;
  }

  private static getCertificationStatus(members: TeamMember[]): {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
  } {
    let total = 0;
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    members.forEach(member => {
      member.certifications?.forEach(cert => {
        total++;
        
        if (cert.status === 'active') {
          active++;
          
          if (cert.expirationDate && new Date(cert.expirationDate) <= thirtyDaysFromNow) {
            expiringSoon++;
          }
        } else if (cert.status === 'expired') {
          expired++;
        }
      });
    });
    
    return { total, active, expired, expiringSoon };
  }

  private static getExpiringCertifications(members: TeamMember[], daysAhead: number): Certification[] {
    const expiring: Certification[] = [];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    members.forEach(member => {
      member.certifications?.forEach(cert => {
        if (cert.expirationDate && 
            new Date(cert.expirationDate) <= targetDate && 
            new Date(cert.expirationDate) > new Date() &&
            cert.status === 'active') {
          expiring.push(cert);
        }
      });
    });
    
    return expiring;
  }
}

// Main Integration Manager
export class TeamIntegrationManager {
  /**
   * Central integration point for all team management data
   */
  static createIntegrationData(
    teamMembers: TeamMember[],
    assignments: OptimizedAssignment[],
    installations: Installation[]
  ): IntegrationData {
    return {
      source: 'team_management',
      timestamp: new Date().toISOString(),
      dataType: 'team_assignments',
      records: assignments.length,
      errors: []
    };
  }

  /**
   * Sync team data with external systems
   */
  static async syncWithExternalSystems(
    teamMembers: TeamMember[],
    syncTargets: string[] = ['scheduling', 'payroll', 'hr']
  ): Promise<{
    successful: string[];
    failed: { system: string; error: string }[];
  }> {
    const successful: string[] = [];
    const failed: { system: string; error: string }[] = [];
    
    for (const target of syncTargets) {
      try {
        // In a real implementation, this would make API calls to external systems
        switch (target) {
          case 'scheduling':
            // Sync with scheduling system
            console.log('Syncing with scheduling system...');
            successful.push(target);
            break;
            
          case 'payroll':
            // Sync with payroll system
            console.log('Syncing with payroll system...');
            successful.push(target);
            break;
            
          case 'hr':
            // Sync with HR system
            console.log('Syncing with HR system...');
            successful.push(target);
            break;
            
          default:
            throw new Error(`Unknown sync target: ${target}`);
        }
      } catch (error) {
        failed.push({ system: target, error: (error as Error).message });
      }
    }
    
    return { successful, failed };
  }
}