import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply default card classes', () => {
      render(
        <Card data-testid="card">
          Content
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'text-card-foreground', 'shadow')
    })

    it('should apply custom className', () => {
      render(
        <Card className="custom-card" data-testid="card">
          Content
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
      expect(card).toHaveClass('rounded-xl') // Should still have default classes
    })

    it('should forward additional props', () => {
      render(
        <Card id="custom-id" role="region" aria-label="Custom card" data-testid="card">
          Content
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'custom-id')
      expect(card).toHaveAttribute('role', 'region')
      expect(card).toHaveAttribute('aria-label', 'Custom card')
    })
  })

  describe('CardHeader', () => {
    it('should render card header with children', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">
            <h2>Header content</h2>
          </CardHeader>
        </Card>
      )

      const header = screen.getByTestId('card-header')
      expect(header).toBeInTheDocument()
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should apply default header classes', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">
            Header
          </CardHeader>
        </Card>
      )

      const header = screen.getByTestId('card-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header" data-testid="card-header">
            Header
          </CardHeader>
        </Card>
      )

      const header = screen.getByTestId('card-header')
      expect(header).toHaveClass('custom-header')
      expect(header).toHaveClass('flex') // Should still have default classes
    })
  })

  describe('CardTitle', () => {
    it('should render card title with text', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>My Card Title</CardTitle>
          </CardHeader>
        </Card>
      )

      const title = screen.getByText('My Card Title')
      expect(title).toBeInTheDocument()
    })

    it('should apply default title classes', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title">Title</CardTitle>
          </CardHeader>
        </Card>
      )

      const title = screen.getByTestId('card-title')
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight')
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title" data-testid="card-title">Title</CardTitle>
          </CardHeader>
        </Card>
      )

      const title = screen.getByTestId('card-title')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('font-semibold') // Should still have default classes
    })

    it('should render as h3 by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Default Title</CardTitle>
          </CardHeader>
        </Card>
      )

      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Default Title')
    })
  })

  describe('CardDescription', () => {
    it('should render card description with text', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a card description</CardDescription>
          </CardHeader>
        </Card>
      )

      const description = screen.getByText('This is a card description')
      expect(description).toBeInTheDocument()
    })

    it('should apply default description classes', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="card-description">Description</CardDescription>
          </CardHeader>
        </Card>
      )

      const description = screen.getByTestId('card-description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-description" data-testid="card-description">
              Description
            </CardDescription>
          </CardHeader>
        </Card>
      )

      const description = screen.getByTestId('card-description')
      expect(description).toHaveClass('custom-description')
      expect(description).toHaveClass('text-sm') // Should still have default classes
    })
  })

  describe('CardContent', () => {
    it('should render card content with children', () => {
      render(
        <Card>
          <CardContent data-testid="card-content">
            <p>This is the main content of the card</p>
          </CardContent>
        </Card>
      )

      const content = screen.getByTestId('card-content')
      expect(content).toBeInTheDocument()
      expect(screen.getByText('This is the main content of the card')).toBeInTheDocument()
    })

    it('should apply default content classes', () => {
      render(
        <Card>
          <CardContent data-testid="card-content">
            Content
          </CardContent>
        </Card>
      )

      const content = screen.getByTestId('card-content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content" data-testid="card-content">
            Content
          </CardContent>
        </Card>
      )

      const content = screen.getByTestId('card-content')
      expect(content).toHaveClass('custom-content')
      expect(content).toHaveClass('p-6') // Should still have default classes
    })
  })

  describe('CardFooter', () => {
    it('should render card footer with children', () => {
      render(
        <Card>
          <CardFooter data-testid="card-footer">
            <button>Action Button</button>
          </CardFooter>
        </Card>
      )

      const footer = screen.getByTestId('card-footer')
      expect(footer).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
    })

    it('should apply default footer classes', () => {
      render(
        <Card>
          <CardFooter data-testid="card-footer">
            Footer
          </CardFooter>
        </Card>
      )

      const footer = screen.getByTestId('card-footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer" data-testid="card-footer">
            Footer
          </CardFooter>
        </Card>
      )

      const footer = screen.getByTestId('card-footer')
      expect(footer).toHaveClass('custom-footer')
      expect(footer).toHaveClass('flex') // Should still have default classes
    })
  })

  describe('Complete Card Structure', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a full example of a card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content area of the card.</p>
            <p>It can contain multiple paragraphs and elements.</p>
          </CardContent>
          <CardFooter>
            <button>Primary Action</button>
            <button>Secondary Action</button>
          </CardFooter>
        </Card>
      )

      // Check all sections are present
      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByText('Complete Card')).toBeInTheDocument()
      expect(screen.getByText('This is a full example of a card')).toBeInTheDocument()
      expect(screen.getByText('This is the main content area of the card.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /primary action/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /secondary action/i })).toBeInTheDocument()
    })

    it('should handle interactive elements in footer', () => {
      const handleClick = jest.fn()

      render(
        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content with interactive footer</p>
          </CardContent>
          <CardFooter>
            <button onClick={handleClick}>Click Me</button>
          </CardFooter>
        </Card>
      )

      const button = screen.getByRole('button', { name: /click me/i })
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should support nested content structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>User information and stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="user-info">
              <img src="/avatar.jpg" alt="User avatar" />
              <div className="user-details">
                <h4>John Doe</h4>
                <p>Software Developer</p>
              </div>
            </div>
            <div className="user-stats">
              <div>Projects: 15</div>
              <div>Contributions: 234</div>
            </div>
          </CardContent>
          <CardFooter>
            <button>View Profile</button>
            <button>Send Message</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('User Profile')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Projects: 15')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view profile/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible as a generic container', () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card is accessible</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')
    })

    it('should support ARIA labels', () => {
      render(
        <Card aria-label="Product information card">
          <CardHeader>
            <CardTitle>Product Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Product details</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByLabelText('Product information card')
      expect(card).toBeInTheDocument()
    })
  })
})
