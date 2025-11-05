import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, Thermometer, Wind, Droplets, Eye, MapPin, RefreshCw } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { fetchWeather } from '@/store/slices/outfitsSlice'
import { WeatherData } from '@/types'
import { weatherService } from '@/services/weather'

const WeatherWidget: React.FC = () => {
  const dispatch = useAppDispatch()
  const { weather, loading } = useAppSelector(state => state.outfits)
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchWeather())
  }, [dispatch])

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRefreshing(true)
    try {
      weatherService.clearCache()
      await dispatch(fetchWeather()).unwrap()
    } catch (error) {
      console.error('Failed to refresh weather:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading && !weather) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!weather) return null

  const getWeatherBackground = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny': return 'from-yellow-400 to-orange-400'
      case 'partly-cloudy': return 'from-blue-400 to-gray-400'
      case 'cloudy': return 'from-gray-400 to-gray-600'
      case 'rainy': return 'from-blue-500 to-blue-700'
      case 'snowy': return 'from-blue-200 to-gray-300'
      default: return 'from-blue-400 to-blue-600'
    }
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

  const getWeatherAdvice = (temp: number, condition: WeatherData['condition']) => {
    if (temp > 80) return 'Light, breathable fabrics recommended'
    if (temp > 60 && condition === 'sunny') return 'Perfect weather for layering'
    if (temp < 40) return 'Warm layers and outerwear essential'
    if (condition === 'rainy') return 'Water-resistant outerwear advised'
    return 'Comfortable weather for any outfit'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-gradient-to-br ${getWeatherBackground(weather.condition)} text-white rounded-xl p-6 cursor-pointer overflow-hidden`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-2 text-6xl">
          {getWeatherIcon(weather.condition)}
        </div>
      </div>

      {/* Main Weather Info */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} />
              <span className="text-sm opacity-90">
                {weather.location || 'Current Location'}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                className="ml-2 opacity-70 hover:opacity-100"
                disabled={refreshing}
              >
                <RefreshCw 
                  size={14} 
                  className={refreshing ? 'animate-spin' : ''} 
                />
              </motion.button>
            </div>
            <div className="text-4xl font-light">
              {Math.round(weather.temperature)}°F
            </div>
            <div className="text-sm opacity-90">
              Feels like {Math.round(weather.feels_like || weather.temperature)}°F
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg capitalize mb-1">
              {weather.condition.replace('-', ' ')}
            </div>
            <div className="text-sm opacity-90">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer size={16} />
            <div>
              <div className="opacity-90">Humidity</div>
              <div className="font-medium">{weather.humidity}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind size={16} />
            <div>
              <div className="opacity-90">Wind</div>
              <div className="font-medium">{weather.windSpeed} mph</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <div>
              <div className="opacity-90">UV Index</div>
              <div className="font-medium">{weather.uv_index || 3}</div>
            </div>
          </div>
        </div>

        {/* Style Advice */}
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="text-sm opacity-90 mb-1">Style Advice</div>
          <div className="text-sm font-medium">
            {getWeatherAdvice(weather.temperature, weather.condition)}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 right-0 bg-white text-gray-900 rounded-b-xl p-6 z-20 mt-2"
          >
            <h4 className="font-medium mb-4">Detailed Forecast</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Sunrise</span>
                <span>6:42 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunset</span>
                <span>7:28 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precipitation</span>
                <span>{weather.condition === 'rainy' ? '80%' : '10%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visibility</span>
                <span>{weather.condition === 'cloudy' ? '6 miles' : '10 miles'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Air Quality</span>
                <span className="text-green-600">Good</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium mb-2">Today's Outfit Recommendations</h5>
              <div className="space-y-2 text-sm">
                {weather.temperature > 75 && (
                  <div>• Lightweight, breathable fabrics</div>
                )}
                {weather.temperature < 45 && (
                  <div>• Warm layers and insulation</div>
                )}
                {weather.condition === 'rainy' && (
                  <div>• Water-resistant jacket and footwear</div>
                )}
                {weather.condition === 'sunny' && weather.uv_index && weather.uv_index > 6 && (
                  <div>• Sun protection and hat recommended</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/Collapse Indicator */}
      <div className="absolute bottom-2 right-2">
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          className="w-4 h-4 opacity-70"
        >
          ▼
        </motion.div>
      </div>
    </motion.div>
  )
}

export default WeatherWidget