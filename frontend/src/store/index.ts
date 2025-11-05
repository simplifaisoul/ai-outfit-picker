import { configureStore } from '@reduxjs/toolkit'
import wardrobeReducer from './slices/wardrobeSlice'
import outfitsReducer from './slices/outfitsSlice'
import userReducer from './slices/userSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    wardrobe: wardrobeReducer,
    outfits: outfitsReducer,
    user: userReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch