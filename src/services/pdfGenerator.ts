// Think Tank Technologies PDF Generation Service
// Professional PDF report generation with branded templates

import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb, StandardFonts } from 'pdf-lib';
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
    // Implementation for team assignments section
    return yPosition - 80; // Placeholder
  }

  private async drawInstallationTable(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, installations: Installation[]): Promise<number> {
    // Implementation for installation table
    return yPosition - 200; // Placeholder
  }

  private async drawRouteOptimization(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, routeData: any): Promise<number> {
    // Implementation for route optimization section
    return yPosition - 100; // Placeholder
  }

  private async drawPerformanceMetrics(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    // Implementation for performance metrics
    return yPosition - 120; // Placeholder
  }

  private async drawPerformanceTable(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, reports: TeamPerformanceReport[]): Promise<number> {
    // Implementation for performance table
    return yPosition - 180; // Placeholder
  }

  private async drawPerformanceCharts(page: PDFPage, yPosition: number, chartData: any): Promise<void> {
    // Implementation for performance charts
  }

  private async drawCustomerDetails(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, customer: any): Promise<number> {
    // Implementation for customer details
    return yPosition - 100; // Placeholder
  }

  private async drawInstallationDetails(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, installation: Installation): Promise<number> {
    // Implementation for installation details
    return yPosition - 120; // Placeholder
  }

  private async drawTeamInfo(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, team: any): Promise<number> {
    // Implementation for team information
    return yPosition - 80; // Placeholder
  }

  private async drawNextSteps(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, nextSteps: string[]): Promise<number> {
    // Implementation for next steps
    return yPosition - 60; // Placeholder
  }

  private async drawCustomerFooter(page: PDFPage, font: PDFFont, yPosition: number): Promise<void> {
    // Implementation for customer-specific footer
  }

  private async drawExecutiveSummary(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, summary: any): Promise<number> {
    // Implementation for executive summary
    return yPosition - 150; // Placeholder
  }

  private async drawKeyMetrics(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    // Implementation for key metrics
    return yPosition - 100; // Placeholder
  }

  private async drawAnalyticsCharts(page: PDFPage, charts: any): Promise<void> {
    // Implementation for analytics charts
  }

  private async drawRegionalAnalysis(page: PDFPage, font: PDFFont, boldFont: PDFFont, regionalData: any): Promise<void> {
    // Implementation for regional analysis
  }

  private async drawOptimizationSummary(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, summary: any): Promise<number> {
    // Implementation for optimization summary
    return yPosition - 100; // Placeholder
  }

  private async drawRouteDetails(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, routes: any): Promise<number> {
    // Implementation for route details
    return yPosition - 150; // Placeholder
  }

  private async drawEfficiencyMetrics(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, metrics: any): Promise<number> {
    // Implementation for efficiency metrics
    return yPosition - 80; // Placeholder
  }

  private async drawMapVisualization(page: PDFPage, yPosition: number, mapImage: any): Promise<void> {
    // Implementation for map visualization
  }

  private async drawGenericComponent(page: PDFPage, font: PDFFont, boldFont: PDFFont, yPosition: number, component: any, data: any): Promise<number> {
    // Implementation for generic component drawing
    return yPosition - 40; // Placeholder
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