// Think Tank Technologies Installation Scheduler - Error Report Component

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronRight, 
  Download,
  Filter,
  Search,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { ValidationError, ProcessingResult } from '../../types';

interface ErrorReportProps {
  result: ProcessingResult;
  onDownloadReport?: () => void;
  className?: string;
}

type ErrorSeverity = 'all' | 'error' | 'warning';
type ErrorCategory = 'all' | 'date' | 'address' | 'contact' | 'format' | 'required';

export const ErrorReport: React.FC<ErrorReportProps> = ({
  result,
  onDownloadReport,
  className = ''
}) => {
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity>('all');
  const [categoryFilter, setCategoryFilter] = useState<ErrorCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Combine errors and warnings
  const allIssues = useMemo(() => {
    return [...result.errors, ...result.warnings].sort((a, b) => a.row - b.row);
  }, [result.errors, result.warnings]);

  // Categorize errors
  const categorizeError = (error: ValidationError): ErrorCategory => {
    const field = error.field.toLowerCase();
    const message = error.message.toLowerCase();

    if (field.includes('date') || message.includes('date')) return 'date';
    if (field.includes('address') || field.includes('street') || field.includes('city') || 
        field.includes('state') || field.includes('zip')) return 'address';
    if (field.includes('phone') || field.includes('email')) return 'contact';
    if (message.includes('format') || message.includes('invalid')) return 'format';
    if (message.includes('required') || message.includes('missing')) return 'required';
    
    return 'format';
  };

  // Filter issues
  const filteredIssues = useMemo(() => {
    return allIssues.filter(issue => {
      // Severity filter
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && categorizeError(issue) !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          issue.field.toLowerCase().includes(searchLower) ||
          issue.message.toLowerCase().includes(searchLower) ||
          String(issue.value).toLowerCase().includes(searchLower) ||
          issue.column.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [allIssues, severityFilter, categoryFilter, searchTerm]);

  // Group issues by row
  const groupedIssues = useMemo(() => {
    const grouped: { [row: number]: ValidationError[] } = {};
    filteredIssues.forEach(issue => {
      if (!grouped[issue.row]) {
        grouped[issue.row] = [];
      }
      grouped[issue.row].push(issue);
    });
    return grouped;
  }, [filteredIssues]);

  // Summary statistics
  const errorStats = useMemo(() => {
    const stats = {
      totalErrors: result.errors.length,
      totalWarnings: result.warnings.length,
      affectedRows: new Set([...result.errors, ...result.warnings].map(e => e.row)).size,
      categories: {} as { [key: string]: number }
    };

    allIssues.forEach(issue => {
      const category = categorizeError(issue);
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    return stats;
  }, [result.errors, result.warnings, allIssues]);

  const toggleRowExpansion = (row: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    setExpandedRows(newExpanded);
  };

  const getFieldIcon = (field: string) => {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('date')) return Calendar;
    if (fieldLower.includes('address') || fieldLower.includes('street') || 
        fieldLower.includes('city') || fieldLower.includes('state') || fieldLower.includes('zip')) return MapPin;
    if (fieldLower.includes('phone')) return Phone;
    if (fieldLower.includes('email')) return Mail;
    if (fieldLower.includes('customer') || fieldLower.includes('name')) return User;
    return AlertTriangle;
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' 
      ? 'text-error-600 bg-error-100' 
      : 'text-yellow-600 bg-yellow-100';
  };

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? XCircle : AlertTriangle;
  };

  if (allIssues.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body text-center py-12">
          <div className="text-success-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            No Issues Found
          </h3>
          <p className="text-primary-600">
            All data has been successfully validated without any errors or warnings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Data Quality Report
            </h3>
            <p className="text-primary-600">
              Review and resolve data validation issues before importing
            </p>
          </div>
          
          {onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </button>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-error-50 rounded-lg p-4 border border-error-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-error-600">Errors</p>
                <p className="text-2xl font-semibold text-error-900">
                  {errorStats.totalErrors}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-error-500" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Warnings</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {errorStats.totalWarnings}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600">Affected Rows</p>
                <p className="text-2xl font-semibold text-primary-900">
                  {errorStats.affectedRows}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-accent-50 rounded-lg p-4 border border-accent-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-accent-600">Total Issues</p>
                <p className="text-2xl font-semibold text-accent-900">
                  {allIssues.length}
                </p>
              </div>
              <Filter className="h-8 w-8 text-accent-500" />
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6 bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="font-medium text-primary-900 mb-3">Issues by Category</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {Object.entries(errorStats.categories).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-primary-600 capitalize">{category}:</span>
                <span className="font-medium text-primary-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg border border-primary-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-primary-600" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as ErrorSeverity)}
              className="border border-primary-300 rounded-md px-3 py-1 text-sm focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="all">All Severities</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-primary-600">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ErrorCategory)}
              className="border border-primary-300 rounded-md px-3 py-1 text-sm focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="all">All Categories</option>
              <option value="required">Required Fields</option>
              <option value="format">Format Issues</option>
              <option value="date">Date/Time</option>
              <option value="address">Address</option>
              <option value="contact">Contact Info</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-primary-600" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-primary-300 rounded-md px-3 py-1 text-sm focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-2">
          {Object.entries(groupedIssues).map(([rowStr, issues]) => {
            const row = parseInt(rowStr);
            const isExpanded = expandedRows.has(row);
            const errorCount = issues.filter(i => i.severity === 'error').length;
            const warningCount = issues.filter(i => i.severity === 'warning').length;

            return (
              <div key={row} className="border border-primary-200 rounded-lg">
                <button
                  onClick={() => toggleRowExpansion(row)}
                  className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-t-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-primary-600" />
                    )}
                    <span className="font-medium text-primary-900">Row {row}</span>
                    <div className="flex space-x-2">
                      {errorCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
                          {errorCount} error{errorCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {warningCount} warning{warningCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-primary-500">{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
                </button>

                {isExpanded && (
                  <div className="px-4 py-3 space-y-3 bg-white rounded-b-lg">
                    {issues.map((issue, index) => {
                      const Icon = getSeverityIcon(issue.severity);
                      const FieldIcon = getFieldIcon(issue.field);

                      return (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-primary-100">
                          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            issue.severity === 'error' ? 'text-error-500' : 'text-yellow-500'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <FieldIcon className="h-4 w-4 text-primary-500" />
                              <span className="font-medium text-primary-900">{issue.field}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                {issue.severity}
                              </span>
                            </div>
                            
                            <p className="text-primary-700 mb-2">{issue.message}</p>
                            
                            <div className="text-sm text-primary-600 space-y-1">
                              <div>
                                <span className="font-medium">Column:</span> {issue.column}
                              </div>
                              {issue.value && (
                                <div>
                                  <span className="font-medium">Value:</span> 
                                  <span className="ml-2 px-2 py-1 bg-primary-100 rounded text-xs font-mono">
                                    {String(issue.value)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredIssues.length === 0 && allIssues.length > 0 && (
          <div className="text-center py-8">
            <div className="text-primary-400 mb-4">
              <Search className="mx-auto h-12 w-12" />
            </div>
            <h4 className="text-lg font-medium text-primary-900 mb-2">
              No issues match your filters
            </h4>
            <p className="text-primary-600">
              Try adjusting your filters or search terms to see more results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorReport;