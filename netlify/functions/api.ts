import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import sharp from 'sharp'
import { Database, open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { v4 as uuidv4 } from 'uuid'

// Types
interface WardrobeItem {
  id: string
  user_id: string
  image_url: string
  category: string
  color?: string
  style?: string
  season?: string
  occasion?: string
  formality?: 'casual' | 'business' | 'formal'
  pattern?: string
  rating?: number
  last_worn?: string
  created_at: string
  updated_at: string
}

interface Outfit {
  id: string
  user_id: string
  name: string
  items: WardrobeItem[]
  occasion: string
  season?: string
  weather?: any
  score: number
  rating?: number
  saved: boolean
  created_at: string
  updated_at: string
}

interface User {
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
  updated_at: string
}

interface WeatherData {
  temperature: number
  feels_like: number
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'
  humidity: number
  windSpeed: number
  uv_index: number
  location: string
  lastUpdated: string
}

class DatabaseService {
  private static instance: DatabaseService
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    if (this.db) return

    try {
      // Use file-based database for persistence
      this.db = await open({
        filename: '/tmp/outfit_picker.db',
        driver: sqlite3.Database
      })

      await this.createTables()
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        preferences TEXT NOT NULL,
        subscription TEXT DEFAULT 'free',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Wardrobe items table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS wardrobe_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        style TEXT,
        season TEXT,
        occasion TEXT,
        formality TEXT DEFAULT 'casual',
        pattern TEXT,
        rating INTEGER DEFAULT 0,
        last_worn DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Outfits table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        items TEXT NOT NULL,
        occasion TEXT NOT NULL,
        season TEXT,
        weather TEXT,
        score REAL DEFAULT 0,
        rating INTEGER DEFAULT 0,
        saved BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Saved outfits table (for calendar/scheduling)
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS saved_outfits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        outfit_id TEXT NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (outfit_id) REFERENCES outfits (id) ON DELETE CASCADE
      )
    `)

    // Analytics events table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event TEXT NOT NULL,
        category TEXT NOT NULL,
        action TEXT,
        label TEXT,
        value INTEGER,
        metadata TEXT,
        session_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        url TEXT,
        user_agent TEXT
      )
    `)

    // Create indexes for better performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_wardrobe_user_id ON wardrobe_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON wardrobe_items(category);
      CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
      CREATE INDEX IF NOT EXISTS idx_outfits_occasion ON outfits(occasion);
      CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
    `)
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized')

    const user: User = {
      id: uuidv4(),
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.db.run(
      `INSERT INTO users (id, email, name, preferences, subscription, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        user.name,
        JSON.stringify(user.preferences),
        user.subscription,
        user.created_at,
        user.updated_at
      ]
    )

    return user
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized')

    const row = await this.db.get('SELECT * FROM users WHERE id = ?', [userId])
    if (!row) return null

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      preferences: JSON.parse(row.preferences),
      subscription: row.subscription,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized')

    const row = await this.db.get('SELECT * FROM users WHERE email = ?', [email])
    if (!row) return null

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      preferences: JSON.parse(row.preferences),
      subscription: row.subscription,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  // Wardrobe operations
  async addWardrobeItem(itemData: Omit<WardrobeItem, 'id' | 'created_at' | 'updated_at'>): Promise<WardrobeItem> {
    if (!this.db) throw new Error('Database not initialized')

    const item: WardrobeItem = {
      id: uuidv4(),
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.db.run(
      `INSERT INTO wardrobe_items 
       (id, user_id, image_url, category, color, style, season, occasion, formality, pattern, rating, last_worn, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.user_id,
        item.image_url,
        item.category,
        item.color,
        item.style,
        item.season,
        item.occasion,
        item.formality,
        item.pattern,
        item.rating,
        item.last_worn,
        item.created_at,
        item.updated_at
      ]
    )

    return item
  }

  async getWardrobeItems(userId: string, category?: string): Promise<WardrobeItem[]> {
    if (!this.db) throw new Error('Database not initialized')

    let query = 'SELECT * FROM wardrobe_items WHERE user_id = ?'
    const params: any[] = [userId]

    if (category && category !== 'all') {
      query += ' AND category = ?'
      params.push(category)
    }

    query += ' ORDER BY created_at DESC'

    const rows = await this.db.all(query, params)
    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      image_url: row.image_url,
      category: row.category,
      color: row.color,
      style: row.style,
      season: row.season,
      occasion: row.occasion,
      formality: row.formality,
      pattern: row.pattern,
      rating: row.rating,
      last_worn: row.last_worn,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  }

  async deleteWardrobeItem(itemId: string, userId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.run(
      'DELETE FROM wardrobe_items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    )

    return (result.changes || 0) > 0
  }

  async updateWardrobeItem(itemId: string, userId: string, updates: Partial<WardrobeItem>): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'user_id')
    if (fields.length === 0) return false

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => (updates as any)[field])
    values.push(new Date().toISOString()) // updated_at
    values.push(itemId, userId)

    const result = await this.db.run(
      `UPDATE wardrobe_items SET ${setClause}, updated_at = ? WHERE id = ? AND user_id = ?`,
      values
    )

    return (result.changes || 0) > 0
  }

  // Outfit operations
  async saveOutfit(outfitData: Omit<Outfit, 'id' | 'created_at' | 'updated_at'>): Promise<Outfit> {
    if (!this.db) throw new Error('Database not initialized')

    const outfit: Outfit = {
      id: uuidv4(),
      ...outfitData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.db.run(
      `INSERT INTO outfits 
       (id, user_id, name, items, occasion, season, weather, score, rating, saved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        outfit.id,
        outfit.user_id,
        outfit.name,
        JSON.stringify(outfit.items),
        outfit.occasion,
        outfit.season,
        JSON.stringify(outfit.weather),
        outfit.score,
        outfit.rating,
        outfit.saved,
        outfit.created_at,
        outfit.updated_at
      ]
    )

    return outfit
  }

  async getOutfits(userId: string, occasion?: string): Promise<Outfit[]> {
    if (!this.db) throw new Error('Database not initialized')

    let query = 'SELECT * FROM outfits WHERE user_id = ?'
    const params: any[] = [userId]

    if (occasion) {
      query += ' AND occasion = ?'
      params.push(occasion)
    }

    query += ' ORDER BY created_at DESC'

    const rows = await this.db.all(query, params)
    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      items: JSON.parse(row.items),
      occasion: row.occasion,
      season: row.season,
      weather: JSON.parse(row.weather || '{}'),
      score: row.score,
      rating: row.rating,
      saved: Boolean(row.saved),
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  }

  // Analytics operations
  async trackEvent(eventData: {
    user_id?: string
    event: string
    category: string
    action?: string
    label?: string
    value?: number
    metadata?: any
    session_id: string
    url: string
    user_agent: string
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.run(
      `INSERT INTO analytics_events 
       (id, user_id, event, category, action, label, value, metadata, session_id, url, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        eventData.user_id,
        eventData.event,
        eventData.category,
        eventData.action,
        eventData.label,
        eventData.value,
        JSON.stringify(eventData.metadata),
        eventData.session_id,
        eventData.url,
        eventData.user_agent
      ]
    )
  }

  async getAnalytics(userId?: string, limit: number = 100): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized')

    let query = 'SELECT * FROM analytics_events'
    const params: any[] = []

    if (userId) {
      query += ' WHERE user_id = ?'
      params.push(userId)
    }

    query += ' ORDER BY timestamp DESC LIMIT ?'
    params.push(limit)

    return await this.db.all(query, params)
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }
}

// Image processing service
class ImageService {
  static async processBase64Image(base64String: string): Promise<string> {
    try {
      const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image format')
      }

      const imageType = matches[1]
      const imageData = matches[2]
      const buffer = Buffer.from(imageData, 'base64')

      // Process image with sharp
      const processedBuffer = await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer()

      return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`
    } catch (error) {
      console.error('Error processing image:', error)
      throw error
    }
  }
}

// Response helper
const createResponse = (statusCode: number, body: any, headers: any = {}): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  }
}

// Main handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const db = DatabaseService.getInstance()

  try {
    await db.initialize()

    const { httpMethod, path, body, queryStringParameters } = event

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return createResponse(200, {})
    }

    // Parse path
    const pathParts = path.replace('/.netlify/functions/api', '').split('/').filter(Boolean)
    
    if (pathParts.length === 0) {
      return createResponse(404, { error: 'Endpoint not found' })
    }

    const resource = pathParts[0]
    const userId = event.headers['x-user-id'] || 'demo-user' // In production, get from JWT

    // Route handling
    switch (resource) {
      case 'wardrobe':
        return handleWardrobeRoutes(httpMethod, pathParts, body, queryStringParameters, userId)
      
      case 'outfits':
        return handleOutfitRoutes(httpMethod, pathParts, body, userId)
      
      case 'users':
        return handleUserRoutes(httpMethod, pathParts, body)
      
      case 'analytics':
        return handleAnalyticsRoutes(httpMethod, body, userId, event)
      
      case 'weather':
        return handleWeatherRoute()
      
      default:
        return createResponse(404, { error: 'Endpoint not found' })
    }

  } catch (error) {
    console.error('API Error:', error)
    return createResponse(500, { error: 'Internal server error' })
  }
}

async function handleWardrobeRoutes(
  method: string | undefined,
  pathParts: string[],
  body: string | null,
  queryParams: any,
  userId: string
): Promise<APIGatewayProxyResult> {
  const db = DatabaseService.getInstance()

  switch (method) {
    case 'GET':
      const category = queryParams?.category
      const items = await db.getWardrobeItems(userId, category)
      return createResponse(200, { items })

    case 'POST':
      if (!body) {
        return createResponse(400, { error: 'Request body is required' })
      }

      try {
        const data = JSON.parse(body)
        const { image, category, color, style, season, occasion, formality, pattern } = data

        if (!image || !category) {
          return createResponse(400, { error: 'Image and category are required' })
        }

        const processedImage = await ImageService.processBase64Image(image)
        const item = await db.addWardrobeItem({
          user_id: userId,
          image_url: processedImage,
          category,
          color,
          style,
          season,
          occasion,
          formality,
          pattern
        })

        return createResponse(200, { item })
      } catch (error) {
        return createResponse(500, { error: 'Failed to process image' })
      }

    case 'DELETE':
      const itemId = pathParts[1]
      if (!itemId) {
        return createResponse(400, { error: 'Item ID is required' })
      }

      const deleted = await db.deleteWardrobeItem(itemId, userId)
      if (deleted) {
        return createResponse(200, { message: 'Item deleted successfully' })
      } else {
        return createResponse(404, { error: 'Item not found' })
      }

    default:
      return createResponse(405, { error: 'Method not allowed' })
  }
}

async function handleOutfitRoutes(
  method: string | undefined,
  pathParts: string[],
  body: string | null,
  userId: string
): Promise<APIGatewayProxyResult> {
  const db = DatabaseService.getInstance()

  switch (method) {
    case 'GET':
      const occasion = pathParts[1]
      const outfits = await db.getOutfits(userId, occasion)
      return createResponse(200, { outfits })

    case 'POST':
      if (!body) {
        return createResponse(400, { error: 'Request body is required' })
      }

      if (pathParts[1] === 'generate') {
        // Handle outfit generation (would integrate with AI service)
        return createResponse(200, { 
          outfits: [],
          message: 'Outfit generation not implemented in TypeScript version yet'
        })
      }

      if (pathParts[1] === 'save') {
        const data = JSON.parse(body)
        const { outfit, occasion, date, notes } = data

        const savedOutfit = await db.saveOutfit({
          user_id: userId,
          name: `Outfit for ${occasion}`,
          items: outfit.items,
          occasion,
          season: outfit.weather?.season,
          weather: outfit.weather,
          score: outfit.score || 0,
          saved: true
        })

        return createResponse(200, { outfit: savedOutfit })
      }

      return createResponse(404, { error: 'Endpoint not found' })

    default:
      return createResponse(405, { error: 'Method not allowed' })
  }
}

async function handleUserRoutes(
  method: string | undefined,
  pathParts: string[],
  body: string | null
): Promise<APIGatewayProxyResult> {
  const db = DatabaseService.getInstance()

  switch (method) {
    case 'POST':
      if (!body) {
        return createResponse(400, { error: 'Request body is required' })
      }

      const data = JSON.parse(body)
      const { email, name, preferences, subscription } = data

      if (!email || !name) {
        return createResponse(400, { error: 'Email and name are required' })
      }

      try {
        const user = await db.createUser({
          email,
          name,
          preferences: preferences || {},
          subscription: subscription || 'free'
        })

        return createResponse(200, { user })
      } catch (error) {
        return createResponse(409, { error: 'User already exists' })
      }

    case 'GET':
      const userEmail = pathParts[1]
      if (!userEmail) {
        return createResponse(400, { error: 'User email is required' })
      }

      const user = await db.getUserByEmail(userEmail)
      if (user) {
        return createResponse(200, { user })
      } else {
        return createResponse(404, { error: 'User not found' })
      }

    default:
      return createResponse(405, { error: 'Method not allowed' })
  }
}

async function handleAnalyticsRoutes(
  method: string | undefined,
  body: string | null,
  userId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const db = DatabaseService.getInstance()

  switch (method) {
    case 'POST':
      if (!body) {
        return createResponse(400, { error: 'Request body is required' })
      }

      const data = JSON.parse(body)
      await db.trackEvent({
        user_id: userId,
        ...data,
        url: event.path,
        user_agent: event.headers['user-agent'] || ''
      })

      return createResponse(200, { message: 'Event tracked successfully' })

    case 'GET':
      const events = await db.getAnalytics(userId)
      return createResponse(200, { events })

    default:
      return createResponse(405, { error: 'Method not allowed' })
  }
}

async function handleWeatherRoute(): Promise<APIGatewayProxyResult> {
  // Mock weather data - in production, integrate with real weather API
  const mockWeather: WeatherData = {
    temperature: Math.floor(Math.random() * 40) + 50,
    feels_like: Math.floor(Math.random() * 40) + 50,
    condition: ['sunny', 'partly-cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)] as WeatherData['condition'],
    humidity: Math.floor(Math.random() * 50) + 30,
    windSpeed: Math.floor(Math.random() * 20),
    uv_index: Math.floor(Math.random() * 11) + 1,
    location: 'New York, NY',
    lastUpdated: new Date().toISOString()
  }

  return createResponse(200, mockWeather)
}