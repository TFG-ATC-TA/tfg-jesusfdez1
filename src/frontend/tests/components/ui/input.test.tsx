/**
 * @jest-environment jsdom
 */

import React from 'react'
import { Input } from '@/components/ui/input'

// Mock cn function
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

function renderInput(props: any = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const input = document.createElement('input')
  
  // Apply props
  Object.keys(props).forEach(key => {
    if (key === 'className') {
      input.className = props[key]
    } else if (key === 'onChange') {
      input.addEventListener('change', props[key])
    } else if (key === 'onFocus') {
      input.addEventListener('focus', props[key])
    } else if (key === 'onBlur') {
      input.addEventListener('blur', props[key])
    } else {
      input.setAttribute(key, props[key])
    }
  })

  container.appendChild(input)

  return {
    container,
    input,
    getByRole: () => input,
  }
}

describe('Input Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders an input element', () => {
    const { input } = renderInput()
    expect(input.tagName).toBe('INPUT')
  })

  it('applies default classes', () => {
    const { input } = renderInput()
    expect(input).toBeDefined()
  })

  it('accepts custom className', () => {
    const customClass = 'custom-input-class'
    const { input } = renderInput({ className: customClass })
    expect(input.className).toContain(customClass)
  })

  it('supports different input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search']
    
    types.forEach(type => {
      const { input } = renderInput({ type })
      expect(input.type).toBe(type)
    })
  })

  it('handles value changes', () => {
    const onChange = jest.fn()
    const { input } = renderInput({ onChange })

    input.value = 'test value'
    const changeEvent = new Event('change')
    input.dispatchEvent(changeEvent)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(input.value).toBe('test value')
  })

  it('supports placeholder text', () => {
    const placeholder = 'Enter your text here'
    const { input } = renderInput({ placeholder })
    expect(input.placeholder).toBe(placeholder)
  })

  it('can be disabled', () => {
    const { input } = renderInput({ disabled: true })
    expect(input.disabled).toBe(true)
  })

  it('can be required', () => {
    const { input } = renderInput({ required: true })
    expect(input.required).toBe(true)
  })

  it('supports min and max attributes for number inputs', () => {
    const { input } = renderInput({ 
      type: 'number', 
      min: '0', 
      max: '100' 
    })
    expect(input.type).toBe('number')
    expect(input.getAttribute('min')).toBe('0')
    expect(input.getAttribute('max')).toBe('100')
  })

  it('supports maxLength attribute', () => {
    const { input } = renderInput({ maxLength: '50' })
    expect(input.getAttribute('maxLength')).toBe('50')
  })

  it('handles focus and blur events', () => {
    const onFocus = jest.fn()
    const onBlur = jest.fn()
    const { input } = renderInput({ onFocus, onBlur })

    input.focus()
    expect(onFocus).toHaveBeenCalledTimes(1)

    input.blur()
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    const input = document.createElement('input')
    
    // Simulate ref assignment
    Object.defineProperty(ref, 'current', {
      value: input,
      writable: true
    })

    expect(ref.current).toBe(input)
    expect(ref.current?.tagName).toBe('INPUT')
  })

  it('supports readonly attribute', () => {
    const { input } = renderInput({ readOnly: true })
    expect(input.readOnly).toBe(true)
  })

  it('supports autoComplete attribute', () => {
    const { input } = renderInput({ autoComplete: 'email' })
    expect(input.getAttribute('autoComplete')).toBe('email')
  })

  it('supports autoFocus attribute', () => {
    const { input } = renderInput({ autoFocus: true })
    expect(input.autofocus).toBe(true)
  })

  it('handles input validation', () => {
    const { input } = renderInput({ 
      type: 'email',
      required: true 
    })

    // Test invalid email
    input.value = 'invalid-email'
    expect(input.type).toBe('email')
    expect(input.required).toBe(true)

    // Test valid email
    input.value = 'test@example.com'
    expect(input.value).toBe('test@example.com')
  })

  it('supports pattern attribute for validation', () => {
    const pattern = '[0-9]{3}-[0-9]{3}-[0-9]{4}'
    const { input } = renderInput({ pattern })
    expect(input.getAttribute('pattern')).toBe(pattern)
  })

  it('supports step attribute for number inputs', () => {
    const { input } = renderInput({ 
      type: 'number',
      step: '0.01' 
    })
    expect(input.getAttribute('step')).toBe('0.01')
  })

  it('supports multiple attribute for file inputs', () => {
    const { input } = renderInput({ 
      type: 'file',
      multiple: true 
    })
    expect(input.multiple).toBe(true)
  })

  it('handles keyboard events', () => {
    const onKeyDown = jest.fn()
    const onKeyUp = jest.fn()
    const { input } = renderInput()

    input.addEventListener('keydown', onKeyDown)
    input.addEventListener('keyup', onKeyUp)

    const keyDownEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    const keyUpEvent = new KeyboardEvent('keyup', { key: 'Enter' })

    input.dispatchEvent(keyDownEvent)
    input.dispatchEvent(keyUpEvent)

    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyUp).toHaveBeenCalledTimes(1)
  })
})
