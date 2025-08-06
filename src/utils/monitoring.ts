// Monitoring and error tracking utilities for Think Tank Technologies Installation Scheduler

interface ErrorInfo {
  message: string
  stack?: string
  context?: Record<string, any>
  userId?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  context?: Record<string, any>
}

interface UserAnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: number
}

class MonitoringService {
  private isProduction: boolean
  private sentryEnabled: boolean
  private analyticsEnabled: boolean
  private performanceEnabled: boolean

  constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENVIRONMENT === 'production'
    this.sentryEnabled = import.meta.env.VITE_ENABLE_SENTRY === 'true'
    this.analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    this.performanceEnabled = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true'
  }

  // Initialize monitoring services
  async initialize(): Promise<void> {
    if (this.sentryEnabled) {
      await this.initializeSentry()
    }

    if (this.analyticsEnabled) {
      this.initializeAnalytics()
    }

    if (this.performanceEnabled) {
      this.initializePerformanceMonitoring()
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers()
  }

  // Initialize Sentry for error tracking
  private async initializeSentry(): Promise<void> {
    try {
      const { init, browserTracingIntegration, replayIntegration } = await import('@sentry/react')
      
      init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_APP_ENVIRONMENT,
        release: `ttt-scheduler@${import.meta.env.VITE_APP_VERSION}`,
        
        // Performance monitoring
        tracesSampleRate: this.isProduction ? 0.1 : 1.0,
        
        // Session replay
        replaysSessionSampleRate: this.isProduction ? 0.01 : 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        integrations: [
          browserTracingIntegration({
            routingInstrumentation: this.isProduction,
          }),
          replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        
        // Error filtering
        beforeSend: (event, hint) => {
          // Filter out development errors
          if (!this.isProduction && hint?.originalException) {
            const error = hint.originalException as Error
            if (error.message?.includes('React DevTools')) {
              return null
            }
          }
          
          // Add additional context
          if (event.extra) {
            event.extra.buildTime = '__BUILD_TIME__'
            event.extra.userAgent = navigator.userAgent
            event.extra.url = window.location.href
          }
          
          return event
        },
        
        // Performance filtering
        beforeSendTransaction: (event) => {
          // Sample transactions in production
          if (this.isProduction && Math.random() > 0.1) {
            return null
          }
          return event
        },
      })

      console.log('✅ Sentry initialized successfully')
    } catch (error) {
      console.warn('❌ Failed to initialize Sentry:', error)
    }
  }

  // Initialize analytics (Google Analytics, Mixpanel, etc.)
  private initializeAnalytics(): void {
    try {
      // Google Analytics 4
      if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
        this.initializeGoogleAnalytics()
      }

      // Mixpanel
      if (import.meta.env.VITE_MIXPANEL_TOKEN) {
        this.initializeMixpanel()
      }

      console.log('✅ Analytics initialized successfully')
    } catch (error) {
      console.warn('❌ Failed to initialize analytics:', error)
    }
  }

  // Initialize Google Analytics
  private initializeGoogleAnalytics(): void {
    const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
    
    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }
    
    window.gtag('js', new Date())
    window.gtag('config', gaId, {
      app_name: 'Think Tank Technologies Installation Scheduler',
      app_version: import.meta.env.VITE_APP_VERSION,
      debug_mode: !this.isProduction,
    })
  }

  // Initialize Mixpanel
  private initializeMixpanel(): void {
    const token = import.meta.env.VITE_MIXPANEL_TOKEN
    
    // Load Mixpanel script
    const script = document.createElement('script')
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'
    script.onload = () => {
      if (window.mixpanel) {
        window.mixpanel.init(token, {
          debug: !this.isProduction,
          track_pageview: true,
          persistence: 'localStorage',
        })
      }
    }
    document.head.appendChild(script)
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    try {
      // Web Vitals
      this.initializeWebVitals()
      
      // Custom performance observers
      this.initializePerformanceObservers()
      
      console.log('✅ Performance monitoring initialized successfully')
    } catch (error) {
      console.warn('❌ Failed to initialize performance monitoring:', error)
    }
  }

  // Initialize Web Vitals monitoring
  private async initializeWebVitals(): Promise<void> {
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')
      
      getCLS((metric) => this.reportWebVital(metric))
      getFID((metric) => this.reportWebVital(metric))
      getFCP((metric) => this.reportWebVital(metric))
      getLCP((metric) => this.reportWebVital(metric))
      getTTFB((metric) => this.reportWebVital(metric))
    } catch (error) {
      console.warn('Failed to load web-vitals:', error)
    }
  }

  // Initialize custom performance observers
  private initializePerformanceObservers(): void {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackPerformance({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              context: {
                startTime: entry.startTime,
                name: entry.name,
              },
            })
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Long task observer not supported')
      }

      // Navigation Observer
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackPerformance({
              name: 'navigation',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: 'ms',
              context: {
                type: navEntry.type,
                redirectCount: navEntry.redirectCount,
              },
            })
          }
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })
      } catch (error) {
        console.warn('Navigation observer not supported')
      }
    }
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          type: 'unhandledrejection',
          reason: event.reason,
        },
      })
    })

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'medium',
        context: {
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureError({
          message: `Resource loading error: ${event.target}`,
          severity: 'low',
          context: {
            type: 'resource_error',
            element: (event.target as Element)?.tagName,
            source: (event.target as any)?.src || (event.target as any)?.href,
          },
        })
      }
    }, true)
  }

  // Public methods for error tracking
  captureError(error: ErrorInfo): void {
    if (!this.sentryEnabled && !this.isProduction) {
      console.error('Error captured:', error)
      return
    }

    try {
      if (this.sentryEnabled && window.Sentry) {
        window.Sentry.captureException(new Error(error.message), {
          extra: error.context,
          level: this.mapSeverityToSentryLevel(error.severity),
          user: error.userId ? { id: error.userId } : undefined,
        })
      }

      // Send to custom error tracking endpoint if needed
      this.sendToCustomErrorTracking(error)
    } catch (err) {
      console.error('Failed to capture error:', err)
    }
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.performanceEnabled) return

    try {
      // Send to analytics
      if (this.analyticsEnabled && window.gtag) {
        window.gtag('event', 'performance_metric', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit,
          custom_parameter: metric.context,
        })
      }

      // Send to custom performance tracking
      this.sendToCustomPerformanceTracking(metric)
    } catch (error) {
      console.error('Failed to track performance:', error)
    }
  }

  // Track user analytics events
  trackEvent(event: UserAnalyticsEvent): void {
    if (!this.analyticsEnabled) return

    try {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', event.event, event.properties)
      }

      // Mixpanel
      if (window.mixpanel) {
        window.mixpanel.track(event.event, event.properties)
      }

      // Custom analytics endpoint
      this.sendToCustomAnalytics(event)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  // Utility methods
  private reportWebVital(metric: any): void {
    this.trackPerformance({
      name: metric.name,
      value: metric.value,
      unit: 'ms',
      context: {
        id: metric.id,
        delta: metric.delta,
        rating: metric.rating,
      },
    })
  }

  private mapSeverityToSentryLevel(severity?: string): string {
    switch (severity) {
      case 'critical': return 'fatal'
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'error'
    }
  }

  private async sendToCustomErrorTracking(error: ErrorInfo): Promise<void> {
    // Implement custom error tracking endpoint
    if (import.meta.env.VITE_CUSTOM_ERROR_ENDPOINT) {
      try {
        await fetch(import.meta.env.VITE_CUSTOM_ERROR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...error,
            timestamp: new Date().toISOString(),
            environment: import.meta.env.VITE_APP_ENVIRONMENT,
            version: import.meta.env.VITE_APP_VERSION,
          }),
        })
      } catch (err) {
        console.error('Failed to send to custom error tracking:', err)
      }
    }
  }

  private async sendToCustomPerformanceTracking(metric: PerformanceMetric): Promise<void> {
    // Implement custom performance tracking endpoint
    if (import.meta.env.VITE_CUSTOM_PERFORMANCE_ENDPOINT) {
      try {
        await fetch(import.meta.env.VITE_CUSTOM_PERFORMANCE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...metric,
            timestamp: new Date().toISOString(),
            environment: import.meta.env.VITE_APP_ENVIRONMENT,
            version: import.meta.env.VITE_APP_VERSION,
          }),
        })
      } catch (err) {
        console.error('Failed to send to custom performance tracking:', err)
      }
    }
  }

  private async sendToCustomAnalytics(event: UserAnalyticsEvent): Promise<void> {
    // Implement custom analytics endpoint
    if (import.meta.env.VITE_CUSTOM_ANALYTICS_ENDPOINT) {
      try {
        await fetch(import.meta.env.VITE_CUSTOM_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...event,
            timestamp: event.timestamp || Date.now(),
            environment: import.meta.env.VITE_APP_ENVIRONMENT,
            version: import.meta.env.VITE_APP_VERSION,
          }),
        })
      } catch (err) {
        console.error('Failed to send to custom analytics:', err)
      }
    }
  }
}

// Create singleton instance
export const monitoring = new MonitoringService()

// Convenience functions
export const captureError = (error: ErrorInfo) => monitoring.captureError(error)
export const trackPerformance = (metric: PerformanceMetric) => monitoring.trackPerformance(metric)
export const trackEvent = (event: UserAnalyticsEvent) => monitoring.trackEvent(event)

// Initialize monitoring on module load
if (typeof window !== 'undefined') {
  monitoring.initialize()
}

// Type declarations for global objects
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
    mixpanel: any
    Sentry: any
  }
}