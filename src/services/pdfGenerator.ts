// Think Tank Technologies PDF Generation Service
// Professional PDF report generation with branded templates

import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb, RGB, StandardFonts } from 'pdf-lib';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import html2canvas from 'html2canvas';
import { format, parseISO } from 'date-fns';
import { 
  PDFTemplate, 
  PDFReport, 
  PDFStatus, 
  PDFTemplateType,
  ThinkTankColors,
  Installation,
  TeamMember,
  TeamPerformanceReport,
  SchedulingAnalytics
} from '../types';

// Think Tank Technologies Brand Colors and Styling
export const THINK_TANK_BRAND: ThinkTankColors = {
  primary: '#1a365d',      // Deep blue
  secondary: '#2d3748',    // Charcoal gray
  accent: '#3182ce',       // Bright blue
  neutral: '#718096',      // Medium gray
  success: '#38a169',      // Green
  warning: '#d69e2e',      // Orange
  error: '#e53e3e',        // Red
  background: '#ffffff',   // White
  surface: '#f7fafc',      // Light gray
  text: '#2d3748'          // Dark gray
};

export const PDF_CONSTANTS = {
  MARGINS: { top: 72, right: 72, bottom: 72, left: 72 }, // 1 inch margins
  FONTS: {
    PRIMARY: 'Helvetica',
    SECONDARY: 'Helvetica-Bold',
    MONO: 'Courier'
  },
  SIZES: {
    TITLE: 24,
    SUBTITLE: 18,
    HEADER: 16,
    BODY: 12,
    CAPTION: 10
  }
};

export class PDFGeneratorService {
  private static instance: PDFGeneratorService;
  private fonts: Map<string, PDFFont> = new Map();

  private constructor() {}

  public static getInstance(): PDFGeneratorService {
    if (!PDFGeneratorService.instance) {
      PDFGeneratorService.instance = new PDFGeneratorService();
    }
    return PDFGeneratorService.instance;
  }

  /**
   * Generate a PDF report based on template and data
   */
  public async generateReport(
    template: PDFTemplate,
    data: any,
    options: PDFGenerationOptions = {}
  ): Promise<PDFReport> {
    const reportId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      // Load fonts
      await this.loadFonts(pdfDoc);
      
      // Generate report based on template type
      let pdfBuffer: Uint8Array;
      
      switch (template.type) {
        case 'installation_schedule':
          pdfBuffer = await this.generateInstallationScheduleReport(pdfDoc, data, template);
          break;
        case 'team_performance':
          pdfBuffer = await this.generateTeamPerformanceReport(pdfDoc, data, template);
          break;
        case 'customer_report':
          pdfBuffer = await this.generateCustomerReport(pdfDoc, data, template);
          break;
        case 'analytics_dashboard':
          pdfBuffer = await this.generateAnalyticsReport(pdfDoc, data, template);
          break;
        case 'route_optimization':
          pdfBuffer = await this.generateRouteOptimizationReport(pdfDoc, data, template);
          break;
        default:
          pdfBuffer = await this.generateGenericReport(pdfDoc, data, template);
      }

      // Calculate file size and page count
      const fileSize = pdfBuffer.length;
      const pageCount = pdfDoc.getPageCount();

      // Generate file path (in production, this would be stored in cloud storage)
      const filePath = `reports/${reportId}.pdf`;
      const fileUrl = `/api/reports/${reportId}/download`;

      const report: PDFReport = {
        id: reportId,
        templateId: template.id,
        name: this.generateReportName(template, data),
        generatedAt: new Date().toISOString(),
        generatedBy: options.userId || 'system',
        status: 'completed' as PDFStatus,
        variables: data,
        metadata: {
          contextData: options.contextData || {},
          dataSource: options.dataSource || 'installation_scheduler',
          reportPeriod: options.reportPeriod,
          recipients: options.recipients,
          deliveryMethod: options.deliveryMethod || 'download'
        },
        fileUrl,
        filePath,
        fileSize,
        pageCount
      };

      // In a real implementation, save the PDF buffer to storage
      await this.savePDFToStorage(pdfBuffer, filePath);

      return report;

    } catch (error) {
      console.error('PDF Generation Error:', error);
      
      return {
        id: reportId,
        templateId: template.id,
        name: `Failed: ${template.name}`,
        generatedAt: new Date().toISOString(),
        generatedBy: options.userId || 'system',
        status: 'failed' as PDFStatus,
        variables: data,
        metadata: {
          contextData: options.contextData || {},
          dataSource: options.dataSource || 'installation_scheduler'
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate Installation Schedule Report
   */
  private async generateInstallationScheduleReport(
    pdfDoc: PDFDocument,
    data: InstallationScheduleData,
    template: PDFTemplate
  ): Promise<Uint8Array> {
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!;
    const boldFont = this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!;

    let yPosition = 720; // Start near top

    // Header with Think Tank branding
    yPosition = await this.drawHeader(page, font, boldFont, yPosition, 
      'Installation Schedule Report', data.region);

    // Schedule summary
    yPosition = await this.drawScheduleSummary(page, font, boldFont, yPosition, data);

    // Team assignments
    yPosition = await this.drawTeamAssignments(page, font, boldFont, yPosition, data);

    // Job details table
    yPosition = await this.drawInstallationTable(page, font, boldFont, yPosition, data.installations);

    // Route optimization if available
    if (data.routeOptimization) {
      yPosition = await this.drawRouteOptimization(page, font, boldFont, yPosition, data.routeOptimization);
    }

    // Footer
    await this.drawFooter(page, font, 50);

    return pdfDoc.save();
  }

  /**
   * Generate Team Performance Report
   */
  private async generateTeamPerformanceReport(
    pdfDoc: PDFDocument,
    data: TeamPerformanceData,
    template: PDFTemplate
  ): Promise<Uint8Array> {
    const page = pdfDoc.addPage([612, 792]);
    const font = this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!;
    const boldFont = this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!;

    let yPosition = 720;

    // Header
    yPosition = await this.drawHeader(page, font, boldFont, yPosition, 
      'Team Performance Report', data.reportPeriod);

    // Performance metrics summary
    yPosition = await this.drawPerformanceMetrics(page, font, boldFont, yPosition, data.metrics);

    // Individual performance table
    yPosition = await this.drawPerformanceTable(page, font, boldFont, yPosition, data.teamReports);

    // Charts (if space allows, otherwise add new page)
    if (yPosition > 200) {
      await this.drawPerformanceCharts(page, yPosition - 150, data.chartData);
    } else {
      const chartPage = pdfDoc.addPage([612, 792]);
      await this.drawPerformanceCharts(chartPage, 650, data.chartData);
    }

    // Footer
    await this.drawFooter(page, font, 50);

    return pdfDoc.save();
  }

  /**
   * Generate Customer Report
   */
  private async generateCustomerReport(
    pdfDoc: PDFDocument,
    data: CustomerReportData,
    template: PDFTemplate
  ): Promise<Uint8Array> {
    const page = pdfDoc.addPage([612, 792]);
    const font = this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!;
    const boldFont = this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!;

    let yPosition = 720;

    // Header with customer info
    yPosition = await this.drawHeader(page, font, boldFont, yPosition, 
      'Installation Summary', data.customer.name);

    // Customer details
    yPosition = await this.drawCustomerDetails(page, font, boldFont, yPosition, data.customer);

    // Installation details
    yPosition = await this.drawInstallationDetails(page, font, boldFont, yPosition, data.installation);

    // Team information
    yPosition = await this.drawTeamInfo(page, font, boldFont, yPosition, data.team);

    // Next steps or follow-up
    if (data.nextSteps) {
      yPosition = await this.drawNextSteps(page, font, boldFont, yPosition, data.nextSteps);
    }

    // Footer with contact information
    await this.drawCustomerFooter(page, font, 50);

    return pdfDoc.save();
  }

  /**
   * Generate Analytics Dashboard Report
   */
  private async generateAnalyticsReport(
    pdfDoc: PDFDocument,
    data: AnalyticsReportData,
    template: PDFTemplate
  ): Promise<Uint8Array> {
    // Multi-page analytics report
    const page1 = pdfDoc.addPage([612, 792]);
    const font = this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!;
    const boldFont = this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!;

    let yPosition = 720;

    // Executive Summary Page
    yPosition = await this.drawHeader(page1, font, boldFont, yPosition, 
      'Analytics Dashboard', data.period);

    yPosition = await this.drawExecutiveSummary(page1, font, boldFont, yPosition, data.summary);

    // Key Metrics
    yPosition = await this.drawKeyMetrics(page1, font, boldFont, yPosition, data.keyMetrics);

    // Charts and visualizations on subsequent pages
    const chartPage = pdfDoc.addPage([612, 792]);
    await this.drawAnalyticsCharts(chartPage, data.charts);

    // Regional analysis page
    const regionPage = pdfDoc.addPage([612, 792]);
    await this.drawRegionalAnalysis(regionPage, font, boldFont, data.regionalData);

    return pdfDoc.save();
  }

  /**
   * Generate Route Optimization Report
   */
  private async generateRouteOptimizationReport(
    pdfDoc: PDFDocument,
    data: RouteOptimizationData,
    template: PDFTemplate
  ): Promise<Uint8Array> {
    const page = pdfDoc.addPage([612, 792]);
    const font = this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!;
    const boldFont = this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!;

    let yPosition = 720;

    // Header
    yPosition = await this.drawHeader(page, font, boldFont, yPosition, 
      'Route Optimization Report', data.date);

    // Optimization summary
    yPosition = await this.drawOptimizationSummary(page, font, boldFont, yPosition, data.summary);

    // Route details
    yPosition = await this.drawRouteDetails(page, font, boldFont, yPosition, data.routes);

    // Savings and efficiency metrics
    yPosition = await this.drawEfficiencyMetrics(page, font, boldFont, yPosition, data.metrics);

    // Map visualization (if available)
    if (data.mapImage && yPosition > 200) {
      await this.drawMapVisualization(page, yPosition - 150, data.mapImage);
    }

    return pdfDoc.save();
  }

  /**
   * Generate Generic Report (fallback)
   */
  private async generateGenericReport(
    pdfDoc: PDFDocument,
    data: any,
    template: PDFTemplate
  ): Promise<Uint8Array> {
    const page = pdfDoc.addPage([612, 792]);
    const font = this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!;
    const boldFont = this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!;

    let yPosition = 720;

    // Header
    yPosition = await this.drawHeader(page, font, boldFont, yPosition, 
      template.name, 'Generated Report');

    // Dynamic content based on template components
    for (const component of template.components) {
      yPosition = await this.drawGenericComponent(page, font, boldFont, yPosition, component, data);
      
      if (yPosition < 100) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 720;
      }
    }

    await this.drawFooter(page, font, 50);

    return pdfDoc.save();
  }

  // Helper methods for drawing specific sections
  
  private async loadFonts(pdfDoc: PDFDocument): Promise<void> {
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    this.fonts.set(PDF_CONSTANTS.FONTS.PRIMARY, helveticaFont);
    this.fonts.set(PDF_CONSTANTS.FONTS.SECONDARY, helveticaBoldFont);
    this.fonts.set(PDF_CONSTANTS.FONTS.MONO, courierFont);
  }

  private async drawHeader(
    page: PDFPage,
    font: PDFFont,
    boldFont: PDFFont,
    yPosition: number,
    title: string,
    subtitle: string
  ): Promise<number> {
    const { width } = page.getSize();

    // Think Tank Technologies logo area (placeholder)
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - 40,
      width: width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right,
      height: 40,
      color: rgb(
        parseInt(THINK_TANK_BRAND.primary.slice(1, 3), 16) / 255,
        parseInt(THINK_TANK_BRAND.primary.slice(3, 5), 16) / 255,
        parseInt(THINK_TANK_BRAND.primary.slice(5, 7), 16) / 255
      )
    });

    // Company name
    page.drawText('Think Tank Technologies', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - 25,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(1, 1, 1) // White text
    });

    // Report title
    page.drawText(title, {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - 70,
      size: PDF_CONSTANTS.SIZES.TITLE,
      font: boldFont,
      color: rgb(
        parseInt(THINK_TANK_BRAND.text.slice(1, 3), 16) / 255,
        parseInt(THINK_TANK_BRAND.text.slice(3, 5), 16) / 255,
        parseInt(THINK_TANK_BRAND.text.slice(5, 7), 16) / 255
      )
    });

    // Subtitle
    page.drawText(subtitle, {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - 95,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: font,
      color: rgb(
        parseInt(THINK_TANK_BRAND.neutral.slice(1, 3), 16) / 255,
        parseInt(THINK_TANK_BRAND.neutral.slice(3, 5), 16) / 255,
        parseInt(THINK_TANK_BRAND.neutral.slice(5, 7), 16) / 255
      )
    });

    // Date
    const currentDate = format(new Date(), 'MMMM dd, yyyy');
    page.drawText(`Generated: ${currentDate}`, {
      x: width - PDF_CONSTANTS.MARGINS.right - 150,
      y: yPosition - 70,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: font,
      color: rgb(
        parseInt(THINK_TANK_BRAND.neutral.slice(1, 3), 16) / 255,
        parseInt(THINK_TANK_BRAND.neutral.slice(3, 5), 16) / 255,
        parseInt(THINK_TANK_BRAND.neutral.slice(5, 7), 16) / 255
      )
    });

    return yPosition - 120;
  }

  private async drawFooter(page: PDFPage, font: PDFFont, yPosition: number): Promise<void> {
    const { width } = page.getSize();

    // Footer line
    page.drawLine({
      start: { x: PDF_CONSTANTS.MARGINS.left, y: yPosition + 20 },
      end: { x: width - PDF_CONSTANTS.MARGINS.right, y: yPosition + 20 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    // Footer text
    page.drawText('Think Tank Technologies Installation Scheduler', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Page number (for multi-page reports, this would be dynamic)
    page.drawText('Page 1', {
      x: width - PDF_CONSTANTS.MARGINS.right - 50,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  // Placeholder methods for specific section drawing
  private async drawScheduleSummary(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, data: any): Promise<number> {
    // Implementation for schedule summary section
    page.drawText('Schedule Summary', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31) // Think Tank primary color
    });

    // Add summary metrics
    const summaryItems = [
      `Total Installations: ${data.totalInstallations || 0}`,
      `Teams Assigned: ${data.teamsAssigned || 0}`,
      `Date Range: ${data.dateRange || 'N/A'}`,
      `Region: ${data.region || 'All Regions'}`
    ];

    let currentY = yPosition - 25;
    summaryItems.forEach(item => {
      page.drawText(`• ${item}`, {
        x: PDF_CONSTANTS.MARGINS.left + 20,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.17, 0.24, 0.31)
      });
      currentY -= 18;
    });

    return currentY - 10;
  }

  private async drawTeamAssignments(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, data: any): Promise<number> {
    // Header
    page.drawText('Team Assignments', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const tableWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;

    if (!data.teamAssignments || data.teamAssignments.length === 0) {
      page.drawText('No team assignments available', {
        x: PDF_CONSTANTS.MARGINS.left + 20,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
      return currentY - 20;
    }

    // Table headers
    const headers = ['Team Lead', 'Assistant', 'Assignments', 'Region', 'Status'];
    const columnWidths = [tableWidth * 0.25, tableWidth * 0.25, tableWidth * 0.15, tableWidth * 0.2, tableWidth * 0.15];

    // Draw table header
    currentY = await this.drawTableHeader(page, boldFont, currentY, headers, columnWidths);

    // Draw assignments
    for (const assignment of data.teamAssignments.slice(0, 10)) { // Limit to avoid overflow
      currentY = await this.drawTeamAssignmentRow(page, font, currentY, assignment, columnWidths);
      
      if (currentY < 100) { // Check if we need a page break
        break;
      }
    }

    return currentY - 10;
  }

  private async drawInstallationTable(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, installations: Installation[]): Promise<number> {
    // Header
    page.drawText('Installation Schedule', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const tableWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;

    if (!installations || installations.length === 0) {
      page.drawText('No installations scheduled', {
        x: PDF_CONSTANTS.MARGINS.left + 20,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
      return currentY - 20;
    }

    // Table headers
    const headers = ['Customer', 'Date/Time', 'Location', 'Status', 'Priority', 'Team'];
    const columnWidths = [tableWidth * 0.2, tableWidth * 0.15, tableWidth * 0.25, tableWidth * 0.12, tableWidth * 0.1, tableWidth * 0.18];

    // Draw table header
    currentY = await this.drawTableHeader(page, boldFont, currentY, headers, columnWidths);

    // Draw installations
    for (const installation of installations.slice(0, 15)) { // Limit to avoid overflow
      currentY = await this.drawInstallationRow(page, font, currentY, installation, columnWidths);
      
      if (currentY < 100) { // Check if we need a page break
        break;
      }
    }

    return currentY - 10;
  }

  private async drawRouteOptimization(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, routeData: any): Promise<number> {
    if (!routeData) return yPosition;

    // Header
    page.drawText('Route Optimization', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const columnWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right) / 2;

    // Optimization summary metrics
    const optimizationSummary = [
      { label: 'Total Distance Saved:', value: `${routeData.distanceSaved || 0} miles` },
      { label: 'Time Saved:', value: `${routeData.timeSaved || 0} hours` },
      { label: 'Fuel Cost Savings:', value: `$${routeData.fuelSavings || 0}` },
      { label: 'Efficiency Improvement:', value: `${routeData.efficiencyGain || 0}%` }
    ];

    // Draw optimization metrics
    for (const metric of optimizationSummary) {
      page.drawText('•', {
        x: PDF_CONSTANTS.MARGINS.left,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.22, 0.66, 0.43)
      });
      
      page.drawText(metric.label, {
        x: PDF_CONSTANTS.MARGINS.left + 15,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      page.drawText(metric.value, {
        x: PDF_CONSTANTS.MARGINS.left + 180,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.22, 0.66, 0.43)
      });
      
      currentY -= 20;
    }

    // Route details if available
    if (routeData.routes && routeData.routes.length > 0) {
      currentY -= 10;
      page.drawText('Optimized Routes:', {
        x: PDF_CONSTANTS.MARGINS.left,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.SUBTITLE,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      currentY -= 20;
      for (let i = 0; i < Math.min(routeData.routes.length, 3); i++) {
        const route = routeData.routes[i];
        page.drawText(`Route ${i + 1}: ${route.description || 'Optimized path'}`, {
          x: PDF_CONSTANTS.MARGINS.left + 20,
          y: currentY,
          size: PDF_CONSTANTS.SIZES.BODY,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
        currentY -= 15;
      }
    }

    return currentY - 10;
  }

  private async drawPerformanceMetrics(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    if (!metrics) return yPosition;

    // Header
    page.drawText('Performance Metrics', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const metricBoxWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right - 30) / 3;
    const metricBoxHeight = 80;

    // Key performance metrics in cards
    const performanceMetrics = [
      { label: 'Completion Rate', value: `${metrics.completionRate || 0}%`, color: rgb(0.22, 0.66, 0.43) },
      { label: 'Customer Satisfaction', value: `${metrics.customerSatisfaction || 0}/10`, color: rgb(0.19, 0.51, 0.81) },
      { label: 'Average Response Time', value: `${metrics.averageTime || 0} hrs`, color: rgb(0.84, 0.52, 0.20) }
    ];

    let xOffset = PDF_CONSTANTS.MARGINS.left;
    for (const metric of performanceMetrics) {
      // Draw metric card background
      page.drawRectangle({
        x: xOffset,
        y: currentY - metricBoxHeight,
        width: metricBoxWidth,
        height: metricBoxHeight,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
        color: rgb(0.98, 0.98, 0.98)
      });

      // Metric value (large)
      page.drawText(metric.value, {
        x: xOffset + 10,
        y: currentY - 25,
        size: 20,
        font: boldFont,
        color: metric.color
      });

      // Metric label
      page.drawText(metric.label, {
        x: xOffset + 10,
        y: currentY - 45,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      });

      // Additional detail if available
      const detailText = this.getMetricDetail(metric.label, metrics);
      if (detailText) {
        page.drawText(detailText, {
          x: xOffset + 10,
          y: currentY - 65,
          size: PDF_CONSTANTS.SIZES.CAPTION,
          font: font,
          color: rgb(0.6, 0.6, 0.6)
        });
      }

      xOffset += metricBoxWidth + 15;
    }

    return currentY - metricBoxHeight - 20;
  }

  private async drawPerformanceTable(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, reports: TeamPerformanceReport[]): Promise<number> {
    if (!reports || reports.length === 0) return yPosition;

    // Header
    page.drawText('Team Performance Details', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const tableWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;

    // Table headers
    const headers = ['Team Member', 'Completed Jobs', 'Efficiency %', 'Customer Rating', 'Revenue'];
    const columnWidths = [tableWidth * 0.3, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.2, tableWidth * 0.2];

    // Draw table header
    currentY = await this.drawTableHeader(page, boldFont, currentY, headers, columnWidths);

    // Draw team performance rows
    for (const report of reports.slice(0, 12)) {
      currentY = await this.drawPerformanceRow(page, font, currentY, report, columnWidths);
      
      if (currentY < 100) break;
    }

    return currentY - 10;
  }

  private async drawPerformanceCharts(page: PDFPage, yPosition: number, chartData: any): Promise<void> {
    if (!chartData) return;

    const { width } = page.getSize();
    const chartWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;
    const chartHeight = 150;

    // Chart placeholder (in real implementation, this would integrate with Chart.js)
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - chartHeight,
      width: chartWidth,
      height: chartHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.97, 0.98, 0.99)
    });

    // Chart title
    page.drawText('Performance Trends', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - 20,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: await this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!,
      color: rgb(0.17, 0.24, 0.31)
    });

    // Simulated chart data points
    if (chartData.dataPoints) {
      const dataY = yPosition - 60;
      let dataX = PDF_CONSTANTS.MARGINS.left + 20;
      
      for (let i = 0; i < Math.min(chartData.dataPoints.length, 10); i++) {
        const point = chartData.dataPoints[i];
        page.drawCircle({
          x: dataX,
          y: dataY + (point.value || 0) * 0.8,
          size: 3,
          color: rgb(0.19, 0.51, 0.81)
        });
        dataX += chartWidth / 10;
      }
    }

    // Chart legend
    page.drawText('Chart data visualization would be rendered here', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - chartHeight + 20,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: await this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  private async drawCustomerDetails(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, customer: any): Promise<number> {
    if (!customer) return yPosition;

    // Header
    page.drawText('Customer Information', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const columnWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right) / 2;

    // Left column - Basic Info
    page.drawText('Name:', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });
    page.drawText(customer.name || 'N/A', {
      x: PDF_CONSTANTS.MARGINS.left + 60,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: font,
      color: rgb(0.2, 0.2, 0.2)
    });

    currentY -= 20;
    page.drawText('Phone:', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });
    page.drawText(customer.phone || 'N/A', {
      x: PDF_CONSTANTS.MARGINS.left + 60,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: font,
      color: rgb(0.2, 0.2, 0.2)
    });

    currentY -= 20;
    page.drawText('Email:', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });
    page.drawText(customer.email || 'N/A', {
      x: PDF_CONSTANTS.MARGINS.left + 60,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: font,
      color: rgb(0.2, 0.2, 0.2)
    });

    // Right column - Address
    if (customer.address) {
      const rightX = PDF_CONSTANTS.MARGINS.left + columnWidth;
      let rightY = yPosition - 30;

      page.drawText('Address:', {
        x: rightX,
        y: rightY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      rightY -= 18;
      const addressLines = this.formatAddress(customer.address);
      for (const line of addressLines) {
        page.drawText(line, {
          x: rightX,
          y: rightY,
          size: PDF_CONSTANTS.SIZES.BODY,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
        rightY -= 15;
      }
    }

    return Math.min(currentY, yPosition - 80) - 10;
  }

  private async drawInstallationDetails(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, installation: Installation): Promise<number> {
    if (!installation) return yPosition;

    // Header
    page.drawText('Installation Details', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const columnWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right) / 2;

    // Left column
    const leftDetails = [
      { label: 'Installation ID:', value: installation.id || 'N/A' },
      { label: 'Scheduled Date:', value: installation.scheduledDate ? format(parseISO(installation.scheduledDate), 'MMMM dd, yyyy') : 'N/A' },
      { label: 'Scheduled Time:', value: installation.scheduledTime || 'N/A' },
      { label: 'Duration:', value: installation.duration ? `${installation.duration} minutes` : 'N/A' },
      { label: 'Priority:', value: this.formatPriority(installation.priority) }
    ];

    for (const detail of leftDetails) {
      page.drawText(detail.label, {
        x: PDF_CONSTANTS.MARGINS.left,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      const text = this.truncateText(detail.value, 35);
      page.drawText(text, {
        x: PDF_CONSTANTS.MARGINS.left + 120,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      currentY -= 18;
    }

    // Right column - Status and Notes
    const rightX = PDF_CONSTANTS.MARGINS.left + columnWidth;
    let rightY = yPosition - 30;

    page.drawText('Status:', {
      x: rightX,
      y: rightY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });
    
    const statusColor = this.getStatusColor(installation.status);
    page.drawText(this.formatStatus(installation.status), {
      x: rightX + 60,
      y: rightY,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: boldFont,
      color: statusColor
    });

    if (installation.notes) {
      rightY -= 25;
      page.drawText('Notes:', {
        x: rightX,
        y: rightY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      rightY -= 18;
      const noteLines = this.wrapText(installation.notes, 40);
      for (const line of noteLines.slice(0, 4)) { // Limit to 4 lines
        page.drawText(line, {
          x: rightX,
          y: rightY,
          size: PDF_CONSTANTS.SIZES.BODY,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
        rightY -= 15;
      }
    }

    return Math.min(currentY, rightY) - 15;
  }

  private async drawTeamInfo(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, team: any): Promise<number> {
    if (!team) return yPosition;

    // Header
    page.drawText('Team Information', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const columnWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right) / 2;

    // Team Lead information
    if (team.lead) {
      page.drawText('Team Lead:', {
        x: PDF_CONSTANTS.MARGINS.left,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.SUBTITLE,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      currentY -= 18;
      page.drawText(`${team.lead.firstName} ${team.lead.lastName}`, {
        x: PDF_CONSTANTS.MARGINS.left + 20,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      if (team.lead.email) {
        currentY -= 15;
        page.drawText(`Email: ${team.lead.email}`, {
          x: PDF_CONSTANTS.MARGINS.left + 20,
          y: currentY,
          size: PDF_CONSTANTS.SIZES.CAPTION,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        });
      }
    }

    // Assistant information (if available)
    if (team.assistant) {
      let assistantY = yPosition - 30;
      const rightX = PDF_CONSTANTS.MARGINS.left + columnWidth;
      
      page.drawText('Assistant:', {
        x: rightX,
        y: assistantY,
        size: PDF_CONSTANTS.SIZES.SUBTITLE,
        font: boldFont,
        color: rgb(0.17, 0.24, 0.31)
      });
      
      assistantY -= 18;
      page.drawText(`${team.assistant.firstName} ${team.assistant.lastName}`, {
        x: rightX + 20,
        y: assistantY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      if (team.assistant.email) {
        assistantY -= 15;
        page.drawText(`Email: ${team.assistant.email}`, {
          x: rightX + 20,
          y: assistantY,
          size: PDF_CONSTANTS.SIZES.CAPTION,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        });
      }
    }

    return currentY - 25;
  }

  private async drawNextSteps(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, nextSteps: string[]): Promise<number> {
    if (!nextSteps || nextSteps.length === 0) return yPosition;

    // Header
    page.drawText('Next Steps & Action Items', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 25;

    // Draw action items
    for (let i = 0; i < Math.min(nextSteps.length, 8); i++) {
      const step = nextSteps[i];
      
      // Step number
      page.drawText(`${i + 1}.`, {
        x: PDF_CONSTANTS.MARGINS.left,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.19, 0.51, 0.81)
      });
      
      // Step description
      const wrappedStep = this.wrapText(step, 85);
      for (let j = 0; j < Math.min(wrappedStep.length, 2); j++) {
        page.drawText(wrappedStep[j], {
          x: PDF_CONSTANTS.MARGINS.left + 20,
          y: currentY - (j * 12),
          size: PDF_CONSTANTS.SIZES.BODY,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
      }
      
      currentY -= wrappedStep.length > 1 ? 30 : 18;
      
      if (currentY < 100) break;
    }

    return currentY - 10;
  }

  private async drawCustomerFooter(page: PDFPage, font: PDFFont, yPosition: number): Promise<void> {
    const { width } = page.getSize();

    // Customer footer line
    page.drawLine({
      start: { x: PDF_CONSTANTS.MARGINS.left, y: yPosition + 20 },
      end: { x: width - PDF_CONSTANTS.MARGINS.right, y: yPosition + 20 },
      thickness: 1,
      color: rgb(0.17, 0.24, 0.31)
    });

    // Customer service contact info
    page.drawText('Questions about your installation?', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: font,
      color: rgb(0.17, 0.24, 0.31)
    });

    page.drawText('Contact us: (555) 123-4567 | support@thinktanktech.com', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - 15,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Company branding
    page.drawText('Think Tank Technologies - Professional Installation Services', {
      x: width - PDF_CONSTANTS.MARGINS.right - 280,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  private async drawExecutiveSummary(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, summary: any): Promise<number> {
    if (!summary) return yPosition;

    // Header
    page.drawText('Executive Summary', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const textWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;

    // Key highlights box
    const highlightBoxHeight = 120;
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY - highlightBoxHeight,
      width: textWidth,
      height: highlightBoxHeight,
      borderColor: rgb(0.17, 0.24, 0.31),
      borderWidth: 2,
      color: rgb(0.97, 0.98, 0.99)
    });

    // Key insights
    currentY -= 20;
    page.drawText('Key Insights:', {
      x: PDF_CONSTANTS.MARGINS.left + 15,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    const insights = [
      summary.keyInsight1 || 'Overall performance metrics show positive trends',
      summary.keyInsight2 || 'Team efficiency has improved by 15% this quarter',
      summary.keyInsight3 || 'Customer satisfaction scores remain consistently high'
    ];

    currentY -= 20;
    for (const insight of insights) {
      page.drawText('•', {
        x: PDF_CONSTANTS.MARGINS.left + 20,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(0.19, 0.51, 0.81)
      });
      
      const wrappedText = this.wrapText(insight, 80);
      for (let i = 0; i < Math.min(wrappedText.length, 2); i++) {
        page.drawText(wrappedText[i], {
          x: PDF_CONSTANTS.MARGINS.left + 35,
          y: currentY - (i * 12),
          size: PDF_CONSTANTS.SIZES.BODY,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
      }
      currentY -= wrappedText.length > 1 ? 30 : 18;
    }

    // Summary metrics
    currentY -= 20;
    page.drawText('Period Summary:', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    currentY -= 20;
    const summaryText = summary.overview || 'This report provides a comprehensive analysis of team performance, operational efficiency, and key business metrics for the reporting period.';
    const wrappedSummary = this.wrapText(summaryText, 90);
    
    for (let i = 0; i < Math.min(wrappedSummary.length, 4); i++) {
      page.drawText(wrappedSummary[i], {
        x: PDF_CONSTANTS.MARGINS.left,
        y: currentY,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      currentY -= 15;
    }

    return currentY - 10;
  }

  private async drawKeyMetrics(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    if (!metrics) return yPosition;

    // Header
    page.drawText('Key Performance Indicators', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 35;
    const { width } = page.getSize();
    const kpiBoxWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right - 45) / 4;
    const kpiBoxHeight = 100;

    const kpiMetrics = [
      { 
        label: 'Jobs Completed', 
        value: metrics.jobsCompleted || '0', 
        change: metrics.jobsCompletedChange || 0,
        color: rgb(0.22, 0.66, 0.43) 
      },
      { 
        label: 'Revenue Generated', 
        value: `$${(metrics.revenue || 0).toLocaleString()}`, 
        change: metrics.revenueChange || 0,
        color: rgb(0.19, 0.51, 0.81) 
      },
      { 
        label: 'Team Utilization', 
        value: `${metrics.utilization || 0}%`, 
        change: metrics.utilizationChange || 0,
        color: rgb(0.84, 0.52, 0.20) 
      },
      { 
        label: 'Quality Score', 
        value: `${metrics.qualityScore || 0}/10`, 
        change: metrics.qualityScoreChange || 0,
        color: rgb(0.64, 0.39, 0.77) 
      }
    ];

    let xOffset = PDF_CONSTANTS.MARGINS.left;
    for (const kpi of kpiMetrics) {
      // KPI Card background
      page.drawRectangle({
        x: xOffset,
        y: currentY - kpiBoxHeight,
        width: kpiBoxWidth,
        height: kpiBoxHeight,
        borderColor: kpi.color,
        borderWidth: 1,
        color: rgb(0.99, 0.99, 0.99)
      });

      // KPI value (large and prominent)
      page.drawText(kpi.value, {
        x: xOffset + 10,
        y: currentY - 30,
        size: 18,
        font: boldFont,
        color: kpi.color
      });

      // KPI label
      const labelLines = this.wrapText(kpi.label, 15);
      for (let i = 0; i < Math.min(labelLines.length, 2); i++) {
        page.drawText(labelLines[i], {
          x: xOffset + 10,
          y: currentY - 50 - (i * 12),
          size: PDF_CONSTANTS.SIZES.CAPTION,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        });
      }

      // Change indicator
      if (kpi.change !== 0) {
        const changeColor = kpi.change > 0 ? rgb(0.22, 0.66, 0.43) : rgb(0.83, 0.33, 0.33);
        const changeSymbol = kpi.change > 0 ? '▲' : '▼';
        page.drawText(`${changeSymbol} ${Math.abs(kpi.change)}%`, {
          x: xOffset + 10,
          y: currentY - 85,
          size: PDF_CONSTANTS.SIZES.CAPTION,
          font: boldFont,
          color: changeColor
        });
      }

      xOffset += kpiBoxWidth + 15;
    }

    return currentY - kpiBoxHeight - 20;
  }

  private async drawAnalyticsCharts(page: PDFPage, charts: any): Promise<void> {
    if (!charts) return;

    const { width, height } = page.getSize();
    const chartAreaWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;
    const chartAreaHeight = height - PDF_CONSTANTS.MARGINS.top - PDF_CONSTANTS.MARGINS.bottom;

    // Title for analytics charts page
    page.drawText('Analytics & Performance Charts', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: height - PDF_CONSTANTS.MARGINS.top - 40,
      size: PDF_CONSTANTS.SIZES.TITLE,
      font: this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = height - PDF_CONSTANTS.MARGINS.top - 80;
    const chartHeight = 180;
    const chartSpacing = 20;

    // Chart 1: Performance Trends
    await this.drawChartPlaceholder(page, PDF_CONSTANTS.MARGINS.left, currentY - chartHeight, chartAreaWidth, chartHeight, 'Performance Trends Over Time', charts.performanceTrends);
    currentY -= (chartHeight + chartSpacing);

    // Chart 2: Team Utilization
    if (currentY > 200) {
      await this.drawChartPlaceholder(page, PDF_CONSTANTS.MARGINS.left, currentY - chartHeight, chartAreaWidth, chartHeight, 'Team Utilization Distribution', charts.teamUtilization);
    }
  }

  private async drawRegionalAnalysis(page: PDFPage, font: PDFFont, boldFont: PDFFont, regionalData: any): Promise<void> {
    if (!regionalData) return;

    const { width, height } = page.getSize();
    let currentY = height - PDF_CONSTANTS.MARGINS.top - 40;

    // Page title
    page.drawText('Regional Performance Analysis', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY,
      size: PDF_CONSTANTS.SIZES.TITLE,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    currentY -= 40;

    // Regional summary table
    if (regionalData.regions) {
      const tableWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;
      const headers = ['Region', 'Jobs Completed', 'Team Members', 'Avg. Response', 'Utilization'];
      const columnWidths = [tableWidth * 0.2, tableWidth * 0.2, tableWidth * 0.15, tableWidth * 0.2, tableWidth * 0.25];

      currentY = await this.drawTableHeader(page, boldFont, currentY, headers, columnWidths);

      for (const region of regionalData.regions.slice(0, 10)) {
        currentY = await this.drawRegionalRow(page, font, currentY, region, columnWidths);
        if (currentY < 100) break;
      }
    }
  }

  private async drawOptimizationSummary(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, summary: any): Promise<number> {
    if (!summary) return yPosition;

    // Header
    page.drawText('Optimization Summary', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;

    // Summary metrics in a box
    const { width } = page.getSize();
    const summaryBoxHeight = 80;
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: currentY - summaryBoxHeight,
      width: width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right,
      height: summaryBoxHeight,
      borderColor: rgb(0.22, 0.66, 0.43),
      borderWidth: 2,
      color: rgb(0.97, 0.99, 0.97)
    });

    currentY -= 20;
    const summaryMetrics = [
      `Total Distance Optimized: ${summary.totalDistance || 'N/A'} miles`,
      `Time Savings: ${summary.timeSavings || 'N/A'} hours`,
      `Cost Savings: $${summary.costSavings || 'N/A'}`,
      `Routes Optimized: ${summary.routesOptimized || 'N/A'}`
    ];

    for (let i = 0; i < summaryMetrics.length; i++) {
      const x = i % 2 === 0 ? PDF_CONSTANTS.MARGINS.left + 15 : PDF_CONSTANTS.MARGINS.left + (width / 2);
      const y = currentY - ((Math.floor(i / 2)) * 20);
      
      page.drawText(summaryMetrics[i], {
        x: x,
        y: y,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
    }

    return currentY - summaryBoxHeight;
  }

  private async drawRouteDetails(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, routes: any): Promise<number> {
    if (!routes || routes.length === 0) return yPosition;

    // Header
    page.drawText('Optimized Route Details', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const tableWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;

    // Table headers
    const headers = ['Route ID', 'Start Location', 'End Location', 'Distance', 'Est. Time', 'Savings'];
    const columnWidths = [tableWidth * 0.1, tableWidth * 0.25, tableWidth * 0.25, tableWidth * 0.12, tableWidth * 0.12, tableWidth * 0.16];

    currentY = await this.drawTableHeader(page, boldFont, currentY, headers, columnWidths);

    // Draw route details
    for (let i = 0; i < Math.min(routes.length, 8); i++) {
      const route = routes[i];
      currentY = await this.drawRouteRow(page, font, currentY, route, columnWidths, i + 1);
      
      if (currentY < 100) break;
    }

    return currentY - 10;
  }

  private async drawEfficiencyMetrics(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    if (!metrics) return yPosition;

    // Header
    page.drawText('Efficiency Metrics', {
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition,
      size: PDF_CONSTANTS.SIZES.HEADER,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    let currentY = yPosition - 30;
    const { width } = page.getSize();
    const metricWidth = (width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right - 20) / 3;

    const efficiencyMetrics = [
      { label: 'Overall Efficiency', value: `${metrics.overallEfficiency || 0}%`, color: rgb(0.22, 0.66, 0.43) },
      { label: 'Fuel Efficiency', value: `${metrics.fuelEfficiency || 0} mpg`, color: rgb(0.19, 0.51, 0.81) },
      { label: 'Time Efficiency', value: `${metrics.timeEfficiency || 0}%`, color: rgb(0.84, 0.52, 0.20) }
    ];

    let xOffset = PDF_CONSTANTS.MARGINS.left;
    for (const metric of efficiencyMetrics) {
      // Efficiency gauge visualization
      const gaugeRadius = 25;
      const centerX = xOffset + metricWidth / 2;
      const centerY = currentY - 40;

      // Gauge background
      page.drawCircle({
        x: centerX,
        y: centerY,
        size: gaugeRadius,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 3
      });

      // Gauge fill (simplified)
      page.drawCircle({
        x: centerX,
        y: centerY,
        size: gaugeRadius - 5,
        color: metric.color,
        opacity: 0.3
      });

      // Metric value
      page.drawText(metric.value, {
        x: centerX - 15,
        y: centerY - 5,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: metric.color
      });

      // Metric label
      page.drawText(metric.label, {
        x: xOffset + 5,
        y: currentY - 80,
        size: PDF_CONSTANTS.SIZES.CAPTION,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      });

      xOffset += metricWidth + 10;
    }

    return currentY - 100;
  }

  private async drawMapVisualization(page: PDFPage, yPosition: number, mapImage: any): Promise<void> {
    if (!mapImage) return;

    const { width } = page.getSize();
    const mapWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;
    const mapHeight = 200;

    // Map placeholder (in real implementation, this would embed actual map image)
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - mapHeight,
      width: mapWidth,
      height: mapHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 2,
      color: rgb(0.95, 0.98, 0.95)
    });

    // Map title
    page.drawText('Route Optimization Map View', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - 20,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!,
      color: rgb(0.17, 0.24, 0.31)
    });

    // Simulated route markers
    for (let i = 0; i < 5; i++) {
      const x = PDF_CONSTANTS.MARGINS.left + 50 + (i * 80);
      const y = yPosition - 100 + Math.sin(i) * 30;
      
      page.drawCircle({
        x: x,
        y: y,
        size: 8,
        color: rgb(0.83, 0.18, 0.18)
      });
      
      page.drawText(`${i + 1}`, {
        x: x - 3,
        y: y - 3,
        size: 8,
        font: this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!,
        color: rgb(1, 1, 1)
      });
    }

    // Map legend
    page.drawText('Map visualization shows optimized route waypoints', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - mapHeight + 20,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  private async drawGenericComponent(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, component: any, data: any): Promise<number> {
    if (!component) return yPosition;

    switch (component.type) {
      case 'text':
        page.drawText(component.content || 'Text Component', {
          x: PDF_CONSTANTS.MARGINS.left,
          y: yPosition,
          size: component.size || PDF_CONSTANTS.SIZES.BODY,
          font: component.bold ? boldFont : font,
          color: rgb(0.2, 0.2, 0.2)
        });
        return yPosition - 20;

      case 'header':
        page.drawText(component.content || 'Header Component', {
          x: PDF_CONSTANTS.MARGINS.left,
          y: yPosition,
          size: component.size || PDF_CONSTANTS.SIZES.HEADER,
          font: boldFont,
          color: rgb(0.17, 0.24, 0.31)
        });
        return yPosition - 30;

      case 'data_table':
        if (component.data && Array.isArray(component.data)) {
          return await this.drawDataTable(page, font, boldFont, yPosition, component.data, component.headers);
        }
        return yPosition - 40;

      case 'metric_box':
        return await this.drawMetricBox(page, font, boldFont, yPosition, component.metrics);

      default:
        page.drawText(`Unknown component: ${component.type}`, {
          x: PDF_CONSTANTS.MARGINS.left,
          y: yPosition,
          size: PDF_CONSTANTS.SIZES.BODY,
          font: font,
          color: rgb(0.5, 0.5, 0.5)
        });
        return yPosition - 25;
    }
  }

  private generateReportName(template: PDFTemplate, data: any): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const baseName = template.name.replace(/\s+/g, '_');
    return `${baseName}_${timestamp}`;
  }

  private async savePDFToStorage(pdfBuffer: Uint8Array, filePath: string): Promise<void> {
    // In a real implementation, this would save to cloud storage (S3, etc.)
    console.log(`PDF saved to: ${filePath}, Size: ${pdfBuffer.length} bytes`);
  }

  // Utility methods for enhanced PDF generation

  private async drawTableHeader(page: PDFPage, boldFont: PDFFont, yPosition: number, headers: string[], columnWidths: number[]): Promise<number> {
    const headerHeight = 25;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    // Header background
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - headerHeight,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: headerHeight,
      color: rgb(0.17, 0.24, 0.31)
    });

    // Header text
    for (let i = 0; i < headers.length; i++) {
      page.drawText(this.truncateText(headers[i], Math.floor(columnWidths[i] / 7)), {
        x: xOffset + 5,
        y: yPosition - 18,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: boldFont,
        color: rgb(1, 1, 1)
      });
      xOffset += columnWidths[i];
    }

    return yPosition - headerHeight;
  }

  private async drawTeamAssignmentRow(page: PDFPage, font: PDFFont, yPosition: number, assignment: any, columnWidths: number[]): Promise<number> {
    const rowHeight = 20;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    // Alternating row background
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - rowHeight,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: rowHeight,
      color: rgb(0.98, 0.98, 0.98)
    });

    const rowData = [
      assignment.leadName || 'N/A',
      assignment.assistantName || 'Unassigned',
      assignment.assignmentCount?.toString() || '0',
      assignment.region || 'N/A',
      assignment.status || 'Active'
    ];

    for (let i = 0; i < rowData.length; i++) {
      page.drawText(this.truncateText(rowData[i], Math.floor(columnWidths[i] / 7)), {
        x: xOffset + 5,
        y: yPosition - 15,
        size: PDF_CONSTANTS.SIZES.BODY,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      xOffset += columnWidths[i];
    }

    return yPosition - rowHeight;
  }

  private async drawInstallationRow(page: PDFPage, font: PDFFont, yPosition: number, installation: Installation, columnWidths: number[]): Promise<number> {
    const rowHeight = 25;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    // Row background
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - rowHeight,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: rowHeight,
      color: rgb(0.99, 0.99, 0.99),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5
    });

    const dateTime = installation.scheduledDate && installation.scheduledTime 
      ? `${format(parseISO(installation.scheduledDate), 'MM/dd')} ${installation.scheduledTime}`
      : 'TBD';

    const address = installation.address 
      ? `${installation.address.city}, ${installation.address.state}`
      : 'Address TBD';

    const team = installation.leadId ? 'Assigned' : 'Unassigned';

    const rowData = [
      installation.customerName || 'N/A',
      dateTime,
      address,
      this.formatStatus(installation.status),
      this.formatPriority(installation.priority),
      team
    ];

    for (let i = 0; i < rowData.length; i++) {
      const textColor = i === 3 ? this.getStatusColor(installation.status) : rgb(0.2, 0.2, 0.2);
      page.drawText(this.truncateText(rowData[i], Math.floor(columnWidths[i] / 6)), {
        x: xOffset + 3,
        y: yPosition - 15,
        size: PDF_CONSTANTS.SIZES.CAPTION,
        font: font,
        color: textColor
      });
      xOffset += columnWidths[i];
    }

    return yPosition - rowHeight;
  }

  private async drawPerformanceRow(page: PDFPage, font: PDFFont, yPosition: number, report: TeamPerformanceReport, columnWidths: number[]): Promise<number> {
    const rowHeight = 22;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    // Row background
    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - rowHeight,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: rowHeight,
      color: rgb(0.98, 0.99, 0.98),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5
    });

    const rowData = [
      report.teamMemberName || 'N/A',
      report.metrics?.completedJobs?.toString() || '0',
      `${report.metrics?.efficiencyScore || 0}%`,
      `${report.metrics?.customerSatisfactionAvg || 0}/10`,
      `$${(report.metrics as any)?.revenue?.toLocaleString() || '0'}`
    ];

    for (let i = 0; i < rowData.length; i++) {
      page.drawText(this.truncateText(rowData[i], Math.floor(columnWidths[i] / 6)), {
        x: xOffset + 3,
        y: yPosition - 15,
        size: PDF_CONSTANTS.SIZES.CAPTION,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      xOffset += columnWidths[i];
    }

    return yPosition - rowHeight;
  }

  private async drawRegionalRow(page: PDFPage, font: PDFFont, yPosition: number, region: any, columnWidths: number[]): Promise<number> {
    const rowHeight = 22;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    const rowData = [
      region.region || 'N/A',
      region.totalJobs?.toString() || '0',
      region.teamCount?.toString() || '0',
      `${region.averageResponse || 0}h`,
      `${region.utilizationRate || 0}%`
    ];

    for (let i = 0; i < rowData.length; i++) {
      page.drawText(this.truncateText(rowData[i], Math.floor(columnWidths[i] / 6)), {
        x: xOffset + 3,
        y: yPosition - 15,
        size: PDF_CONSTANTS.SIZES.CAPTION,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      xOffset += columnWidths[i];
    }

    return yPosition - rowHeight;
  }

  private async drawRouteRow(page: PDFPage, font: PDFFont, yPosition: number, route: any, columnWidths: number[], routeNumber: number): Promise<number> {
    const rowHeight = 20;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    const rowData = [
      `R-${routeNumber.toString().padStart(3, '0')}`,
      this.truncateText(route.startLocation || 'N/A', 25),
      this.truncateText(route.endLocation || 'N/A', 25),
      `${route.distance || 0} mi`,
      `${route.estimatedTime || 0} min`,
      `${route.savings || 0}%`
    ];

    for (let i = 0; i < rowData.length; i++) {
      page.drawText(this.truncateText(rowData[i], Math.floor(columnWidths[i] / 6)), {
        x: xOffset + 3,
        y: yPosition - 15,
        size: PDF_CONSTANTS.SIZES.CAPTION,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      xOffset += columnWidths[i];
    }

    return yPosition - rowHeight;
  }

  private async drawChartPlaceholder(page: PDFPage, x: number, y: number, width: number, height: number, title: string, data: any): Promise<void> {
    // Chart container
    page.drawRectangle({
      x: x,
      y: y,
      width: width,
      height: height,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.97, 0.98, 0.99)
    });

    // Chart title
    page.drawText(title, {
      x: x + 15,
      y: y + height - 25,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: this.fonts.get(PDF_CONSTANTS.FONTS.SECONDARY)!,
      color: rgb(0.17, 0.24, 0.31)
    });

    // Simulated chart visualization
    if (data && data.points) {
      const chartArea = { x: x + 40, y: y + 30, width: width - 80, height: height - 80 };
      
      for (let i = 0; i < Math.min(data.points.length, 12); i++) {
        const pointX = chartArea.x + (i * chartArea.width / 12);
        const pointY = chartArea.y + (data.points[i] * chartArea.height / 100);
        
        page.drawCircle({
          x: pointX,
          y: pointY,
          size: 3,
          color: rgb(0.19, 0.51, 0.81)
        });
      }
    }

    // Placeholder text
    page.drawText('Chart visualization area', {
      x: x + width / 2 - 60,
      y: y + height / 2,
      size: PDF_CONSTANTS.SIZES.CAPTION,
      font: this.fonts.get(PDF_CONSTANTS.FONTS.PRIMARY)!,
      color: rgb(0.6, 0.6, 0.6)
    });
  }

  private async drawDataTable(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, data: any[], headers?: string[]): Promise<number> {
    if (!data || data.length === 0) return yPosition;

    const { width } = page.getSize();
    const tableWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;
    const defaultHeaders = headers || Object.keys(data[0] || {});
    const columnWidths = defaultHeaders.map(() => tableWidth / defaultHeaders.length);

    let currentY = await this.drawTableHeader(page, boldFont, yPosition, defaultHeaders, columnWidths);

    for (const row of data.slice(0, 10)) {
      currentY = await this.drawGenericRow(page, font, currentY, row, columnWidths, defaultHeaders);
      if (currentY < 100) break;
    }

    return currentY;
  }

  private async drawGenericRow(page: PDFPage, font: PDFFont, yPosition: number, rowData: any, columnWidths: number[], headers: string[]): Promise<number> {
    const rowHeight = 20;
    let xOffset = PDF_CONSTANTS.MARGINS.left;

    for (let i = 0; i < headers.length; i++) {
      const value = rowData[headers[i]]?.toString() || 'N/A';
      page.drawText(this.truncateText(value, Math.floor(columnWidths[i] / 6)), {
        x: xOffset + 3,
        y: yPosition - 15,
        size: PDF_CONSTANTS.SIZES.CAPTION,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      xOffset += columnWidths[i];
    }

    return yPosition - rowHeight;
  }

  private async drawMetricBox(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    if (!metrics) return yPosition;

    const { width } = page.getSize();
    const boxWidth = width - PDF_CONSTANTS.MARGINS.left - PDF_CONSTANTS.MARGINS.right;
    const boxHeight = 60;

    page.drawRectangle({
      x: PDF_CONSTANTS.MARGINS.left,
      y: yPosition - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.19, 0.51, 0.81),
      borderWidth: 1,
      color: rgb(0.97, 0.98, 0.99)
    });

    page.drawText(metrics.title || 'Metric', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - 20,
      size: PDF_CONSTANTS.SIZES.BODY,
      font: boldFont,
      color: rgb(0.19, 0.51, 0.81)
    });

    page.drawText(metrics.value || 'N/A', {
      x: PDF_CONSTANTS.MARGINS.left + 10,
      y: yPosition - 40,
      size: PDF_CONSTANTS.SIZES.SUBTITLE,
      font: boldFont,
      color: rgb(0.17, 0.24, 0.31)
    });

    return yPosition - boxHeight - 10;
  }

  // Text and data formatting utilities

  private truncateText(text: string, maxLength: number): string {
    if (!text) return 'N/A';
    return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
  }

  private wrapText(text: string, maxChars: number): string[] {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  private formatAddress(address: any): string[] {
    if (!address) return ['Address not available'];
    
    const lines = [];
    if (address.street) lines.push(address.street);
    
    const cityStateZip = [address.city, address.state, address.zipCode]
      .filter(Boolean)
      .join(', ');
    if (cityStateZip) lines.push(cityStateZip);
    
    return lines.length > 0 ? lines : ['Address incomplete'];
  }

  private formatStatus(status: string): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatPriority(priority: string): string {
    if (!priority) return 'Normal';
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  }

  private getStatusColor(status: string): RGB {
    switch (status?.toLowerCase()) {
      case 'completed':
        return rgb(0.22, 0.66, 0.43); // Green
      case 'in_progress':
        return rgb(0.19, 0.51, 0.81); // Blue
      case 'cancelled':
        return rgb(0.83, 0.33, 0.33); // Red
      case 'rescheduled':
        return rgb(0.84, 0.52, 0.20); // Orange
      case 'pending':
        return rgb(0.64, 0.39, 0.77); // Purple
      default:
        return rgb(0.5, 0.5, 0.5); // Gray
    }
  }

  private getMetricDetail(label: string, metrics: any): string | null {
    switch (label) {
      case 'Completion Rate':
        return metrics.completionTrend ? `${metrics.completionTrend > 0 ? '+' : ''}${metrics.completionTrend}% vs last period` : null;
      case 'Customer Satisfaction':
        return metrics.satisfactionCount ? `Based on ${metrics.satisfactionCount} reviews` : null;
      case 'Average Response Time':
        return metrics.responseImprovement ? `${metrics.responseImprovement}% improvement` : null;
      default:
        return null;
    }
  }
}

// Data interfaces for different report types
export interface PDFGenerationOptions {
  userId?: string;
  contextData?: { [key: string]: any };
  dataSource?: string;
  reportPeriod?: { start: string; end: string };
  recipients?: string[];
  deliveryMethod?: 'download' | 'email' | 'storage';
}

export interface InstallationScheduleData {
  region: string;
  dateRange: string;
  totalInstallations: number;
  teamsAssigned: number;
  installations: Installation[];
  teamAssignments: any[];
  routeOptimization?: any;
}

export interface TeamPerformanceData {
  reportPeriod: string;
  metrics: any;
  teamReports: TeamPerformanceReport[];
  chartData: any;
}

export interface CustomerReportData {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: any;
  };
  installation: Installation;
  team: {
    lead: TeamMember;
    assistant?: TeamMember;
  };
  nextSteps?: string[];
}

export interface AnalyticsReportData {
  period: string;
  summary: any;
  keyMetrics: any;
  charts: any;
  regionalData: any;
}

export interface RouteOptimizationData {
  date: string;
  summary: any;
  routes: any[];
  metrics: any;
  mapImage?: any;
}

// Export singleton instance
export const pdfGenerator = PDFGeneratorService.getInstance();