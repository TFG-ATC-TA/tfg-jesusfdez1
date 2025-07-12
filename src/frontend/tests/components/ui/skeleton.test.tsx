/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton Component', () => {
  it('should render skeleton element', () => {
    render(<Skeleton data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
  })
  it('should have default skeleton classes', () => {
    render(<Skeleton data-testid="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-primary/10')
  })

  it('should apply custom className', () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('custom-skeleton')
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-primary/10')
  })

  it('should forward props to div element', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading content" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content')
  })

  it('should handle style prop', () => {
    render(
      <Skeleton 
        data-testid="skeleton" 
        style={{ width: '200px', height: '20px' }} 
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '200px', height: '20px' })
  })

  it('should support common skeleton sizes with custom classes', () => {
    const { rerender } = render(
      <Skeleton className="h-4 w-full" data-testid="skeleton" />
    )
    
    let skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('h-4', 'w-full')
    
    rerender(<Skeleton className="h-8 w-8 rounded-full" data-testid="skeleton" />)
    skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('h-8', 'w-8', 'rounded-full')
  })

  describe('Accessibility', () => {
    it('should be accessible as div element', () => {
      render(<Skeleton data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton.tagName).toBe('DIV')
    })

    it('should support aria-label for better accessibility', () => {
      render(<Skeleton aria-label="Loading user profile" />)
      
      const skeleton = screen.getByLabelText('Loading user profile')
      expect(skeleton).toBeInTheDocument()
    })

    it('should support aria-hidden for decorative skeletons', () => {
      render(<Skeleton aria-hidden="true" data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Common use cases', () => {
    it('should render text skeleton', () => {
      render(<Skeleton className="h-4 w-[250px]" data-testid="text-skeleton" />)
      
      const skeleton = screen.getByTestId('text-skeleton')
      expect(skeleton).toHaveClass('h-4', 'w-[250px]')
    })

    it('should render avatar skeleton', () => {
      render(<Skeleton className="h-12 w-12 rounded-full" data-testid="avatar-skeleton" />)
      
      const skeleton = screen.getByTestId('avatar-skeleton')
      expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full')
    })

    it('should render button skeleton', () => {
      render(<Skeleton className="h-10 w-20" data-testid="button-skeleton" />)
      
      const skeleton = screen.getByTestId('button-skeleton')
      expect(skeleton).toHaveClass('h-10', 'w-20')
    })
  })

  describe('Animation', () => {
    it('should have pulse animation class', () => {
      render(<Skeleton data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })
  })
})
