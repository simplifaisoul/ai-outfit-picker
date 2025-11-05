import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { WardrobeItem } from '@/types'

interface WardrobeState {
  items: WardrobeItem[]
  categories: string[]
  selectedCategory: string
  loading: boolean
  error: string | null
  searchQuery: string
  sortBy: 'date' | 'name' | 'category'
  sortOrder: 'asc' | 'desc'
}

const initialState: WardrobeState = {
  items: [],
  categories: ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'],
  selectedCategory: 'all',
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc'
}

// Async thunks
export const fetchWardrobe = createAsyncThunk(
  'wardrobe/fetchWardrobe',
  async (category?: string) => {
    const response = await fetch(`/.netlify/functions/api/wardrobe${category ? `?category=${category}` : ''}`)
    if (!response.ok) throw new Error('Failed to fetch wardrobe')
    return response.json()
  }
)

export const addWardrobeItem = createAsyncThunk(
  'wardrobe/addItem',
  async (item: Omit<WardrobeItem, 'id' | 'created_at'>) => {
    const response = await fetch('/.netlify/functions/api/wardrobe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!response.ok) throw new Error('Failed to add item')
    return response.json()
  }
)

export const deleteWardrobeItem = createAsyncThunk(
  'wardrobe/deleteItem',
  async (id: number) => {
    const response = await fetch(`/.netlify/functions/api/wardrobe/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete item')
    return id
  }
)

export const updateWardrobeItem = createAsyncThunk(
  'wardrobe/updateItem',
  async (item: WardrobeItem) => {
    const response = await fetch(`/.netlify/functions/api/wardrobe/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!response.ok) throw new Error('Failed to update item')
    return response.json()
  }
)

const wardrobeSlice = createSlice({
  name: 'wardrobe',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setSortBy: (state, action: PayloadAction<'date' | 'name' | 'category'>) => {
      state.sortBy = action.payload
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wardrobe
      .addCase(fetchWardrobe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWardrobe.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchWardrobe.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch wardrobe'
      })
      // Add item
      .addCase(addWardrobeItem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addWardrobeItem.fulfilled, (state, action) => {
        state.loading = false
        state.items.unshift(action.payload)
      })
      .addCase(addWardrobeItem.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add item'
      })
      // Delete item
      .addCase(deleteWardrobeItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
      })
      // Update item
      .addCase(updateWardrobeItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
  }
})

export const {
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  clearError
} = wardrobeSlice.actions

export default wardrobeSlice.reducer