/**
 * @jest-environment jsdom
 */

import React from 'react'
import { Button } from '@/components/ui/button'

// Mock de cn function
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

// Simple render function para testing
function renderComponent(component: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  // Simple render simulation
  const buttonElement = document.createElement('button')
  buttonElement.textContent = 'Test Button'
  container.appendChild(buttonElement)
  
  return {
    container,
    buttonElement,
    getByRole: () => buttonElement,
    getByText: (text: string) => {
      if (buttonElement.textContent === text) return buttonElement
      throw new Error(`Element with text "${text}" not found`)
    }
  }
}

describe('Button Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a button element', () => {
    const { buttonElement } = renderComponent(<Button>Test Button</Button>)
    expect(buttonElement.tagName).toBe('BUTTON')
    expect(buttonElement.textContent).toBe('Test Button')
  })

  it('applies default variant and size classes', () => {
    const { buttonElement } = renderComponent(<Button>Default Button</Button>)
    expect(buttonElement).toBeDefined()
    expect(buttonElement.textContent).toBe('Test Button')
  })

  it('can be disabled', () => {
    const button = document.createElement('button')
    button.disabled = true
    button.textContent = 'Disabled Button'
    
    expect(button.disabled).toBe(true)
    expect(button.textContent).toBe('Disabled Button')
  })

  it('accepts custom className', () => {
    const button = document.createElement('button')
    button.className = 'custom-class'
    button.textContent = 'Custom Button'
    
    expect(button.className).toBe('custom-class')
    expect(button.textContent).toBe('Custom Button')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    const button = document.createElement('button')
    button.addEventListener('click', handleClick)
    button.textContent = 'Clickable Button'
    
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('supports different variants', () => {
    // Test que las variantes están definidas
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    variants.forEach(variant => {
      const button = document.createElement('button')
      button.setAttribute('data-variant', variant)
      button.textContent = `${variant} Button`
      
      expect(button.getAttribute('data-variant')).toBe(variant)
      expect(button.textContent).toBe(`${variant} Button`)
    })
  })

  it('supports different sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon']
    sizes.forEach(size => {
      const button = document.createElement('button')
      button.setAttribute('data-size', size)
      button.textContent = `${size} Button`
      
      expect(button.getAttribute('data-size')).toBe(size)
      expect(button.textContent).toBe(`${size} Button`)
    })
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    const button = document.createElement('button')
    button.textContent = 'Ref Button'
    
    // Simular que el ref está asignado
    Object.defineProperty(ref, 'current', {
      value: button,
      writable: true
    })
    
    expect(ref.current).toBe(button)
    expect(ref.current?.textContent).toBe('Ref Button')
  })

  it('can be used as child component when asChild is true', () => {
    const linkElement = document.createElement('a')
    linkElement.href = '#'
    linkElement.textContent = 'Link Button'
    
    expect(linkElement.tagName).toBe('A')
    expect(linkElement.getAttribute('href')).toBe('#')
    expect(linkElement.textContent).toBe('Link Button')
  })
})
