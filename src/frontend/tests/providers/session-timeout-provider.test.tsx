import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SessionTimeoutProvider } from '@/providers/session-timeout-provider'
import { useSession } from 'next-auth/react'

// Mock useSession hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  })
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Test component to consume the context
const TestComponent: React.FC = () => {
  return <div>Test Content</div>
}

describe('SessionTimeoutProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear all timers
    jest.clearAllTimers()
    // Use fake timers
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Provider Rendering', () => {
    it('should render children when session is authenticated', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render children when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render children when session is unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Session Timeout Logic', () => {
    it('should setup warning timer when session is authenticated', () => {
      const futureExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: futureExpiry.toISOString()
        },
        status: 'authenticated'
      } as any)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      // Should setup timers for session management
      expect(setTimeout).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle session that expires soon', () => {
      const soonExpiry = new Date(Date.now() + 60000) // 1 minute from now

      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: soonExpiry.toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle already expired session', () => {
      const pastExpiry = new Date(Date.now() - 3600000) // 1 hour ago

      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: pastExpiry.toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Custom Timeout Configuration', () => {
    it('should accept custom warning time', () => {
      const futureExpiry = new Date(Date.now() + 3600000)

      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: futureExpiry.toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider warningMinutes={10}>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should accept custom logout redirect path', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider logoutRedirectPath="/custom-login">
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle session without expires field', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' }
          // No expires field
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle invalid expires date', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: 'invalid-date'
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle null session data', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should cleanup timers on unmount', () => {
      const futureExpiry = new Date(Date.now() + 3600000)

      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: futureExpiry.toISOString()
        },
        status: 'authenticated'
      } as any)

      const { unmount } = render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })
  })

  describe('Session Status Changes', () => {
    it('should update timers when session changes', () => {
      const { rerender } = render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      // First render with no session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any)

      rerender(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      // Then with authenticated session
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      rerender(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle status transition from loading to authenticated', () => {
      const { rerender } = render(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      // Start with loading
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      } as any)

      rerender(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      // Transition to authenticated
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      rerender(
        <SessionTimeoutProvider>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Provider Props Validation', () => {
    it('should handle negative warning minutes', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider warningMinutes={-5}>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle zero warning minutes', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider warningMinutes={0}>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle very large warning minutes', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider warningMinutes={1000}>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Multiple Children', () => {
    it('should render multiple children components', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <div>First Child</div>
          <div>Second Child</div>
          <TestComponent />
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('First Child')).toBeInTheDocument()
      expect(screen.getByText('Second Child')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should handle fragment children', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: new Date(Date.now() + 3600000).toISOString()
        },
        status: 'authenticated'
      } as any)

      render(
        <SessionTimeoutProvider>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </SessionTimeoutProvider>
      )

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument()
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument()
    })
  })
})
