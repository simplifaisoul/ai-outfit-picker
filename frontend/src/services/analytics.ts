interface AnalyticsEvent {
  event: string
  category: string
  action?: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  timestamp: number
  url: string
  userAgent: string
  metadata?: Record<string, any>
}

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

interface ErrorInfo {
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  context?: Record<string, any>
}

class AnalyticsService {
  private static instance: AnalyticsService
  private sessionId: string
  private userId: string | null = null
  private isInitialized: boolean = false
  private eventQueue: AnalyticsEvent[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private errorQueue: ErrorInfo[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupErrorTracking()
    this.setupPerformanceTracking()
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize Google Analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('js', new Date())
        (window as any).gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
          send_page_view: false,
          custom_map: { custom_parameter_1: 'user_type' }
        })
      }

      this.isInitialized = true
      this.trackEvent('app_initialized', 'system', 'app_start')
      
      // Process queued events
      await this.flushEventQueue()
    } catch (error) {
      console.error('Analytics initialization failed:', error)
    }
  }

  setUserId(userId: string): void {
    this.userId = userId
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
        user_id: userId
      })
    }
  }

  trackPageView(path: string, title?: string): void {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
          page_title: title || document.title,
          page_location: window.location.href,
          page_path: path
        })
      }

      this.trackEvent('page_view', 'navigation', 'view', path)
    } catch (error) {
      console.error('Page view tracking failed:', error)
    }
  }

  trackEvent(
    event: string,
    category: string,
    action?: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata
    }

    if (this.isInitialized) {
      this.sendEvent(analyticsEvent)
    } else {
      this.eventQueue.push(analyticsEvent)
    }
  }

  trackUserInteraction(element: string, action: string, context?: Record<string, any>): void {
    this.trackEvent('user_interaction', 'ui', action, element, undefined, context)
  }

  trackOutfitGeneration(occasion: string, itemCount: number, score: number): void {
    this.trackEvent('outfit_generated', 'ai', 'generate', occasion, itemCount, {
      score,
      itemCount
    })
  }

  trackWardrobeAction(action: 'add' | 'remove' | 'update', category: string): void {
    this.trackEvent('wardrobe_action', 'wardrobe', action, category)
  }

  trackOutfitAction(action: 'save' | 'rate' | 'share', outfitId: string, rating?: number): void {
    this.trackEvent('outfit_action', 'outfit', action, outfitId, rating, { rating })
  }

  trackPerformance(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric)
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: metric.name,
        value: Math.round(metric.value)
      })
    }

    // Send to custom endpoint
    this.sendPerformanceData(metric)
  }

  trackError(error: ErrorInfo): void {
    this.errorQueue.push(error)
    
    // Send to error tracking service
    this.sendErrorData(error)
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.event, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_parameter_1: this.userId ? 'authenticated' : 'anonymous'
        })
      }

      // Send to custom analytics endpoint
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Event tracking failed:', error)
    }
  }

  private async sendPerformanceData(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Performance tracking failed:', error)
    }
  }

  private async sendErrorData(error: ErrorInfo): Promise<void> {
    try {
      await fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      })
    } catch (error) {
      console.error('Error tracking failed:', error)
    }
  }

  private async flushEventQueue(): Promise<void> {
    const events = [...this.eventQueue]
    this.eventQueue = []

    for (const event of events) {
      await this.sendEvent(event)
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId || undefined,
        sessionId: this.sessionId
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId || undefined,
        sessionId: this.sessionId,
        context: { reason: event.reason }
      })
    })
  }

  private setupPerformanceTracking(): void {
    if ('PerformanceObserver' in window) {
      // Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              this.trackPerformance({
                name: 'LCP',
                value: entry.startTime,
                rating: this.getLCPRating(entry.startTime),
                timestamp: Date.now(),
                url: window.location.href
              })
              break
            
            case 'first-input':
              this.trackPerformance({
                name: 'FID',
                value: (entry as any).processingStart - entry.startTime,
                rating: this.getFIDRating((entry as any).processingStart - entry.startTime),
                timestamp: Date.now(),
                url: window.location.href
              })
              break
            
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                this.trackPerformance({
                  name: 'CLS',
                  value: (entry as any).value,
                  rating: this.getCLSRating((entry as any).value),
                  timestamp: Date.now(),
                  url: window.location.href
                })
              }
              break
          }
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    }

    // Custom performance metrics
    this.measurePageLoadTime()
    this.measureAPIResponseTimes()
  }

  private measurePageLoadTime(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.trackPerformance({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.loadEventStart,
          rating: this.getPageLoadRating(navigation.loadEventEnd - navigation.loadEventStart),
          timestamp: Date.now(),
          url: window.location.href
        })
      }
    })
  }

  private measureAPIResponseTimes(): void {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = performance.now()
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start
        
        if (args[0].toString().includes('/api/')) {
          this.trackPerformance({
            name: 'api_response_time',
            value: duration,
            rating: this.getAPIRating(duration),
            timestamp: Date.now(),
            url: args[0].toString()
          })
        }
        
        return response
      } catch (error) {
        const duration = performance.now() - start
        this.trackPerformance({
          name: 'api_error_time',
          value: duration,
          rating: 'poor',
          timestamp: Date.now(),
          url: args[0].toString()
        })
        throw error
      }
    }
  }

  private getLCPRating(value: number): PerformanceMetric['rating'] {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getFIDRating(value: number): PerformanceMetric['rating'] {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  private getCLSRating(value: number): PerformanceMetric['rating'] {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private getPageLoadRating(value: number): PerformanceMetric['rating'] {
    if (value <= 3000) return 'good'
    if (value <= 5000) return 'needs-improvement'
    return 'poor'
  }

  private getAPIRating(value: number): PerformanceMetric['rating'] {
    if (value <= 500) return 'good'
    if (value <= 1500) return 'needs-improvement'
    return 'poor'
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API for getting analytics data
  getSessionId(): string {
    return this.sessionId
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics]
  }

  getErrorQueue(): ErrorInfo[] {
    return [...this.errorQueue]
  }

  clearQueues(): void {
    this.eventQueue = []
    this.performanceMetrics = []
    this.errorQueue = []
  }
}

export const analyticsService = AnalyticsService.getInstance()

// Type declarations for Google Analytics
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
  }
}