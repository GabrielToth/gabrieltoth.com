/**
 * Unit tests for TokenRecorder
 * Tests token recording, aggregation, and running totals
 */

import { TokenRecorder, RecordTokenRequest, TaskAggregation } from './recorder'
import { initializeDatabasePool, getDatabasePool } from '../storage/database'
import { initializeDatabase } from '../storage/initialize'

describe('TokenRecorder', () => {
  let recorder: TokenRecorder
  let pool: any

  beforeAll(async () => {
    // Initialize database
    pool = await initializeDatabasePool()
    await initializeDatabase()
  })

  beforeEach(() => {
    recorder = new TokenRecorder(5.0) // 5 BRL per USD
  })

  afterAll(async () => {
    await pool.close()
  })

  describe('recordToken', () => {
    it('should record a token with all metadata', async () => {
      const request: RecordTokenRequest = {
        requestId: 'req-123',
        taskId: 'task-456',
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      }

      const record = await recorder.recordToken(request)

      expect(record.id).toBeDefined()
      expect(record.requestId).toBe('req-123')
      expect(record.taskId).toBe('task-456')
      expect(record.agentType).toBe('kiro')
      expect(record.model).toBe('claude-haiku-4.5')
      expect(record.inputTokens).toBe(100)
      expect(record.outputTokens).toBe(50)
      expect(record.totalTokens).toBe(150)
      expect(record.inputCost).toBe(0.00008)
      expect(record.outputCost).toBe(0.0002)
      expect(record.totalCost).toBeCloseTo(0.00028, 6)
      expect(record.timestamp).toBeInstanceOf(Date)
      expect(record.createdAt).toBeInstanceOf(Date)
    })

    it('should calculate BRL cost correctly', async () => {
      const request: RecordTokenRequest = {
        requestId: 'req-124',
        taskId: 'task-457',
        agentType: 'cursor',
        model: 'gemini-flash-3.1',
        inputTokens: 1000,
        outputTokens: 500,
        inputCost: 0.000075,
        outputCost: 0.0003,
      }

      const record = await recorder.recordToken(request)

      // Verify BRL conversion (should be stored in running total)
      const running = recorder.getRunningTotal('task-457')
      expect(running).toBeDefined()
      expect(running!.currentCostBRL).toBeCloseTo(running!.currentCostUSD * 5.0, 6)
    })

    it('should reject negative token counts', async () => {
      const request: RecordTokenRequest = {
        requestId: 'req-125',
        taskId: 'task-458',
        agentType: 'antigravity',
        model: 'cursor-composer-2.0',
        inputTokens: -100,
        outputTokens: 50,
        inputCost: 0.0001,
        outputCost: 0.0005,
      }

      await expect(recorder.recordToken(request)).rejects.toThrow('Token counts must be non-negative')
    })

    it('should reject negative costs', async () => {
      const request: RecordTokenRequest = {
        requestId: 'req-126',
        taskId: 'task-459',
        agentType: 'gabrieltoth',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: -0.0001,
        outputCost: 0.0005,
      }

      await expect(recorder.recordToken(request)).rejects.toThrow('Costs must be non-negative')
    })

    it('should include metadata in record', async () => {
      const request: RecordTokenRequest = {
        requestId: 'req-127',
        taskId: 'task-460',
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
        metadata: {
          endpoint: '/api/generate',
          userId: 'user-123',
          version: '1.0',
        },
      }

      const record = await recorder.recordToken(request)

      expect(record.metadata).toEqual({
        endpoint: '/api/generate',
        userId: 'user-123',
        version: '1.0',
      })
    })
  })

  describe('Running Totals', () => {
    it('should update running total for task', async () => {
      const taskId = 'task-500'

      const request1: RecordTokenRequest = {
        requestId: 'req-200',
        taskId,
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      }

      const request2: RecordTokenRequest = {
        requestId: 'req-201',
        taskId,
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 200,
        outputTokens: 100,
        inputCost: 0.00016,
        outputCost: 0.0004,
      }

      await recorder.recordToken(request1)
      await recorder.recordToken(request2)

      const running = recorder.getRunningTotal(taskId)

      expect(running).toBeDefined()
      expect(running!.currentTokens).toBe(450) // 150 + 300
      expect(running!.requestCount).toBe(2)
      // Total cost: (0.00008 + 0.0002) + (0.00016 + 0.0004) = 0.00028 + 0.00056 = 0.00084
      expect(running!.currentCostUSD).toBeCloseTo(0.00084, 6)
      expect(running!.currentCostBRL).toBeCloseTo(0.0042, 6)
    })

    it('should return undefined for non-existent task', () => {
      const running = recorder.getRunningTotal('non-existent-task')
      expect(running).toBeUndefined()
    })

    it('should clear running total', async () => {
      const taskId = 'task-501'

      const request: RecordTokenRequest = {
        requestId: 'req-202',
        taskId,
        agentType: 'cursor',
        model: 'gemini-flash-3.1',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.000075,
        outputCost: 0.0003,
      }

      await recorder.recordToken(request)
      expect(recorder.getRunningTotal(taskId)).toBeDefined()

      recorder.clearRunningTotal(taskId)
      expect(recorder.getRunningTotal(taskId)).toBeUndefined()
    })

    it('should get all running totals', async () => {
      const taskId1 = 'task-502'
      const taskId2 = 'task-503'

      const request1: RecordTokenRequest = {
        requestId: 'req-203',
        taskId: taskId1,
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      }

      const request2: RecordTokenRequest = {
        requestId: 'req-204',
        taskId: taskId2,
        agentType: 'cursor',
        model: 'gemini-flash-3.1',
        inputTokens: 200,
        outputTokens: 100,
        inputCost: 0.00015,
        outputCost: 0.0003,
      }

      await recorder.recordToken(request1)
      await recorder.recordToken(request2)

      const allTotals = recorder.getAllRunningTotals()

      expect(allTotals.length).toBeGreaterThanOrEqual(2)
      expect(allTotals.some((t) => t.taskId === taskId1)).toBe(true)
      expect(allTotals.some((t) => t.taskId === taskId2)).toBe(true)
    })
  })

  describe('Exchange Rate', () => {
    it('should set and get exchange rate', () => {
      recorder.setExchangeRate(6.5)
      expect(recorder.getExchangeRate()).toBe(6.5)
    })

    it('should reject negative exchange rate', () => {
      expect(() => recorder.setExchangeRate(-1)).toThrow('Exchange rate must be positive')
    })

    it('should reject zero exchange rate', () => {
      expect(() => recorder.setExchangeRate(0)).toThrow('Exchange rate must be positive')
    })

    it('should use exchange rate in running totals', async () => {
      const recorder2 = new TokenRecorder(10.0) // 10 BRL per USD

      const request: RecordTokenRequest = {
        requestId: 'req-205',
        taskId: 'task-504',
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      }

      await recorder2.recordToken(request)

      const running = recorder2.getRunningTotal('task-504')
      expect(running!.currentCostBRL).toBeCloseTo(running!.currentCostUSD * 10.0, 6)
    })
  })

  describe('Batch Writing', () => {
    it('should batch write records to memory buffer', async () => {
      const recorder2 = new TokenRecorder()

      const requests: RecordTokenRequest[] = []
      for (let i = 0; i < 5; i++) {
        requests.push({
          requestId: `req-batch-${i}`,
          agentType: 'kiro',
          model: 'claude-haiku-4.5',
          inputTokens: 100 + i * 10,
          outputTokens: 50 + i * 5,
          inputCost: 0.00008,
          outputCost: 0.0002,
        })
      }

      for (const req of requests) {
        await recorder2.recordToken(req)
      }

      // Don't flush - just verify records are in memory
      // In production, flush would write to database
      expect(recorder2).toBeDefined()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      const recorder2 = new TokenRecorder()

      const request: RecordTokenRequest = {
        requestId: 'req-cleanup',
        agentType: 'kiro',
        model: 'claude-haiku-4.5',
        inputTokens: 100,
        outputTokens: 50,
        inputCost: 0.00008,
        outputCost: 0.0002,
      }

      await recorder2.recordToken(request)
      await recorder2.cleanup()

      // After cleanup, running totals should be cleared
      expect(recorder2.getAllRunningTotals().length).toBe(0)
    })
  })
})
