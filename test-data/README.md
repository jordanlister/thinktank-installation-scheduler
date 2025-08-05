# Test Data Files for Think Tank Technologies Installation Scheduler

This directory contains comprehensive test data files designed to validate the data processing system's functionality, error handling, and performance capabilities.

## Test Files Overview

### 1. `starbucks_installations_valid.csv`
**Purpose**: Test successful data processing with clean, well-formatted data
- **Records**: 10 valid installation records
- **Format**: Standard CSV with consistent column names
- **Features**: All required fields present, proper date/time formats, valid phone numbers and emails
- **Use Case**: Verify that clean data processes without errors and imports correctly

### 2. `installation_data_with_errors.csv`
**Purpose**: Test error handling and validation capabilities
- **Records**: 15 records with various data quality issues
- **Validation Tests**:
  - Missing required fields (customer name, address components, dates)
  - Invalid data formats (phone numbers, emails, dates, times)
  - Invalid values (future dates, invalid priority levels)
  - Empty rows (should be skipped)
  - Different format variations
- **Use Case**: Ensure robust error detection and user-friendly error reporting

### 3. `varied_column_names.csv`
**Purpose**: Test intelligent column mapping with different header variations
- **Records**: 5 records with alternative column naming conventions
- **Column Variations**:
  - "Location ID" instead of "Store Number"
  - "Client Name" instead of "Customer Name"
  - "Town" instead of "City"
  - "Appointment Date/Time" instead of "Install Date/Time"
  - "Work Type" instead of "Installation Type"
  - "Importance" instead of "Priority"
- **Use Case**: Verify that the system can intelligently map columns despite naming differences

### 4. `multi_sheet_installation_data.xlsx`
**Purpose**: Test Excel file processing with multiple worksheets
- **Format**: Excel workbook (.xlsx)
- **Sheets**: 
  - "Installation Jobs": Main data with 5 records
  - "Summary": Metadata and statistics
- **Records**: 5 installation records for electronics stores
- **Use Case**: Ensure Excel parsing works correctly and processes the first sheet appropriately

### 5. `large_dataset_500_records.csv`
**Purpose**: Performance testing with large datasets
- **Records**: 500 automatically generated installation records
- **Data Variety**: 
  - 10 different states with realistic cities
  - 10 different company types
  - 5 installation types
  - 4 priority levels
  - Randomized dates from March to June 2024
  - Realistic addresses, phone numbers, and email formats
- **Use Case**: Test system performance, pagination, filtering, and memory usage with larger datasets

## Usage Instructions

### For Testing Data Upload
1. Start the application and navigate to the Data Processing page
2. Use the drag-and-drop interface or file browser to upload any test file
3. Review the processing results, error reports, and data preview

### For Validation Testing
- Use `starbucks_installations_valid.csv` first to ensure basic functionality works
- Progress to `installation_data_with_errors.csv` to test error handling
- Try `varied_column_names.csv` to test column mapping intelligence
- Use `multi_sheet_installation_data.xlsx` to test Excel file support
- Use `large_dataset_500_records.csv` for performance and stress testing

### Expected Results

#### Valid Data File
- Should process all 10 records successfully
- No errors or warnings
- All fields should be properly mapped and normalized
- Ready for import to scheduling system

#### Error Data File
- Should identify multiple validation errors and warnings
- Error report should categorize issues by type and severity
- Invalid records should not be included in valid data set
- System should remain stable despite data quality issues

#### Varied Column Names
- Should automatically detect and map alternative column names
- Confidence scores should be high (>80%) for successful mappings
- All 5 records should process successfully
- Schema mapping should show detected column relationships

#### Multi-Sheet Excel
- Should process only the first sheet by default
- All 5 records should be valid
- Excel date formats should be properly converted
- File metadata should reflect Excel format

#### Large Dataset
- Should handle 500 records efficiently
- Processing should complete in under 10 seconds
- Pagination should work smoothly in preview
- Memory usage should remain reasonable
- Export functionality should work with large datasets

## Data Schema

The test data follows this general schema:
- **Job ID**: Unique identifier for the installation job
- **Store/Location Number**: Store identifier
- **Customer Name**: Business name
- **Phone**: Contact phone number
- **Email**: Contact email address
- **Address**: Street, City, State, ZIP components
- **Install Date/Time**: Scheduled installation date and time
- **Duration**: Estimated duration in minutes
- **Installation Type**: Type of work to be performed
- **Priority**: Urgency level (Low, Medium, High, Urgent)
- **Region**: Geographic region or territory
- **Notes**: Additional comments or special instructions

## Troubleshooting

If you encounter issues with the test files:
1. Ensure all files are properly saved in the test-data directory
2. Check that file permissions allow reading
3. Verify that the application has access to the file system
4. Try uploading files one at a time to isolate issues
5. Check the browser console for detailed error messages

## Adding New Test Data

When creating additional test files:
1. Follow the existing naming convention
2. Include a variety of data scenarios
3. Document the purpose and expected behavior
4. Test edge cases and boundary conditions
5. Update this README with new file descriptions