import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from '@/store'
import ErrorBoundary from './components/ErrorBoundary'
import { GlobalLoading } from './components/UI/LoadingStates'
import Layout from './components/Layout'
import PWAStatus from './components/PWAStatus'
import Home from './pages/Home'
import WardrobeManager from './components/WardrobeManager'
import OutfitPicker from './components/OutfitPicker'
import PhotoCapture from './components/PhotoCapture'
import { pwaService } from './services/pwa'
import './styles/globals.css'

const App: React.FC = () => {
  useEffect(() => {
    // Initialize PWA services
    pwaService.initialize().catch(error => {
      console.error('PWA initialization failed:', error)
    })
  }, [])

  return (
    <Provider store={store}>
      <ErrorBoundary>
        <GlobalLoading>
          <Router>
            <PWAStatus />
            <Layout>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/wardrobe" element={<WardrobeManager />} />
                  <Route path="/outfit-picker" element={<OutfitPicker />} />
                  <Route path="/add-item" element={<PhotoCapture />} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#000',
                color: '#fff',
                border: '1px solid #333',
                fontSize: '14px'
              },
              success: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#000'
                }
              },
              error: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#dc3545'
                }
              }
            }}
          />
        </GlobalLoading>
      </ErrorBoundary>
    </Provider>
  )
}

export default App