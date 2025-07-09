import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs Components', () => {
  describe('Basic Tabs Functionality', () => {
    it('should render tabs with triggers and content', () => {
      render(
        <Tabs defaultValue="tab1" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content for tab 1</TabsContent>
          <TabsContent value="tab2">Content for tab 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('tabs')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument()
      expect(screen.getByText('Content for tab 1')).toBeInTheDocument()
    })

    it('should show default tab content initially', () => {
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">First Tab</TabsTrigger>
            <TabsTrigger value="tab2">Second Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">First content</TabsContent>
          <TabsContent value="tab2">Second content</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Second content')).toBeInTheDocument()
      expect(screen.queryByText('First content')).not.toBeInTheDocument()
    })

    it('should switch content when different tab is clicked', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab One</TabsTrigger>
            <TabsTrigger value="tab2">Tab Two</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content One</TabsContent>
          <TabsContent value="tab2">Content Two</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByRole('tab', { name: /tab two/i })
      
      // Initially show tab 1 content
      expect(screen.getByText('Content One')).toBeInTheDocument()
      expect(screen.queryByText('Content Two')).not.toBeInTheDocument()

      // Click tab 2
      fireEvent.click(tab2)
      
      // Should now show tab 2 content
      expect(screen.getByText('Content Two')).toBeInTheDocument()
      expect(screen.queryByText('Content One')).not.toBeInTheDocument()
    })
  })

  describe('TabsList', () => {
    it('should render tabs list with proper role', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tabsList = screen.getByTestId('tabs-list')
      expect(tabsList).toBeInTheDocument()
      expect(tabsList).toHaveAttribute('role', 'tablist')
    })

    it('should apply default list classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tabsList = screen.getByTestId('tabs-list')
      expect(tabsList).toHaveClass(
        'inline-flex',
        'h-9',
        'items-center',
        'justify-center',
        'rounded-lg',
        'bg-muted',
        'p-1',
        'text-muted-foreground'
      )
    })

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-tabs-list" data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tabsList = screen.getByTestId('tabs-list')
      expect(tabsList).toHaveClass('custom-tabs-list')
      expect(tabsList).toHaveClass('inline-flex') // Should still have default classes
    })
  })

  describe('TabsTrigger', () => {
    it('should render tab trigger as button with proper attributes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">First Tab</TabsTrigger>
            <TabsTrigger value="tab2">Second Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const firstTab = screen.getByRole('tab', { name: /first tab/i })
      const secondTab = screen.getByRole('tab', { name: /second tab/i })

      expect(firstTab).toHaveAttribute('type', 'button')
      expect(firstTab).toHaveAttribute('aria-selected', 'true')
      expect(secondTab).toHaveAttribute('aria-selected', 'false')
    })

    it('should apply default trigger classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="tab-trigger">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const trigger = screen.getByTestId('tab-trigger')
      expect(trigger).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'whitespace-nowrap',
        'rounded-md',
        'px-3',
        'py-1',
        'text-sm',
        'font-medium'
      )
    })

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger" data-testid="tab-trigger">
              Tab
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const trigger = screen.getByTestId('tab-trigger')
      expect(trigger).toHaveClass('custom-trigger')
      expect(trigger).toHaveClass('inline-flex') // Should still have default classes
    })

    it('should be disabled when disabled prop is true', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Active Tab</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Disabled Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const disabledTab = screen.getByRole('tab', { name: /disabled tab/i })
      expect(disabledTab).toBeDisabled()
      expect(disabledTab).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('TabsContent', () => {
    it('should render content with proper role and attributes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="tab-content">
            Content for tab 1
          </TabsContent>
        </Tabs>
      )

      const content = screen.getByTestId('tab-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveAttribute('role', 'tabpanel')
    })

    it('should apply default content classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="tab-content">
            Content
          </TabsContent>
        </Tabs>
      )

      const content = screen.getByTestId('tab-content')
      expect(content).toHaveClass(
        'mt-2',
        'ring-offset-background',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      )
    })

    it('should apply custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content" data-testid="tab-content">
            Content
          </TabsContent>
        </Tabs>
      )

      const content = screen.getByTestId('tab-content')
      expect(content).toHaveClass('custom-content')
      expect(content).toHaveClass('mt-2') // Should still have default classes
    })

    it('should handle complex content structure', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Complex Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div className="content-wrapper">
              <h3>Section Title</h3>
              <p>Paragraph content</p>
              <button>Action Button</button>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('Paragraph content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
      expect(screen.getByText('List item 1')).toBeInTheDocument()
    })
  })

  describe('Multiple Tabs Interaction', () => {
    it('should handle multiple tabs correctly', () => {
      render(
        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          <TabsContent value="home">Welcome to the home page</TabsContent>
          <TabsContent value="about">Learn about us</TabsContent>
          <TabsContent value="contact">Get in touch</TabsContent>
        </Tabs>
      )

      // Initially show home content
      expect(screen.getByText('Welcome to the home page')).toBeInTheDocument()

      // Click about tab
      fireEvent.click(screen.getByRole('tab', { name: /about/i }))
      expect(screen.getByText('Learn about us')).toBeInTheDocument()
      expect(screen.queryByText('Welcome to the home page')).not.toBeInTheDocument()

      // Click contact tab
      fireEvent.click(screen.getByRole('tab', { name: /contact/i }))
      expect(screen.getByText('Get in touch')).toBeInTheDocument()
      expect(screen.queryByText('Learn about us')).not.toBeInTheDocument()
    })

    it('should update aria-selected attributes correctly', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: /tab 1/i })
      const tab2 = screen.getByRole('tab', { name: /tab 2/i })

      // Initially tab1 is selected
      expect(tab1).toHaveAttribute('aria-selected', 'true')
      expect(tab2).toHaveAttribute('aria-selected', 'false')

      // Click tab2
      fireEvent.click(tab2)

      // Now tab2 is selected
      expect(tab1).toHaveAttribute('aria-selected', 'false')
      expect(tab2).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation between tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )

      const tab1 = screen.getByRole('tab', { name: /tab 1/i })
      const tab2 = screen.getByRole('tab', { name: /tab 2/i })

      // Focus first tab
      tab1.focus()
      expect(tab1).toHaveFocus()

      // Press Arrow Right to move to next tab
      fireEvent.keyDown(tab1, { key: 'ArrowRight' })
      expect(tab2).toHaveFocus()

      // Press Enter to activate tab
      fireEvent.keyDown(tab2, { key: 'Enter' })
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA relationships', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Accessible Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Accessible Content</TabsContent>
        </Tabs>
      )

      const tab = screen.getByRole('tab', { name: /accessible tab/i })
      const content = screen.getByRole('tabpanel')
      
      const panelId = tab.getAttribute('aria-controls')
      expect(panelId).toBeTruthy()
      expect(content).toHaveAttribute('id', panelId)
      expect(content).toHaveAttribute('aria-labelledby', tab.id)
    })

    it('should be focusable and keyboard accessible', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Focusable Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tab = screen.getByRole('tab', { name: /focusable tab/i })
      
      // Should be focusable
      tab.focus()
      expect(tab).toHaveFocus()

      // Should be activatable with Space key
      fireEvent.keyDown(tab, { key: ' ' })
      expect(tab).toHaveAttribute('aria-selected', 'true')
    })
  })
})
