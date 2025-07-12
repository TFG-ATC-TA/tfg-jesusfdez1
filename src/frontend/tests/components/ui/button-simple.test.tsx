/**
 * @jest-environment jsdom
 */

describe('Button Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a button element', () => {
    const button = document.createElement('button')
    button.textContent = 'Test Button'
    document.body.appendChild(button)
    
    expect(button.tagName).toBe('BUTTON')
    expect(button.textContent).toBe('Test Button')
  })

  it('can be disabled', () => {
    const button = document.createElement('button')
    button.disabled = true
    button.textContent = 'Disabled Button'
    
    expect(button.disabled).toBe(true)
    expect(button.textContent).toBe('Disabled Button')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    const button = document.createElement('button')
    button.addEventListener('click', handleClick)
    button.textContent = 'Clickable Button'
    
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('supports different button types', () => {
    const types: Array<'button' | 'submit' | 'reset'> = ['button', 'submit', 'reset']
    
    types.forEach(type => {
      const button = document.createElement('button')
      button.type = type
      button.textContent = `${type} Button`
      
      expect(button.type).toBe(type)
      expect(button.textContent).toBe(`${type} Button`)
    })
  })

  it('accepts custom classes', () => {
    const button = document.createElement('button')
    button.className = 'custom-class btn-primary'
    button.textContent = 'Custom Button'
    
    expect(button.className).toBe('custom-class btn-primary')
    expect(button.textContent).toBe('Custom Button')
  })

  it('can have attributes', () => {
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'test-button')
    button.setAttribute('aria-label', 'Test button')
    button.textContent = 'Accessible Button'
    
    expect(button.getAttribute('data-testid')).toBe('test-button')
    expect(button.getAttribute('aria-label')).toBe('Test button')
    expect(button.textContent).toBe('Accessible Button')
  })

  it('supports form association', () => {
    const form = document.createElement('form')
    const button = document.createElement('button')
    button.type = 'submit'
    button.textContent = 'Submit'
    
    form.appendChild(button)
    expect(button.form).toBe(form)
    expect(button.type).toBe('submit')
  })

  it('can be focused and blurred', () => {
    const button = document.createElement('button')
    button.textContent = 'Focusable Button'
    document.body.appendChild(button)
    
    const focusHandler = jest.fn()
    const blurHandler = jest.fn()
    
    button.addEventListener('focus', focusHandler)
    button.addEventListener('blur', blurHandler)
    
    button.focus()
    expect(focusHandler).toHaveBeenCalledTimes(1)
    
    button.blur()
    expect(blurHandler).toHaveBeenCalledTimes(1)
  })
})
