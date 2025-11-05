import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Outfit, WeatherData, WardrobeItem, Occasion } from '@/types'
import { aiEngine, RecommendationContext, OutfitScore } from '@/services/aiRecommendation'

interface OutfitsState {
  outfits: Outfit[]
  selectedOutfit: Outfit | null
  weather: WeatherData | null
  loading: boolean
  error: string | null
  occasion: string
  generating: boolean
  savedOutfits: Outfit[]
}

const initialState: OutfitsState = {
  outfits: [],
  selectedOutfit: null,
  weather: null,
  loading: false,
  error: null,
  occasion: 'casual',
  generating: false,
  savedOutfits: []
}

// Async thunks
export const fetchWeather = createAsyncThunk(
  'outfits/fetchWeather',
  async (_, { rejectWithValue }) => {
    try {
      const { weatherService } = await import('@/services/weather')
      const weatherData = await weatherService.getCurrentWeather()
      return weatherData
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch weather')
    }
  }
)

export const generateOutfits = createAsyncThunk(
  'outfits/generateOutfits',
  async (params: { 
    occasion: string; 
    weather?: WeatherData; 
    count?: number;
    wardrobe?: WardrobeItem[];
    userPreferences?: any;
  }) => {
    // If we have local wardrobe data, use AI engine
    if (params.wardrobe && params.userPreferences) {
      const context: RecommendationContext = {
        weather: params.weather,
        occasion: params.occasion as Occasion,
        userPreferences: params.userPreferences,
        season: getCurrentSeason(),
        timeOfDay: getCurrentTimeOfDay()
      }

      const scoredOutfits = await aiEngine.generateOutfits(
        params.wardrobe, 
        context, 
        params.count || 6
      )

      return {
        outfits: scoredOutfits.map((score, index) => ({
          id: `outfit-${Date.now()}-${index}`,
          items: score.outfit,
          score: score.score,
          reasoning: score.reasoning,
          occasion: params.occasion,
          created_at: new Date().toISOString(),
          breakdown: score.breakdown
        }))
      }
    }

    // Fallback to API
    const response = await fetch('/.netlify/functions/api/outfits/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    if (!response.ok) throw new Error('Failed to generate outfits')
    return response.json()
  }
)

export const saveOutfit = createAsyncThunk(
  'outfits/saveOutfit',
  async (params: { outfit: Outfit; occasion: string; date?: string; notes?: string }) => {
    const response = await fetch('/.netlify/functions/api/outfits/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    if (!response.ok) throw new Error('Failed to save outfit')
    return response.json()
  }
)

const outfitsSlice = createSlice({
  name: 'outfits',
  initialState,
  reducers: {
    setSelectedOutfit: (state, action: PayloadAction<Outfit | null>) => {
      state.selectedOutfit = action.payload
    },
    setOccasion: (state, action: PayloadAction<string>) => {
      state.occasion = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    rateOutfit: (state, action: PayloadAction<{ outfitId: string; rating: number }>) => {
      const outfit = state.outfits.find(o => o.id === action.payload.outfitId)
      if (outfit) {
        outfit.rating = action.payload.rating
      }
      const savedOutfit = state.savedOutfits.find(o => o.id === action.payload.outfitId)
      if (savedOutfit) {
        savedOutfit.rating = action.payload.rating
      }
    },
    updateOutfitScore: (state, action: PayloadAction<{ outfitId: string; breakdown: any }>) => {
      const outfit = state.outfits.find(o => o.id === action.payload.outfitId)
      if (outfit) {
        outfit.breakdown = action.payload.breakdown
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch weather
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.weather = { ...action.payload, season: 'all' }
      })
      // Generate outfits
      .addCase(generateOutfits.pending, (state) => {
        state.generating = true
        state.error = null
      })
      .addCase(generateOutfits.fulfilled, (state, action) => {
        state.generating = false
        state.outfits = action.payload.outfits
        if (action.payload.outfits.length > 0) {
          state.selectedOutfit = action.payload.outfits[0]
        }
      })
      .addCase(generateOutfits.rejected, (state, action) => {
        state.generating = false
        state.error = action.error.message || 'Failed to generate outfits'
      })
      // Save outfit
      .addCase(saveOutfit.fulfilled, (state, action) => {
        const savedOutfit = { ...action.payload.outfit, saved: true }
        state.savedOutfits.push(savedOutfit)
      })
  }
})

export const {
  setSelectedOutfit,
  setOccasion,
  clearError,
  rateOutfit,
  updateOutfitScore
} = outfitsSlice.actions

// Helper functions
const getCurrentSeason = (): string => {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default outfitsSlice.reducer