// Think Tank Technologies Installation Scheduler - Data Preview Component

import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { ProcessedJobData, ProcessingResult } from '../../types';

interface DataPreviewProps {
  result: ProcessingResult;
  onAccept?: (data: ProcessedJobData[]) => void;
  onReject?: () => void;
  className?: string;
}

type FilterType = 'all' | 'valid' | 'errors' | 'warnings';

export const DataPreview: React.FC<DataPreviewProps> = ({
  result,
  onAccept,
  onReject,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set([
    'customerName',
    'installDate',
    'address',
    'customerPhone',
    'installationType',
    'specifications',
    'notes'
  ]));

  // Get rows with error/warning information
  const rowsWithStatus = useMemo(() => {
    const errorRows = new Set(result.errors.map(e => e.row));
    const warningRows = new Set(result.warnings.map(e => e.row));
    
    return result.validData.map((data, index) => {
      const rowNumber = index + 2; // +2 because Excel starts from row 2 (after header)
      return {
        ...data,
        _rowNumber: rowNumber,
        _hasErrors: errorRows.has(rowNumber),
        _hasWarnings: warningRows.has(rowNumber),
        _errors: result.errors.filter(e => e.row === rowNumber),
        _warnings: result.warnings.filter(e => e.row === rowNumber)
      };
    });
  }, [result]);

  // Filter data based on selected filter
  const filteredData = useMemo(() => {
    switch (filter) {
      case 'valid':
        return rowsWithStatus.filter(row => !row._hasErrors && !row._hasWarnings);
      case 'errors':
        return rowsWithStatus.filter(row => row._hasErrors);
      case 'warnings':
        return rowsWithStatus.filter(row => row._hasWarnings);
      default:
        return rowsWithStatus;
    }
  }, [rowsWithStatus, filter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Available columns for selection
  const availableColumns = [
    { key: 'customerName', label: 'Customer Name', icon: Building },
    { key: 'customerPhone', label: 'Phone', icon: Phone },
    { key: 'customerEmail', label: 'Email', icon: Mail },
    { key: 'installDate', label: 'Install Date', icon: Calendar },
    { key: 'installTime', label: 'Install Time', icon: Calendar },
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'installationType', label: 'Installation Type', icon: Building },
    { key: 'specifications', label: 'Specifications', icon: Eye },
    { key: 'priority', label: 'Priority', icon: AlertTriangle },
    { key: 'region', label: 'Region', icon: MapPin },
    { key: 'notes', label: 'Notes', icon: Eye }
  ];

  const toggleColumn = (columnKey: string) => {
    const newSelection = new Set(selectedColumns);
    if (newSelection.has(columnKey)) {
      newSelection.delete(columnKey);
    } else {
      newSelection.add(columnKey);
    }
    setSelectedColumns(newSelection);
  };

  const formatAddress = (address: any): string => {
    if (!address) return '';
    const parts = [address.street, address.city, address.state, address.zipCode];
    return parts.filter(Boolean).join(', ');
  };

  const formatCellValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '';
    if (value === '') return '(empty)';
    
    switch (key) {
      case 'address':
        return formatAddress(value);
      case 'installDate':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case 'priority':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'specifications':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'notes':
        return String(value);
      default:
        return String(value);
    }
  };

  const getRowStatusColor = (row: any): string => {
    if (row._hasErrors) return 'bg-error-50 border-error-200';
    if (row._hasWarnings) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-primary-200';
  };

  const getStatusIcon = (row: any) => {
    if (row._hasErrors) return <XCircle className="h-4 w-4 text-error-500" />;
    if (row._hasWarnings) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-success-500" />;
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Data Preview
            </h3>
            <p className="text-primary-600">
              Review the processed data before importing to your schedule
            </p>
          </div>
          
          <div className="flex space-x-3">
            {onReject && (
              <button onClick={onReject} className="btn-secondary">
                Cancel
              </button>
            )}
            {onAccept && (
              <button
                onClick={() => onAccept(result.validData)}
                className="btn-primary inline-flex items-center space-x-2"
                disabled={result.validData.length === 0}
              >
                <Download className="h-4 w-4" />
                <span>Import {result.validData.length} Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600">Total Records</p>
                <p className="text-2xl font-semibold text-primary-900">
                  {result.metadata.totalRows}
                </p>
              </div>
              <Building className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-success-50 rounded-lg p-4 border border-success-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-success-600">Valid Records</p>
                <p className="text-2xl font-semibold text-success-900">
                  {result.metadata.validRows}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Warnings</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {result.warnings.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-error-50 rounded-lg p-4 border border-error-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-error-600">Errors</p>
                <p className="text-2xl font-semibold text-error-900">
                  {result.errors.length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-error-500" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-primary-600" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as FilterType);
                setCurrentPage(1);
              }}
              className="border border-primary-300 rounded-md px-3 py-1 text-sm focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="all">All Records ({rowsWithStatus.length})</option>
              <option value="valid">Valid Only ({rowsWithStatus.filter(r => !r._hasErrors && !r._hasWarnings).length})</option>
              <option value="warnings">Warnings ({rowsWithStatus.filter(r => r._hasWarnings).length})</option>
              <option value="errors">Errors ({rowsWithStatus.filter(r => r._hasErrors).length})</option>
            </select>
          </div>

          {/* Items per page */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-primary-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-primary-300 rounded-md px-3 py-1 text-sm focus:ring-accent-500 focus:border-accent-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Column visibility */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-primary-600">Columns:</span>
            <div className="flex flex-wrap gap-1">
              {availableColumns.map(column => (
                <button
                  key={column.key}
                  onClick={() => toggleColumn(column.key)}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                    selectedColumns.has(column.key)
                      ? 'bg-accent-100 text-accent-700 border border-accent-300'
                      : 'bg-white text-primary-600 border border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  {selectedColumns.has(column.key) ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  <span>{column.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-200">
            <thead className="bg-primary-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Row
                </th>
                {availableColumns
                  .filter(col => selectedColumns.has(col.key))
                  .map(column => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider"
                    >
                      <div className="flex items-center space-x-1">
                        <column.icon className="h-3 w-3" />
                        <span>{column.label}</span>
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200">
              {paginatedData.map((row, _) => (
                <tr key={row.id} className={`${getRowStatusColor(row)} hover:bg-primary-50`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusIcon(row)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-900">
                    {row._rowNumber}
                  </td>
                  {availableColumns
                    .filter(col => selectedColumns.has(col.key))
                    .map(column => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-primary-900 max-w-xs truncate"
                        title={formatCellValue(column.key, row[column.key as keyof ProcessedJobData])}
                      >
                        {formatCellValue(column.key, row[column.key as keyof ProcessedJobData])}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4 py-3 bg-primary-50 rounded-lg border border-primary-200">
            <div className="text-sm text-primary-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-accent-600 text-white'
                          : 'text-primary-700 bg-white border border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreview;