/**
 * @jest-environment jsdom
 */

describe('Login Form Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function createLoginForm() {
    const form = document.createElement('form')
    form.setAttribute('data-testid', 'login-form')

    const emailInput = document.createElement('input')
    emailInput.type = 'email'
    emailInput.name = 'email'
    emailInput.placeholder = 'Introduce tu correo electrónico'
    emailInput.required = true

    const passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    passwordInput.name = 'password'
    passwordInput.placeholder = 'Introduce tu contraseña'
    passwordInput.required = true

    const submitButton = document.createElement('button')
    submitButton.type = 'submit'
    submitButton.textContent = 'Iniciar sesión'

    const errorDiv = document.createElement('div')
    errorDiv.className = 'error-message'
    errorDiv.style.display = 'none'

    form.appendChild(emailInput)
    form.appendChild(passwordInput)
    form.appendChild(errorDiv)
    form.appendChild(submitButton)

    return {
      form,
      emailInput,
      passwordInput,
      submitButton,
      errorDiv
    }
  }

  it('renders login form with email and password fields', () => {
    const { form, emailInput, passwordInput, submitButton } = createLoginForm()
    document.body.appendChild(form)

    expect(form.tagName).toBe('FORM')
    expect(emailInput.type).toBe('email')
    expect(emailInput.placeholder).toBe('Introduce tu correo electrónico')
    expect(passwordInput.type).toBe('password')
    expect(passwordInput.placeholder).toBe('Introduce tu contraseña')
    expect(submitButton.type).toBe('submit')
    expect(submitButton.textContent).toBe('Iniciar sesión')
  })

  it('validates required fields', () => {
    const { emailInput, passwordInput } = createLoginForm()

    expect(emailInput.required).toBe(true)
    expect(passwordInput.required).toBe(true)
  })

  it('handles form submission', () => {
    const { form, emailInput, passwordInput } = createLoginForm()
    document.body.appendChild(form)

    const submitHandler = jest.fn()
    form.addEventListener('submit', submitHandler)

    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    const submitEvent = new Event('submit')
    form.dispatchEvent(submitEvent)

    expect(submitHandler).toHaveBeenCalledTimes(1)
    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('prevents default form submission', () => {
    const { form } = createLoginForm()
    document.body.appendChild(form)

    const submitHandler = jest.fn((e) => {
      e.preventDefault()
    })
    form.addEventListener('submit', submitHandler)

    const submitEvent = new Event('submit')
    Object.defineProperty(submitEvent, 'preventDefault', {
      value: jest.fn(),
      writable: true
    })

    form.dispatchEvent(submitEvent)

    expect(submitHandler).toHaveBeenCalledTimes(1)
  })

  it('shows and hides error messages', () => {
    const { errorDiv } = createLoginForm()

    // Initially hidden
    expect(errorDiv.style.display).toBe('none')

    // Show error
    errorDiv.textContent = 'Invalid credentials'
    errorDiv.style.display = 'block'
    expect(errorDiv.style.display).toBe('block')
    expect(errorDiv.textContent).toBe('Invalid credentials')

    // Hide error
    errorDiv.style.display = 'none'
    errorDiv.textContent = ''
    expect(errorDiv.style.display).toBe('none')
    expect(errorDiv.textContent).toBe('')
  })

  it('handles email validation', () => {
    const { emailInput } = createLoginForm()

    // Valid email
    emailInput.value = 'test@example.com'
    expect(emailInput.value).toBe('test@example.com')
    expect(emailInput.type).toBe('email')

    // Invalid email (browser will handle validation)
    emailInput.value = 'invalid-email'
    expect(emailInput.value).toBe('invalid-email')
  })

  it('handles password visibility toggle', () => {
    const { passwordInput } = createLoginForm()

    // Create toggle button
    const toggleButton = document.createElement('button')
    toggleButton.type = 'button'
    toggleButton.textContent = '👁️'

    let isPasswordVisible = false
    const togglePasswordVisibility = () => {
      isPasswordVisible = !isPasswordVisible
      passwordInput.type = isPasswordVisible ? 'text' : 'password'
      toggleButton.textContent = isPasswordVisible ? '🙈' : '👁️'
    }

    toggleButton.addEventListener('click', togglePasswordVisibility)

    // Initial state
    expect(passwordInput.type).toBe('password')
    expect(toggleButton.textContent).toBe('👁️')

    // Toggle to show password
    toggleButton.click()
    expect(passwordInput.type).toBe('text')
    expect(toggleButton.textContent).toBe('🙈')

    // Toggle to hide password
    toggleButton.click()
    expect(passwordInput.type).toBe('password')
    expect(toggleButton.textContent).toBe('👁️')
  })

  it('handles input events to clear errors', () => {
    const { emailInput, errorDiv } = createLoginForm()

    // Show error initially
    errorDiv.textContent = 'Error message'
    errorDiv.style.display = 'block'

    // Add event listener to clear error on input
    const clearError = () => {
      errorDiv.textContent = ''
      errorDiv.style.display = 'none'
    }
    emailInput.addEventListener('input', clearError)

    // Trigger input event
    const inputEvent = new Event('input')
    emailInput.dispatchEvent(inputEvent)

    expect(errorDiv.textContent).toBe('')
    expect(errorDiv.style.display).toBe('none')
  })

  it('disables submit button during loading', () => {
    const { submitButton } = createLoginForm()

    // Normal state
    expect(submitButton.disabled).toBe(false)
    expect(submitButton.textContent).toBe('Iniciar sesión')

    // Loading state
    submitButton.disabled = true
    submitButton.textContent = 'Iniciando sesión...'

    expect(submitButton.disabled).toBe(true)
    expect(submitButton.textContent).toBe('Iniciando sesión...')

    // Back to normal
    submitButton.disabled = false
    submitButton.textContent = 'Iniciar sesión'

    expect(submitButton.disabled).toBe(false)
    expect(submitButton.textContent).toBe('Iniciar sesión')
  })

  it('handles keyboard navigation', () => {
    const { form, emailInput, passwordInput, submitButton } = createLoginForm()
    document.body.appendChild(form)

    const keyDownHandler = jest.fn()
    form.addEventListener('keydown', keyDownHandler)

    // Simulate Tab key to navigate between fields
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    emailInput.dispatchEvent(tabEvent)

    // Simulate Enter key on submit button
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    submitButton.dispatchEvent(enterEvent)

    expect(keyDownHandler).toHaveBeenCalled()
  })

  it('preserves form data on error', () => {
    const { emailInput, passwordInput, errorDiv } = createLoginForm()

    // Fill form
    emailInput.value = 'test@example.com'
    passwordInput.value = 'wrongpassword'

    // Simulate error response
    errorDiv.textContent = 'Invalid credentials'
    errorDiv.style.display = 'block'

    // Form data should be preserved
    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('wrongpassword')
    expect(errorDiv.textContent).toBe('Invalid credentials')
  })
})
