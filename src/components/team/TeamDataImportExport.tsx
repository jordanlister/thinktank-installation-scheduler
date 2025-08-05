// Think Tank Technologies - Team Data Import/Export Component

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X,
  RefreshCw,
  FileSpreadsheet,
  Database,
  Users
} from 'lucide-react';
import { useTeamStore } from '../../stores/useTeamStore';
import { TeamDataManager } from '../../utils/teamManagement';
import type { TeamMember, BulkTeamOperation } from '../../types';
import ExcelJS from 'exceljs';

interface TeamDataImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
}

const TeamDataImportExport: React.FC<TeamDataImportExportProps> = ({ isOpen, onClose, mode }) => {
  const {
    teamMembers,
    addTeamMember,
    startBulkOperation,
    setLoading,
    setError
  } = useTeamStore();

  const [dragOver, setDragOver] = useState(false);
  const [importData, setImportData] = useState<Partial<TeamMember>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export functionality
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setProcessing(true);

      if (format === 'csv') {
        const csvContent = TeamDataManager.exportTeamMembersToCSV(teamMembers);
        downloadFile(csvContent, 'team_members.csv', 'text/csv');
      } else if (format === 'excel') {
        await exportToExcel();
      }

      setProcessing(false);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export team data');
      setProcessing(false);
    }
  };

  const exportToExcel = async () => {
    // Create workbook with multiple sheets
    const workbook = new ExcelJS.Workbook();
    
    // Team Members Sheet
    const teamData = teamMembers.map(member => ({
      'ID': member.id,
      'First Name': member.firstName,
      'Last Name': member.lastName,
      'Email': member.email,
      'Role': member.role,
      'Region': member.region,
      'Sub Regions': member.subRegions.join(', '),
      'Active': member.isActive ? 'Yes' : 'No',
      'Capacity': member.capacity,
      'Travel Radius': member.travelRadius,
      'Skills Count': member.skills?.length || 0,
      'Certifications Count': member.certifications?.length || 0,
      'Equipment Count': member.equipment?.length || 0,
      'Performance Score': member.performanceMetrics ? (
        member.performanceMetrics.completionRate * 0.3 +
        member.performanceMetrics.customerSatisfaction * 0.3 +
        member.performanceMetrics.qualityScore * 0.4
      ).toFixed(2) : 'N/A',
      'Hire Date': member.employmentInfo?.hireDate || '',
      'Job Title': member.employmentInfo?.jobTitle || '',
      'Emergency Contact': member.emergencyContact?.name || '',
      'Emergency Phone': member.emergencyContact?.phoneNumber || ''
    }));
    
    const teamSheet = workbook.addWorksheet('Team Members');
    if (teamData.length > 0) {
      const headers = Object.keys(teamData[0]);
      teamSheet.addRow(headers);
      teamData.forEach(row => {
        teamSheet.addRow(Object.values(row));
      });
      
      // Style the header row
      const headerRow = teamSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    // Skills Sheet
    const skillsData: any[] = [];
    teamMembers.forEach(member => {
      member.skills?.forEach(skill => {
        skillsData.push({
          'Team Member': `${member.firstName} ${member.lastName}`,
          'Skill Name': skill.name,
          'Category': skill.category,
          'Level': skill.level,
          'Acquired Date': skill.acquiredDate,
          'Last Assessed': skill.lastAssessed || '',
          'Assessed By': skill.assessedBy || ''
        });
      });
    });
    
    if (skillsData.length > 0) {
      const skillsSheet = workbook.addWorksheet('Skills');
      const skillsHeaders = Object.keys(skillsData[0]);
      skillsSheet.addRow(skillsHeaders);
      skillsData.forEach(row => {
        skillsSheet.addRow(Object.values(row));
      });
      
      // Style the header row
      const skillsHeaderRow = skillsSheet.getRow(1);
      skillsHeaderRow.font = { bold: true };
      skillsHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    // Certifications Sheet
    const certsData: any[] = [];
    teamMembers.forEach(member => {
      member.certifications?.forEach(cert => {
        certsData.push({
          'Team Member': `${member.firstName} ${member.lastName}`,
          'Certification': cert.name,
          'Issuer': cert.issuer,
          'Issue Date': cert.issueDate,
          'Expiration Date': cert.expirationDate || '',
          'Status': cert.status,
          'Cost': cert.cost || ''
        });
      });
    });
    
    if (certsData.length > 0) {
      const certsSheet = workbook.addWorksheet('Certifications');
      const certsHeaders = Object.keys(certsData[0]);
      certsSheet.addRow(certsHeaders);
      certsData.forEach(row => {
        certsSheet.addRow(Object.values(row));
      });
      
      // Style the header row
      const certsHeaderRow = certsSheet.getRow(1);
      certsHeaderRow.font = { bold: true };
      certsHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_data.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Import functionality
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let parsedData: Partial<TeamMember>[] = [];
        
        if (file.name.endsWith('.csv')) {
          parsedData = TeamDataManager.parseTeamMembersFromCSV(content);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          parsedData = await parseExcelFile(content);
        } else {
          throw new Error('Unsupported file format');
        }
        
        // Validate data
        const errors = validateImportData(parsedData);
        setValidationErrors(errors);
        setImportData(parsedData);
        setPreviewMode(true);
      } catch (error) {
        console.error('File parsing error:', error);
        setError('Failed to parse file. Please check the format and try again.');
      }
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const parseExcelFile = async (binaryString: string): Promise<Partial<TeamMember>[]> => {
    const workbook = new ExcelJS.Workbook();
    const buffer = Buffer.from(binaryString, 'binary');
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel file appears to be empty');
    }
    
    const jsonData: any[] = [];
    let headers: string[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as any[];
      const cleanValues = values.slice(1); // Remove the first undefined element
      
      if (rowNumber === 1) {
        headers = cleanValues.map(value => value ? String(value).trim() : '');
      } else {
        const obj: any = {};
        headers.forEach((header, colIndex) => {
          const cellValue = cleanValues[colIndex];
          obj[header] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';
        });
        jsonData.push(obj);
      }
    });
    
    return jsonData.map((row: any) => ({
      firstName: row['First Name'] || row['first_name'] || '',
      lastName: row['Last Name'] || row['last_name'] || '',
      email: row['Email'] || row['email'] || '',
      role: (row['Role'] || row['role'] || 'assistant').toLowerCase(),
      region: row['Region'] || row['region'] || '',
      isActive: row['Active'] === 'Yes' || row['active'] === true,
      capacity: parseInt(row['Capacity'] || row['capacity']) || 3,
      travelRadius: parseInt(row['Travel Radius'] || row['travel_radius']) || 50
    }));
  };

  const validateImportData = (data: Partial<TeamMember>[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((member, index) => {
      const rowNum = index + 1;
      
      if (!member.firstName?.trim()) {
        errors.push(`Row ${rowNum}: First name is required`);
      }
      
      if (!member.lastName?.trim()) {
        errors.push(`Row ${rowNum}: Last name is required`);
      }
      
      if (!member.email?.trim()) {
        errors.push(`Row ${rowNum}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        errors.push(`Row ${rowNum}: Invalid email format`);
      }
      
      if (!member.region?.trim()) {
        errors.push(`Row ${rowNum}: Region is required`);
      }
      
      if (!['lead', 'assistant', 'admin', 'scheduler'].includes(member.role || '')) {
        errors.push(`Row ${rowNum}: Invalid role`);
      }
    });
    
    return errors;
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Create bulk operation
      const bulkOperation: BulkTeamOperation = {
        id: `import_${Date.now()}`,
        type: 'update_status',
        teamMemberIds: [],
        changes: {},
        requestedBy: 'system',
        requestedAt: new Date().toISOString(),
        status: 'in_progress'
      };
      
      startBulkOperation(bulkOperation);
      
      // Add team members
      for (const memberData of importData) {
        const newMember: TeamMember = {
          ...memberData as TeamMember,
          id: `team_${Date.now()}_${Math.random()}`,
          skills: [],
          certifications: [],
          equipment: [],
          availability: [],
          specializations: [],
          subRegions: [],
          emergencyContact: {
            name: '',
            relationship: '',
            phoneNumber: ''
          },
          workPreferences: {
            preferredStartTime: '08:00',
            preferredEndTime: '17:00',
            maxDailyJobs: 5,
            maxWeeklyHours: 40,
            weekendsAvailable: false,
            overtimeAvailable: false,
            travelPreference: 'regional',
            specialRequests: [],
            unavailableDates: []
          },
          trainingRecord: [],
          employmentInfo: {
            employeeId: '',
            hireDate: new Date().toISOString().split('T')[0],
            department: 'Installation Services',
            jobTitle: memberData.role || 'Installation Technician',
            workLocation: memberData.region || '',
            employmentType: 'full_time',
            status: 'active'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        addTeamMember(newMember);
      }
      
      setProcessing(false);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import team data');
      setProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mode === 'import' ? (
                <Upload className="h-6 w-6 text-blue-600" />
              ) : (
                <Download className="h-6 w-6 text-green-600" />
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'import' ? 'Import Team Data' : 'Export Team Data'}
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {mode === 'export' ? (
            <ExportContent onExport={handleExport} processing={processing} />
          ) : (
            <ImportContent
              onFileSelect={handleFileSelect}
              onImport={handleImport}
              dragOver={dragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              fileInputRef={fileInputRef}
              importData={importData}
              validationErrors={validationErrors}
              processing={processing}
              previewMode={previewMode}
              onBackToUpload={() => setPreviewMode(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Export Content Component
const ExportContent: React.FC<{
  onExport: (format: 'csv' | 'excel') => void;
  processing: boolean;
}> = ({ onExport, processing }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Export Team Data</h3>
        <p className="text-gray-600">
          Download your team member data in your preferred format
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onExport('csv')}
          disabled={processing}
          className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <FileText className="h-8 w-8 text-gray-400" />
          <div className="text-left">
            <div className="font-medium text-gray-900">CSV Format</div>
            <div className="text-sm text-gray-600">Simple comma-separated values</div>
          </div>
        </button>

        <button
          onClick={() => onExport('excel')}
          disabled={processing}
          className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="h-8 w-8 text-gray-400" />
          <div className="text-left">
            <div className="font-medium text-gray-900">Excel Format</div>
            <div className="text-sm text-gray-600">Multi-sheet with skills & certifications</div>
          </div>
        </button>
      </div>

      {processing && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Generating export file...</span>
        </div>
      )}
    </div>
  );
};

// Import Content Component
const ImportContent: React.FC<{
  onFileSelect: (files: FileList | null) => void;
  onImport: () => void;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  importData: Partial<TeamMember>[];
  validationErrors: string[];
  processing: boolean;
  previewMode: boolean;
  onBackToUpload: () => void;
}> = ({
  onFileSelect,
  onImport,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  importData,
  validationErrors,
  processing,
  previewMode,
  onBackToUpload
}) => {
  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Import Preview</h3>
          <button
            onClick={onBackToUpload}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Upload
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Validation Errors</h4>
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {importData.length} team members to import
            </span>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Region</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {importData.slice(0, 10).map((member, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{member.firstName} {member.lastName}</td>
                    <td className="px-4 py-2">{member.email}</td>
                    <td className="px-4 py-2 capitalize">{member.role}</td>
                    <td className="px-4 py-2">{member.region}</td>
                    <td className="px-4 py-2">
                      {member.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {importData.length > 10 && (
              <div className="p-4 text-center text-gray-500">
                ... and {importData.length - 10} more rows
              </div>
            )}
          </div>
        </div>

        {/* Import Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onBackToUpload}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={validationErrors.length > 0 || processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Importing...</span>
              </div>
            ) : (
              `Import ${importData.length} Team Members`
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Import Team Data</h3>
        <p className="text-gray-600">
          Upload a CSV or Excel file with your team member information
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your file here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-600">
          Supports CSV and Excel (.xlsx, .xls) files
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => onFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Format Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Required Columns</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>First Name</strong> - Team member's first name</p>
          <p>• <strong>Last Name</strong> - Team member's last name</p>
          <p>• <strong>Email</strong> - Valid email address</p>
          <p>• <strong>Role</strong> - lead, assistant, admin, or scheduler</p>
          <p>• <strong>Region</strong> - Primary work region</p>
          <p>• <strong>Active</strong> - Yes/No or true/false</p>
        </div>
      </div>
    </div>
  );
};

export default TeamDataImportExport;