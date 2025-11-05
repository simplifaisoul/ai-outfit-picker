export interface WeatherData {
  temperature: number
  feels_like: number
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'
  humidity: number
  windSpeed: number
  uv_index: number
  location: string
  lastUpdated: string
}

export interface LocationData {
  latitude: number
  longitude: number
  city: string
  country: string
}

class WeatherService {
  private static instance: WeatherService
  private apiKey: string
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not found. Using mock weather data.')
    }
  }

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService()
    }
    return WeatherService.instance
  }

  async getCurrentWeather(location?: LocationData): Promise<WeatherData> {
    const cacheKey = location ? `${location.latitude},${location.longitude}` : 'default'
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      if (!this.apiKey) {
        return this.getMockWeatherData(location)
      }

      const loc = location || await this.getCurrentLocation()
      const weatherData = await this.fetchWeatherFromAPI(loc)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      })

      return weatherData
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
      return this.getMockWeatherData(location)
    }
  }

  private async fetchWeatherFromAPI(location: LocationData): Promise<WeatherData> {
    const { latitude, longitude } = location
    
    // Current weather API call
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=imperial`
    )
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API request failed')
    }
    
    const weatherData = await weatherResponse.json()
    
    // UV index API call (requires separate endpoint)
    let uvIndex = 5 // Default value
    try {
      const uvResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}`
      )
      if (uvResponse.ok) {
        const uvData = await uvResponse.json()
        uvIndex = Math.round(uvData.value || 5)
      }
    } catch (error) {
      console.warn('Failed to fetch UV index:', error)
    }

    return this.transformWeatherData(weatherData, location, uvIndex)
  }

  private transformWeatherData(
    apiData: any, 
    location: LocationData, 
    uvIndex: number
  ): WeatherData {
    const condition = this.mapWeatherCondition(apiData.weather[0].main, apiData.weather[0].description)
    
    return {
      temperature: Math.round(apiData.main.temp),
      feels_like: Math.round(apiData.main.feels_like),
      condition,
      humidity: apiData.main.humidity,
      windSpeed: Math.round(apiData.wind.speed),
      uv_index: uvIndex,
      location: `${location.city}, ${location.country}`,
      lastUpdated: new Date().toISOString()
    }
  }

  private mapWeatherCondition(main: string, description: string): WeatherData['condition'] {
    const mainLower = main.toLowerCase()
    const descLower = description.toLowerCase()
    
    if (mainLower === 'clear') return 'sunny'
    if (mainLower === 'clouds') {
      return descLower.includes('partly') ? 'partly-cloudy' : 'cloudy'
    }
    if (mainLower === 'rain' || mainLower === 'drizzle') return 'rainy'
    if (mainLower === 'snow') return 'snowy'
    if (mainLower === 'thunderstorm' || mainLower === 'squall') return 'stormy'
    
    // Default based on description
    if (descLower.includes('sunny') || descLower.includes('clear')) return 'sunny'
    if (descLower.includes('cloud')) return 'cloudy'
    if (descLower.includes('rain')) return 'rainy'
    if (descLower.includes('snow')) return 'snowy'
    if (descLower.includes('storm')) return 'stormy'
    
    return 'partly-cloudy' // Default
  }

  private async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to a default location (New York)
        resolve({
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          country: 'US'
        })
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const locationData = await this.reverseGeocode(latitude, longitude)
            resolve(locationData)
          } catch (error) {
            reject(error)
          }
        },
        (error) => {
          console.warn('Geolocation denied, using default location:', error)
          // Fallback to a default location
          resolve({
            latitude: 40.7128,
            longitude: -74.0060,
            city: 'New York',
            country: 'US'
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.apiKey}`
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }
      
      const data = await response.json()
      const location = data[0]
      
      if (!location) {
        throw new Error('No location found')
      }
      
      return {
        latitude,
        longitude,
        city: location.name || 'Unknown',
        country: location.country || 'Unknown'
      }
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinates:', error)
      return {
        latitude,
        longitude,
        city: 'Unknown',
        country: 'Unknown'
      }
    }
  }

  private getMockWeatherData(location?: LocationData): WeatherData {
    const conditions: WeatherData['condition'][] = ['sunny', 'partly-cloudy', 'cloudy', 'rainy']
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]
    
    const baseTemp = 65
    const variation = Math.random() * 30 - 15 // ±15 degrees
    const temperature = Math.round(baseTemp + variation)
    
    return {
      temperature,
      feels_like: temperature + Math.round(Math.random() * 6 - 3),
      condition: randomCondition,
      humidity: Math.round(40 + Math.random() * 40), // 40-80%
      windSpeed: Math.round(Math.random() * 20), // 0-20 mph
      uv_index: Math.round(1 + Math.random() * 10), // 1-11
      location: location ? `${location.city}, ${location.country}` : 'Default Location',
      lastUpdated: new Date().toISOString()
    }
  }

  async getWeatherForecast(location?: LocationData, days: number = 5): Promise<WeatherData[]> {
    // This would implement the forecast API call
    // For now, return current weather repeated
    const currentWeather = await this.getCurrentWeather(location)
    return Array(days).fill(null).map((_, index) => ({
      ...currentWeather,
      lastUpdated: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString()
    }))
  }

  clearCache(): void {
    this.cache.clear()
  }

  getWeatherRecommendations(weather: WeatherData): {
    outfit: string[]
    activities: string[]
    warnings: string[]
  } {
    const recommendations = {
      outfit: [] as string[],
      activities: [] as string[],
      warnings: [] as string[]
    }

    const { temperature, condition, humidity, windSpeed } = weather

    // Temperature-based recommendations
    if (temperature < 32) {
      recommendations.outfit.push('Heavy coat', 'Warm layers', 'Insulated boots', 'Gloves and hat')
      recommendations.warnings.push('Risk of frostbite - cover exposed skin')
    } else if (temperature < 50) {
      recommendations.outfit.push('Light jacket', 'Long sleeves', 'Pants')
    } else if (temperature < 70) {
      recommendations.outfit.push('Light layers', 'Comfortable pants')
    } else if (temperature < 85) {
      recommendations.outfit.push('Breathable fabrics', 'Light colors')
    } else {
      recommendations.outfit.push('Lightweight clothing', 'Sun protection')
      recommendations.warnings.push('High heat - stay hydrated')
    }

    // Condition-based recommendations
    switch (condition) {
      case 'rainy':
        recommendations.outfit.push('Waterproof jacket', 'Rain boots')
        recommendations.activities.push('Indoor activities recommended')
        break
      case 'snowy':
        recommendations.outfit.push('Waterproof boots', 'Warm layers')
        recommendations.warnings.push('Slippery conditions - be careful')
        break
      case 'sunny':
        recommendations.outfit.push('Sunglasses', 'Sunscreen')
        recommendations.activities.push('Great day for outdoor activities')
        break
      case 'stormy':
        recommendations.warnings.push('Severe weather - stay indoors if possible')
        break
    }

    // Humidity-based recommendations
    if (humidity > 80) {
      recommendations.outfit.push('Moisture-wicking fabrics')
      recommendations.warnings.push('High humidity - may feel warmer')
    }

    // Wind-based recommendations
    if (windSpeed > 20) {
      recommendations.outfit.push('Windbreaker', 'Secure loose items')
      recommendations.warnings.push('Strong winds - secure outdoor items')
    }

    return recommendations
  }
}

export const weatherService = WeatherService.getInstance()