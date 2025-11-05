import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, Calendar, Heart, Star, Cloud, Thermometer, Wind } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { useAnalytics } from '@/hooks/useAnalytics'
import { 
  generateOutfits, 
  saveOutfit, 
  setSelectedOutfit, 
  setOccasion,
  fetchWeather,
  rateOutfit
} from '@/store/slices/outfitsSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { LoadingSpinner, ErrorDisplay } from './UI/LoadingStates'
import { Outfit, WeatherData, Occasion } from '@/types'
import { Brain, Sparkles } from 'lucide-react'

const OutfitPicker: React.FC = () => {
  const dispatch = useAppDispatch()
  const { 
    outfits, 
    selectedOutfit, 
    weather, 
    error, 
    occasion,
    generating 
  } = useAppSelector((state: any) => state.outfits)
  const { trackOutfitGeneration, trackOutfitAction, trackUserInteraction } = useAnalytics()

  const [userRating, setUserRating] = useState(0)
  const [showWeatherDetails, setShowWeatherDetails] = useState(false)

  const occasions: Occasion[] = ['casual', 'work', 'formal', 'party', 'sport', 'date', 'business']

  useEffect(() => {
    dispatch(fetchWeather())
  }, [dispatch])

  const handleGenerateOutfits = async () => {
    try {
      const { wardrobe } = useAppSelector((state: any) => state.wardrobe)
      const { user } = useAppSelector((state: any) => state.user)
      
      await dispatch(generateOutfits({ 
        occasion, 
        weather: weather || undefined, 
        count: 6,
        wardrobe: (wardrobe as any)?.items || [],
        userPreferences: (user as any)?.preferences
      })).unwrap()
      
      dispatch(addNotification({
        type: 'success',
        title: 'AI Outfits Generated',
        message: `Generated ${outfits.length} smart outfit suggestions for ${occasion}`
      }))
      
      // Track analytics
      trackOutfitGeneration(occasion, outfits.length, selectedOutfit?.score || 0)
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate outfits. Please try again.'
      }))
    }
  }

  const handleSaveOutfit = async (outfit: Outfit) => {
    try {
      await dispatch(saveOutfit({
        outfit,
        occasion,
        date: new Date().toISOString().split('T')[0],
        notes: `Generated for ${occasion} occasion`
      })).unwrap()
      
      dispatch(addNotification({
        type: 'success',
        title: 'Outfit Saved',
        message: 'Outfit has been saved to your collection'
      }))
      
      // Track analytics
      trackOutfitAction('save', outfit.id)
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save outfit. Please try again.'
      }))
    }
  }

  const handleRateOutfit = (outfitId: string, rating: number) => {
    dispatch(rateOutfit({ outfitId, rating }))
    setUserRating(rating)
    
    dispatch(addNotification({
      type: 'success',
      title: 'Outfit Rated',
      message: `You rated this outfit ${rating} stars`
    }))
    
    // Track analytics
    trackOutfitAction('rate', outfitId, rating)
  }

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny': return '☀️'
      case 'partly-cloudy': return '⛅'
      case 'cloudy': return '☁️'
      case 'rainy': return '🌧️'
      case 'snowy': return '❄️'
      default: return '🌤️'
    }
  }

  const getWeatherBackground = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny': return 'from-yellow-50 to-orange-50'
      case 'cloudy': return 'from-gray-50 to-gray-100'
      case 'rainy': return 'from-blue-50 to-gray-100'
      case 'snowy': return 'from-blue-50 to-white'
      default: return 'from-blue-50 to-sky-50'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Weather */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className={`bg-gradient-to-r ${getWeatherBackground(weather?.condition || 'sunny')} border border-gray-200 rounded-xl p-6`}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Today's Outfit
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {weather && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-right"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{getWeatherIcon(weather.condition)}</span>
                  <div>
                    <div className="text-2xl font-light">{weather.temperature}°F</div>
                    <div className="text-sm text-gray-600">Feels like {weather.feels_like}°F</div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWeatherDetails(!showWeatherDetails)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {showWeatherDetails ? 'Hide' : 'Show'} Details
                </motion.button>

                <AnimatePresence>
                  {showWeatherDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-1 text-sm text-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        <Thermometer size={14} />
                        <span>Humidity: {weather.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind size={14} />
                        <span>Wind: {weather.windSpeed} mph</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cloud size={14} />
                        <span>UV Index: {weather.uv_index}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Occasion Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-lg p-6 mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Today's Occasion
            </label>
            <div className="flex flex-wrap gap-3">
              {occasions.map(occ => (
                <motion.button
                  key={occ}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    dispatch(setOccasion(occ))
                    trackUserInteraction('occasion_selector', 'select', { occasion: occ })
                  }}
                  className={`px-4 py-2 border capitalize transition-colors ${
                    occasion === occ
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {occ}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateOutfits}
            disabled={generating}
            className="px-8 py-3 bg-black text-white border border-black hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Shuffle size={20} />
                Generate Outfits
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={handleGenerateOutfits}
          />
        )}
      </AnimatePresence>

      {/* Selected Outfit */}
      <AnimatePresence>
        {selectedOutfit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-gray-200 rounded-xl p-8 mb-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h2 className="text-2xl font-light text-gray-900">
                    AI Recommended Outfit
                  </h2>
                </div>
                {selectedOutfit.reasoning && selectedOutfit.reasoning.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedOutfit.reasoning.map((reason: any, index: any) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs"
                      >
                        <Sparkles size={12} />
                        {reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className="text-sm text-gray-600">AI Score:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= Math.round(selectedOutfit.score) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  ({selectedOutfit.score.toFixed(1)})
                </span>
                {selectedOutfit.breakdown && (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <div>Weather: {((selectedOutfit.breakdown as any).weather * 100).toFixed(0)}%</div>
                    <div>Style: {((selectedOutfit.breakdown as any).style * 100).toFixed(0)}%</div>
                    <div>Color: {((selectedOutfit.breakdown as any).color * 100).toFixed(0)}%</div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {selectedOutfit.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="relative mb-3">
                    <img 
                      src={item.image_url} 
                      alt={item.category}
                      className="w-full h-40 object-cover border border-gray-200 rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium">
                      {item.category}
                    </div>
                  </div>
                  {item.color && (
                    <p className="text-sm text-gray-600">{item.color}</p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSaveOutfit(selectedOutfit)}
                className="flex-1 px-6 py-3 bg-black text-white border border-black hover:bg-gray-900 flex items-center justify-center gap-2"
              >
                <Heart size={20} />
                Save Outfit
              </motion.button>
              
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-gray-600">Rate:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => handleRateOutfit(selectedOutfit.id, rating)}
                      className="transition-colors"
                    >
                      <Star
                        size={20}
                        className={rating <= userRating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 hover:text-yellow-200'
                        }
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alternative Outfits */}
      {outfits.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-light text-gray-900 mb-6">
            More Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.slice(1).map((outfit, index) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => dispatch(setSelectedOutfit(outfit))}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedOutfit?.id === outfit.id 
                    ? 'border-black shadow-lg' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex gap-2 mb-3">
                  {outfit.items.slice(0, 3).map((item, itemIndex) => (
                    <img
                      key={itemIndex}
                      src={item.image_url}
                      alt={item.category}
                      className="w-16 h-16 object-cover border border-gray-200 rounded"
                    />
                  ))}
                  {outfit.items.length > 3 && (
                    <div className="w-16 h-16 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
                      <span className="text-sm text-gray-600">+{outfit.items.length - 3}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= Math.round(outfit.score) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {outfit.score.toFixed(1)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default OutfitPicker