// Think Tank Technologies - Reports Hook

import { useState, useEffect, useCallback } from 'react';
import { ReportService } from '../services/reportService';
import type { 
  PDFTemplate,
  EmailTemplate,
  ReportStatus,
  ScheduledReport
} from '../types';

export const usePDFTemplates = () => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ReportService.getPDFTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching PDF templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PDF templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    refetch: fetchTemplates
  };
};

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ReportService.getEmailTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching email templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch email templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    refetch: fetchTemplates
  };
};

export const useRecentReports = () => {
  const [reports, setReports] = useState<Array<{
    id: string;
    name: string;
    status: ReportStatus;
    generatedAt: string;
    fileUrl: string | null;
    templateName: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ReportService.getRecentPDFReports(20);
      setReports(data);
    } catch (err) {
      console.error('Error fetching recent reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports
  };
};

export const useScheduledReports = () => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduledReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ReportService.getScheduledReports();
      setScheduledReports(data);
    } catch (err) {
      console.error('Error fetching scheduled reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduled reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports]);

  return {
    scheduledReports,
    isLoading,
    error,
    refetch: fetchScheduledReports
  };
};

export const useReportGeneration = () => {
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [reportStatuses, setReportStatuses] = useState<Map<string, {
    status: ReportStatus;
    fileUrl: string | null;
    error: string | null;
  }>>(new Map());

  const generateScheduleReport = async (dateRange: { start: string; end: string }) => {
    const reportId = `schedule-${Date.now()}`;
    setGeneratingReports(prev => new Set([...prev, reportId]));
    
    try {
      const actualReportId = await ReportService.generateScheduleReport(dateRange);
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await ReportService.getPDFReportStatus(actualReportId);
          setReportStatuses(prev => new Map(prev.set(reportId, status)));
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setGeneratingReports(prev => {
              const newSet = new Set(prev);
              newSet.delete(reportId);
              return newSet;
            });
          }
        } catch (error) {
          console.error('Error polling report status:', error);
          clearInterval(pollInterval);
          setGeneratingReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
        }
      }, 2000);

      return reportId;
    } catch (error) {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      throw error;
    }
  };

  const generatePerformanceReport = async (period: 'week' | 'month' | 'quarter') => {
    const reportId = `performance-${period}-${Date.now()}`;
    setGeneratingReports(prev => new Set([...prev, reportId]));
    
    try {
      const actualReportId = await ReportService.generatePerformanceReport(period);
      
      // Poll for completion (similar to schedule report)
      const pollInterval = setInterval(async () => {
        try {
          const status = await ReportService.getPDFReportStatus(actualReportId);
          setReportStatuses(prev => new Map(prev.set(reportId, status)));
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setGeneratingReports(prev => {
              const newSet = new Set(prev);
              newSet.delete(reportId);
              return newSet;
            });
          }
        } catch (error) {
          console.error('Error polling report status:', error);
          clearInterval(pollInterval);
          setGeneratingReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
        }
      }, 2000);

      return reportId;
    } catch (error) {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      throw error;
    }
  };

  const generateAnalyticsReport = async () => {
    const reportId = `analytics-${Date.now()}`;
    setGeneratingReports(prev => new Set([...prev, reportId]));
    
    try {
      const actualReportId = await ReportService.generateAnalyticsReport();
      
      // Poll for completion (similar to other reports)
      const pollInterval = setInterval(async () => {
        try {
          const status = await ReportService.getPDFReportStatus(actualReportId);
          setReportStatuses(prev => new Map(prev.set(reportId, status)));
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setGeneratingReports(prev => {
              const newSet = new Set(prev);
              newSet.delete(reportId);
              return newSet;
            });
          }
        } catch (error) {
          console.error('Error polling report status:', error);
          clearInterval(pollInterval);
          setGeneratingReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
        }
      }, 2000);

      return reportId;
    } catch (error) {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      throw error;
    }
  };

  const generateCustomPDFReport = async (request: {
    templateId: string;
    name: string;
    variables: Record<string, any>;
  }) => {
    const reportId = `custom-${Date.now()}`;
    setGeneratingReports(prev => new Set([...prev, reportId]));
    
    try {
      const actualReportId = await ReportService.generatePDFReport(request);
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await ReportService.getPDFReportStatus(actualReportId);
          setReportStatuses(prev => new Map(prev.set(reportId, status)));
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setGeneratingReports(prev => {
              const newSet = new Set(prev);
              newSet.delete(reportId);
              return newSet;
            });
          }
        } catch (error) {
          console.error('Error polling report status:', error);
          clearInterval(pollInterval);
          setGeneratingReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
        }
      }, 2000);

      return reportId;
    } catch (error) {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      throw error;
    }
  };

  const sendEmailReport = async (request: {
    templateId: string;
    toAddresses: string[];
    ccAddresses?: string[];
    variables: Record<string, any>;
    attachments?: Array<{
      name: string;
      url: string;
    }>;
  }) => {
    return await ReportService.sendEmailReport(request);
  };

  return {
    generatingReports,
    reportStatuses,
    generateScheduleReport,
    generatePerformanceReport,
    generateAnalyticsReport,
    generateCustomPDFReport,
    sendEmailReport
  };
};

export const useReportScheduling = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createScheduledReport = async (request: {
    name: string;
    templateId: string;
    templateType: 'pdf' | 'email';
    cronExpression: string;
    timezone: string;
    recipients: string[];
    variables: Record<string, any>;
  }) => {
    setIsCreating(true);
    try {
      const scheduleId = await ReportService.createScheduledReport(request);
      return scheduleId;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createScheduledReport,
    isCreating
  };
};