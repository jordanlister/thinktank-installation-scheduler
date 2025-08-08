/**
 * Analytics Implementation with Privacy Compliance
 * 
 * Features:
 * - Google Analytics 4 integration with consent management
 * - Custom event tracking for marketing KPIs
 * - Privacy-compliant data collection (no PII)
 * - Global Privacy Control (GPC) respect
 * - Performance monitoring integration
 * - A/B testing event tracking
 */

export interface AnalyticsConfig {
  ga4MeasurementId: string;
  debug: boolean;
  anonymizeIp: boolean;
  respectDnt: boolean;
  consentRequired: boolean;
  cookieDomain: string;
  sessionTimeoutDuration: number;
}

export interface CustomEvent {
  name: string;
  category: 'engagement' | 'conversion' | 'performance' | 'navigation';
  parameters: Record<string, string | number | boolean>;
  value?: number;
}

export interface UserConsent {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  statistics: boolean;
  timestamp: number;
}

export interface ConversionEvent {
  eventName: string;
  currency?: string;
  value?: number;
  items?: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    quantity: number;
  }>;
}

// Default configuration
const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  ga4MeasurementId: process.env.REACT_APP_GA4_MEASUREMENT_ID || '',
  debug: process.env.NODE_ENV === 'development',
  anonymizeIp: true,
  respectDnt: true,
  consentRequired: true,
  cookieDomain: 'auto',
  sessionTimeoutDuration: 30 * 60 * 1000 // 30 minutes
};

// Consent management
class ConsentManager {
  private static readonly CONSENT_KEY = 'ttt_user_consent';
  private static readonly GPC_HEADER = 'Sec-GPC';
  
  public static hasConsent(type: keyof UserConsent): boolean {
    // Respect Global Privacy Control
    if (this.hasGlobalPrivacyControl()) {
      return false;
    }
    
    // Respect Do Not Track
    if (navigator.doNotTrack === '1') {
      return false;
    }
    
    const consent = this.getConsent();
    return consent ? consent[type] : false;
  }
  
  public static getConsent(): UserConsent | null {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  
  public static setConsent(consent: Omit<UserConsent, 'timestamp'>) {
    const consentWithTimestamp: UserConsent = {
      ...consent,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentWithTimestamp));
      
      // Update GA consent
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: consent.analytics ? 'granted' : 'denied',
          ad_storage: consent.marketing ? 'granted' : 'denied',
          ad_user_data: consent.marketing ? 'granted' : 'denied',
          ad_personalization: consent.marketing ? 'granted' : 'denied',
        });
      }
      
      // Dispatch event for other parts of the app
      window.dispatchEvent(new CustomEvent('consent-updated', { 
        detail: consentWithTimestamp 
      }));
      
    } catch (error) {
      console.error('Failed to save consent preferences:', error);
    }
  }
  
  public static hasGlobalPrivacyControl(): boolean {
    return navigator.globalPrivacyControl === true;
  }
  
  public static isConsentRequired(): boolean {
    // Check if user is in a region requiring consent (e.g., EU for GDPR)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const euTimezones = [
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
      'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna'
    ];
    
    return euTimezones.some(tz => timezone.includes(tz));
  }
}

// Analytics service
export class AnalyticsService {
  private config: AnalyticsConfig;
  private initialized = false;
  private eventQueue: CustomEvent[] = [];
  
  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
  }
  
  public async initialize(): Promise<void> {
    if (this.initialized || !this.config.ga4MeasurementId) {
      return;
    }
    
    // Check consent before initializing
    if (this.config.consentRequired && !ConsentManager.hasConsent('analytics')) {
      console.log('Analytics initialization deferred - waiting for consent');
      return;
    }
    
    try {
      await this.loadGoogleAnalytics();
      this.initializeGA4();
      this.setupPerformanceTracking();
      this.processEventQueue();
      this.initialized = true;
      
      console.log('✅ Analytics initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
    }
  }
  
  private async loadGoogleAnalytics(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.gtag && window.dataLayer) {
        resolve();
        return;
      }
      
      // Create gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4MeasurementId}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Analytics'));
      
      document.head.appendChild(script);
    });
  }
  
  private initializeGA4(): void {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    
    // Set default consent state
    window.gtag('consent', 'default', {
      analytics_storage: ConsentManager.hasConsent('analytics') ? 'granted' : 'denied',
      ad_storage: ConsentManager.hasConsent('marketing') ? 'granted' : 'denied',
      ad_user_data: ConsentManager.hasConsent('marketing') ? 'granted' : 'denied',
      ad_personalization: ConsentManager.hasConsent('marketing') ? 'granted' : 'denied',
    });
    
    // Configure GA4
    window.gtag('config', this.config.ga4MeasurementId, {
      debug_mode: this.config.debug,
      anonymize_ip: this.config.anonymizeIp,
      cookie_domain: this.config.cookieDomain,
      session_timeout: this.config.sessionTimeoutDuration,
      // Enhanced ecommerce
      send_page_view: false, // We'll send manually with additional data
    });
    
    // Send initial page view with custom data
    this.trackPageView();
  }
  
  private setupPerformanceTracking(): void {
    // Import performance tracking
    import('./perf/core-web-vitals').then(({ setPerformanceReporter }) => {
      setPerformanceReporter((report) => {
        this.trackEvent({
          name: 'performance_report',
          category: 'performance',
          parameters: {
            url: report.url,
            lcp: report.metrics.find(m => m.name === 'LCP')?.value || 0,
            fid: report.metrics.find(m => m.name === 'FID')?.value || 0,
            cls: report.metrics.find(m => m.name === 'CLS')?.value || 0,
            connection_type: report.deviceInfo.connection || 'unknown'
          }
        });
      });
    });
  }
  
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.sendEvent(event);
    }
  }
  
  public trackEvent(event: CustomEvent): void {
    if (!this.initialized) {
      this.eventQueue.push(event);
      return;
    }
    
    this.sendEvent(event);
  }
  
  private sendEvent(event: CustomEvent): void {
    if (!window.gtag) return;
    
    const eventData: any = {
      event_category: event.category,
      ...event.parameters
    };
    
    if (event.value !== undefined) {
      eventData.value = event.value;
    }
    
    window.gtag('event', event.name, eventData);
    
    if (this.config.debug) {
      console.log('📊 Analytics Event:', event.name, eventData);
    }
  }
  
  public trackPageView(path?: string, title?: string): void {
    if (!window.gtag) return;
    
    const page_path = path || window.location.pathname;
    const page_title = title || document.title;
    
    window.gtag('event', 'page_view', {
      page_path,
      page_title,
      page_location: window.location.href,
      // Add custom marketing data
      page_type: this.getPageType(page_path),
      user_engagement: this.calculateEngagementScore()
    });
    
    if (this.config.debug) {
      console.log('📄 Page View:', page_path, page_title);
    }
  }
  
  private getPageType(path: string): string {
    if (path === '/') return 'homepage';
    if (path.startsWith('/features')) return 'features';
    if (path.startsWith('/solutions')) return 'solutions';
    if (path.startsWith('/pricing')) return 'pricing';
    if (path.startsWith('/resources')) return 'resources';
    if (path.startsWith('/company')) return 'company';
    if (path.startsWith('/contact')) return 'contact';
    return 'other';
  }
  
  private calculateEngagementScore(): number {
    // Simple engagement score based on time on page and scroll depth
    const timeOnPage = performance.now();
    const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    return Math.min(100, Math.round((timeOnPage / 1000) + scrollPercentage));
  }
  
  public trackConversion(conversion: ConversionEvent): void {
    if (!window.gtag) return;
    
    const eventData: any = {
      currency: conversion.currency || 'USD',
      value: conversion.value || 0
    };
    
    if (conversion.items) {
      eventData.items = conversion.items;
    }
    
    window.gtag('event', conversion.eventName, eventData);
    
    if (this.config.debug) {
      console.log('💰 Conversion Event:', conversion);
    }
  }
  
  public setUserProperties(properties: Record<string, string | number>): void {
    if (!window.gtag) return;
    
    // Ensure no PII is included
    const sanitizedProperties = this.sanitizeUserProperties(properties);
    
    window.gtag('config', this.config.ga4MeasurementId, {
      custom_map: sanitizedProperties
    });
  }
  
  private sanitizeUserProperties(properties: Record<string, string | number>): Record<string, string | number> {
    const sanitized: Record<string, string | number> = {};
    const allowedKeys = ['company_size', 'industry', 'role', 'plan_tier', 'feature_usage'];
    
    Object.entries(properties).forEach(([key, value]) => {
      if (allowedKeys.includes(key) && typeof value !== 'undefined') {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
}

// Marketing-specific event tracking
export class MarketingAnalytics {
  constructor(private analytics: AnalyticsService) {}
  
  // Lead generation events
  public trackTrialSignup(planType: string = 'starter'): void {
    this.analytics.trackConversion({
      eventName: 'sign_up',
      value: 100,
      items: [{
        item_id: 'trial_signup',
        item_name: 'Free Trial',
        item_category: 'conversion',
        price: 0,
        quantity: 1
      }]
    });
    
    this.analytics.trackEvent({
      name: 'trial_signup',
      category: 'conversion',
      parameters: {
        plan_type: planType,
        source: 'marketing_website'
      },
      value: 100
    });
  }
  
  public trackDemoRequest(demoType: string = 'general'): void {
    this.analytics.trackConversion({
      eventName: 'generate_lead',
      value: 75
    });
    
    this.analytics.trackEvent({
      name: 'demo_request',
      category: 'conversion',
      parameters: {
        demo_type: demoType,
        page_path: window.location.pathname
      },
      value: 75
    });
  }
  
  public trackContactForm(formType: string = 'contact'): void {
    this.analytics.trackEvent({
      name: 'form_submit',
      category: 'engagement',
      parameters: {
        form_type: formType,
        page_path: window.location.pathname
      }
    });
  }
  
  // Feature interaction events
  public trackPricingCalculator(calculation: { monthlyVolume: number; estimatedSavings: number }): void {
    this.analytics.trackEvent({
      name: 'pricing_calculator_used',
      category: 'engagement',
      parameters: {
        monthly_volume: calculation.monthlyVolume,
        estimated_savings: calculation.estimatedSavings
      },
      value: calculation.estimatedSavings
    });
  }
  
  public trackFeatureDemo(featureName: string, interactionType: 'view' | 'interact'): void {
    this.analytics.trackEvent({
      name: 'feature_demo_interaction',
      category: 'engagement',
      parameters: {
        feature_name: featureName,
        interaction_type: interactionType,
        page_path: window.location.pathname
      }
    });
  }
  
  // Content engagement
  public trackResourceDownload(resourceType: 'case_study' | 'whitepaper' | 'guide', resourceName: string): void {
    this.analytics.trackEvent({
      name: 'file_download',
      category: 'engagement',
      parameters: {
        resource_type: resourceType,
        resource_name: resourceName,
        file_extension: 'pdf'
      }
    });
  }
  
  public trackVideoPlay(videoName: string, progress: number): void {
    this.analytics.trackEvent({
      name: 'video_progress',
      category: 'engagement',
      parameters: {
        video_name: videoName,
        progress_percent: progress
      },
      value: progress
    });
  }
  
  // Navigation and engagement
  public trackScrollDepth(percentage: number): void {
    // Only track meaningful scroll milestones
    if ([25, 50, 75, 90, 100].includes(percentage)) {
      this.analytics.trackEvent({
        name: 'scroll_depth',
        category: 'engagement',
        parameters: {
          scroll_depth: percentage,
          page_path: window.location.pathname
        },
        value: percentage
      });
    }
  }
  
  public trackTimeOnPage(seconds: number): void {
    // Track time milestones
    if ([30, 60, 120, 300].includes(seconds)) {
      this.analytics.trackEvent({
        name: 'time_on_page',
        category: 'engagement',
        parameters: {
          time_seconds: seconds,
          page_path: window.location.pathname
        },
        value: seconds
      });
    }
  }
}

// Global analytics instance
let analyticsInstance: AnalyticsService | null = null;
let marketingAnalyticsInstance: MarketingAnalytics | null = null;

export function initAnalytics(config?: Partial<AnalyticsConfig>): { analytics: AnalyticsService; marketing: MarketingAnalytics } {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(config);
    marketingAnalyticsInstance = new MarketingAnalytics(analyticsInstance);
    
    // Initialize analytics
    analyticsInstance.initialize();
    
    // Listen for consent changes
    window.addEventListener('consent-updated', () => {
      analyticsInstance?.initialize();
    });
  }
  
  return {
    analytics: analyticsInstance,
    marketing: marketingAnalyticsInstance!
  };
}

export function getAnalytics(): AnalyticsService | null {
  return analyticsInstance;
}

export function getMarketingAnalytics(): MarketingAnalytics | null {
  return marketingAnalyticsInstance;
}

// Export consent manager
export { ConsentManager };

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
  
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}