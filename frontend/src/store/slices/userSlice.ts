import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User as UserType } from '@/services/mockAuth'

interface User {
  id: string
  name: string
  email: string
  preferences: {
    style: string
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
  subscription: 'free' | 'premium' | 'pro'
  created_at: string
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
    },
    updatePreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload }
      }
    },
    updateSubscription: (state, action: PayloadAction<'free' | 'premium' | 'pro'>) => {
      if (state.user) {
        state.user.subscription = action.payload
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    }
  }
})

export const {
  setUser,
  logout,
  updatePreferences,
  updateSubscription,
  setLoading,
  setError
} = userSlice.actions

export default userSlice.reducer