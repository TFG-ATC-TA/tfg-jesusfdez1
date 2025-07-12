/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { usePWA } from '@/hooks/usePWA'

// Mock window.matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock navigator.standalone
Object.defineProperty(window.navigator, 'standalone', {
  writable: true,
  value: false,
})

describe('usePWA Hook', () => {
  let mockMediaQuery: any
  let originalAddEventListener: typeof window.addEventListener
  let originalRemoveEventListener: typeof window.removeEventListener

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Store original methods
    originalAddEventListener = window.addEventListener
    originalRemoveEventListener = window.removeEventListener
    
    // Mock MediaQueryList
    mockMediaQuery = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQuery)
    
    // Reset navigator.standalone
    ;(window.navigator as any).standalone = false
    
    // Reset document.referrer
    Object.defineProperty(document, 'referrer', {
      writable: true,
      value: '',
    })
    
    // Mock addEventListener and removeEventListener
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
  })

  afterEach(() => {
    // Restore original methods after each test
    window.addEventListener = originalAddEventListener
    window.removeEventListener = originalRemoveEventListener
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePWA())
    
    expect(result.current.isStandalone).toBe(false)
    expect(result.current.isInstallable).toBe(false)
  })

  it('should detect standalone mode from matchMedia', () => {
    mockMediaQuery.matches = true
    
    const { result } = renderHook(() => usePWA())
    
    expect(result.current.isStandalone).toBe(true)
  })

  it('should detect standalone mode from navigator.standalone', () => {
    ;(window.navigator as any).standalone = true
    
    const { result } = renderHook(() => usePWA())
    
    expect(result.current.isStandalone).toBe(true)
  })

  it('should detect standalone mode from android-app referrer', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'android-app://com.example.app',
      writable: true,
    })
    
    const { result } = renderHook(() => usePWA())
    
    expect(result.current.isStandalone).toBe(true)
  })

  it('should set up beforeinstallprompt event listener', () => {
    renderHook(() => usePWA())
    
    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeinstallprompt',
      expect.any(Function)
    )
  })

  it('should set up media query change listener', () => {
    renderHook(() => usePWA())
    
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('should set isInstallable to true when beforeinstallprompt fires', () => {
    const { result } = renderHook(() => usePWA())
    
    // Get the event handler that was registered
    const addEventListenerCalls = (window.addEventListener as jest.Mock).mock.calls
    const beforeInstallPromptHandler = addEventListenerCalls.find(
      call => call[0] === 'beforeinstallprompt'
    )?.[1]
    
    expect(beforeInstallPromptHandler).toBeDefined()
    
    // Simulate the beforeinstallprompt event
    act(() => {
      beforeInstallPromptHandler()
    })
    
    expect(result.current.isInstallable).toBe(true)
  })

  it('should update standalone state when media query changes', () => {
    const { result } = renderHook(() => usePWA())
    
    // Get the media query change handler
    const addEventListenerCalls = mockMediaQuery.addEventListener.mock.calls
    const mediaQueryHandler = addEventListenerCalls.find(
      (call: any) => call[0] === 'change'
    )?.[1]
    
    expect(mediaQueryHandler).toBeDefined()
    
    // Simulate media query change to standalone
    mockMediaQuery.matches = true
    act(() => {
      mediaQueryHandler()
    })
    
    expect(result.current.isStandalone).toBe(true)
  })

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => usePWA())
    
    unmount()
    
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'beforeinstallprompt',
      expect.any(Function)
    )
    
    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  describe('Multiple detection methods', () => {
    it('should return true if any detection method is positive', () => {
      // Test with navigator.standalone
      ;(window.navigator as any).standalone = true
      const { result: result1 } = renderHook(() => usePWA())
      expect(result1.current.isStandalone).toBe(true)
      
      // Test with matchMedia
      ;(window.navigator as any).standalone = false
      mockMediaQuery.matches = true
      const { result: result2 } = renderHook(() => usePWA())
      expect(result2.current.isStandalone).toBe(true)
      
      // Test with referrer
      mockMediaQuery.matches = false
      Object.defineProperty(document, 'referrer', {
        value: 'android-app://test',
        writable: true,
      })
      const { result: result3 } = renderHook(() => usePWA())
      expect(result3.current.isStandalone).toBe(true)
    })
    
    it('should return false if all detection methods are negative', () => {
      mockMediaQuery.matches = false
      ;(window.navigator as any).standalone = false
      Object.defineProperty(document, 'referrer', {
        value: 'https://example.com',
        writable: true,
      })
      
      const { result } = renderHook(() => usePWA())
      expect(result.current.isStandalone).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined navigator.standalone', () => {
      delete (window.navigator as any).standalone
      
      const { result } = renderHook(() => usePWA())
      
      // Should not throw and should work with other detection methods
      expect(result.current.isStandalone).toBe(false)
    })

    it('should handle matchMedia not supported', () => {
      window.matchMedia = undefined as any
      
      // Should not throw an error
      expect(() => {
        renderHook(() => usePWA())
      }).not.toThrow()
    })
  })
})
