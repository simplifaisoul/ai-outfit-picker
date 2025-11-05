export interface WardrobeItem {
  id: number
  image_url: string
  category: string
  color?: string
  style?: string
  season?: string
  occasion?: string
  created_at: string
  updated_at?: string
  tags?: string[]
  favorite?: boolean
  worn_count?: number
  last_worn?: string
  formality?: 'casual' | 'formal' | 'business' | 'sporty'
  rating?: number
  pattern?: string
}

export interface Outfit {
  id: string
  items: WardrobeItem[]
  occasion: string
  season?: string
  weather?: WeatherData
  score: number
  rating?: number
  saved?: boolean
  created_at?: string
  notes?: string
  reasoning?: string[]
  breakdown?: {
    top: WardrobeItem
    bottom: WardrobeItem
    shoes: WardrobeItem
    accessories?: WardrobeItem[]
  }
  reasoning?: string[]
  breakdown?: {
    top: WardrobeItem
    bottom: WardrobeItem
    shoes: WardrobeItem
    accessories?: WardrobeItem[]
  }
}

export interface WeatherData {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly-cloudy'
  humidity: number
  windSpeed: number
  season: 'spring' | 'summer' | 'fall' | 'winter'
  location?: string
  feels_like?: number
  uv_index?: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: UserPreferences
  subscription?: 'free' | 'premium' | 'pro'
  created_at: string
}

export interface UserPreferences {
  style: 'casual' | 'formal' | 'sporty' | 'trendy' | 'classic'
  colors: string[]
  occasions: string[]
  weatherPreferences: {
    hot: number
    cold: number
  }
  notifications: {
    email: boolean
    push: boolean
    dailyOutfit: boolean
  }
  privacy: {
    shareData: boolean
    analytics: boolean
  }
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  read: boolean
  action?: {
    label: string
    callback: () => void
  }
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type SortOption = 'date' | 'name' | 'category' | 'rating' | 'worn_count'
export type FilterOption = 'all' | 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories'
export type Occasion = 'casual' | 'work' | 'formal' | 'party' | 'sport' | 'date' | 'business'