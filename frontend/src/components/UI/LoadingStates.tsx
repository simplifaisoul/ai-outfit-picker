import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAppSelector } from '@/hooks/redux'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  overlay?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text, 
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const spinner = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-black`} />
      </motion.div>
      {text && (
        <span className="ml-3 text-gray-600 font-light">{text}</span>
      )}
    </motion.div>
  )

  if (overlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50"
      >
        {spinner}
      </motion.div>
    )
  }

  return spinner
}

interface ErrorDisplayProps {
  error: string | null
  onRetry?: () => void
  onDismiss?: () => void
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss 
}) => {
  if (!error) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
      >
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-red-800 font-medium mb-1">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface GlobalLoadingProps {
  children: React.ReactNode
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({ children }) => {
  const loading = useAppSelector(state => state.ui.loading.global)

  return (
    <>
      <AnimatePresence>
        {loading && (
          <LoadingSpinner overlay text="Loading..." />
        )}
      </AnimatePresence>
      {children}
    </>
  )
}