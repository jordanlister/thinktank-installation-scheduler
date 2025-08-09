// Think Tank Technologies - Data Import/Export Service
// Handles organization-scoped data import/export with validation and transformation

import { MultiTenantService, TenantContext } from './multiTenantService';
import { supabase } from './supabase';

export interface ImportJob {
  id: string;
  organizationId: string;
  projectId?: string;
  name: string;
  dataType: 'installations' | 'team_members' | 'assignments' | 'customers' | 'all';
  format: 'csv' | 'json' | 'xlsx' | 'xml';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  filename: string;
  fileSize: number;
  fileUrl?: string;
  totalRecords: number;
  processedRecords: number;
  successRecords: number;
  errorRecords: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  settings: {
    skipHeader: boolean;
    delimiter: string;
    encoding: string;
    duplicateHandling: 'skip' | 'update' | 'error';
    validationLevel: 'strict' | 'lenient';
    fieldMappings: Record<string, string>;
    transformations: Array<{
      field: string;
      type: 'uppercase' | 'lowercase' | 'trim' | 'format_phone' | 'format_email' | 'custom';
      value?: string;
    }>;
  };
  progress: {
    stage: 'uploading' | 'validating' | 'importing' | 'completed';
    percentage: number;
    currentRecord: number;
    estimatedTimeRemaining?: number;
  };
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  summary?: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

export interface ExportJob {
  id: string;
  organizationId: string;
  projectId?: string;
  name: string;
  dataType: 'installations' | 'team_members' | 'assignments' | 'reports' | 'all';
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  filename: string;
  fileUrl?: string;
  totalRecords: number;
  filters: {
    dateRange?: {
      start: string;
      end: string;
    };
    status?: string[];
    teamMembers?: string[];
    regions?: string[];
    customFilters?: Record<string, any>;
  };
  settings: {
    includeHeaders: boolean;
    delimiter: string;
    encoding: string;
    fields: string[];
    groupBy?: string[];
    sortBy?: Array<{
      field: string;
      direction: 'asc' | 'desc';
    }>;
  };
  progress: {
    stage: 'preparing' | 'extracting' | 'formatting' | 'uploading' | 'completed';
    percentage: number;
    currentRecord: number;
  };
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

export interface ImportResult {
  jobId: string;
  status: 'success' | 'partial' | 'failed';
  summary: {
    totalRecords: number;
    successRecords: number;
    errorRecords: number;
    created: number;
    updated: number;
    skipped: number;
  };
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  warnings: string[];
}

export interface ExportResult {
  jobId: string;
  status: 'success' | 'failed';
  filename: string;
  fileUrl: string;
  fileSize: number;
  recordCount: number;
  expiresAt: string;
}

export interface DataTemplate {
  dataType: string;
  format: string;
  templateUrl: string;
  sampleUrl?: string;
  fields: Array<{
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'date' | 'email' | 'phone' | 'boolean';
    required: boolean;
    description: string;
    example: string;
    validation?: {
      pattern?: string;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      enum?: string[];
    };
  }>;
  instructions: string;
}

export class DataImportExportService extends MultiTenantService {

  /**
   * Start data import process
   */
  async startImport(importRequest: {
    name: string;
    dataType: ImportJob['dataType'];
    format: ImportJob['format'];
    fileUrl: string;
    filename: string;
    fileSize: number;
    projectId?: string;
    settings?: Partial<ImportJob['settings']>;
  }): Promise<ImportJob> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to import data');
    }

    try {
      const defaultSettings: ImportJob['settings'] = {
        skipHeader: true,
        delimiter: ',',
        encoding: 'utf-8',
        duplicateHandling: 'skip',
        validationLevel: 'strict',
        fieldMappings: {},
        transformations: []
      };

      const jobData = this.addOrganizationContext({
        project_id: importRequest.projectId,
        name: importRequest.name,
        data_type: importRequest.dataType,
        format: importRequest.format,
        status: 'pending',
        filename: importRequest.filename,
        file_size: importRequest.fileSize,
        file_url: importRequest.fileUrl,
        total_records: 0,
        processed_records: 0,
        success_records: 0,
        error_records: 0,
        errors: [],
        settings: { ...defaultSettings, ...importRequest.settings },
        progress: {
          stage: 'uploading',
          percentage: 0,
          currentRecord: 0
        }
      });

      const { data: job, error } = await this.getBaseQuery('import_jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      // Start processing in the background
      this.processImportJob(job.id).catch(console.error);

      // Log activity
      await this.logActivity(
        'import_started',
        `Started import job: ${importRequest.name}`,
        'import_job',
        job.id,
        { dataType: importRequest.dataType, filename: importRequest.filename }
      );

      return this.transformImportJobData(job);
    } catch (error) {
      console.error('Error starting import:', error);
      throw error;
    }
  }

  /**
   * Start data export process
   */
  async startExport(exportRequest: {
    name: string;
    dataType: ExportJob['dataType'];
    format: ExportJob['format'];
    projectId?: string;
    filters?: ExportJob['filters'];
    settings?: Partial<ExportJob['settings']>;
  }): Promise<ExportJob> {
    if (!this.hasPermission('read')) {
      throw new Error('Insufficient permissions to export data');
    }

    try {
      const defaultSettings: ExportJob['settings'] = {
        includeHeaders: true,
        delimiter: ',',
        encoding: 'utf-8',
        fields: [],
        sortBy: [{ field: 'created_at', direction: 'desc' }]
      };

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const jobData = this.addOrganizationContext({
        project_id: exportRequest.projectId,
        name: exportRequest.name,
        data_type: exportRequest.dataType,
        format: exportRequest.format,
        status: 'pending',
        filename: `${exportRequest.name}.${exportRequest.format}`,
        total_records: 0,
        filters: exportRequest.filters || {},
        settings: { ...defaultSettings, ...exportRequest.settings },
        progress: {
          stage: 'preparing',
          percentage: 0,
          currentRecord: 0
        },
        expires_at: expiresAt.toISOString()
      });

      const { data: job, error } = await this.getBaseQuery('export_jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      // Start processing in the background
      this.processExportJob(job.id).catch(console.error);

      // Log activity
      await this.logActivity(
        'export_started',
        `Started export job: ${exportRequest.name}`,
        'export_job',
        job.id,
        { dataType: exportRequest.dataType, format: exportRequest.format }
      );

      return this.transformExportJobData(job);
    } catch (error) {
      console.error('Error starting export:', error);
      throw error;
    }
  }

  /**
   * Get import job status
   */
  async getImportJob(jobId: string): Promise<ImportJob> {
    if (!this.hasPermission('read')) {
      throw new Error('Insufficient permissions to view import jobs');
    }

    try {
      const { data: job, error } = await this.getBaseQuery('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      return this.transformImportJobData(job);
    } catch (error) {
      console.error('Error fetching import job:', error);
      throw error;
    }
  }

  /**
   * Get export job status
   */
  async getExportJob(jobId: string): Promise<ExportJob> {
    if (!this.hasPermission('read')) {
      throw new Error('Insufficient permissions to view export jobs');
    }

    try {
      const { data: job, error } = await this.getBaseQuery('export_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      return this.transformExportJobData(job);
    } catch (error) {
      console.error('Error fetching export job:', error);
      throw error;
    }
  }

  /**
   * List import/export jobs
   */
  async getJobs(type: 'import' | 'export', limit = 50): Promise<(ImportJob | ExportJob)[]> {
    if (!this.hasPermission('read')) {
      throw new Error('Insufficient permissions to view jobs');
    }

    try {
      const tableName = type === 'import' ? 'import_jobs' : 'export_jobs';
      const { data: jobs, error } = await this.getBaseQuery(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return jobs.map(job => 
        type === 'import' 
          ? this.transformImportJobData(job)
          : this.transformExportJobData(job)
      );
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, type: 'import' | 'export'): Promise<void> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to cancel jobs');
    }

    try {
      const tableName = type === 'import' ? 'import_jobs' : 'export_jobs';
      const { error } = await this.getBaseQuery(tableName)
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .in('status', ['pending', 'processing']);

      if (error) throw error;

      // Log activity
      await this.logActivity(
        `${type}_cancelled`,
        `Cancelled ${type} job`,
        `${type}_job`,
        jobId
      );
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  /**
   * Get data templates for import
   */
  async getDataTemplates(dataType?: string): Promise<DataTemplate[]> {
    const templates: DataTemplate[] = [
      {
        dataType: 'installations',
        format: 'csv',
        templateUrl: '/templates/installations-template.csv',
        sampleUrl: '/templates/installations-sample.csv',
        fields: [
          {
            name: 'customer_name',
            displayName: 'Customer Name',
            type: 'string',
            required: true,
            description: 'Full name of the customer',
            example: 'John Doe'
          },
          {
            name: 'customer_email',
            displayName: 'Customer Email',
            type: 'email',
            required: false,
            description: 'Customer email address',
            example: 'john@example.com'
          },
          {
            name: 'customer_phone',
            displayName: 'Customer Phone',
            type: 'phone',
            required: false,
            description: 'Customer phone number',
            example: '+1-555-123-4567'
          },
          {
            name: 'address_street',
            displayName: 'Street Address',
            type: 'string',
            required: true,
            description: 'Street address',
            example: '123 Main St'
          },
          {
            name: 'address_city',
            displayName: 'City',
            type: 'string',
            required: true,
            description: 'City name',
            example: 'Anytown'
          },
          {
            name: 'address_state',
            displayName: 'State',
            type: 'string',
            required: true,
            description: 'State or province',
            example: 'CA'
          },
          {
            name: 'address_zip',
            displayName: 'ZIP Code',
            type: 'string',
            required: true,
            description: 'ZIP or postal code',
            example: '12345'
          },
          {
            name: 'scheduled_date',
            displayName: 'Scheduled Date',
            type: 'date',
            required: true,
            description: 'Installation date (YYYY-MM-DD)',
            example: '2024-02-15'
          },
          {
            name: 'scheduled_time',
            displayName: 'Scheduled Time',
            type: 'string',
            required: true,
            description: 'Installation time (HH:MM)',
            example: '09:00'
          },
          {
            name: 'priority',
            displayName: 'Priority',
            type: 'string',
            required: false,
            description: 'Installation priority',
            example: 'medium',
            validation: {
              enum: ['low', 'medium', 'high', 'urgent']
            }
          },
          {
            name: 'notes',
            displayName: 'Notes',
            type: 'string',
            required: false,
            description: 'Additional notes',
            example: 'Special instructions for installation'
          }
        ],
        instructions: 'Download the template, fill in your installation data, and upload the completed file. Ensure all required fields are completed and dates are in the correct format.'
      },
      {
        dataType: 'team_members',
        format: 'csv',
        templateUrl: '/templates/team-members-template.csv',
        sampleUrl: '/templates/team-members-sample.csv',
        fields: [
          {
            name: 'first_name',
            displayName: 'First Name',
            type: 'string',
            required: true,
            description: 'Team member first name',
            example: 'John'
          },
          {
            name: 'last_name',
            displayName: 'Last Name',
            type: 'string',
            required: true,
            description: 'Team member last name',
            example: 'Smith'
          },
          {
            name: 'email',
            displayName: 'Email',
            type: 'email',
            required: true,
            description: 'Team member email address',
            example: 'john.smith@company.com'
          },
          {
            name: 'role',
            displayName: 'Role',
            type: 'string',
            required: true,
            description: 'Team member role',
            example: 'lead',
            validation: {
              enum: ['lead', 'assistant', 'scheduler', 'admin']
            }
          },
          {
            name: 'region',
            displayName: 'Region',
            type: 'string',
            required: true,
            description: 'Service region',
            example: 'North'
          },
          {
            name: 'specializations',
            displayName: 'Specializations',
            type: 'string',
            required: false,
            description: 'Comma-separated specializations',
            example: 'electrical,plumbing,HVAC'
          }
        ],
        instructions: 'Upload team member information. Each team member will receive an invitation email to join the platform.'
      }
    ];

    return dataType 
      ? templates.filter(t => t.dataType === dataType)
      : templates;
  }

  /**
   * Validate import data
   */
  async validateImportData(
    jobId: string,
    sampleSize = 100
  ): Promise<{
    isValid: boolean;
    errors: Array<{
      row: number;
      field?: string;
      message: string;
      data?: any;
    }>;
    warnings: string[];
    statistics: {
      totalRows: number;
      validRows: number;
      invalidRows: number;
      duplicates: number;
    };
  }> {
    // This would implement data validation logic
    // For now, return a mock response
    return {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalRows: 100,
        validRows: 98,
        invalidRows: 2,
        duplicates: 1
      }
    };
  }

  /**
   * Process import job
   */
  private async processImportJob(jobId: string): Promise<void> {
    try {
      // Update job status
      await this.updateJobStatus(jobId, 'import', 'processing', {
        stage: 'validating',
        percentage: 10
      });

      // Get job details
      const job = await this.getImportJob(jobId);
      
      // Download and parse file
      const data = await this.downloadAndParseFile(job.fileUrl!, job.format);
      
      // Update total records
      await this.updateJobProgress(jobId, 'import', {
        totalRecords: data.length,
        stage: 'importing',
        percentage: 25
      });

      // Process data based on type
      const result = await this.importData(job, data);

      // Update job completion
      await this.completeImportJob(jobId, result);

    } catch (error) {
      console.error('Error processing import job:', error);
      
      await this.getBaseQuery('import_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [{
            row: 0,
            message: error instanceof Error ? error.message : 'Import failed'
          }]
        })
        .eq('id', jobId);
    }
  }

  /**
   * Process export job
   */
  private async processExportJob(jobId: string): Promise<void> {
    try {
      // Update job status
      await this.updateJobStatus(jobId, 'export', 'processing', {
        stage: 'extracting',
        percentage: 10
      });

      // Get job details
      const job = await this.getExportJob(jobId);
      
      // Extract data
      const data = await this.extractData(job);
      
      // Update progress
      await this.updateJobProgress(jobId, 'export', {
        totalRecords: data.length,
        stage: 'formatting',
        percentage: 50
      });

      // Format and upload file
      const fileUrl = await this.formatAndUploadData(job, data);

      // Complete job
      await this.completeExportJob(jobId, fileUrl, data.length);

    } catch (error) {
      console.error('Error processing export job:', error);
      
      await this.getBaseQuery('export_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string, 
    type: 'import' | 'export', 
    status: string, 
    progress?: any
  ): Promise<void> {
    const tableName = type === 'import' ? 'import_jobs' : 'export_jobs';
    const updateData: any = { status };
    
    if (status === 'processing') {
      updateData.started_at = new Date().toISOString();
    }
    
    if (progress) {
      updateData.progress = progress;
    }

    await this.getBaseQuery(tableName)
      .update(updateData)
      .eq('id', jobId);
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(
    jobId: string, 
    type: 'import' | 'export', 
    updates: any
  ): Promise<void> {
    const tableName = type === 'import' ? 'import_jobs' : 'export_jobs';
    await this.getBaseQuery(tableName)
      .update(updates)
      .eq('id', jobId);
  }

  /**
   * Download and parse file
   */
  private async downloadAndParseFile(fileUrl: string, format: string): Promise<any[]> {
    // This would implement file download and parsing logic
    // For different formats (CSV, JSON, XLSX, XML)
    return [];
  }

  /**
   * Import data based on job configuration
   */
  private async importData(job: ImportJob, data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      jobId: job.id,
      status: 'success',
      summary: {
        totalRecords: data.length,
        successRecords: 0,
        errorRecords: 0,
        created: 0,
        updated: 0,
        skipped: 0
      },
      errors: [],
      warnings: []
    };

    // Process each record based on data type
    for (let i = 0; i < data.length; i++) {
      try {
        const record = data[i];
        const transformedRecord = this.transformRecord(record, job.settings);
        
        // Import based on data type
        switch (job.dataType) {
          case 'installations':
            await this.importInstallation(transformedRecord, job);
            break;
          case 'team_members':
            await this.importTeamMember(transformedRecord, job);
            break;
          // Add other data types as needed
        }

        result.summary.successRecords++;
        result.summary.created++; // This would be determined by the import logic

      } catch (error) {
        result.summary.errorRecords++;
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Import error',
          data: data[i]
        });
      }

      // Update progress every 100 records
      if (i % 100 === 0) {
        await this.updateJobProgress(job.id, 'import', {
          processed_records: i + 1,
          progress: {
            ...job.progress,
            percentage: Math.round((i / data.length) * 75) + 25,
            currentRecord: i + 1
          }
        });
      }
    }

    result.status = result.errors.length === 0 ? 'success' : 
                   result.summary.successRecords > 0 ? 'partial' : 'failed';

    return result;
  }

  /**
   * Extract data for export
   */
  private async extractData(job: ExportJob): Promise<any[]> {
    // This would implement data extraction based on job configuration
    // Apply filters, sorting, field selection, etc.
    return [];
  }

  /**
   * Format and upload export data
   */
  private async formatAndUploadData(job: ExportJob, data: any[]): Promise<string> {
    // This would format data according to the specified format
    // and upload to storage, returning the URL
    return `https://exports.thinktank-scheduler.com/${job.filename}`;
  }

  /**
   * Transform record based on settings
   */
  private transformRecord(record: any, settings: ImportJob['settings']): any {
    let transformed = { ...record };

    // Apply field mappings
    Object.entries(settings.fieldMappings).forEach(([source, target]) => {
      if (record[source] !== undefined) {
        transformed[target] = record[source];
        delete transformed[source];
      }
    });

    // Apply transformations
    settings.transformations.forEach(transform => {
      if (transformed[transform.field] !== undefined) {
        switch (transform.type) {
          case 'uppercase':
            transformed[transform.field] = String(transformed[transform.field]).toUpperCase();
            break;
          case 'lowercase':
            transformed[transform.field] = String(transformed[transform.field]).toLowerCase();
            break;
          case 'trim':
            transformed[transform.field] = String(transformed[transform.field]).trim();
            break;
          // Add more transformations as needed
        }
      }
    });

    return transformed;
  }

  /**
   * Import installation record
   */
  private async importInstallation(record: any, job: ImportJob): Promise<void> {
    // This would implement installation import logic
    // Validate, transform, and insert into database
  }

  /**
   * Import team member record
   */
  private async importTeamMember(record: any, job: ImportJob): Promise<void> {
    // This would implement team member import logic
    // Create user account, send invitation, etc.
  }

  /**
   * Complete import job
   */
  private async completeImportJob(jobId: string, result: ImportResult): Promise<void> {
    await this.getBaseQuery('import_jobs')
      .update({
        status: result.status,
        completed_at: new Date().toISOString(),
        success_records: result.summary.successRecords,
        error_records: result.summary.errorRecords,
        errors: result.errors,
        summary: result.summary,
        progress: {
          stage: 'completed',
          percentage: 100,
          currentRecord: result.summary.totalRecords
        }
      })
      .eq('id', jobId);
  }

  /**
   * Complete export job
   */
  private async completeExportJob(jobId: string, fileUrl: string, recordCount: number): Promise<void> {
    await this.getBaseQuery('export_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_url: fileUrl,
        total_records: recordCount,
        progress: {
          stage: 'completed',
          percentage: 100,
          currentRecord: recordCount
        }
      })
      .eq('id', jobId);
  }

  /**
   * Transform database data to ImportJob type
   */
  private transformImportJobData(data: any): ImportJob {
    return {
      id: data.id,
      organizationId: data.organization_id,
      projectId: data.project_id,
      name: data.name,
      dataType: data.data_type,
      format: data.format,
      status: data.status,
      filename: data.filename,
      fileSize: data.file_size,
      fileUrl: data.file_url,
      totalRecords: data.total_records || 0,
      processedRecords: data.processed_records || 0,
      successRecords: data.success_records || 0,
      errorRecords: data.error_records || 0,
      errors: data.errors || [],
      settings: data.settings,
      progress: data.progress,
      createdBy: data.created_by,
      createdAt: data.created_at,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      summary: data.summary
    };
  }

  /**
   * Transform database data to ExportJob type
   */
  private transformExportJobData(data: any): ExportJob {
    return {
      id: data.id,
      organizationId: data.organization_id,
      projectId: data.project_id,
      name: data.name,
      dataType: data.data_type,
      format: data.format,
      status: data.status,
      filename: data.filename,
      fileUrl: data.file_url,
      totalRecords: data.total_records || 0,
      filters: data.filters || {},
      settings: data.settings,
      progress: data.progress,
      createdBy: data.created_by,
      createdAt: data.created_at,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      expiresAt: data.expires_at
    };
  }
}

export default DataImportExportService;