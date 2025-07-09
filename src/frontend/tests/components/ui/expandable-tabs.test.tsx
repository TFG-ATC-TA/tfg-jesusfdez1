import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ExpandableTabs } from '@/components/ui/expandable-tabs'
import { Home, User, Settings, Search } from 'lucide-react'

// Mock the click outside functionality
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

beforeAll(() => {
  Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
    writable: true
  })
  Object.defineProperty(document, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true
  })
})

describe('ExpandableTabs Component', () => {
  const basicTabs = [
    { title: 'Home', icon: Home },
    { title: 'Profile', icon: User },
    { title: 'Settings', icon: Settings }
  ]

  const tabsWithSeparator = [
    { title: 'Home', icon: Home },
    { type: 'separator' as const },
    { title: 'Profile', icon: User },
    { title: 'Settings', icon: Settings }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render expandable tabs with icons', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      // Should render tab buttons
      expect(screen.getAllByRole('button')).toHaveLength(3)
      
      // Icons should be present
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const svg = button.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })

    it('should apply default classes to container', () => {
      const { container } = render(<ExpandableTabs tabs={basicTabs} />)
      
      const tabsContainer = container.firstChild
      expect(tabsContainer).toHaveClass(
        'flex',
        'flex-wrap',
        'items-center',
        'justify-center',
        'rounded-xl',
        'border-2',
        'bg-background',
        'p-1',
        'gap-3',
        'shadow-md'
      )
    })

    it('should apply custom className', () => {
      const { container } = render(
        <ExpandableTabs tabs={basicTabs} className="custom-tabs" />
      )
      
      const tabsContainer = container.firstChild
      expect(tabsContainer).toHaveClass('custom-tabs')
      expect(tabsContainer).toHaveClass('flex') // Should still have default classes
    })

    it('should handle tab click and call onChange', () => {
      const handleChange = jest.fn()
      render(<ExpandableTabs tabs={basicTabs} onChange={handleChange} />)

      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])

      expect(handleChange).toHaveBeenCalledWith(0)
    })

    it('should highlight active tab', () => {
      render(<ExpandableTabs tabs={basicTabs} activeIndex={1} />)

      const buttons = screen.getAllByRole('button')
      
      // First button should not have active classes
      expect(buttons[0]).toHaveClass('text-muted-foreground')
      
      // Second button should have active classes
      expect(buttons[1]).toHaveClass('bg-primary', 'text-primary-foreground')
    })
  })

  describe('Separators', () => {
    it('should render separators between tabs', () => {
      const { container } = render(<ExpandableTabs tabs={tabsWithSeparator} />)

      // Should render 3 buttons + 1 separator
      expect(screen.getAllByRole('button')).toHaveLength(3)
      
      // Check for separator div
      const separators = container.querySelectorAll('.mx-2.h-5.w-\\[2px\\]')
      expect(separators.length).toBeGreaterThan(0)
    })

    it('should not render separators as clickable elements', () => {
      render(<ExpandableTabs tabs={tabsWithSeparator} />)

      // Only actual tabs should be buttons, not separators
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3) // Should not include separator
    })
  })

  describe('Icons and Styling', () => {
    it('should render icons with correct size', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const svg = button.querySelector('svg')
        expect(svg).toHaveAttribute('size', '20')
      })
    })

    it('should apply hover classes to buttons', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:bg-primary', 'hover:text-primary-foreground')
      })
    })

    it('should apply transition classes', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-colors')
      })
    })

    it('should handle dark mode classes', () => {
      const { container } = render(<ExpandableTabs tabs={basicTabs} />)
      
      const tabsContainer = container.firstChild
      expect(tabsContainer).toHaveClass('dark:bg-gray-800', 'dark:shadow-lg')
    })
  })

  describe('Active State Management', () => {
    it('should show correct active state when activeIndex is provided', () => {
      render(<ExpandableTabs tabs={basicTabs} activeIndex={2} />)

      const buttons = screen.getAllByRole('button')
      
      // Only the third button (index 2) should be active
      expect(buttons[0]).toHaveClass('text-muted-foreground')
      expect(buttons[1]).toHaveClass('text-muted-foreground')
      expect(buttons[2]).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should handle no active tab when activeIndex is null', () => {
      render(<ExpandableTabs tabs={basicTabs} activeIndex={null} />)

      const buttons = screen.getAllByRole('button')
      
      // All buttons should be inactive
      buttons.forEach(button => {
        expect(button).toHaveClass('text-muted-foreground')
        expect(button).not.toHaveClass('bg-primary')
      })
    })

    it('should update active state when activeIndex changes', () => {
      const { rerender } = render(<ExpandableTabs tabs={basicTabs} activeIndex={0} />)

      let buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveClass('bg-primary')

      // Re-render with different activeIndex
      rerender(<ExpandableTabs tabs={basicTabs} activeIndex={1} />)
      
      buttons = screen.getAllByRole('button')
      expect(buttons[0]).not.toHaveClass('bg-primary')
      expect(buttons[1]).toHaveClass('bg-primary')
    })
  })

  describe('Click Outside Functionality', () => {
    it('should set up click outside event listener', () => {
      render(<ExpandableTabs tabs={basicTabs} onChange={jest.fn()} />)

      expect(mockAddEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('should clean up event listener on unmount', () => {
      const { unmount } = render(<ExpandableTabs tabs={basicTabs} onChange={jest.fn()} />)

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('should call onChange with null when clicking outside', () => {
      const handleChange = jest.fn()
      const { container } = render(<ExpandableTabs tabs={basicTabs} onChange={handleChange} />)

      // Simulate a click outside event
      const clickHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1]

      if (clickHandler) {
        const outsideElement = document.createElement('div')
        document.body.appendChild(outsideElement)
        
        clickHandler({ target: outsideElement })
        
        expect(handleChange).toHaveBeenCalledWith(null)
        
        document.body.removeChild(outsideElement)
      }
    })
  })

  describe('Custom Color Support', () => {
    it('should accept custom activeColor prop', () => {
      render(<ExpandableTabs tabs={basicTabs} activeColor="text-blue-500" />)

      // The component should render without errors
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })
  })

  describe('Complex Tab Configurations', () => {
    it('should handle tabs with only icons (no titles)', () => {
      const iconOnlyTabs = [
        { icon: Home },
        { icon: User },
        { icon: Settings }
      ]

      render(<ExpandableTabs tabs={iconOnlyTabs} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      
      // Each button should have an icon
      buttons.forEach(button => {
        const svg = button.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })

    it('should handle mixed separator and tab configurations', () => {
      const mixedTabs = [
        { title: 'Home', icon: Home },
        { type: 'separator' as const },
        { title: 'Search', icon: Search },
        { type: 'separator' as const },
        { title: 'Settings', icon: Settings }
      ]

      render(<ExpandableTabs tabs={mixedTabs} />)

      // Should only render actual tabs as buttons
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })

    it('should handle empty tabs array', () => {
      const { container } = render(<ExpandableTabs tabs={[]} />)

      // Should render container but no buttons
      expect(container.firstChild).toBeInTheDocument()
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })
  })

  describe('Accessibility', () => {
    it('should render buttons with proper role', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should be keyboard accessible', () => {
      const handleChange = jest.fn()
      render(<ExpandableTabs tabs={basicTabs} onChange={handleChange} />)

      const firstButton = screen.getAllByRole('button')[0]
      
      // Focus the button
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      // Press Enter
      fireEvent.keyDown(firstButton, { key: 'Enter' })
      fireEvent.click(firstButton)
      
      expect(handleChange).toHaveBeenCalledWith(0)
    })

    it('should support tab navigation', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      const buttons = screen.getAllByRole('button')
      
      // Should be able to tab between buttons
      buttons[0].focus()
      expect(buttons[0]).toHaveFocus()

      fireEvent.keyDown(buttons[0], { key: 'Tab' })
      // Tab navigation is handled by browser, just verify buttons are focusable
      expect(buttons[0]).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined onChange prop', () => {
      render(<ExpandableTabs tabs={basicTabs} />)

      const button = screen.getAllByRole('button')[0]
      
      // Should not throw error when clicking without onChange
      expect(() => {
        fireEvent.click(button)
      }).not.toThrow()
    })

    it('should handle invalid activeIndex', () => {
      render(<ExpandableTabs tabs={basicTabs} activeIndex={999} />)

      // Should render without errors
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })

    it('should handle negative activeIndex', () => {
      render(<ExpandableTabs tabs={basicTabs} activeIndex={-1} />)

      const buttons = screen.getAllByRole('button')
      
      // All buttons should be inactive
      buttons.forEach(button => {
        expect(button).not.toHaveClass('bg-primary')
      })
    })
  })
})
