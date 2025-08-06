// Think Tank Technologies Installation Scheduler - Data Export Component

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Settings
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ProcessingResult } from '../../types';

interface DataExportProps {
  result: ProcessingResult;
  className?: string;
}

type ExportFormat = 'xlsx' | 'csv' | 'json';
type ExportType = 'valid_data' | 'all_data' | 'errors_only' | 'processing_report';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  includeMetadata: boolean;
  includeHeaders: boolean;
  dateFormat: 'iso' | 'us' | 'excel';
}

export const DataExport: React.FC<DataExportProps> = ({
  result,
  className = ''
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    type: 'valid_data',
    includeMetadata: true,
    includeHeaders: true,
    dateFormat: 'us'
  });
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateStr: string, format: 'iso' | 'us' | 'excel'): string => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    switch (format) {
      case 'iso':
        return date.toISOString().split('T')[0];
      case 'us':
        return date.toLocaleDateString('en-US');
      case 'excel':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
      default:
        return dateStr;
    }
  };

  const formatAddress = (address: any): string => {
    if (!address) return '';
    const parts = [address.street, address.city, address.state, address.zipCode];
    return parts.filter(Boolean).join(', ');
  };

  const prepareValidData = (): any[] => {
    return result.validData.map(item => ({
      'Job ID': item.jobId || '',
      'Store Number': item.storeNumber || '',
      'Customer Name': item.customerName,
      'Customer Phone': item.customerPhone,
      'Customer Email': item.customerEmail,
      'Street Address': item.address?.street || '',
      'City': item.address?.city || '',
      'State': item.address?.state || '',
      'ZIP Code': item.address?.zipCode || '',
      'Full Address': formatAddress(item.address),
      'Install Date': formatDate(item.installDate, exportOptions.dateFormat),
      'Install Time': item.installTime || '',
      'Duration (Minutes)': item.duration || '',
      'Installation Type': item.installationType,
      'Specifications': Array.isArray(item.specifications) ? item.specifications.join('; ') : item.specifications || '',
      'Requirements': item.requirements || '',
      'Priority': item.priority,
      'Region': item.region || '',
      'Notes': item.notes || '',
      'Created At': formatDate(item.createdAt, exportOptions.dateFormat)
    }));
  };

  const prepareErrorData = (): any[] => {
    const allErrors = [...result.errors, ...result.warnings];
    return allErrors.map(error => ({
      'Row Number': error.row,
      'Severity': error.severity.toUpperCase(),
      'Field': error.field,
      'Column': error.column,
      'Value': error.value || '',
      'Error Message': error.message
    }));
  };

  const prepareProcessingReport = (): any[] => {
    const report = [
      { 'Metric': 'File Name', 'Value': result.metadata.fileName },
      { 'Metric': 'File Size', 'Value': `${(result.metadata.fileSize / 1024).toFixed(2)} KB` },
      { 'Metric': 'File Type', 'Value': result.metadata.fileType },
      { 'Metric': 'Total Rows', 'Value': result.metadata.totalRows },
      { 'Metric': 'Valid Rows', 'Value': result.metadata.validRows },
      { 'Metric': 'Error Rows', 'Value': result.metadata.errorRows },
      { 'Metric': 'Warning Rows', 'Value': result.metadata.warningRows },
      { 'Metric': 'Total Errors', 'Value': result.errors.length },
      { 'Metric': 'Total Warnings', 'Value': result.warnings.length },
      { 'Metric': 'Processed At', 'Value': formatDate(result.metadata.processedAt, exportOptions.dateFormat) }
    ];

    if (result.metadata.dateRange) {
      report.push(
        { 'Metric': 'Date Range Start', 'Value': formatDate(result.metadata.dateRange.start, exportOptions.dateFormat) },
        { 'Metric': 'Date Range End', 'Value': formatDate(result.metadata.dateRange.end, exportOptions.dateFormat) }
      );
    }

    if (result.metadata.regionsDetected.length > 0) {
      report.push({ 'Metric': 'Regions Detected', 'Value': result.metadata.regionsDetected.join(', ') });
    }

    if (result.metadata.installationTypes.length > 0) {
      report.push({ 'Metric': 'Installation Types', 'Value': result.metadata.installationTypes.join(', ') });
    }

    return report;
  };

  const getData = (): any[] => {
    switch (exportOptions.type) {
      case 'valid_data':
        return prepareValidData();
      case 'errors_only':
        return prepareErrorData();
      case 'processing_report':
        return prepareProcessingReport();
      case 'all_data':
      default:
        return prepareValidData();
    }
  };

  const getFileName = (): string => {
    const baseFileName = result.metadata.fileName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (exportOptions.type) {
      case 'valid_data':
        return `${baseFileName}_valid_data_${timestamp}`;
      case 'errors_only':
        return `${baseFileName}_errors_${timestamp}`;
      case 'processing_report':
        return `${baseFileName}_report_${timestamp}`;
      case 'all_data':
      default:
        return `${baseFileName}_processed_${timestamp}`;
    }
  };

  const exportToExcel = async (data: any[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    
    // Add main data worksheet
    const worksheet = workbook.addWorksheet('Data');
    
    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Add data rows
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
      
      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    // Add metadata sheet if requested
    if (exportOptions.includeMetadata && exportOptions.type !== 'processing_report') {
      const metadataWorksheet = workbook.addWorksheet('Metadata');
      const metadataData = prepareProcessingReport();
      
      if (metadataData.length > 0) {
        const metadataHeaders = Object.keys(metadataData[0]);
        metadataWorksheet.addRow(metadataHeaders);
        
        metadataData.forEach(row => {
          metadataWorksheet.addRow(Object.values(row));
        });
        
        // Style the header row
        const metadataHeaderRow = metadataWorksheet.getRow(1);
        metadataHeaderRow.font = { bold: true };
        metadataHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
    }

    // Add error sheet if exporting valid data and there are errors
    if (exportOptions.type === 'valid_data' && (result.errors.length > 0 || result.warnings.length > 0)) {
      const errorWorksheet = workbook.addWorksheet('Issues');
      const errorData = prepareErrorData();
      
      if (errorData.length > 0) {
        const errorHeaders = Object.keys(errorData[0]);
        errorWorksheet.addRow(errorHeaders);
        
        errorData.forEach(row => {
          errorWorksheet.addRow(Object.values(row));
        });
        
        // Style the header row
        const errorHeaderRow = errorWorksheet.getRow(1);
        errorHeaderRow.font = { bold: true };
        errorHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }
        };
      }
    }

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  const exportToCSV = async (data: any[], fileName: string) => {
    if (data.length === 0) {
      const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(header => `"${header}"`).join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if needed
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  };

  const exportToJSON = async (data: any[], fileName: string) => {
    const exportData = {
      metadata: result.metadata,
      data: data,
      ...(exportOptions.includeMetadata && {
        schemaMap: result.schemaMap,
        errors: result.errors,
        warnings: result.warnings
      })
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${fileName}.json`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = getData();
      const fileName = getFileName();

      switch (exportOptions.format) {
        case 'xlsx':
          await exportToExcel(data, fileName);
          break;
        case 'csv':
          await exportToCSV(data, fileName);
          break;
        case 'json':
          await exportToJSON(data, fileName);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const getExportDescription = (): string => {
    switch (exportOptions.type) {
      case 'valid_data':
        return `Export ${result.validData.length} valid records that passed all validation checks`;
      case 'errors_only':
        return `Export ${result.errors.length + result.warnings.length} validation issues for review`;
      case 'processing_report':
        return 'Export detailed processing statistics and metadata';
      case 'all_data':
      default:
        return `Export all ${result.metadata.totalRows} processed records including validation status`;
    }
  };

  const getExportIcon = () => {
    switch (exportOptions.format) {
      case 'xlsx':
        return FileSpreadsheet;
      case 'csv':
        return FileSpreadsheet;
      case 'json':
        return FileText;
      default:
        return Download;
    }
  };

  const ExportIcon = getExportIcon();

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Export Data
        </h3>

        {/* Export Type Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Export Content
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setExportOptions({ ...exportOptions, type: 'valid_data' })}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportOptions.type === 'valid_data'
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-primary-300 hover:border-accent-400 hover:bg-accent-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                  <div>
                    <div className="font-medium text-primary-900">Valid Data Only</div>
                    <div className="text-sm text-primary-600">{result.validData.length} records</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportOptions({ ...exportOptions, type: 'errors_only' })}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportOptions.type === 'errors_only'
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-primary-300 hover:border-accent-400 hover:bg-accent-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-error-500" />
                  <div>
                    <div className="font-medium text-primary-900">Issues Report</div>
                    <div className="text-sm text-primary-600">
                      {result.errors.length + result.warnings.length} issues
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportOptions({ ...exportOptions, type: 'processing_report' })}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportOptions.type === 'processing_report'
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-primary-300 hover:border-accent-400 hover:bg-accent-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="font-medium text-primary-900">Processing Report</div>
                    <div className="text-sm text-primary-600">Metadata & statistics</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setExportOptions({ ...exportOptions, type: 'all_data' })}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportOptions.type === 'all_data'
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-primary-300 hover:border-accent-400 hover:bg-accent-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-accent-500" />
                  <div>
                    <div className="font-medium text-primary-900">Complete Dataset</div>
                    <div className="text-sm text-primary-600">All processed data</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Format and Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              File Format
            </label>
            <select
              value={exportOptions.format}
              onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as ExportFormat })}
              className="w-full border border-primary-300 rounded-md px-3 py-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Date Format
            </label>
            <select
              value={exportOptions.dateFormat}
              onChange={(e) => setExportOptions({ ...exportOptions, dateFormat: e.target.value as any })}
              className="w-full border border-primary-300 rounded-md px-3 py-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="us">US Format (MM/DD/YYYY)</option>
              <option value="iso">ISO Format (YYYY-MM-DD)</option>
              <option value="excel">Excel Format (MM/DD/YYYY)</option>
            </select>
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3 mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h4 className="font-medium text-primary-900 flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Export Options</span>
          </h4>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeHeaders}
                onChange={(e) => setExportOptions({ ...exportOptions, includeHeaders: e.target.checked })}
                className="rounded border-primary-300 text-accent-600 focus:ring-accent-500"
              />
              <span className="ml-2 text-sm text-primary-700">Include column headers</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => setExportOptions({ ...exportOptions, includeMetadata: e.target.checked })}
                className="rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                disabled={exportOptions.type === 'processing_report'}
              />
              <span className="ml-2 text-sm text-primary-700">
                Include processing metadata 
                {exportOptions.format === 'xlsx' && ' (as separate sheet)'}
              </span>
            </label>
          </div>
        </div>

        {/* Export Preview */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-primary-200">
          <h4 className="font-medium text-primary-900 mb-2">Export Preview</h4>
          <p className="text-sm text-primary-600 mb-3">{getExportDescription()}</p>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-primary-600">Format:</span>
              <span className="font-medium text-primary-900">{exportOptions.format.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-600">Estimated file name:</span>
              <span className="font-medium text-primary-900">{getFileName()}.{exportOptions.format}</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn-primary w-full inline-flex items-center justify-center space-x-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <ExportIcon className="h-4 w-4" />
              <span>Export Data</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DataExport;