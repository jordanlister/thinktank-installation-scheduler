// Think Tank Technologies Installation Scheduler - Data Processing Utilities

import ExcelJS from 'exceljs';
import {
  RawJobData,
  ProcessedJobData,
  ValidationError,
  ProcessingResult,
  ProcessingMetadata,
  ColumnMapping,
  DataProcessingConfig,
  COLUMN_ALIASES,
  ColumnAlias,
  Priority,
  Address
} from '../types';

// Default configuration for data processing
export const DEFAULT_CONFIG: DataProcessingConfig = {
  strictValidation: false,
  skipEmptyRows: true,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  requiredFields: [],
  allowedFileTypes: ['xlsx', 'xls', 'csv'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

/**
 * Parses Excel or CSV files and returns raw data
 */
export async function parseFile(file: File): Promise<RawJobData[]> {
  try {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    
    // Check file type and load accordingly
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      // Handle CSV files
      const text = new TextDecoder().decode(buffer);
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV file appears to be empty');
      }
      
      // Parse CSV manually (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );
      
      const rawData: RawJobData[] = rows.map((row, index) => {
        const obj: RawJobData = { _rowNumber: index + 2 }; // +2 because we start from row 2
        headers.forEach((header, colIndex) => {
          obj[header] = row[colIndex] || '';
        });
        return obj;
      });
      
      return rawData;
    } else {
      // Handle Excel files (.xlsx, .xls)
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Excel file appears to be empty or corrupted');
      }
      
      const rawData: RawJobData[] = [];
      let headers: string[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        const values = row.values as any[];
        // Remove the first undefined element that ExcelJS adds
        const cleanValues = values.slice(1);
        
        if (rowNumber === 1) {
          // First row contains headers
          headers = cleanValues.map(value => value ? String(value).trim() : '');
        } else {
          // Data rows
          const obj: RawJobData = { _rowNumber: rowNumber };
          headers.forEach((header, colIndex) => {
            const cellValue = cleanValues[colIndex];
            obj[header] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';
          });
          rawData.push(obj);
        }
      });
      
      if (rawData.length === 0) {
        throw new Error('File appears to be empty');
      }
      
      return rawData;
    }
  } catch (error) {
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detects column mappings using intelligent alias matching
 */
export function detectSchema(rawData: RawJobData[]): ColumnMapping {
  if (rawData.length === 0) return {};

  const columnMapping: ColumnMapping = {};
  const availableColumns = Object.keys(rawData[0]).filter(key => key !== '_rowNumber');

  // For each standard field, find the best matching column
  Object.entries(COLUMN_ALIASES).forEach(([standardField, aliases]: [string, readonly string[]]) => {
    let bestMatch = '';
    let bestConfidence = 0;

    availableColumns.forEach(column => {
      const columnLower = column.toLowerCase().trim();
      
      // Check for exact matches first
      if (aliases.includes(columnLower)) {
        if (bestConfidence < 1.0) {
          bestMatch = column;
          bestConfidence = 1.0;
        }
      } else {
        // Check for partial matches and substring matches
        const confidence = calculateStringSimilarity(columnLower, aliases);
        
        // Also check if any alias is a substring or vice versa
        let substringMatch = false;
        aliases.forEach(alias => {
          if (columnLower.includes(alias) || alias.includes(columnLower)) {
            substringMatch = true;
          }
        });
        
        if (confidence > bestConfidence && (confidence > 0.4 || substringMatch)) {
          bestMatch = column;
          bestConfidence = Math.max(confidence, substringMatch ? 0.7 : confidence);
        }
      }
    });

    if (bestMatch && bestConfidence > 0.4) {
      columnMapping[standardField] = {
        detectedColumn: bestMatch,
        confidence: Math.round(bestConfidence * 100) / 100,
        aliases: aliases as string[]
      };
    }
  });

  return columnMapping;
}

/**
 * Calculates similarity between a string and an array of aliases
 */
function calculateStringSimilarity(str: string, aliases: readonly string[]): number {
  let maxSimilarity = 0;
  
  aliases.forEach(alias => {
    const similarity = stringSimilarity(str, alias);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  });
  
  return maxSimilarity;
}

/**
 * Calculates Levenshtein distance based similarity between two strings
 */
function stringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}

/**
 * Validates and normalizes raw data into ProcessedJobData
 */
export function processData(
  rawData: RawJobData[],
  schemaMap: ColumnMapping,
  config: DataProcessingConfig = DEFAULT_CONFIG
): ProcessingResult {
  const validData: ProcessedJobData[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const regionsDetected = new Set<string>();
  const installationTypes = new Set<string>();
  let validRows = 0;
  let errorRows = 0;
  let warningRows = 0;

  rawData.forEach((row, index) => {
    const rowNumber = row._rowNumber || index + 1;
    const processedRow: Partial<ProcessedJobData> = {
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    let hasErrors = false;
    let hasWarnings = false;

    // Process each mapped field
    Object.entries(schemaMap).forEach(([standardField, mapping]) => {
      const rawValue = row[mapping.detectedColumn];
      
      try {
        const processedValue = processField(
          standardField as ColumnAlias,
          rawValue,
          rowNumber,
          mapping.detectedColumn,
          config
        );
        
        if (processedValue !== null && processedValue !== undefined) {
          // Handle nested address fields
          if (['street', 'city', 'state', 'zipCode'].includes(standardField)) {
            if (!processedRow.address) {
              processedRow.address = {} as Partial<Address>;
            }
            (processedRow.address as any)[standardField] = processedValue;
          } else {
            (processedRow as any)[standardField] = processedValue;
          }

          // Collect metadata
          if (standardField === 'region' && processedValue) {
            regionsDetected.add(processedValue as string);
          }
          if (standardField === 'installationType' && processedValue) {
            installationTypes.add(processedValue as string);
          }
        }
      } catch (error) {
        // For low-confidence mappings, treat processing failures as warnings
        const severity = mapping.confidence < 0.5 ? 'warning' : 'error';
        const validationError: ValidationError = {
          row: rowNumber,
          column: mapping.detectedColumn,
          field: standardField,
          value: rawValue,
          message: error instanceof Error ? error.message : 'Processing error',
          severity
        };
        
        if (severity === 'error') {
          errors.push(validationError);
          hasErrors = true;
        } else {
          warnings.push(validationError);
          hasWarnings = true;
          // For warnings, still try to put some default value
          try {
            if (standardField === 'customerName') {
              (processedRow as any)[standardField] = String(rawValue).trim() || 'Unknown Customer';
            } else if (standardField === 'installDate') {
              (processedRow as any)[standardField] = new Date().toISOString().split('T')[0];
            } else {
              (processedRow as any)[standardField] = String(rawValue).trim();
            }
          } catch {
            // If even default assignment fails, just skip this field
          }
        }
      }
    });

    // Validate required fields
    config.requiredFields.forEach(field => {
      if (field === 'address') {
        if (!processedRow.address || Object.keys(processedRow.address).length === 0) {
          errors.push({
            row: rowNumber,
            column: 'address',
            field: 'address',
            value: null,
            message: 'Address information is required',
            severity: 'error'
          });
          hasErrors = true;
        }
      } else if (!(processedRow as any)[field]) {
        errors.push({
          row: rowNumber,
          column: schemaMap[field]?.detectedColumn || field,
          field,
          value: null,
          message: `${field} is required`,
          severity: 'error'
        });
        hasErrors = true;
      }
    });

    // Additional validation warnings
    if (processedRow.customerPhone && !isValidPhoneNumber(processedRow.customerPhone)) {
      warnings.push({
        row: rowNumber,
        column: schemaMap.customerPhone?.detectedColumn || 'phone',
        field: 'customerPhone',
        value: processedRow.customerPhone,
        message: 'Phone number format may be invalid',
        severity: 'warning'
      });
      hasWarnings = true;
    }

    if (processedRow.customerEmail && !isValidEmail(processedRow.customerEmail)) {
      warnings.push({
        row: rowNumber,
        column: schemaMap.customerEmail?.detectedColumn || 'email',
        field: 'customerEmail',
        value: processedRow.customerEmail,
        message: 'Email format may be invalid',
        severity: 'warning'
      });
      hasWarnings = true;
    }

    // Ensure we have at least some basic data for display
    if (!processedRow.customerName && !processedRow.installDate && !processedRow.specifications && !processedRow.notes) {
      // If completely empty, try to use raw data directly
      const availableColumns = Object.keys(row).filter(key => key !== '_rowNumber');
      if (availableColumns.length >= 1) {
        processedRow.customerName = String(row[availableColumns[0]] || '').trim() || `Row ${rowNumber}`;
      }
      if (availableColumns.length >= 2) {
        processedRow.specifications = String(row[availableColumns[1]] || '').trim() || 'No data';
      }
      // Add today's date as fallback
      if (!processedRow.installDate) {
        processedRow.installDate = new Date().toISOString().split('T')[0];
      }
    }

    // Skip empty rows if configured
    if (config.skipEmptyRows && isEmptyRow(processedRow)) {
      return;
    }

    if (!hasErrors && isValidProcessedData(processedRow)) {
      validData.push(processedRow as ProcessedJobData);
      validRows++;
    } else {
      errorRows++;
    }

    if (hasWarnings) {
      warningRows++;
    }
  });

  // Calculate metadata
  const dates = validData
    .map(d => d.installDate)
    .filter(Boolean)
    .sort();

  const metadata: ProcessingMetadata = {
    fileName: '',
    fileSize: 0,
    fileType: '',
    totalRows: rawData.length,
    validRows,
    errorRows,
    warningRows,
    dateRange: dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1]
    } : undefined,
    regionsDetected: Array.from(regionsDetected),
    installationTypes: Array.from(installationTypes),
    processedAt: new Date().toISOString()
  };

  return {
    validData,
    errors,
    warnings,
    metadata,
    schemaMap
  };
}

/**
 * Processes individual field values based on field type
 */
function processField(
  field: ColumnAlias,
  value: any,
  rowNumber: number,
  columnName: string,
  config: DataProcessingConfig
): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const stringValue = String(value).trim();
  if (!stringValue) return null;

  switch (field) {
    case 'installDate':
      return normalizeDate(stringValue);
    
    case 'installTime':
      return normalizeTime(stringValue);
    
    case 'duration':
      return normalizeDuration(stringValue);
    
    case 'priority':
      return normalizePriority(stringValue);
    
    case 'customerPhone':
      return normalizePhoneNumber(stringValue);
    
    case 'customerEmail':
      return normalizeEmail(stringValue);
    
    case 'zipCode':
      return normalizeZipCode(stringValue);
    
    case 'specifications':
      return stringValue.split(',').map(s => s.trim()).filter(Boolean);
    
    default:
      return stringValue;
  }
}

/**
 * Normalizes date strings to ISO format
 */
function normalizeDate(dateStr: string): string {
  // Handle Excel date numbers
  if (/^\d+$/.test(dateStr)) {
    const excelDate = new Date((parseInt(dateStr) - 25569) * 86400 * 1000);
    return excelDate.toISOString().split('T')[0];
  }

  // Try parsing various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // For fallback mappings, return a default date instead of throwing error
  const today = new Date();
  console.warn(`Could not parse date "${dateStr}", using today's date as fallback`);
  return today.toISOString().split('T')[0];
}

/**
 * Normalizes time strings
 */
function normalizeTime(timeStr: string): string {
  // Handle various time formats
  const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || '0');
    const ampm = timeMatch[3]?.toUpperCase();

    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // For fallback mappings, return default time
  console.warn(`Could not parse time "${timeStr}", using default time 09:00`);
  return '09:00';
}

/**
 * Normalizes duration to minutes
 */
function normalizeDuration(durationStr: string): number {
  const duration = parseFloat(durationStr);
  if (isNaN(duration)) {
    // For fallback mappings, return default duration
    console.warn(`Could not parse duration "${durationStr}", using default 240 minutes`);
    return 240; // 4 hours default
  }
  
  // If it looks like hours (decimal), convert to minutes
  if (duration < 24 && duration % 1 !== 0) {
    return Math.round(duration * 60);
  }
  
  return Math.round(duration);
}

/**
 * Normalizes priority values
 */
function normalizePriority(priorityStr: string): Priority {
  const normalized = priorityStr.toLowerCase();
  
  if (['urgent', 'critical', 'high priority'].some(p => normalized.includes(p))) {
    return 'urgent';
  }
  if (['high', 'important'].some(p => normalized.includes(p))) {
    return 'high';
  }
  if (['low', 'minor'].some(p => normalized.includes(p))) {
    return 'low';
  }
  
  return 'medium'; // default
}

/**
 * Normalizes phone numbers
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle US phone numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone; // Return original if we can't normalize
}

/**
 * Normalizes email addresses
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalizes ZIP codes
 */
function normalizeZipCode(zip: string): string {
  const digits = zip.replace(/\D/g, '');
  
  if (digits.length === 5) {
    return digits;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  
  return zip; // Return original if we can't normalize
}

/**
 * Validates phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+1\s?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if a processed row is empty
 */
function isEmptyRow(row: Partial<ProcessedJobData>): boolean {
  const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'createdAt');
  return keys.length === 0 || keys.every(key => {
    const value = (row as any)[key];
    return value === null || value === undefined || value === '';
  });
}

/**
 * Type guard to check if processed data is valid
 */
function isValidProcessedData(data: Partial<ProcessedJobData>): data is ProcessedJobData {
  // For fallback processing, require minimal data
  return !!(
    data.customerName || 
    data.installDate ||
    data.specifications ||
    data.notes ||
    Object.keys(data).length > 2 // Has some meaningful data beyond id and createdAt
  );
}

/**
 * Generates unique IDs for processed data
 */
function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main processing function that orchestrates the entire workflow
 */
export async function processJobDataFile(
  file: File,
  config: DataProcessingConfig = DEFAULT_CONFIG
): Promise<ProcessingResult> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > config.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${config.maxFileSize / (1024 * 1024)}MB`);
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedFileTypes.includes(fileExtension)) {
      throw new Error(`Unsupported file type. Allowed types: ${config.allowedFileTypes.join(', ')}`);
    }

    // Parse the file
    const rawData = await parseFile(file);
    
    if (rawData.length === 0) {
      throw new Error('File contains no data');
    }

    // Detect schema
    const schemaMap = detectSchema(rawData);
    
    if (Object.keys(schemaMap).length === 0) {
      // Create a fallback mapping using available columns
      const availableColumns = Object.keys(rawData[0]).filter(key => key !== '_rowNumber');
      
      // If we have any columns, create a basic mapping
      if (availableColumns.length > 0) {
        // Use first column as customerName if no better match
        if (availableColumns.length >= 1) {
          schemaMap.customerName = {
            detectedColumn: availableColumns[0],
            confidence: 0.3,
            aliases: COLUMN_ALIASES.customerName as string[]
          };
        }
        
        // Use second column as installDate if no better match  
        if (availableColumns.length >= 2) {
          schemaMap.installDate = {
            detectedColumn: availableColumns[1],
            confidence: 0.3,
            aliases: COLUMN_ALIASES.installDate as string[]
          };
        }
        
        // Map remaining columns as notes/specifications
        availableColumns.slice(2).forEach((col, index) => {
          const fieldName = index === 0 ? 'specifications' : 'notes';
          if (!schemaMap[fieldName]) {
            schemaMap[fieldName] = {
              detectedColumn: col,
              confidence: 0.2,
              aliases: COLUMN_ALIASES[fieldName as keyof typeof COLUMN_ALIASES] as string[]
            };
          }
        });
      } else {
        // If still no columns, provide helpful debugging information
        const requiredFields = ['customerName', 'installDate']; // Core fields for display
        
        const errorMsg = [
          'Could not detect any recognizable columns in the file.',
          '',
          'Available columns in your file:',
          availableColumns.map((col, i) => `  ${i + 1}. "${col}"`).join('\n'),
          '',
          'Expected fields we can work with:',
          requiredFields.map(field => {
            const aliases = COLUMN_ALIASES[field as keyof typeof COLUMN_ALIASES];
            return `  • ${field}: ${aliases.slice(0, 5).join(', ')}${aliases.length > 5 ? ', ...' : ''}`;
          }).join('\n'),
          '',
          'Tips:',
          '• Make sure your first row contains column headers',
          '• Column names should match or be similar to the expected fields',
          '• Try renaming columns to match expected names (e.g., "Customer Name", "Install Date", "Address")'
        ].join('\n');
        
        throw new Error(errorMsg);
      }
    }

    // Process the data
    const result = processData(rawData, schemaMap, config);
    
    // Debug logging to see what data structure we're creating
    console.log('Processing result:', {
      totalRows: result.validData.length,
      sampleData: result.validData.slice(0, 2),
      schemaMap,
      rawDataSample: rawData.slice(0, 2)
    });
    
    // Update metadata with file information
    result.metadata.fileName = file.name;
    result.metadata.fileSize = file.size;
    result.metadata.fileType = fileExtension;

    return result;
  } catch (error) {
    throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}