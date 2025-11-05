// Firebase imports - commented out until Firebase is installed
// import { 
//   signInWithEmailAndPassword, 
//   createUserWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   User as FirebaseUser
// } from 'firebase/auth'
// import { doc, setDoc, getDoc } from 'firebase/firestore'
// import { auth, db } from './firebase'

export interface User {
  id: string
  email: string
  name: string
  preferences: {
    style: string
    colors: string[]
    occasions: string[]
    weatherPreferences: { hot: number; cold: number }
    notifications: { email: boolean; push: boolean; dailyOutfit: boolean }
    privacy: { shareData: boolean; analytics: boolean }
  }
  subscription: 'free' | 'premium' | 'pro'
  created_at: string
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<User> {
    // Mock implementation until Firebase is installed
    return {
      id: 'mock-user-id',
      email,
      name: 'Mock User',
      preferences: {
        style: 'casual',
        colors: [],
        occasions: [],
        weatherPreferences: { hot: 75, cold: 65 },
        notifications: { email: true, push: true, dailyOutfit: true },
        privacy: { shareData: false, analytics: true }
      },
      subscription: 'free',
      created_at: new Date().toISOString()
    }
  }

  static async signUp(email: string, password: string, name: string): Promise<User> {
    // Mock implementation until Firebase is installed
    return {
      id: 'mock-user-id',
      email,
      name,
      preferences: {
        style: 'casual',
        colors: [],
        occasions: [],
        weatherPreferences: { hot: 75, cold: 65 },
        notifications: { email: true, push: true, dailyOutfit: true },
        privacy: { shareData: false, analytics: true }
      },
      subscription: 'free',
      created_at: new Date().toISOString()
    }
  }

  static async signOut(): Promise<void> {
    // Mock implementation until Firebase is installed
    return Promise.resolve()
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    // Mock implementation until Firebase is installed
    callback(null)
    return () => {} // Return unsubscribe function
  }

  static async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<void> {
    // Mock implementation until Firebase is installed
    return Promise.resolve()
  }
}