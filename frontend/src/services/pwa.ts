interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface OfflineAction {
  type: 'wardrobe_add' | 'outfit_save' | 'outfit_rate'
  data: any
  timestamp: number
}

class PWAService {
  private static instance: PWAService
  private swRegistration: ServiceWorkerRegistration | null = null
  private deferredPrompt: any = null
  private isOffline: boolean = false
  private offlineQueue: OfflineAction[] = []

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready
        this.setupEventListeners()
        this.setupOfflineDetection()
        await this.syncOfflineActions()
      } catch (error) {
        console.error('Service Worker initialization failed:', error)
      }
    }

    // Setup install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
    })

    // Setup push notification subscription
    await this.setupPushNotifications()
  }

  private setupEventListeners(): void {
    if (!this.swRegistration) return

    // Handle background sync
    if ('sync' in this.swRegistration) {
      this.swRegistration.sync.register('outfit-sync')
        .catch(err => console.log('Background sync registration failed:', err))
    }

    // Handle push events
    this.swRegistration.addEventListener('push', (event) => {
      if (event.data) {
        const options = event.data.json()
        event.waitUntil(
          this.showNotification(options.title, options)
        )
      }
    })

    // Handle notification clicks
    this.swRegistration.addEventListener('notificationclick', (event) => {
      event.notification.close()
      
      if (event.action) {
        this.handleNotificationAction(event.action, event.notification.data)
      } else {
        // Default action - open app
        clients.openWindow('/')
      }
    })
  }

  private setupOfflineDetection(): void {
    this.isOffline = !navigator.onLine
    
    window.addEventListener('online', () => {
      this.isOffline = false
      this.syncOfflineActions()
      this.showOnlineStatus()
    })

    window.addEventListener('offline', () => {
      this.isOffline = true
      this.showOfflineStatus()
    })
  }

  private async setupPushNotifications(): Promise<void> {
    if (!('PushManager' in window) || !this.swRegistration) {
      console.log('Push notifications not supported')
      return
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      
      if (!subscription) {
        await this.requestNotificationPermission()
      }
    } catch (error) {
      console.error('Push notification setup failed:', error)
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      await this.subscribeToPush()
      return true
    }

    return false
  }

  private async subscribeToPush(): Promise<void> {
    if (!this.swRegistration) return

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      })

      await this.sendSubscriptionToServer(subscription)
    } catch (error) {
      console.error('Push subscription failed:', error)
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh || '',
        auth: subscription.toJSON().keys?.auth || ''
      }
    }

    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false

    this.deferredPrompt.prompt()
    const { outcome } = await this.deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null
      return true
    }

    return false
  }

  async addToOfflineQueue(action: OfflineAction): Promise<void> {
    this.offlineQueue.push(action)
    
    try {
      await this.saveOfflineQueue()
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }

    if (this.isOffline) {
      this.showOfflineNotification(action)
    }
  }

  private async syncOfflineActions(): Promise<void> {
    if (this.isOffline || this.offlineQueue.length === 0) return

    const actions = [...this.offlineQueue]
    this.offlineQueue = []

    for (const action of actions) {
      try {
        await this.processOfflineAction(action)
      } catch (error) {
        console.error('Failed to process offline action:', error)
        // Re-queue failed actions
        this.offlineQueue.push(action)
      }
    }

    await this.saveOfflineQueue()
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'wardrobe_add':
        await fetch('/api/wardrobe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        })
        break
      
      case 'outfit_save':
        await fetch('/api/outfits/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        })
        break
      
      case 'outfit_rate':
        await fetch('/api/outfits/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        })
        break
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const saved = localStorage.getItem('offlineQueue')
      if (saved) {
        this.offlineQueue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
  }

  private async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    await this.swRegistration?.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    })
  }

  private showOfflineNotification(action: OfflineAction): void {
    this.showNotification('Offline Mode', {
      body: `Your ${action.type.replace('_', ' ')} will be synced when you're back online.`,
      tag: 'offline-action',
      requireInteraction: false
    })
  }

  private showOnlineStatus(): void {
    this.showNotification('Back Online', {
      body: 'Your offline actions have been synced.',
      tag: 'online-status'
    })
  }

  private showOfflineStatus(): void {
    this.showNotification('Offline Mode', {
      body: 'You\'re currently offline. Actions will be synced when you reconnect.',
      tag: 'offline-status',
      requireInteraction: true
    })
  }

  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'view-outfit':
        window.location.href = `/outfit/${data.outfitId}`
        break
      case 'view-wardrobe':
        window.location.href = '/wardrobe'
        break
      default:
        window.location.href = '/'
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }

  // Public API methods
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  getConnectionStatus(): 'online' | 'offline' {
    return this.isOffline ? 'offline' : 'online'
  }

  getOfflineQueueCount(): number {
    return this.offlineQueue.length
  }

  async scheduleDailyOutfitNotification(time: string = '09:00'): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    // This would typically be handled by a backend service
    // For now, we'll use a local approach
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime()

    setTimeout(() => {
      this.showNotification('Daily Outfit Suggestion', {
        body: 'Check out today\'s AI-powered outfit recommendations!',
        tag: 'daily-outfit',
        actions: [
          {
            action: 'view-outfit',
            title: 'View Outfits'
          },
          {
            action: 'dismiss',
            title: 'Later'
          }
        ]
      })
    }, timeUntilNotification)
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }

  getStorageEstimate(): Promise<StorageEstimate> {
    return navigator.storage?.estimate?.() || Promise.resolve({
      quota: 0,
      usage: 0,
      usageDetails: {}
    })
  }
}

export const pwaService = PWAService.getInstance()