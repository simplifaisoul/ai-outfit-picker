import { WardrobeItem, Outfit, WeatherData, Occasion, User } from '@/types'

export interface StyleRule {
  id: string
  name: string
  description: string
  weight: number
  apply: (items: WardrobeItem[], context: RecommendationContext) => number
}

export interface RecommendationContext {
  weather?: WeatherData
  occasion: Occasion
  userPreferences: User['preferences']
  previousOutfits?: Outfit[]
  season: string
  timeOfDay: 'morning' | 'afternoon' | 'evening'
}

export interface OutfitScore {
  outfit: WardrobeItem[]
  score: number
  breakdown: {
    weather: number
    occasion: number
    style: number
    color: number
    variety: number
    userPreference: number
  }
  reasoning: string[]
}

export class AIRecommendationEngine {
  private styleRules: StyleRule[]
  private colorHarmonyRules: ColorHarmonyRule[]
  private patternMatchingRules: PatternMatchingRule[]

  constructor() {
    this.styleRules = this.initializeStyleRules()
    this.colorHarmonyRules = this.initializeColorHarmonyRules()
    this.patternMatchingRules = this.initializePatternMatchingRules()
  }

  async generateOutfits(
    wardrobe: WardrobeItem[], 
    context: RecommendationContext,
    count: number = 6
  ): Promise<OutfitScore[]> {
    const validOutfits = await this.generateValidOutfits(wardrobe, context)
    const scoredOutfits = await this.scoreOutfits(validOutfits, context)
    
    // Sort by score and return top results
    return scoredOutfits
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
  }

  private async generateValidOutfits(
    wardrobe: WardrobeItem[], 
    context: RecommendationContext
  ): Promise<WardrobeItem[][]> {
    const outfits: WardrobeItem[][] = []
    const categories = this.getRequiredCategories(context.occasion)
    
    // Generate combinations based on occasion requirements
    for (let i = 0; i < 100; i++) { // Generate 100 potential outfits
      const outfit = this.generateSingleOutfit(wardrobe, categories, context)
      if (outfit && this.isValidOutfit(outfit, context)) {
        outfits.push(outfit)
      }
    }
    
    return outfits
  }

  private generateSingleOutfit(
    wardrobe: WardrobeItem[], 
    categories: string[], 
    context: RecommendationContext
  ): WardrobeItem[] | null {
    const outfit: WardrobeItem[] = []
    
    for (const category of categories) {
      const categoryItems = wardrobe.filter(item => 
        item.category === category && 
        this.isItemSuitableForContext(item, context)
      )
      
      if (categoryItems.length === 0) return null
      
      // Weighted random selection based on user preferences and item ratings
      const weights = categoryItems.map(item => this.calculateItemWeight(item, context))
      const selectedItem = this.weightedRandomSelection(categoryItems, weights)
      outfit.push(selectedItem)
    }
    
    return outfit
  }

  private getRequiredCategories(occasion: Occasion): string[] {
    const categoryMap: Record<Occasion, string[]> = {
      casual: ['top', 'bottom', 'footwear'],
      work: ['top', 'bottom', 'footwear', 'outerwear'],
      formal: ['top', 'bottom', 'footwear', 'outerwear', 'accessories'],
      party: ['top', 'bottom', 'footwear', 'accessories'],
      sport: ['top', 'bottom', 'footwear'],
      date: ['top', 'bottom', 'footwear', 'accessories'],
      business: ['top', 'bottom', 'footwear', 'outerwear']
    }
    
    return categoryMap[occasion] || ['top', 'bottom', 'footwear']
  }

  private isItemSuitableForContext(item: WardrobeItem, context: RecommendationContext): boolean {
    // Weather suitability
    if (context.weather) {
      if (context.weather.temperature < 32 && item.season === 'summer') return false
      if (context.weather.temperature > 80 && item.season === 'winter') return false
    }
    
    // Occasion suitability
    if (context.occasion === 'formal' && item.formality === 'casual') return false
    if (context.occasion === 'sport' && item.formality === 'formal') return false
    
    return true
  }

  private calculateItemWeight(item: WardrobeItem, context: RecommendationContext): number {
    let weight = 1
    
    // User preference boost
    if (context.userPreferences.colors.includes(item.color || '')) weight *= 1.5
    if (context.userPreferences.style === item.style) weight *= 1.3
    
    // Rating boost
    weight *= (item.rating || 3) / 3
    
    // Recent wear penalty (variety)
    const daysSinceWorn = item.last_worn 
      ? Math.floor((Date.now() - new Date(item.last_worn).getTime()) / (1000 * 60 * 60 * 24))
      : 365
    weight *= Math.min(2, 1 + (daysSinceWorn / 30))
    
    return weight
  }

  private weightedRandomSelection<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random <= 0) return items[i]
    }
    
    return items[items.length - 1]
  }

  private isValidOutfit(outfit: WardrobeItem[], context: RecommendationContext): boolean {
    // Check for color clashes
    if (!this.hasGoodColorHarmony(outfit)) return false
    
    // Check for pattern conflicts
    if (!this.hasGoodPatternCombination(outfit)) return false
    
    // Check formality consistency
    const formalities = outfit.map(item => item.formality)
    if (formalities.some(f => f === 'formal') && formalities.some(f => f === 'casual')) {
      return false
    }
    
    return true
  }

  private async scoreOutfits(
    outfits: WardrobeItem[][], 
    context: RecommendationContext
  ): Promise<OutfitScore[]> {
    return outfits.map(outfit => {
      const score = this.calculateOutfitScore(outfit, context)
      return {
        outfit,
        score: score.total,
        breakdown: score.breakdown,
        reasoning: score.reasoning
      }
    })
  }

  private calculateOutfitScore(
    outfit: WardrobeItem[], 
    context: RecommendationContext
  ): { total: number; breakdown: any; reasoning: string[] } {
    const breakdown = {
      weather: this.calculateWeatherScore(outfit, context),
      occasion: this.calculateOccasionScore(outfit, context),
      style: this.calculateStyleScore(outfit, context),
      color: this.calculateColorScore(outfit, context),
      variety: this.calculateVarietyScore(outfit, context),
      userPreference: this.calculateUserPreferenceScore(outfit, context)
    }
    
    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0) / 6
    const reasoning = this.generateReasoning(outfit, context, breakdown)
    
    return { total, breakdown, reasoning }
  }

  private calculateWeatherScore(outfit: WardrobeItem[], context: RecommendationContext): number {
    if (!context.weather) return 0.8 // Default score if no weather data
    
    let score = 0.5
    const temp = context.weather.temperature
    
    outfit.forEach(item => {
      if (temp < 32 && item.season === 'winter') score += 0.2
      else if (temp > 80 && item.season === 'summer') score += 0.2
      else if (temp >= 50 && temp <= 70) score += 0.1 // Mild weather
    })
    
    return Math.min(1, score)
  }

  private calculateOccasionScore(outfit: WardrobeItem[], context: RecommendationContext): number {
    const occasionRequirements: Record<Occasion, {formality: string[]; coverage: number}> = {
      casual: { formality: ['casual'], coverage: 0.3 },
      work: { formality: ['business', 'formal'], coverage: 0.7 },
      formal: { formality: ['formal'], coverage: 0.9 },
      party: { formality: ['casual', 'formal'], coverage: 0.5 },
      sport: { formality: ['casual'], coverage: 0.4 },
      date: { formality: ['casual', 'business'], coverage: 0.6 },
      business: { formality: ['business', 'formal'], coverage: 0.8 }
    }
    
    const requirement = occasionRequirements[context.occasion]
    const outfitFormality = outfit.map(item => item.formality)
    
    const formalityMatch = outfitFormality.some(f => requirement.formality.includes(f))
    const coverageScore = outfit.length >= 3 ? 1 : outfit.length / 3
    
    return (formalityMatch ? 0.7 : 0.3) + (coverageScore * 0.3)
  }

  private calculateStyleScore(outfit: WardrobeItem[], context: RecommendationContext): number {
    let score = 0.5
    
    // Check style consistency
    const styles = outfit.map(item => item.style)
    const uniqueStyles = new Set(styles)
    if (uniqueStyles.size === 1) score += 0.3
    else if (uniqueStyles.size === 2) score += 0.1
    
    // Apply style rules
    this.styleRules.forEach(rule => {
      score += rule.apply(outfit, context) * rule.weight
    })
    
    return Math.min(1, score)
  }

  private calculateColorScore(outfit: WardrobeItem[], context: RecommendationContext): number {
    const colors = outfit.map(item => item.color).filter(Boolean)
    if (colors.length < 2) return 0.5
    
    let score = 0.5
    
    // Check color harmony
    this.colorHarmonyRules.forEach(rule => {
      if (rule.applies(colors)) {
        score += rule.bonus
      }
    })
    
    // Check for user preferred colors
    const preferredColors = context.userPreferences.colors
    const preferredCount = colors.filter(color => preferredColors.includes(color!)).length
    score += (preferredCount / colors.length) * 0.2
    
    return Math.min(1, score)
  }

  private calculateVarietyScore(outfit: WardrobeItem[], context: RecommendationContext): number {
    const today = new Date().toDateString()
    const recentWears = outfit.filter(item => 
      item.last_worn && new Date(item.last_worn).toDateString() === today
    )
    
    // Penalize recently worn items
    const penalty = recentWears.length / outfit.length
    return Math.max(0.2, 1 - penalty)
  }

  private calculateUserPreferenceScore(outfit: WardrobeItem[], context: RecommendationContext): number {
    let score = 0.5
    
    outfit.forEach(item => {
      // Style preference
      if (item.style === context.userPreferences.style) score += 0.1
      
      // Color preference
      if (context.userPreferences.colors.includes(item.color || '')) score += 0.1
      
      // Rating preference
      if (item.rating && item.rating >= 4) score += 0.1
    })
    
    return Math.min(1, score)
  }

  private generateReasoning(
    outfit: WardrobeItem[], 
    context: RecommendationContext, 
    breakdown: any
  ): string[] {
    const reasoning: string[] = []
    
    if (breakdown.weather > 0.8) {
      reasoning.push('Perfect for current weather conditions')
    }
    
    if (breakdown.occasion > 0.8) {
      reasoning.push(`Well-suited for ${context.occasion} occasion`)
    }
    
    if (breakdown.color > 0.8) {
      reasoning.push('Excellent color harmony')
    }
    
    if (breakdown.variety > 0.8) {
      reasoning.push('Fresh combination you haven\'t worn recently')
    }
    
    if (breakdown.userPreference > 0.8) {
      reasoning.push('Matches your style preferences')
    }
    
    return reasoning
  }

  private hasGoodColorHarmony(outfit: WardrobeItem[]): boolean {
    const colors = outfit.map(item => item.color).filter(Boolean)
    if (colors.length < 2) return true
    
    // Basic color harmony check
    return this.colorHarmonyRules.some(rule => rule.applies(colors))
  }

  private hasGoodPatternCombination(outfit: WardrobeItem[]): boolean {
    const patterns = outfit.map(item => item.pattern).filter(Boolean)
    if (patterns.length <= 1) return true
    
    // Avoid multiple bold patterns
    const boldPatterns = patterns.filter(p => ['striped', 'floral', 'geometric'].includes(p!))
    return boldPatterns.length <= 1
  }

  private initializeStyleRules(): StyleRule[] {
    return [
      {
        id: 'layering',
        name: 'Layering Principle',
        description: 'Good layering for weather versatility',
        weight: 0.1,
        apply: (items, context) => {
          const hasOuterwear = items.some(item => item.category === 'outerwear')
          const hasBaseLayer = items.some(item => item.category === 'top')
          return (hasOuterwear && hasBaseLayer) ? 0.2 : 0
        }
      },
      {
        id: 'balance',
        name: 'Visual Balance',
        description: 'Balanced proportions',
        weight: 0.1,
        apply: (items, context) => {
          // Simple balance check - can be enhanced
          return items.length >= 3 ? 0.2 : 0.1
        }
      }
    ]
  }

  private initializeColorHarmonyRules(): ColorHarmonyRule[] {
    return [
      {
        name: 'Monochromatic',
        applies: (colors) => {
          const uniqueColors = new Set(colors.map(c => c?.toLowerCase()))
          return uniqueColors.size <= 2
        },
        bonus: 0.3
      },
      {
        name: 'Complementary',
        applies: (colors) => {
          // Simplified complementary color check
          const complementaryPairs = [
            ['black', 'white'],
            ['blue', 'orange'],
            ['red', 'green'],
            ['purple', 'yellow']
          ]
          return complementaryPairs.some(pair => 
            colors.some(c => pair.includes(c?.toLowerCase())) &&
            colors.some(c => pair.includes(c?.toLowerCase()))
          )
        },
        bonus: 0.4
      },
      {
        name: 'Neutral Base',
        applies: (colors) => {
          const neutrals = ['black', 'white', 'gray', 'navy', 'brown']
          return colors.some(c => neutrals.includes(c?.toLowerCase()))
        },
        bonus: 0.2
      }
    ]
  }

  private initializePatternMatchingRules(): PatternMatchingRule[] {
    return [
      {
        name: 'Pattern Limit',
        check: (patterns) => {
          const boldPatterns = patterns.filter(p => ['striped', 'floral', 'geometric'].includes(p))
          return boldPatterns.length <= 1
        }
      }
    ]
  }
}

interface ColorHarmonyRule {
  name: string
  applies: (colors: (string | undefined)[]) => boolean
  bonus: number
}

interface PatternMatchingRule {
  name: string
  check: (patterns: string[]) => boolean
}

export const aiEngine = new AIRecommendationEngine()