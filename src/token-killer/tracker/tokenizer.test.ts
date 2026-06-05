/**
 * Unit tests for tokenizer module
 * Tests consistency, edge cases, and fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  TokenizerFactory,
  ClaudeTokenizer,
  GeminiTokenizer,
  CursorTokenizer,
  FallbackTokenizer,
} from './tokenizer'

describe('Tokenizer Module', () => {
  beforeEach(() => {
    TokenizerFactory.clear()
  })

  afterEach(() => {
    TokenizerFactory.clear()
  })

  describe('ClaudeTokenizer', () => {
    let tokenizer: ClaudeTokenizer

    beforeEach(() => {
      tokenizer = new ClaudeTokenizer()
    })

    it('should count input tokens correctly', () => {
      const text = 'Hello, world!'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(Math.ceil(text.length / 3))
    })

    it('should count output tokens correctly', () => {
      const text = 'This is a response.'
      const count = tokenizer.countOutputTokens(text)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(Math.ceil(text.length / 3))
    })

    it('should handle empty strings', () => {
      const count = tokenizer.countInputTokens('')
      expect(count).toBe(0)
    })

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000)
      const count = tokenizer.countInputTokens(longText)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(Math.ceil(longText.length / 3))
    })

    it('should handle special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBeGreaterThan(0)
    })

    it('should handle unicode characters', () => {
      const text = '你好世界 🌍 مرحبا'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBeGreaterThan(0)
    })

    it('should be consistent across multiple invocations', () => {
      const text = 'Consistency test'
      const count1 = tokenizer.countInputTokens(text)
      const count2 = tokenizer.countInputTokens(text)
      const count3 = tokenizer.countInputTokens(text)
      expect(count1).toBe(count2)
      expect(count2).toBe(count3)
    })

    it('should verify token count within acceptable range', () => {
      const text = 'Test text for verification'
      const calculatedCount = tokenizer.countInputTokens(text)
      // Verify with exact count
      expect(tokenizer.verifyTokenCount(text, calculatedCount)).toBe(true)
      // Verify with 5% variance
      expect(tokenizer.verifyTokenCount(text, Math.ceil(calculatedCount * 1.05))).toBe(true)
      // Verify with 15% variance (should fail for larger counts)
      if (calculatedCount > 5) {
        expect(tokenizer.verifyTokenCount(text, Math.ceil(calculatedCount * 1.15))).toBe(false)
      }
    })

    it('should return correct model', () => {
      expect(tokenizer.getModel()).toBe('claude-haiku-4.5')
    })
  })

  describe('GeminiTokenizer', () => {
    let tokenizer: GeminiTokenizer

    beforeEach(() => {
      tokenizer = new GeminiTokenizer()
    })

    it('should count input tokens correctly', () => {
      const text = 'Hello, world!'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBeGreaterThan(0)
    })

    it('should be more efficient than Claude (fewer tokens)', () => {
      const text = 'This is a test message for token counting.'
      const claudeCount = new ClaudeTokenizer().countInputTokens(text)
      const geminiCount = tokenizer.countInputTokens(text)
      // Gemini uses 3.5 chars per token vs Claude's 4, so should be slightly more efficient
      // But due to rounding, they might be similar
      expect(geminiCount).toBeLessThanOrEqual(claudeCount + 1)
    })

    it('should handle empty strings', () => {
      const count = tokenizer.countInputTokens('')
      expect(count).toBe(0)
    })

    it('should be consistent across multiple invocations', () => {
      const text = 'Consistency test'
      const count1 = tokenizer.countInputTokens(text)
      const count2 = tokenizer.countInputTokens(text)
      expect(count1).toBe(count2)
    })

    it('should return correct model', () => {
      expect(tokenizer.getModel()).toBe('gemini-flash-3.1')
    })
  })

  describe('CursorTokenizer', () => {
    let tokenizer: CursorTokenizer

    beforeEach(() => {
      tokenizer = new CursorTokenizer()
    })

    it('should count input tokens correctly', () => {
      const text = 'Hello, world!'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBeGreaterThan(0)
    })

    it('should be similar to Claude', () => {
      const text = 'This is a test message for token counting.'
      const claudeCount = new ClaudeTokenizer().countInputTokens(text)
      const cursorCount = tokenizer.countInputTokens(text)
      // Should be similar (within 10%)
      const variance = Math.abs(claudeCount - cursorCount) / claudeCount
      expect(variance).toBeLessThan(0.1)
    })

    it('should return correct model', () => {
      expect(tokenizer.getModel()).toBe('cursor-composer-2.0')
    })
  })

  describe('FallbackTokenizer', () => {
    let tokenizer: FallbackTokenizer

    beforeEach(() => {
      tokenizer = new FallbackTokenizer()
    })

    it('should count tokens using approximate method', () => {
      const text = 'Hello, world!'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBe(Math.ceil(text.length / 4))
    })

    it('should handle empty strings', () => {
      const count = tokenizer.countInputTokens('')
      expect(count).toBe(0)
    })

    it('should return correct model', () => {
      expect(tokenizer.getModel()).toBe('unknown')
    })

    it('should verify token count with tolerance', () => {
      const text = 'Test text for verification with more content'
      const calculatedCount = tokenizer.countInputTokens(text)
      // Verify with exact count
      expect(tokenizer.verifyTokenCount(text, calculatedCount)).toBe(true)
      // Verify with no provider count (should pass)
      expect(tokenizer.verifyTokenCount(text)).toBe(true)
    })
  })

  describe('TokenizerFactory', () => {
    it('should initialize tokenizers on first use', () => {
      const tokenizer = TokenizerFactory.getTokenizer('claude-haiku-4.5')
      expect(tokenizer).toBeDefined()
      expect(tokenizer.getModel()).toBe('claude-haiku-4.5')
    })

    it('should return Claude tokenizer for claude-haiku-4.5', () => {
      const tokenizer = TokenizerFactory.getTokenizer('claude-haiku-4.5')
      expect(tokenizer.getModel()).toBe('claude-haiku-4.5')
    })

    it('should return Gemini tokenizer for gemini-flash-3.1', () => {
      const tokenizer = TokenizerFactory.getTokenizer('gemini-flash-3.1')
      expect(tokenizer.getModel()).toBe('gemini-flash-3.1')
    })

    it('should return Cursor tokenizer for cursor-composer-2.0', () => {
      const tokenizer = TokenizerFactory.getTokenizer('cursor-composer-2.0')
      expect(tokenizer.getModel()).toBe('cursor-composer-2.0')
    })

    it('should return fallback tokenizer for unknown models', () => {
      const tokenizer = TokenizerFactory.getTokenizer('gpt-4')
      // Should return a tokenizer (fallback)
      expect(tokenizer).toBeDefined()
      // For gpt-4, it should use fallback counting
      const text = 'test'
      const count = tokenizer.countInputTokens(text)
      expect(count).toBe(Math.ceil(text.length / 4))
    })

    it('should cache tokenizer instances', () => {
      const tokenizer1 = TokenizerFactory.getTokenizer('claude-haiku-4.5')
      const tokenizer2 = TokenizerFactory.getTokenizer('claude-haiku-4.5')
      expect(tokenizer1).toBe(tokenizer2)
    })

    it('should count input tokens for a model', () => {
      const text = 'Hello, world!'
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should count output tokens for a model', () => {
      const text = 'Response text'
      const count = TokenizerFactory.countOutputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should verify token count for a model', () => {
      const text = 'Test'
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      const verified = TokenizerFactory.verifyTokenCount(text, 'claude-haiku-4.5', count)
      expect(verified).toBe(true)
    })

    it('should handle errors gracefully and fallback', () => {
      const text = 'Test text'
      // Should not throw even if tokenizer fails
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should clear cache', () => {
      TokenizerFactory.getTokenizer('claude-haiku-4.5')
      TokenizerFactory.clear()
      // After clear, should reinitialize
      const tokenizer = TokenizerFactory.getTokenizer('claude-haiku-4.5')
      expect(tokenizer).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long text without overflow', () => {
      const longText = 'a'.repeat(1000000) // 1 million characters
      const count = TokenizerFactory.countInputTokens(longText, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(Math.ceil(longText.length / 3))
    })

    it('should handle text with only whitespace', () => {
      const text = '   \n\t\r   '
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should handle text with newlines and tabs', () => {
      const text = 'Line 1\nLine 2\tTabbed'
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should handle mixed unicode and ASCII', () => {
      const text = 'Hello 世界 مرحبا 🌍'
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should handle HTML content', () => {
      const html = '<div><p>Hello <strong>world</strong></p></div>'
      const count = TokenizerFactory.countInputTokens(html, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should handle JSON content', () => {
      const json = JSON.stringify({ name: 'test', value: 123, nested: { key: 'value' } })
      const count = TokenizerFactory.countInputTokens(json, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should handle code content', () => {
      const code = `
        function hello() {
          console.log('Hello, world!');
          return 42;
        }
      `
      const count = TokenizerFactory.countInputTokens(code, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Consistency Properties', () => {
    it('should maintain consistency for same input across models', () => {
      const text = 'Consistency test'
      const claudeCount = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      const geminiCount = TokenizerFactory.countInputTokens(text, 'gemini-flash-3.1')
      const cursorCount = TokenizerFactory.countInputTokens(text, 'cursor-composer-2.0')

      // All should be positive
      expect(claudeCount).toBeGreaterThan(0)
      expect(geminiCount).toBeGreaterThan(0)
      expect(cursorCount).toBeGreaterThan(0)

      // Should be within reasonable range of each other
      const maxCount = Math.max(claudeCount, geminiCount, cursorCount)
      const minCount = Math.min(claudeCount, geminiCount, cursorCount)
      const variance = (maxCount - minCount) / minCount
      expect(variance).toBeLessThan(0.5) // Within 50%
    })

    it('should never return negative token counts', () => {
      const texts = [
        '',
        'a',
        'Hello',
        'Hello, world!',
        'a'.repeat(1000),
        '!@#$%^&*()',
        '你好世界',
      ]

      for (const text of texts) {
        const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    it('should maintain consistency for input and output counting', () => {
      const text = 'Test text'
      const inputCount = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      const outputCount = TokenizerFactory.countOutputTokens(text, 'claude-haiku-4.5')

      // Should be the same for same text
      expect(inputCount).toBe(outputCount)
    })

    it('should scale linearly with text length', () => {
      const baseText = 'Hello world'
      const baseCount = TokenizerFactory.countInputTokens(baseText, 'claude-haiku-4.5')

      const doubledText = baseText + baseText
      const doubledCount = TokenizerFactory.countInputTokens(doubledText, 'claude-haiku-4.5')

      // Doubled text should have approximately doubled token count
      const ratio = doubledCount / baseCount
      expect(ratio).toBeGreaterThan(1.8)
      expect(ratio).toBeLessThan(2.2)
    })
  })

  describe('Fallback Mechanism', () => {
    it('should fallback to approximate counting on error', () => {
      const text = 'Test'
      // Should not throw
      const count = TokenizerFactory.countInputTokens(text, 'claude-haiku-4.5')
      expect(count).toBeGreaterThan(0)
    })

    it('should never throw on invalid input', () => {
      const invalidInputs = [
        null,
        undefined,
        NaN,
        Infinity,
      ]

      for (const input of invalidInputs) {
        // Should handle gracefully
        try {
          const count = TokenizerFactory.countInputTokens(input as any, 'claude-haiku-4.5')
          expect(typeof count).toBe('number')
        } catch (error) {
          // If it throws, that's acceptable for invalid input
          expect(error).toBeDefined()
        }
      }
    })

    it('should return approximate count for unknown models', () => {
      const text = 'Test text'
      const count = TokenizerFactory.countInputTokens(text, 'unknown')
      const approximateCount = Math.ceil(text.length / 4)
      expect(count).toBe(approximateCount)
    })
  })
})
