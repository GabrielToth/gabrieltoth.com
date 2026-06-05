/**
 * Compression Module
 * Handles data compression and decompression using gzip and brotli
 */

import zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)
const brotliCompress = promisify(zlib.brotliCompress)
const brotliDecompress = promisify(zlib.brotliDecompress)

/**
 * Compression result
 */
export interface CompressionResult {
  compressedData: Buffer
  originalSize: number
  compressedSize: number
  compressionRatio: number
  method: 'gzip' | 'brotli'
  duration: number // milliseconds
}

/**
 * Decompression result
 */
export interface DecompressionResult {
  data: any[]
  originalSize: number
  compressedSize: number
  compressionRatio: number
  method: 'gzip' | 'brotli'
  duration: number // milliseconds
}

/**
 * Compression Service
 * Provides compression and decompression utilities
 */
export class CompressionService {
  /**
   * Compress data using specified method
   */
  async compress(
    data: any[],
    method: 'gzip' | 'brotli' = 'gzip'
  ): Promise<CompressionResult> {
    const startTime = Date.now()

    try {
      // Serialize data to JSON
      const jsonData = JSON.stringify(data)
      const originalSize = Buffer.byteLength(jsonData, 'utf8')

      // Compress based on method
      let compressedData: Buffer

      if (method === 'brotli') {
        compressedData = (await brotliCompress(jsonData)) as Buffer
      } else {
        compressedData = (await gzip(jsonData)) as Buffer
      }

      const compressedSize = compressedData.length
      const compressionRatio = (1 - compressedSize / originalSize) * 100

      return {
        compressedData,
        originalSize,
        compressedSize,
        compressionRatio,
        method,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to compress data: ${message}`)
    }
  }

  /**
   * Decompress data using specified method
   */
  async decompress(
    compressedData: Buffer,
    method: 'gzip' | 'brotli' = 'gzip'
  ): Promise<DecompressionResult> {
    const startTime = Date.now()
    const compressedSize = compressedData.length

    try {
      // Decompress based on method
      let decompressedBuffer: Buffer

      if (method === 'brotli') {
        decompressedBuffer = (await brotliDecompress(compressedData)) as Buffer
      } else {
        decompressedBuffer = (await gunzip(compressedData)) as Buffer
      }

      // Parse JSON
      const jsonData = decompressedBuffer.toString('utf8')
      const data = JSON.parse(jsonData)
      const originalSize = Buffer.byteLength(jsonData, 'utf8')
      const compressionRatio = (1 - compressedSize / originalSize) * 100

      return {
        data,
        originalSize,
        compressedSize,
        compressionRatio,
        method,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to decompress data: ${message}`)
    }
  }

  /**
   * Estimate compression ratio for data
   * Returns estimated compression ratio without actually compressing
   */
  estimateCompressionRatio(data: any[], method: 'gzip' | 'brotli' = 'gzip'): number {
    try {
      const jsonData = JSON.stringify(data)
      const originalSize = Buffer.byteLength(jsonData, 'utf8')

      // Estimate based on method
      // These are conservative estimates based on typical compression ratios
      if (method === 'brotli') {
        // Brotli typically achieves 15-25% better compression than gzip
        return Math.min(originalSize * 0.4, originalSize * 0.5) / originalSize
      } else {
        // Gzip typically achieves 50-70% compression on JSON
        return Math.min(originalSize * 0.5, originalSize * 0.6) / originalSize
      }
    } catch (error) {
      // Return conservative estimate on error
      return 0.5
    }
  }

  /**
   * Get compression method recommendation based on data characteristics
   */
  recommendCompressionMethod(data: any[]): 'gzip' | 'brotli' {
    try {
      const jsonData = JSON.stringify(data)
      const size = Buffer.byteLength(jsonData, 'utf8')

      // Use brotli for larger datasets (>1MB) as it has better compression
      // Use gzip for smaller datasets as it's faster
      if (size > 1024 * 1024) {
        return 'brotli'
      } else {
        return 'gzip'
      }
    } catch (error) {
      // Default to gzip on error
      return 'gzip'
    }
  }

  /**
   * Compare compression methods for given data
   */
  async compareCompressionMethods(data: any[]): Promise<{
    gzip: CompressionResult
    brotli: CompressionResult
    recommendation: 'gzip' | 'brotli'
  }> {
    try {
      const gzipResult = await this.compress(data, 'gzip')
      const brotliResult = await this.compress(data, 'brotli')

      // Recommend the method with better compression ratio
      const recommendation =
        brotliResult.compressionRatio > gzipResult.compressionRatio ? 'brotli' : 'gzip'

      return {
        gzip: gzipResult,
        brotli: brotliResult,
        recommendation,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to compare compression methods: ${message}`)
    }
  }

  /**
   * Compress data in chunks for large datasets
   */
  async compressInChunks(
    data: any[],
    chunkSize: number = 1000,
    method: 'gzip' | 'brotli' = 'gzip'
  ): Promise<{
    chunks: CompressionResult[]
    totalOriginalSize: number
    totalCompressedSize: number
    totalCompressionRatio: number
  }> {
    try {
      const chunks: CompressionResult[] = []
      let totalOriginalSize = 0
      let totalCompressedSize = 0

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)
        const result = await this.compress(chunk, method)
        chunks.push(result)
        totalOriginalSize += result.originalSize
        totalCompressedSize += result.compressedSize
      }

      const totalCompressionRatio = (1 - totalCompressedSize / totalOriginalSize) * 100

      return {
        chunks,
        totalOriginalSize,
        totalCompressedSize,
        totalCompressionRatio,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to compress data in chunks: ${message}`)
    }
  }

  /**
   * Decompress data in chunks
   */
  async decompressInChunks(
    compressedChunks: Buffer[],
    method: 'gzip' | 'brotli' = 'gzip'
  ): Promise<any[]> {
    try {
      const allData: any[] = []

      for (const chunk of compressedChunks) {
        const result = await this.decompress(chunk, method)
        allData.push(...result.data)
      }

      return allData
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to decompress data in chunks: ${message}`)
    }
  }
}

export { CompressionResult, DecompressionResult }
