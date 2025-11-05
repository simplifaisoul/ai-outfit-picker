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

class MockAuthService {
  private static instance: MockAuthService
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService()
    }
    return MockAuthService.instance
  }

  async signIn(email: string, password: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock validation
    if (email === 'demo@example.com' && password === 'password') {
      const mockUser: User = {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User',
        preferences: {
          style: 'casual',
          colors: ['blue', 'black', 'white'],
          occasions: ['work', 'casual'],
          weatherPreferences: { hot: 75, cold: 65 },
          notifications: { email: true, push: true, dailyOutfit: true },
          privacy: { shareData: false, analytics: true }
        },
        subscription: 'premium',
        created_at: new Date().toISOString()
      }
      
      this.currentUser = mockUser
      this.notifyListeners()
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      
      return mockUser
    }
    
    throw new Error('Invalid email or password. Use demo@example.com / password')
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newUser: User = {
      id: `user-${Date.now()}`,
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
    
    this.currentUser = newUser
    this.notifyListeners()
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    
    return newUser
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    this.notifyListeners()
    localStorage.removeItem('auth_user')
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser
    }
    
    // Check localStorage for persisted session
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      } catch {
        localStorage.removeItem('auth_user')
      }
    }
    
    return null
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback)
    
    // Immediately call with current user
    callback(this.getCurrentUser())
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<void> {
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.preferences = { ...this.currentUser.preferences, ...preferences }
      this.notifyListeners()
      localStorage.setItem('auth_user', JSON.stringify(this.currentUser))
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser))
  }
}

export const authService = MockAuthService.getInstance()