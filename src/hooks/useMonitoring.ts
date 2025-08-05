import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { monitoring, trackEvent, trackPerformance, captureError } from '@/utils/monitoring'

interface UseMonitoringOptions {
  trackPageViews?: boolean
  trackUserInteractions?: boolean
  trackPerformanceMetrics?: boolean
}

interface MonitoringHook {
  trackEvent: (event: string, properties?: Record<string, any>) => void
  trackError: (error: Error, context?: Record<string, any>) => void
  trackPerformance: (name: string, value: number, unit?: string) => void
  startTimer: (name: string) => () => void
  trackUserAction: (action: string, target?: string, properties?: Record<string, any>) => void
}

export const useMonitoring = (options: UseMonitoringOptions = {}): MonitoringHook => {
  const location = useLocation()
  const timersRef = useRef<Map<string, number>>(new Map())
  
  const {
    trackPageViews = true,
    trackUserInteractions = true,
    trackPerformanceMetrics = true,
  } = options

  // Track page views
  useEffect(() => {
    if (trackPageViews) {
      trackEvent('page_view', {
        page_path: location.pathname,
        page_search: location.search,
        page_hash: location.hash,
        page_title: document.title,
        referrer: document.referrer,
      })
    }
  }, [location, trackPageViews])

  // Track performance metrics on mount
  useEffect(() => {
    if (trackPerformanceMetrics) {
      // Track page load time
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        trackPerformance('page_load_time', navigationEntry.loadEventEnd - navigationEntry.fetchStart, 'ms')
        trackPerformance('dom_content_loaded', navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart, 'ms')
        trackPerformance('first_paint', navigationEntry.domContentLoadedEventEnd - navigationEntry.responseStart, 'ms')
      }

      // Track component mount time
      const mountStartTime = Date.now()
      return () => {
        const mountDuration = Date.now() - mountStartTime
        trackPerformance('component_mount_time', mountDuration, 'ms')
      }
    }
  }, [trackPerformanceMetrics])

  // Memoized tracking functions
  const handleTrackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    trackEvent({
      event,
      properties: {
        ...properties,
        page_path: location.pathname,
        timestamp: Date.now(),
      },
    })
  }, [location.pathname])

  const handleTrackError = useCallback((error: Error, context?: Record<string, any>) => {
    captureError({
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        page_path: location.pathname,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      severity: 'medium',
    })
  }, [location.pathname])

  const handleTrackPerformance = useCallback((name: string, value: number, unit: string = 'ms') => {
    trackPerformance({
      name,
      value,
      unit,
      context: {
        page_path: location.pathname,
        timestamp: Date.now(),
      },
    })
  }, [location.pathname])

  const startTimer = useCallback((name: string) => {
    const startTime = performance.now()
    timersRef.current.set(name, startTime)
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      timersRef.current.delete(name)
      handleTrackPerformance(name, duration, 'ms')
    }
  }, [handleTrackPerformance])

  const trackUserAction = useCallback((action: string, target?: string, properties?: Record<string, any>) => {
    if (trackUserInteractions) {
      handleTrackEvent('user_action', {
        action,
        target,
        ...properties,
      })
    }
  }, [trackUserInteractions, handleTrackEvent])

  return {
    trackEvent: handleTrackEvent,
    trackError: handleTrackError,
    trackPerformance: handleTrackPerformance,
    startTimer,
    trackUserAction,
  }
}

// Hook for tracking component performance
export const usePerformanceTimer = (componentName: string) => {
  const mountTimeRef = useRef<number>(Date.now())
  const renderCountRef = useRef<number>(0)
  
  useEffect(() => {
    renderCountRef.current++
    
    return () => {
      const mountDuration = Date.now() - mountTimeRef.current
      trackPerformance({
        name: `${componentName}_lifetime`,
        value: mountDuration,
        unit: 'ms',
        context: {
          component: componentName,
          render_count: renderCountRef.current,
        },
      })
    }
  }, [componentName])

  const trackRenderTime = useCallback(() => {
    const renderStart = performance.now()
    
    return () => {
      const renderDuration = performance.now() - renderStart
      trackPerformance({
        name: `${componentName}_render`,
        value: renderDuration,
        unit: 'ms',
        context: {
          component: componentName,
          render_number: renderCountRef.current,
        },
      })
    }
  }, [componentName])

  return { trackRenderTime }
}

// Hook for tracking API calls
export const useApiMonitoring = () => {
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = performance.now()
    const callId = `${method}_${endpoint}_${Date.now()}`
    
    try {
      trackEvent({
        event: 'api_call_start',
        properties: {
          endpoint,
          method,
          call_id: callId,
        },
      })

      const result = await apiCall()
      const duration = performance.now() - startTime

      trackEvent({
        event: 'api_call_success',
        properties: {
          endpoint,
          method,
          call_id: callId,
          duration,
        },
      })

      trackPerformance({
        name: 'api_call_duration',
        value: duration,
        unit: 'ms',
        context: {
          endpoint,
          method,
          status: 'success',
        },
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      trackEvent({
        event: 'api_call_error',
        properties: {
          endpoint,
          method,
          call_id: callId,
          duration,
          error_message: (error as Error).message,
        },
      })

      captureError({
        message: `API call failed: ${method} ${endpoint}`,
        stack: (error as Error).stack,
        context: {
          endpoint,
          method,
          duration,
          call_id: callId,
        },
        severity: 'high',
      })

      throw error
    }
  }, [])

  return { trackApiCall }
}

// Hook for tracking form interactions
export const useFormMonitoring = (formName: string) => {
  const { trackEvent } = useMonitoring()
  
  const trackFormStart = useCallback(() => {
    trackEvent('form_start', { form_name: formName })
  }, [formName, trackEvent])

  const trackFormSubmit = useCallback((success: boolean, errors?: string[]) => {
    trackEvent('form_submit', {
      form_name: formName,
      success,
      errors,
      error_count: errors?.length || 0,
    })
  }, [formName, trackEvent])

  const trackFieldInteraction = useCallback((fieldName: string, action: string) => {
    trackEvent('form_field_interaction', {
      form_name: formName,
      field_name: fieldName,
      action,
    })
  }, [formName, trackEvent])

  const trackFormError = useCallback((fieldName: string, errorMessage: string) => {
    trackEvent('form_error', {
      form_name: formName,
      field_name: fieldName,
      error_message: errorMessage,
    })
  }, [formName, trackEvent])

  return {
    trackFormStart,
    trackFormSubmit,
    trackFieldInteraction,
    trackFormError,
  }
}