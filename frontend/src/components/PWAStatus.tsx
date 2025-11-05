import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Download, RefreshCw, Smartphone } from 'lucide-react'
import { pwaService } from '@/services/pwa'

const PWAStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if PWA is already installed
    if (!pwaService.isPWAInstalled() && !localStorage.getItem('install-dismissed')) {
      setTimeout(() => setShowInstallPrompt(true), 3000)
    }

    // Update storage info periodically
    const updateStorageInfo = async () => {
      try {
        const estimate = await pwaService.getStorageEstimate()
        setStorageInfo({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        })
      } catch (error) {
        console.error('Failed to get storage estimate:', error)
      }
    }

    updateStorageInfo()
    const interval = setInterval(updateStorageInfo, 30000) // Update every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const updateQueueCount = () => {
      setOfflineQueueCount(pwaService.getOfflineQueueCount())
    }

    updateQueueCount()
    const interval = setInterval(updateQueueCount, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleInstall = async () => {
    const installed = await pwaService.showInstallPrompt()
    if (installed) {
      setShowInstallPrompt(false)
    }
  }

  const handleDismissInstall = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('install-dismissed', 'true')
  }

  const handleClearCache = async () => {
    try {
      await pwaService.clearCache()
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      {/* Connection Status */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-orange-500 text-white z-50 p-3"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff size={20} />
                <span className="font-medium">You're offline</span>
                {offlineQueueCount > 0 && (
                  <span className="bg-white text-orange-500 px-2 py-1 rounded-full text-xs font-medium">
                    {offlineQueueCount} pending actions
                  </span>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-white text-orange-500 px-3 py-1 rounded-full text-sm font-medium hover:bg-orange-50"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40 max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
                <Smartphone size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Install Outfit Picker</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get offline access and a faster experience with our app.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInstall}
                    className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    <Download size={16} />
                    Install
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDismissInstall}
                    className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Not now
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storage Status (for development/debugging) */}
      {process.env.NODE_ENV === 'development' && storageInfo && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs z-40">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={14} className={isOnline ? 'text-green-400' : 'text-red-400'} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div>Storage: {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}</div>
          {offlineQueueCount > 0 && (
            <div>Queue: {offlineQueueCount} items</div>
          )}
          <button
            onClick={handleClearCache}
            className="mt-2 text-blue-300 hover:text-blue-200 underline"
          >
            Clear Cache
          </button>
        </div>
      )}
    </>
  )
}

export default PWAStatus