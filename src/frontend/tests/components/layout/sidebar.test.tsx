/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import { useSidebar } from '@/hooks/useSidebar'
import { UserProvider } from '@/hooks/useUserContext'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))
jest.mock('@/hooks/useSidebar', () => ({
  useSidebar: jest.fn(),
}))
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseSidebar = useSidebar as jest.MockedFunction<typeof useSidebar>

describe('Sidebar Component', () => {
  const mockToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          role: 'Ganadero'
        },
        expires: '2025-12-31'
      },
      status: 'authenticated',
      update: jest.fn()
    })
    
    mockUsePathname.mockReturnValue('/')
    
    mockUseSidebar.mockReturnValue({
      isMinimized: false,
      toggle: mockToggle
    })
  })

  it('should render sidebar with logo', () => {
    render(<Sidebar />)
    
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveClass('relative', 'hidden', 'h-screen', 'flex-none', 'border-r')
    
    const logo = screen.getByAltText('LactoKeeper Logo')
    expect(logo).toBeInTheDocument()
  })

  it('should show full logo text when not minimized', () => {
    mockUseSidebar.mockReturnValue({
      isMinimized: false,
      toggle: mockToggle
    })
    
    render(<Sidebar />)
    
    expect(screen.getByText('LACTO')).toBeInTheDocument()
    expect(screen.getByText('KEEPER')).toBeInTheDocument()
  })

  it('should hide logo text when minimized', () => {
    mockUseSidebar.mockReturnValue({
      isMinimized: true,
      toggle: mockToggle
    })
    
    render(<Sidebar />)
    
    expect(screen.queryByText('LACTO')).not.toBeInTheDocument()
    expect(screen.queryByText('KEEPER')).not.toBeInTheDocument()
  })

  it('should apply correct width classes based on minimized state', () => {
    const { rerender } = render(<Sidebar />)
    
    let sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass('w-64')
    expect(sidebar).not.toHaveClass('w-20')
    
    // Test minimized state
    mockUseSidebar.mockReturnValue({
      isMinimized: true,
      toggle: mockToggle
    })
    
    rerender(<Sidebar />)
    
    sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass('w-20')
    expect(sidebar).not.toHaveClass('w-64')
  })

  it('should call toggle function when toggle button is clicked', () => {
    render(<Sidebar />)
    
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)
    
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className when provided', () => {
    const customClass = 'custom-sidebar-class'
    render(<Sidebar className={customClass} />)
    
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass(customClass)
  })

  it('should render logo link that points to home', () => {
    render(<Sidebar />)
    
    const logoLink = screen.getByRole('link')
    expect(logoLink).toHaveAttribute('href', '/')
  })

  describe('Responsive behavior', () => {
    it('should have mobile-hidden classes', () => {
      render(<Sidebar />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('hidden', 'md:flex')
    })
  })

  describe('Visual styling', () => {
    it('should have proper transition classes', () => {
      render(<Sidebar />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
    })

    it('should have proper layout classes', () => {
      render(<Sidebar />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('flex-none', 'border-r', 'bg-card', 'md:flex-col')
    })
  })

  describe('Logo section layout', () => {
    it('should center logo when minimized', () => {
      mockUseSidebar.mockReturnValue({
        isMinimized: true,
        toggle: mockToggle
      })
      
      render(<Sidebar />)
      
      const logoContainer = screen.getByRole('link')
      expect(logoContainer).toHaveClass('w-full')
    })

    it('should use normal layout when not minimized', () => {
      mockUseSidebar.mockReturnValue({
        isMinimized: false,
        toggle: mockToggle
      })
      
      render(<Sidebar />)
      
      const logoContainer = screen.getByRole('link')
      expect(logoContainer).not.toHaveClass('w-full')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Sidebar />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toBeInTheDocument()
    })

    it('should have accessible toggle button', () => {
      render(<Sidebar />)
      
      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toBeInTheDocument()
    })

    it('should have accessible logo image', () => {
      render(<Sidebar />)
      
      const logo = screen.getByAltText('LactoKeeper Logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('alt', 'LactoKeeper Logo')
    })
  })
})
