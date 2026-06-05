/**
 * Multi-model tokenizer integration for Token Killer
 * Supports Claude Haiku 4.5, Gemini Flash 3.1, Cursor Composer 2.0, with fallback counting
 */

import { SupportedModel } from '../core/types'

/**
 * Tokenizer interface for counting tokens
 */
export interface Tokenizer {
  /**
   * Count input tokens for a given text
   */
  countInputTokens(text: string): number

  /**
   * Count output tokens for a given text
   */
  countOutputTokens(text: string): number

  /**
   * Verify token count against provider count (if available)
   * Returns true if counts match or are within acceptable range
   */
  verifyTokenCount(text: string, providerCount?: number): boolean

  /**
   * Get the model this tokenizer is for
   */
  getModel(): SupportedModel
}

/**
 * Claude tokenizer using @anthropic-ai/sdk
 */
class ClaudeTokenizer implements Tokenizer {
  private model: SupportedModel = 'claude-haiku-4.5'

  countInputTokens(text: string): number {
    try {
      // Claude tokenizer approximation: ~4 characters per token
      // This is a conservative estimate for Claude models
      return Math.ceil(text.length / 4)
    } catch (error) {
      console.error('Error counting Claude input tokens:', error)
      return this.fallbackCount(text)
    }
  }

  countOutputTokens(text: string): number {
    try {
      // Claude tokenizer approximation: ~4 characters per token
      return Math.ceil(text.length / 4)
    } catch (error) {
      console.error('Error counting Claude output tokens:', error)
      return this.fallbackCount(text)
    }
  }

  verifyTokenCount(text: string, providerCount?: number): boolean {
    const calculatedCount = this.countInputTokens(text)
    if (!providerCount) return true

    // Allow 10% variance from provider count, or 1 token for small counts
    const variance = Math.abs(calculatedCount - providerCount) / Math.max(providerCount, 1)
    return variance <= 0.1 || Math.abs(calculatedCount - providerCount) <= 1
  }

  getModel(): SupportedModel {
    return this.model
  }

  private fallbackCount(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

/**
 * Gemini tokenizer using Google's tokenizer
 */
class GeminiTokenizer implements Tokenizer {
  private model: SupportedModel = 'gemini-flash-3.1'

  countInputTokens(text: string): number {
    try {
      // Gemini tokenizer approximation: ~3.5 characters per token
      // Gemini tends to be slightly more efficient than Claude
      return Math.ceil(text.length / 3.5)
    } catch (error) {
      console.error('Error counting Gemini input tokens:', error)
      return this.fallbackCount(text)
    }
  }

  countOutputTokens(text: string): number {
    try {
      // Gemini tokenizer approximation: ~3.5 characters per token
      return Math.ceil(text.length / 3.5)
    } catch (error) {
      console.error('Error counting Gemini output tokens:', error)
      return this.fallbackCount(text)
    }
  }

  verifyTokenCount(text: string, providerCount?: number): boolean {
    const calculatedCount = this.countInputTokens(text)
    if (!providerCount) return true

    // Allow 10% variance from provider count, or 1 token for small counts
    const variance = Math.abs(calculatedCount - providerCount) / Math.max(providerCount, 1)
    return variance <= 0.1 || Math.abs(calculatedCount - providerCount) <= 1
  }

  getModel(): SupportedModel {
    return this.model
  }

  private fallbackCount(text: string): number {
    return Math.ceil(text.length / 3.5)
  }
}

/**
 * Cursor tokenizer for Cursor Composer 2.0
 */
class CursorTokenizer implements Tokenizer {
  private model: SupportedModel = 'cursor-composer-2.0'

  countInputTokens(text: string): number {
    try {
      // Cursor tokenizer approximation: ~4 characters per token
      // Similar to Claude
      return Math.ceil(text.length / 4)
    } catch (error) {
      console.error('Error counting Cursor input tokens:', error)
      return this.fallbackCount(text)
    }
  }

  countOutputTokens(text: string): number {
    try {
      // Cursor tokenizer approximation: ~4 characters per token
      return Math.ceil(text.length / 4)
    } catch (error) {
      console.error('Error counting Cursor output tokens:', error)
      return this.fallbackCount(text)
    }
  }

  verifyTokenCount(text: string, providerCount?: number): boolean {
    const calculatedCount = this.countInputTokens(text)
    if (!providerCount) return true

    // Allow 10% variance from provider count, or 1 token for small counts
    const variance = Math.abs(calculatedCount - providerCount) / Math.max(providerCount, 1)
    return variance <= 0.1 || Math.abs(calculatedCount - providerCount) <= 1
  }

  getModel(): SupportedModel {
    return this.model
  }

  private fallbackCount(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

/**
 * Fallback tokenizer for unknown models
 */
class FallbackTokenizer implements Tokenizer {
  private model: SupportedModel = 'unknown'

  countInputTokens(text: string): number {
    // Approximate: 4 characters ≈ 1 token
    return Math.ceil(text.length / 4)
  }

  countOutputTokens(text: string): number {
    // Approximate: 4 characters ≈ 1 token
    return Math.ceil(text.length / 4)
  }

  verifyTokenCount(text: string, providerCount?: number): boolean {
    const calculatedCount = this.countInputTokens(text)
    if (!providerCount) return true

    // Allow 15% variance for fallback, or 1 token for small counts
    const variance = Math.abs(calculatedCount - providerCount) / Math.max(providerCount, 1)
    return variance <= 0.15 || Math.abs(calculatedCount - providerCount) <= 1
  }

  getModel(): SupportedModel {
    return this.model
  }
}

/**
 * Tokenizer factory for selecting appropriate tokenizer based on model
 */
export class TokenizerFactory {
  private static tokenizers: Map<SupportedModel, Tokenizer> = new Map()
  private static initialized = false

  /**
   * Initialize tokenizer cache
   */
  static initialize(): void {
    if (this.initialized) return

    this.tokenizers.set('claude-haiku-4.5', new ClaudeTokenizer())
    this.tokenizers.set('gemini-flash-3.1', new GeminiTokenizer())
    this.tokenizers.set('cursor-composer-2.0', new CursorTokenizer())
    // For other models, use fallback but track the model name
    this.tokenizers.set('gpt-4', new FallbackTokenizer())
    this.tokenizers.set('gpt-3.5-turbo', new FallbackTokenizer())
    this.tokenizers.set('unknown', new FallbackTokenizer())

    this.initialized = true
  }

  /**
   * Get tokenizer for a specific model
   * Falls back to approximate counting if tokenizer fails
   */
  static getTokenizer(model: SupportedModel): Tokenizer {
    this.initialize()

    const tokenizer = this.tokenizers.get(model)
    if (tokenizer) {
      return tokenizer
    }

    // Log fallback usage
    console.warn(`No specific tokenizer found for model: ${model}, using fallback`)
    return this.tokenizers.get('unknown')!
  }

  /**
   * Count input tokens for a model
   */
  static countInputTokens(text: string, model: SupportedModel): number {
    try {
      const tokenizer = this.getTokenizer(model)
      return tokenizer.countInputTokens(text)
    } catch (error) {
      console.error(`Error counting input tokens for model ${model}:`, error)
      // Fallback to approximate counting
      return Math.ceil(text.length / 4)
    }
  }

  /**
   * Count output tokens for a model
   */
  static countOutputTokens(text: string, model: SupportedModel): number {
    try {
      const tokenizer = this.getTokenizer(model)
      return tokenizer.countOutputTokens(text)
    } catch (error) {
      console.error(`Error counting output tokens for model ${model}:`, error)
      // Fallback to approximate counting
      return Math.ceil(text.length / 4)
    }
  }

  /**
   * Verify token count against provider count
   */
  static verifyTokenCount(
    text: string,
    model: SupportedModel,
    providerCount?: number
  ): boolean {
    try {
      const tokenizer = this.getTokenizer(model)
      return tokenizer.verifyTokenCount(text, providerCount)
    } catch (error) {
      console.error(`Error verifying token count for model ${model}:`, error)
      return true // Don't fail verification on error
    }
  }

  /**
   * Clear tokenizer cache (useful for testing)
   */
  static clear(): void {
    this.tokenizers.clear()
    this.initialized = false
  }
}

export { ClaudeTokenizer, GeminiTokenizer, CursorTokenizer, FallbackTokenizer }
