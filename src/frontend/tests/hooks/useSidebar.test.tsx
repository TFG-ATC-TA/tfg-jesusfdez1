/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useSidebar } from '@/hooks/useSidebar'

describe('useSidebar Hook', () => {
  beforeEach(() => {
    // Reset the Zustand store before each test
    useSidebar.setState({ isMinimized: false })
  })
  it('should initialize with isMinimized as false', () => {
    const { result } = renderHook(() => useSidebar())
    
    expect(result.current.isMinimized).toBe(false)
    expect(typeof result.current.toggle).toBe('function')
  })

  it('should toggle isMinimized state when toggle is called', () => {
    const { result } = renderHook(() => useSidebar())
    
    expect(result.current.isMinimized).toBe(false)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.isMinimized).toBe(true)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.isMinimized).toBe(false)
  })

  it('should maintain state across multiple toggles', () => {
    const { result } = renderHook(() => useSidebar())
    
    // Initial state
    expect(result.current.isMinimized).toBe(false)
    
    // First toggle
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isMinimized).toBe(true)
    
    // Second toggle
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isMinimized).toBe(false)
    
    // Third toggle
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isMinimized).toBe(true)
  })

  it('should return the same toggle function reference', () => {
    const { result, rerender } = renderHook(() => useSidebar())
    
    const firstToggle = result.current.toggle
    
    rerender()
    
    const secondToggle = result.current.toggle
    
    expect(firstToggle).toBe(secondToggle)
  })

  it('should work with multiple hook instances sharing state', () => {
    const { result: result1 } = renderHook(() => useSidebar())
    const { result: result2 } = renderHook(() => useSidebar())
    
    // Both should start with false
    expect(result1.current.isMinimized).toBe(false)
    expect(result2.current.isMinimized).toBe(false)
    
    // Toggle first instance
    act(() => {
      result1.current.toggle()
    })
    
    // Both should be true since they share the same Zustand store
    expect(result1.current.isMinimized).toBe(true)
    expect(result2.current.isMinimized).toBe(true)
    
    // Toggle second instance
    act(() => {
      result2.current.toggle()
    })
    
    // Both should now be false
    expect(result1.current.isMinimized).toBe(false)
    expect(result2.current.isMinimized).toBe(false)
  })

  describe('Return value structure', () => {
    it('should return an object with isMinimized and toggle properties', () => {
      const { result } = renderHook(() => useSidebar())
      
      expect(result.current).toHaveProperty('isMinimized')
      expect(result.current).toHaveProperty('toggle')
      expect(Object.keys(result.current)).toEqual(['isMinimized', 'toggle'])
    })

    it('should have correct types for return values', () => {
      const { result } = renderHook(() => useSidebar())
      
      expect(typeof result.current.isMinimized).toBe('boolean')
      expect(typeof result.current.toggle).toBe('function')
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid successive toggles', () => {
      const { result } = renderHook(() => useSidebar())
      
      expect(result.current.isMinimized).toBe(false)
      
      act(() => {
        result.current.toggle()
        result.current.toggle()
        result.current.toggle()
        result.current.toggle()
      })
      
      expect(result.current.isMinimized).toBe(false)
    })

    it('should persist state after component remount', () => {
      const { result, unmount } = renderHook(() => useSidebar())
      
      act(() => {
        result.current.toggle()
      })
      
      expect(result.current.isMinimized).toBe(true)
      
      unmount()
      
      // Remount - should persist state with Zustand
      const { result: newResult } = renderHook(() => useSidebar())
      
      expect(newResult.current.isMinimized).toBe(true)
    })
  })
})
