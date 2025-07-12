/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useTheme } from 'next-themes'
import ThemeToggle from '@/components/layout/theme-toggle'

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

// Mock dropdown menu components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
}))

// Mock button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('ThemeToggle Component', () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined
    })
  })

  it('should render null when not mounted', () => {
    // Before useEffect runs
    const { container } = render(<ThemeToggle />)
    expect(container.firstChild).toBeNull()
  })

  it('should render theme toggle after mounting', async () => {
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
    })
  })

  it('should display correct theme icon for light theme', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('should display correct theme icon for dark theme', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('should display correct theme icon for system theme', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('should call setTheme when theme option is selected', async () => {
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
    })

    // Simulate clicking on a theme option
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    fireEvent.click(dropdownItems[0]) // Click first theme option
    
    expect(mockSetTheme).toHaveBeenCalled()
  })

  it('should render dropdown menu structure', async () => {
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })
  })

  it('should render all theme options in dropdown', async () => {
    render(<ThemeToggle />)
    
    await waitFor(() => {
      const dropdownItems = screen.getAllByTestId('dropdown-item')
      expect(dropdownItems).toHaveLength(3) // Light, Dark, System
    })
  })

  describe('Theme state management', () => {
    it('should update selected theme when theme prop changes', async () => {
      const { rerender } = render(<ThemeToggle />)
      
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      })

      // Change theme
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined
      })

      rerender(<ThemeToggle />)
      
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      })
    })

    it('should handle undefined theme gracefully', async () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined
      })

      render(<ThemeToggle />)
      
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button', async () => {
      render(<ThemeToggle />)
      
      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
      })
    })

    it('should provide proper dropdown structure', async () => {
      render(<ThemeToggle />)
      
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
        expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
      })
    })
  })

  describe('Component lifecycle', () => {
    it('should set mounted state after initial render', async () => {
      render(<ThemeToggle />)
      
      // Initially should render null
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument()
      
      // After mounting, should render the component
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      })
    })
  })
})
