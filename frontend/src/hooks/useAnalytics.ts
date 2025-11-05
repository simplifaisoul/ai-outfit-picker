import { useEffect, useCallback } from 'react'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { analyticsService } from '@/services/analytics'

export const useAnalytics = () => {
  const location = useLocation()
  const { user } = useAppSelector(state => state.user)

  useEffect(() => {
    // Initialize analytics on first load
    analyticsService.initialize()
  }, [])

  useEffect(() => {
    // Track page views
    analyticsService.trackPageView(location.pathname, document.title)
  }, [location.pathname])

  useEffect(() => {
    // Update user ID when user changes
    if (user) {
      analyticsService.setUserId(user.id)
    }
  }, [user])

  const trackEvent = useCallback((
    event: string,
    category: string,
    action?: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    analyticsService.trackEvent(event, category, action, label, value, metadata)
  }, [])

  const trackUserInteraction = useCallback((
    element: string,
    action: string,
    context?: Record<string, any>
  ) => {
    analyticsService.trackUserInteraction(element, action, context)
  }, [])

  const trackOutfitGeneration = useCallback((
    occasion: string,
    itemCount: number,
    score: number
  ) => {
    analyticsService.trackOutfitGeneration(occasion, itemCount, score)
  }, [])

  const trackWardrobeAction = useCallback((
    action: 'add' | 'remove' | 'update',
    category: string
  ) => {
    analyticsService.trackWardrobeAction(action, category)
  }, [])

  const trackOutfitAction = useCallback((
    action: 'save' | 'rate' | 'share',
    outfitId: string,
    rating?: number
  ) => {
    analyticsService.trackOutfitAction(action, outfitId, rating)
  }, [])

  return {
    trackEvent,
    trackUserInteraction,
    trackOutfitGeneration,
    trackWardrobeAction,
    trackOutfitAction
  }
}

// Higher-order component for automatic tracking
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const TrackedComponent = (props: P) => {
    const { trackUserInteraction } = useAnalytics()

    useEffect(() => {
      trackUserInteraction(componentName, 'component_mounted')
    }, [])

    return React.createElement(Component, props)
  }

  TrackedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`
  return TrackedComponent
}