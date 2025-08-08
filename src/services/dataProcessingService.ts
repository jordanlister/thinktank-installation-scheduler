// Think Tank Technologies - Data Processing Service
// Handles all data processing and import operations

import { supabase } from './supabase';
import type { 
  ProcessingResult,
  ProcessedJobData,
  ValidationError,
  ProcessingMetadata,
  ColumnMapping,
  DataProcessingConfig,
  Installation,
  Priority
} from '../types';

export class DataProcessingService {
  /**
   * Save processing results to database
   */
  static async saveProcessingResult(result: ProcessingResult): Promise<string> {
    const { data, error } = await supabase
      .from('data_processing_results')
      .insert([{
        file_name: result.metadata.fileName,
        file_size: result.metadata.fileSize,
        file_type: result.metadata.fileType,
        total_rows: result.metadata.totalRows,
        valid_rows: result.metadata.validRows,
        error_rows: result.metadata.errorRows,
        warning_rows: result.metadata.warningRows,
        valid_data: result.validData,
        errors: result.errors,
        warnings: result.warnings,
        metadata: result.metadata,
        schema_map: result.schemaMap,
        processed_by: 'current_user', // This should be set from auth context
        processed_at: result.metadata.processedAt
      }])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save processing result: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get processing history for a user
   */
  static async getProcessingHistory(limit: number = 10): Promise<ProcessingResult[]> {
    const { data, error } = await supabase
      .from('data_processing_results')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch processing history: ${error.message}`);
    }

    return data.map(this.transformDatabaseResult);
  }

  /**
   * Get a specific processing result by ID
   */
  static async getProcessingResult(id: string): Promise<ProcessingResult | null> {
    const { data, error } = await supabase
      .from('data_processing_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch processing result: ${error.message}`);
    }

    return this.transformDatabaseResult(data);
  }

  /**
   * Delete processing result
   */
  static async deleteProcessingResult(id: string): Promise<void> {
    const { error } = await supabase
      .from('data_processing_results')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete processing result: ${error.message}`);
    }
  }

  /**
   * Import valid data from processing result into installations table
   */
  static async importProcessedData(processingResultId: string): Promise<string[]> {
    // First get the processing result
    const processingResult = await this.getProcessingResult(processingResultId);
    if (!processingResult) {
      throw new Error('Processing result not found');
    }

    const installations = processingResult.validData.map(this.transformProcessedDataToInstallation);
    
    // Insert installations in batches to avoid hitting database limits
    const batchSize = 100;
    const insertedIds: string[] = [];

    for (let i = 0; i < installations.length; i += batchSize) {
      const batch = installations.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('installations')
        .insert(batch)
        .select('id');

      if (error) {
        throw new Error(`Failed to import batch ${i / batchSize + 1}: ${error.message}`);
      }

      insertedIds.push(...data.map(item => item.id));
    }

    return insertedIds;
  }

  /**
   * Validate processed data against business rules
   */
  static validateProcessedData(data: ProcessedJobData[]): ValidationError[] {
    const errors: ValidationError[] = [];

    data.forEach((item, index) => {
      // Check required fields
      if (!item.customerName?.trim()) {
        errors.push({
          row: index + 1,
          column: 'customerName',
          field: 'customerName',
          value: item.customerName,
          message: 'Customer name is required',
          severity: 'error'
        });
      }

      if (!item.installDate) {
        errors.push({
          row: index + 1,
          column: 'installDate',
          field: 'installDate',
          value: item.installDate,
          message: 'Installation date is required',
          severity: 'error'
        });
      } else {
        // Validate date is not in the past
        const installDate = new Date(item.installDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (installDate < today) {
          errors.push({
            row: index + 1,
            column: 'installDate',
            field: 'installDate',
            value: item.installDate,
            message: 'Installation date cannot be in the past',
            severity: 'warning'
          });
        }
      }

      // Validate address fields
      if (!item.address?.street?.trim()) {
        errors.push({
          row: index + 1,
          column: 'street',
          field: 'address.street',
          value: item.address?.street,
          message: 'Street address is required',
          severity: 'error'
        });
      }

      if (!item.address?.city?.trim()) {
        errors.push({
          row: index + 1,
          column: 'city',
          field: 'address.city',
          value: item.address?.city,
          message: 'City is required',
          severity: 'error'
        });
      }

      if (!item.address?.state?.trim()) {
        errors.push({
          row: index + 1,
          column: 'state',
          field: 'address.state',
          value: item.address?.state,
          message: 'State is required',
          severity: 'error'
        });
      }

      if (!item.address?.zipCode?.trim()) {
        errors.push({
          row: index + 1,
          column: 'zipCode',
          field: 'address.zipCode',
          value: item.address?.zipCode,
          message: 'ZIP code is required',
          severity: 'error'
        });
      } else {
        // Validate ZIP code format (basic US format)
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(item.address.zipCode.trim())) {
          errors.push({
            row: index + 1,
            column: 'zipCode',
            field: 'address.zipCode',
            value: item.address.zipCode,
            message: 'ZIP code must be in format 12345 or 12345-6789',
            severity: 'warning'
          });
        }
      }

      // Validate phone number format
      if (item.customerPhone && item.customerPhone.trim()) {
        const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)\.]{10,}$/;
        if (!phoneRegex.test(item.customerPhone.trim())) {
          errors.push({
            row: index + 1,
            column: 'customerPhone',
            field: 'customerPhone',
            value: item.customerPhone,
            message: 'Phone number format appears invalid',
            severity: 'warning'
          });
        }
      }

      // Validate email format
      if (item.customerEmail && item.customerEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(item.customerEmail.trim())) {
          errors.push({
            row: index + 1,
            column: 'customerEmail',
            field: 'customerEmail',
            value: item.customerEmail,
            message: 'Email format appears invalid',
            severity: 'warning'
          });
        }
      }

      // Validate duration
      if (item.duration && item.duration < 30) {
        errors.push({
          row: index + 1,
          column: 'duration',
          field: 'duration',
          value: item.duration,
          message: 'Installation duration should be at least 30 minutes',
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  /**
   * Transform database result to ProcessingResult
   */
  private static transformDatabaseResult(data: any): ProcessingResult {
    return {
      validData: data.valid_data || [],
      errors: data.errors || [],
      warnings: data.warnings || [],
      metadata: {
        fileName: data.file_name,
        fileSize: data.file_size,
        fileType: data.file_type,
        totalRows: data.total_rows,
        validRows: data.valid_rows,
        errorRows: data.error_rows,
        warningRows: data.warning_rows,
        dateRange: data.metadata?.dateRange,
        regionsDetected: data.metadata?.regionsDetected || [],
        installationTypes: data.metadata?.installationTypes || [],
        processedAt: data.processed_at
      },
      schemaMap: data.schema_map || {}
    };
  }

  /**
   * Transform processed data to installation format for database insertion
   */
  private static transformProcessedDataToInstallation(data: ProcessedJobData): any {
    return {
      job_id: data.jobId,
      store_number: data.storeNumber,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail,
      // Note: This would need address insertion/lookup logic in a real implementation
      scheduled_date: data.installDate,
      scheduled_time: data.installTime || '09:00',
      duration: data.duration || 120,
      status: 'pending',
      priority: data.priority || 'medium',
      installation_type: data.installationType,
      specifications: data.specifications || [],
      requirements: data.requirements,
      region: data.region,
      notes: data.notes,
      estimated_revenue: null, // Would need to be calculated or provided
      actual_revenue: null
    };
  }
}

export default DataProcessingService;