/**
 * @jest-environment jsdom
 */

import { logger } from '@/lib/logger'

describe('Logger Utility', () => {
  let originalEnv: string | undefined

  beforeEach(() => {
    // Store original NODE_ENV
    originalEnv = process.env.NODE_ENV
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'info').mockImplementation()
    jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv
    
    // Restore console methods
    jest.restoreAllMocks()
  })

  describe('Development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log messages in development', () => {
      logger.log('Test message', { data: 'test' })
      
      expect(console.log).toHaveBeenCalledWith('Test message', { data: 'test' })
    })

    it('should log error messages in development', () => {
      logger.error('Error message', new Error('Test error'))
      
      expect(console.error).toHaveBeenCalledWith('Error message', new Error('Test error'))
    })

    it('should log warning messages in development', () => {
      logger.warn('Warning message', { warning: true })
      
      expect(console.warn).toHaveBeenCalledWith('Warning message', { warning: true })
    })

    it('should log info messages in development', () => {
      logger.info('Info message', { info: 'data' })
      
      expect(console.info).toHaveBeenCalledWith('Info message', { info: 'data' })
    })

    it('should log debug messages in development', () => {
      logger.debug('Debug message', { debug: true })
      
      expect(console.debug).toHaveBeenCalledWith('Debug message', { debug: true })
    })

    it('should handle multiple arguments', () => {
      logger.log('Message', 'arg1', 2, { key: 'value' }, true)
      
      expect(console.log).toHaveBeenCalledWith('Message', 'arg1', 2, { key: 'value' }, true)
    })

    it('should handle no arguments', () => {
      logger.log()
      
      expect(console.log).toHaveBeenCalledWith()
    })
  })

  describe('Production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should not log messages in production', () => {
      logger.log('Test message')
      
      expect(console.log).not.toHaveBeenCalled()
    })

    it('should not log error messages in production', () => {
      logger.error('Error message')
      
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should not log warning messages in production', () => {
      logger.warn('Warning message')
      
      expect(console.warn).not.toHaveBeenCalled()
    })

    it('should not log info messages in production', () => {
      logger.info('Info message')
      
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should not log debug messages in production', () => {
      logger.debug('Debug message')
      
      expect(console.debug).not.toHaveBeenCalled()
    })
  })

  describe('Other environments', () => {
    it('should not log in test environment', () => {
      process.env.NODE_ENV = 'test'
      
      logger.log('Test message')
      
      expect(console.log).not.toHaveBeenCalled()
    })

    it('should not log in staging environment', () => {
      process.env.NODE_ENV = 'staging'
      
      logger.log('Test message')
      
      expect(console.log).not.toHaveBeenCalled()
    })

    it('should not log when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV
      
      logger.log('Test message')
      
      expect(console.log).not.toHaveBeenCalled()
    })
  })

  describe('Logger methods availability', () => {
    it('should have all required methods', () => {
      expect(typeof logger.log).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })
  })

  describe('Data types handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should handle strings', () => {
      logger.log('String message')
      
      expect(console.log).toHaveBeenCalledWith('String message')
    })

    it('should handle numbers', () => {
      logger.log(42, 3.14)
      
      expect(console.log).toHaveBeenCalledWith(42, 3.14)
    })

    it('should handle objects', () => {
      const obj = { key: 'value', nested: { prop: 'test' } }
      logger.log(obj)
      
      expect(console.log).toHaveBeenCalledWith(obj)
    })

    it('should handle arrays', () => {
      const arr = [1, 'two', { three: 3 }]
      logger.log(arr)
      
      expect(console.log).toHaveBeenCalledWith(arr)
    })

    it('should handle null and undefined', () => {
      logger.log(null, undefined)
      
      expect(console.log).toHaveBeenCalledWith(null, undefined)
    })

    it('should handle boolean values', () => {
      logger.log(true, false)
      
      expect(console.log).toHaveBeenCalledWith(true, false)
    })

    it('should handle Error objects', () => {
      const error = new Error('Test error')
      logger.error(error)
      
      expect(console.error).toHaveBeenCalledWith(error)
    })
  })
})
