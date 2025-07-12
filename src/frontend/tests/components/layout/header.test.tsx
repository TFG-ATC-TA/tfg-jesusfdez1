/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/header'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render header element', () => {
    mockUsePathname.mockReturnValue('/')
    
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('sticky', 'inset-x-0', 'top-0', 'w-full')
  })

  it('should not show breadcrumbs on home page', () => {
    mockUsePathname.mockReturnValue('/')
    
    render(<Header />)
    
    const homeLink = screen.queryByRole('link')
    expect(homeLink).not.toBeInTheDocument()
  })
  it('should show home link when not on home page', () => {
    mockUsePathname.mockReturnValue('/users')
    
    render(<Header />)

    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
    expect(homeLink).toHaveClass('hover:text-primary')
  })

  it('should translate path segments correctly', () => {
    mockUsePathname.mockReturnValue('/users')
    
    render(<Header />)
    
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
  })

  it('should handle multiple path segments', () => {
    mockUsePathname.mockReturnValue('/farms/123/devices')
    
    render(<Header />)
    
    expect(screen.getByText('Granjas')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.getByText('Dispositivos')).toBeInTheDocument()
  })

  it('should handle unknown path segments', () => {
    mockUsePathname.mockReturnValue('/unknown-path')
    
    render(<Header />)
    
    expect(screen.getByText('unknown-path')).toBeInTheDocument()
  })

  it('should handle empty or null pathname', () => {
    mockUsePathname.mockReturnValue('/')
    
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('should render navigation with correct structure', () => {
    mockUsePathname.mockReturnValue('/users')
    
    render(<Header />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass('flex', 'items-center', 'py-2', 'sm:px-6', 'sm:py-2')
  })

  describe('Path translations', () => {
    const testCases = [
      { path: '/users', expected: 'Usuarios' },
      { path: '/farms', expected: 'Granjas' },
      { path: '/devices', expected: 'Dispositivos' },
      { path: '/notifications', expected: 'Notificaciones' },
    ]

    testCases.forEach(({ path, expected }) => {
      it(`should translate ${path} to ${expected}`, () => {
        mockUsePathname.mockReturnValue(path)
        
        render(<Header />)
        
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      mockUsePathname.mockReturnValue('/users')
      
      render(<Header />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have home icon that is accessible', () => {
      mockUsePathname.mockReturnValue('/users')
      
      render(<Header />)
      
      const homeLink = screen.getByRole('link', { name: /home/i })
      const homeIcon = homeLink.querySelector('svg')
      expect(homeIcon).toBeInTheDocument()
    })
  })
})
