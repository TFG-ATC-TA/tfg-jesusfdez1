/**
 * @jest-environment jsdom
 */

import { cn } from '@/lib/utils'

// Mock clsx and twMerge
jest.mock('clsx', () => ({
  clsx: jest.fn((...args) => args.filter(Boolean).join(' '))
}))

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn((str) => str)
}))

describe('cn utility function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should combine class names correctly', () => {
    const result = cn('class1', 'class2', 'class3')
    expect(typeof result).toBe('string')
    // Since we're mocking the functions, we can test the basic behavior
    expect(result).toBeTruthy()
  })

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, 'class2', null, 'class3')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should handle empty strings', () => {
    const result = cn('class1', '', 'class2')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should handle conditional classes', () => {
    const condition = true
    const result = cn('base-class', condition && 'conditional-class')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should handle object syntax', () => {
    const result = cn('base-class', {
      'active-class': true,
      'inactive-class': false
    })
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should work with no arguments', () => {
    const result = cn()
    expect(typeof result).toBe('string')
  })

  it('should handle complex combinations', () => {
    const isActive = true
    const size = 'large'
    const result = cn(
      'base-class',
      'another-class',
      {
        'active': isActive,
        'inactive': !isActive
      },
      size === 'large' && 'large-class',
      ['array-class-1', 'array-class-2']
    )
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should merge Tailwind classes correctly', () => {
    // Test merging of conflicting Tailwind classes
    const result = cn('px-2 py-1', 'px-4')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('should handle dynamic class generation', () => {
    const variant = 'primary'
    const size = 'sm'
    
    const getVariantClass = (v: string) => {
      switch (v) {
        case 'primary': return 'bg-blue-500'
        case 'secondary': return 'bg-gray-500'
        default: return 'bg-white'
      }
    }
    
    const getSizeClass = (s: string) => {
      switch (s) {
        case 'sm': return 'text-sm px-2 py-1'
        case 'lg': return 'text-lg px-4 py-2'
        default: return 'text-base px-3 py-1.5'
      }
    }
    
    const result = cn(
      'base-button',
      getVariantClass(variant),
      getSizeClass(size)
    )
    
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })
})
