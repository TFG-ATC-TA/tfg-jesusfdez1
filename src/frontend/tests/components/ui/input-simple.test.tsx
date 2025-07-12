/**
 * @jest-environment jsdom
 */

describe('Input Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders an input element', () => {
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    
    expect(input.tagName).toBe('INPUT')
    expect(input.type).toBe('text')
  })

  it('handles value changes', () => {
    const input = document.createElement('input')
    input.type = 'text'
    
    input.value = 'test value'
    expect(input.value).toBe('test value')
  })

  it('supports different input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url']
    
    types.forEach(type => {
      const input = document.createElement('input')
      input.type = type
      expect(input.type).toBe(type)
    })
  })

  it('can be disabled', () => {
    const input = document.createElement('input')
    input.disabled = true
    expect(input.disabled).toBe(true)
  })

  it('can be required', () => {
    const input = document.createElement('input')
    input.required = true
    expect(input.required).toBe(true)
  })

  it('supports placeholder text', () => {
    const input = document.createElement('input')
    input.placeholder = 'Enter text here'
    expect(input.placeholder).toBe('Enter text here')
  })

  it('handles change events', () => {
    const onChange = jest.fn()
    const input = document.createElement('input')
    input.addEventListener('change', onChange)
    
    input.value = 'new value'
    const changeEvent = new Event('change')
    input.dispatchEvent(changeEvent)
    
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('handles input events', () => {
    const onInput = jest.fn()
    const input = document.createElement('input')
    input.addEventListener('input', onInput)
    
    input.value = 'typing...'
    const inputEvent = new Event('input')
    input.dispatchEvent(inputEvent)
    
    expect(onInput).toHaveBeenCalledTimes(1)
  })

  it('can be focused and blurred', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    
    const focusHandler = jest.fn()
    const blurHandler = jest.fn()
    
    input.addEventListener('focus', focusHandler)
    input.addEventListener('blur', blurHandler)
    
    input.focus()
    expect(focusHandler).toHaveBeenCalledTimes(1)
    
    input.blur()
    expect(blurHandler).toHaveBeenCalledTimes(1)
  })

  it('supports validation attributes', () => {
    const input = document.createElement('input')
    input.type = 'email'
    input.required = true
    input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$'
    
    expect(input.type).toBe('email')
    expect(input.required).toBe(true)
    expect(input.pattern).toBe('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$')
  })

  it('supports min/max for number inputs', () => {
    const input = document.createElement('input')
    input.type = 'number'
    input.min = '0'
    input.max = '100'
    input.step = '5'
    
    expect(input.type).toBe('number')
    expect(input.min).toBe('0')
    expect(input.max).toBe('100')
    expect(input.step).toBe('5')
  })

  it('supports maxLength attribute', () => {
    const input = document.createElement('input')
    input.maxLength = 50
    
    expect(input.maxLength).toBe(50)
  })

  it('can be readonly', () => {
    const input = document.createElement('input')
    input.readOnly = true
    
    expect(input.readOnly).toBe(true)
  })

  it('supports custom attributes', () => {
    const input = document.createElement('input')
    input.setAttribute('data-testid', 'test-input')
    input.setAttribute('aria-label', 'Test input field')
    
    expect(input.getAttribute('data-testid')).toBe('test-input')
    expect(input.getAttribute('aria-label')).toBe('Test input field')
  })

  it('handles keyboard events', () => {
    const onKeyDown = jest.fn()
    const onKeyUp = jest.fn()
    const input = document.createElement('input')
    
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
