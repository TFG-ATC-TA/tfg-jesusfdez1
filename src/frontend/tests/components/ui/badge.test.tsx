/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {  it('should render badge with default variant', () => {
    render(<Badge>Default Badge</Badge>)

    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md')
  })

  it('should render badge with default variant class', () => {
    render(<Badge>Default Badge</Badge>)
    
    const badge = screen.getByText('Default Badge')
    expect(badge).toHaveClass('bg-primary')
  })

  it('should render badge with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>)
    
    const badge = screen.getByText('Secondary Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-secondary')
  })

  it('should render badge with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>)
    
    const badge = screen.getByText('Destructive Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-destructive')
  })

  it('should render badge with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    
    const badge = screen.getByText('Outline Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('border')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('should forward props to div element', () => {
    render(<Badge data-testid="test-badge">Test Badge</Badge>)
    
    const badge = screen.getByTestId('test-badge')
    expect(badge).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    render(<Badge data-testid="empty-badge"></Badge>)
    
    const badge = screen.getByTestId('empty-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toBeEmptyDOMElement()
  })

  describe('Badge variants', () => {
    const variants = [
      { variant: 'default' as const, expectedClass: 'bg-primary' },
      { variant: 'secondary' as const, expectedClass: 'bg-secondary' },
      { variant: 'destructive' as const, expectedClass: 'bg-destructive' },
      { variant: 'outline' as const, expectedClass: 'border' },
    ]

    variants.forEach(({ variant, expectedClass }) => {
      it(`should apply correct classes for ${variant} variant`, () => {
        render(<Badge variant={variant}>{variant} Badge</Badge>)
        
        const badge = screen.getByText(`${variant} Badge`)
        expect(badge).toHaveClass(expectedClass)
      })
    })
  })

  describe('Accessibility', () => {
    it('should be accessible as div element', () => {
      render(<Badge data-testid="accessible-badge">Accessible Badge</Badge>)
      
      const badge = screen.getByTestId('accessible-badge')
      expect(badge).toBeInTheDocument()
      expect(badge.tagName).toBe('DIV')
    })

    it('should support aria-label', () => {
      render(<Badge aria-label="Status badge">Status</Badge>)
      
      const badge = screen.getByLabelText('Status badge')
      expect(badge).toBeInTheDocument()
    })
  })
})
