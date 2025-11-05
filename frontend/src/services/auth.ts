import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      
      if (userDoc.exists()) {
        return userDoc.data() as User
      } else {
        throw new Error('User profile not found')
      }
    } catch (error) {
      throw new Error('Invalid email or password')
    }
  }

  static async signUp(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      const newUser: User = {
        id: userCredential.user.uid,
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

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser)
      return newUser
    } catch (error) {
      throw new Error('Failed to create account')
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      throw new Error('Failed to sign out')
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            callback(userDoc.data() as User)
          } else {
            callback(null)
          }
        } catch (error) {
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }

  static async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const currentPreferences = userDoc.data().preferences
        await setDoc(userRef, {
          preferences: { ...currentPreferences, ...preferences }
        }, { merge: true })
      }
    } catch (error) {
      throw new Error('Failed to update preferences')
    }
  }
}