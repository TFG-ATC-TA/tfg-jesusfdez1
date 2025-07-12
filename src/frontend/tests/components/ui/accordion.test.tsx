import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

describe('Accordion Components', () => {
  describe('AccordionItem', () => {
    it('should render accordion item with value', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" data-testid="accordion-item">
            <AccordionTrigger>Test Trigger</AccordionTrigger>
            <AccordionContent>Test Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const item = screen.getByTestId('accordion-item')
      expect(item).toBeInTheDocument()
      expect(item).toHaveAttribute('data-state', 'closed')
    })

    it('should apply custom className', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-item" data-testid="accordion-item">
            <AccordionTrigger>Test Trigger</AccordionTrigger>
            <AccordionContent>Test Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const item = screen.getByTestId('accordion-item')
      expect(item).toHaveClass('custom-item')
      expect(item).toHaveClass('border-b') // Default class
    })
  })

  describe('AccordionTrigger', () => {
    it('should render trigger button with text', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Click me to expand</AccordionTrigger>
            <AccordionContent>Hidden content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /click me to expand/i })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('type', 'button')
    })

    it('should toggle content when clicked', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle Content</AccordionTrigger>
            <AccordionContent>This is the content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /toggle content/i })
      const content = screen.getByText('This is the content')

      // Initially closed
      expect(content).not.toBeVisible()

      // Click to open
      fireEvent.click(trigger)
      expect(content).toBeVisible()

      // Click to close
      fireEvent.click(trigger)
      expect(content).not.toBeVisible()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Accessible Trigger</AccordionTrigger>
            <AccordionContent>Content here</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /accessible trigger/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-controls')
    })

    it('should apply custom className', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="custom-trigger">Custom Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /custom trigger/i })
      expect(trigger).toHaveClass('custom-trigger')
    })

    it('should render chevron icon', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>With Icon</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /with icon/i })
      const icon = trigger.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('AccordionContent', () => {
    it('should render content when accordion is open', () => {
      render(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Open Item</AccordionTrigger>
            <AccordionContent>This content should be visible</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const content = screen.getByText('This content should be visible')
      expect(content).toBeInTheDocument()
      expect(content).toBeVisible()
    })

    it('should apply custom className', () => {
      render(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Open Item</AccordionTrigger>
            <AccordionContent className="custom-content">Custom styled content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const content = screen.getByText('Custom styled content')
      expect(content).toHaveClass('custom-content')
    })

    it('should handle complex content', () => {
      render(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Complex Content</AccordionTrigger>
            <AccordionContent>
              <div>
                <h3>Nested heading</h3>
                <p>Paragraph with text</p>
                <button>Action button</button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      expect(screen.getByText('Nested heading')).toBeInTheDocument()
      expect(screen.getByText('Paragraph with text')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
    })
  })

  describe('Multiple Accordion Items', () => {
    it('should render multiple items', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>First Item</AccordionTrigger>
            <AccordionContent>First content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second Item</AccordionTrigger>
            <AccordionContent>Second content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Third Item</AccordionTrigger>
            <AccordionContent>Third content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      expect(screen.getByText('First Item')).toBeInTheDocument()
      expect(screen.getByText('Second Item')).toBeInTheDocument()
      expect(screen.getByText('Third Item')).toBeInTheDocument()
    })

    it('should allow only one item open at a time (single mode)', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>First Item</AccordionTrigger>
            <AccordionContent>First content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second Item</AccordionTrigger>
            <AccordionContent>Second content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const firstTrigger = screen.getByText('First Item')
      const secondTrigger = screen.getByText('Second Item')
      const firstContent = screen.getByText('First content')
      const secondContent = screen.getByText('Second content')

      // Open first item
      fireEvent.click(firstTrigger)
      expect(firstContent).toBeVisible()
      expect(secondContent).not.toBeVisible()

      // Open second item - should close first
      fireEvent.click(secondTrigger)
      expect(firstContent).not.toBeVisible()
      expect(secondContent).toBeVisible()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>First Item</AccordionTrigger>
            <AccordionContent>First content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second Item</AccordionTrigger>
            <AccordionContent>Second content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const firstTrigger = screen.getByRole('button', { name: /first item/i })
      
      // Focus first trigger
      firstTrigger.focus()
      expect(firstTrigger).toHaveFocus()

      // Press Enter to expand
      fireEvent.keyDown(firstTrigger, { key: 'Enter' })
      expect(screen.getByText('First content')).toBeVisible()

      // Press Space to collapse
      fireEvent.keyDown(firstTrigger, { key: ' ' })
      expect(screen.getByText('First content')).not.toBeVisible()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA relationships', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Accessible Item</AccordionTrigger>
            <AccordionContent>Accessible content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /accessible item/i })
      const contentId = trigger.getAttribute('aria-controls')
      
      expect(contentId).toBeTruthy()
      expect(document.getElementById(contentId!)).toBeInTheDocument()
    })

    it('should update aria-expanded when toggling', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle Item</AccordionTrigger>
            <AccordionContent>Content to toggle</AccordionContent>
          </AccordionItem>
        </Accordion>
      )

      const trigger = screen.getByRole('button', { name: /toggle item/i })
      
      // Initially collapsed
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // Click to expand
      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // Click to collapse
      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
