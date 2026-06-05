/**
 * Pricing Management and Currency Conversion Module
 * Handles pricing fetching, caching, and cost calculations
 */

import { SupportedModel, PricingInfo } from '../core/types'
import { getDatabasePool } from '../storage/database'

/**
 * Pricing data for supported models
 */
const DEFAULT_PRICING: Record<SupportedModel, { input: number; output: number }> = {
  'claude-haiku-4.5': {
    input: 0.8, // USD per 1M tokens
    output: 4.0,
  },
  'gemini-flash-3.1': {
    input: 0.075,
    output: 0.3,
  },
  'cursor-composer-2.0': {
    input: 1.0,
    output: 5.0,
  },
  'gpt-4': {
    input: 30.0,
    output: 60.0,
  },
  'gpt-3.5-turbo': {
    input: 0.5,
    output: 1.5,
  },
  unknown: {
    input: 1.0,
    output: 1.0,
  },
}

/**
 * Pricing cache entry
 */
interface CacheEntry {
  data: PricingInfo
  expiresAt: Date
}

/**
 * Pricing Manager class for managing model pricing and cost calculations
 */
export class PricingManager {
  private pool = getDatabasePool()
  private cache: Map<SupportedModel, CacheEntry> = new Map()
  private cacheExpiry: number = 24 * 60 * 60 * 1000 // 24 hours
  private exchangeRate: number = 5.0 // BRL per USD (default)
  private userPricingOverrides: Map<SupportedModel, { input: number; output: number }> =
    new Map()
  private lastPricingPrompt: Date = new Date()
  private pricingPromptInterval: number = 7 * 24 * 60 * 60 * 1000 // 7 days

  constructor(exchangeRate?: number) {
    if (exchangeRate) {
      this.exchangeRate = exchangeRate
    }
  }

  /**
   * Set exchange rate for BRL conversion
   */
  setExchangeRate(rate: number): void {
    if (rate <= 0) {
      throw new Error('Exchange rate must be positive')
    }
    this.exchangeRate = rate
  }

  /**
   * Get exchange rate
   */
  getExchangeRate(): number {
    return this.exchangeRate
  }

  /**
   * Set user-configured pricing override for a model
   */
  setPricingOverride(
    model: SupportedModel,
    inputPrice: number,
    outputPrice: number
  ): void {
    if (inputPrice < 0 || outputPrice < 0) {
      throw new Error('Prices must be non-negative')
    }
    this.userPricingOverrides.set(model, { input: inputPrice, output: outputPrice })
  }

  /**
   * Get pricing for a model
   */
  async getPricing(model: SupportedModel): Promise<PricingInfo> {
    // Check user override first
    const override = this.userPricingOverrides.get(model)
    if (override) {
      return {
        model,
        inputPrice: override.input,
        outputPrice: override.output,
        currency: 'USD',
        lastUpdated: new Date(),
      }
    }

    // Check cache
    const cached = this.cache.get(model)
    if (cached && cached.expiresAt > new Date()) {
      return cached.data
    }

    // Try to fetch from database cache
    const dbCached = await this.getPricingFromDatabase(model)
    if (dbCached && dbCached.lastUpdated.getTime() + this.cacheExpiry > Date.now()) {
      this.cache.set(model, {
        data: dbCached,
        expiresAt: new Date(dbCached.lastUpdated.getTime() + this.cacheExpiry),
      })
      return dbCached
    }

    // Try to fetch from provider API
    const fetched = await this.fetchPricingFromProvider(model)
    if (fetched) {
      await this.savePricingToDatabase(fetched)
      this.cache.set(model, {
        data: fetched,
        expiresAt: new Date(Date.now() + this.cacheExpiry),
      })
      return fetched
    }

    // Fall back to default pricing
    const defaultPrice = DEFAULT_PRICING[model]
    const fallback: PricingInfo = {
      model,
      inputPrice: defaultPrice.input,
      outputPrice: defaultPrice.output,
      currency: 'USD',
      lastUpdated: new Date(),
    }

    this.cache.set(model, {
      data: fallback,
      expiresAt: new Date(Date.now() + this.cacheExpiry),
    })

    return fallback
  }

  /**
   * Get pricing from database cache
   */
  private async getPricingFromDatabase(model: SupportedModel): Promise<PricingInfo | null> {
    return new Promise((resolve) => {
      const query = `
        SELECT model, inputPrice, outputPrice, currency, lastUpdated
        FROM pricing_cache
        WHERE model = ?
      `

      this.pool.getConnection().get(query, [model], (err, row: any) => {
        if (err || !row) {
          resolve(null)
          return
        }

        resolve({
          model: row.model,
          inputPrice: row.inputPrice,
          outputPrice: row.outputPrice,
          currency: row.currency,
          lastUpdated: new Date(row.lastUpdated),
        })
      })
    })
  }

  /**
   * Save pricing to database cache
   */
  private async savePricingToDatabase(pricing: PricingInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO pricing_cache
        (id, model, inputPrice, outputPrice, currency, lastUpdated)
        VALUES (?, ?, ?, ?, ?, ?)
      `

      const id = `${pricing.model}-${Date.now()}`

      this.pool.getConnection().run(
        query,
        [id, pricing.model, pricing.inputPrice, pricing.outputPrice, pricing.currency, pricing.lastUpdated.toISOString()],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })
  }

  /**
   * Fetch pricing from provider API
   * This is a placeholder - in production, would call actual provider APIs
   */
  private async fetchPricingFromProvider(model: SupportedModel): Promise<PricingInfo | null> {
    try {
      // Placeholder for actual API calls to Anthropic, Google, Cursor
      // In production, would call:
      // - https://api.anthropic.com/pricing for Claude models
      // - https://ai.google.dev/pricing for Gemini models
      // - Cursor API for Cursor Composer

      // For now, return null to trigger fallback
      return null
    } catch (error) {
      console.error(`Failed to fetch pricing for ${model}:`, error)
      return null
    }
  }

  /**
   * Calculate cost for tokens
   */
  async calculateCost(
    model: SupportedModel,
    inputTokens: number,
    outputTokens: number
  ): Promise<{ inputCost: number; outputCost: number; totalCost: number }> {
    if (inputTokens < 0 || outputTokens < 0) {
      throw new Error('Token counts must be non-negative')
    }

    const pricing = await this.getPricing(model)

    // Convert from per 1M tokens to per token
    const inputCostPerToken = pricing.inputPrice / 1_000_000
    const outputCostPerToken = pricing.outputPrice / 1_000_000

    const inputCost = inputTokens * inputCostPerToken
    const outputCost = outputTokens * outputCostPerToken
    const totalCost = inputCost + outputCost

    return {
      inputCost,
      outputCost,
      totalCost,
    }
  }

  /**
   * Convert USD to BRL
   */
  convertUSDToBRL(usd: number): number {
    if (usd < 0) {
      throw new Error('Amount must be non-negative')
    }
    return usd * this.exchangeRate
  }

  /**
   * Convert BRL to USD
   */
  convertBRLToUSD(brl: number): number {
    if (brl < 0) {
      throw new Error('Amount must be non-negative')
    }
    return brl / this.exchangeRate
  }

  /**
   * Check if pricing needs user verification
   */
  shouldPromptForPricingVerification(): boolean {
    const timeSinceLastPrompt = Date.now() - this.lastPricingPrompt.getTime()
    return timeSinceLastPrompt >= this.pricingPromptInterval
  }

  /**
   * Mark pricing as verified by user
   */
  markPricingVerified(): void {
    this.lastPricingPrompt = new Date()
  }

  /**
   * Get all cached pricing
   */
  getAllCachedPricing(): PricingInfo[] {
    return Array.from(this.cache.values()).map((entry) => entry.data)
  }

  /**
   * Clear pricing cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear user pricing overrides
   */
  clearOverrides(): void {
    this.userPricingOverrides.clear()
  }

  /**
   * Get default pricing for a model
   */
  static getDefaultPricing(model: SupportedModel): { input: number; output: number } {
    return DEFAULT_PRICING[model] || DEFAULT_PRICING.unknown
  }

  /**
   * Get all default pricing
   */
  static getAllDefaultPricing(): Record<SupportedModel, { input: number; output: number }> {
    return { ...DEFAULT_PRICING }
  }
}

export default PricingManager
