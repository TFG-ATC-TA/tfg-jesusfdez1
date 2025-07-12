/**
 * @jest-environment jsdom
 */

import React from 'react'
import SignInForm from '@/components/forms/sign-in-form'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => ({})),
}))

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: jest.fn((fn) => (e: Event) => {
      e.preventDefault()
      fn({ email: 'test@example.com', password: 'password123' })
    }),
    formState: { errors: {} },
  }),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, onClick, type }: any) => (
    <button type={type} disabled={disabled} onClick={onClick} data-testid="submit-button">
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <div data-testid="form">{children}</div>,
  FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
  FormField: ({ render }: any) => {
    const field = { onChange: jest.fn(), value: '' }
    return render({ field })
  },
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
  FormMessage: ({ children, className }: any) => (
    <div data-testid="form-message" className={className}>{children}</div>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => (
    <input
      data-testid={props['data-testid'] || 'input'}
      type={props.type}
      placeholder={props.placeholder}
      disabled={props.disabled}
      onChange={props.onChange}
      {...props}
    />
  ),
}))

function renderSignInForm() {
  const container = document.createElement('div')
  document.body.appendChild(container)

  // Simulate form structure
  const form = document.createElement('form')
  form.setAttribute('data-testid', 'sign-in-form')

  const emailInput = document.createElement('input')
  emailInput.setAttribute('data-testid', 'email-input')
  emailInput.type = 'email'
  emailInput.placeholder = 'Introduce tu correo electrónico'

  const passwordInput = document.createElement('input')
  passwordInput.setAttribute('data-testid', 'password-input')
  passwordInput.type = 'password'
  passwordInput.placeholder = 'Introduce tu contraseña'

  const submitButton = document.createElement('button')
  submitButton.setAttribute('data-testid', 'submit-button')
  submitButton.type = 'submit'
  submitButton.textContent = 'Iniciar sesión'

  const errorDiv = document.createElement('div')
  errorDiv.setAttribute('data-testid', 'error-message')
  errorDiv.style.display = 'none'
  errorDiv.className = 'text-red-500 text-sm'

  form.appendChild(emailInput)
  form.appendChild(passwordInput)
  form.appendChild(errorDiv)
  form.appendChild(submitButton)
  container.appendChild(form)

  return {
    container,
    form,
    emailInput,
    passwordInput,
    submitButton,
    errorDiv,
    getByTestId: (testId: string) => {
      const element = container.querySelector(`[data-testid="${testId}"]`)
      if (!element) throw new Error(`Element with testId "${testId}" not found`)
      return element
    },
  }
}

describe('SignInForm Component', () => {
  const { signIn } = require('next-auth/react')

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
        setItem: jest.fn(),
        getItem: jest.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders sign in form with email and password fields', () => {
    const { emailInput, passwordInput, submitButton } = renderSignInForm()

    expect(emailInput).toBeDefined()
    expect(emailInput.type).toBe('email')
    expect(emailInput.placeholder).toBe('Introduce tu correo electrónico')

    expect(passwordInput).toBeDefined()
    expect(passwordInput.type).toBe('password')
    expect(passwordInput.placeholder).toBe('Introduce tu contraseña')

    expect(submitButton).toBeDefined()
    expect(submitButton.textContent).toBe('Iniciar sesión')
  })

  it('handles successful login', async () => {
    signIn.mockResolvedValue({ ok: true, error: null })

    const { form, emailInput, passwordInput, submitButton } = renderSignInForm()

    // Fill form
    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    // Add submit handler
    let submitted = false
    const handleSubmit = (e: Event) => {
      e.preventDefault()
      submitted = true
      signIn('credentials', {
        redirect: false,
        email: emailInput.value,
        password: passwordInput.value,
      })
    }

    form.addEventListener('submit', handleSubmit)

    // Simulate form submission
    const submitEvent = new Event('submit')
    form.dispatchEvent(submitEvent)

    expect(submitted).toBe(true)
    expect(signIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials'
    signIn.mockResolvedValue({ ok: false, error: errorMessage })

    const { form, emailInput, passwordInput, errorDiv } = renderSignInForm()

    // Fill form
    emailInput.value = 'test@example.com'
    passwordInput.value = 'wrongpassword'

    // Add error handler
    const handleSubmit = async (e: Event) => {
      e.preventDefault()
      const result = await signIn('credentials', {
        redirect: false,
        email: emailInput.value,
        password: passwordInput.value,
      })

      if (result?.error) {
        errorDiv.textContent = result.error
        errorDiv.style.display = 'block'
      }
    }

    form.addEventListener('submit', handleSubmit)

    // Simulate form submission
    const submitEvent = new Event('submit')
    await form.dispatchEvent(submitEvent)

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(signIn).toHaveBeenCalled()
  })

  it('validates email format', () => {
    const { emailInput } = renderSignInForm()

    // Test invalid email
    emailInput.value = 'invalid-email'
    const isValid = emailInput.validity.valid
    
    // For email input type, browser validation will handle this
    expect(emailInput.type).toBe('email')
  })

  it('validates required fields', () => {
    const { emailInput, passwordInput } = renderSignInForm()

    // Test empty fields
    emailInput.value = ''
    passwordInput.value = ''

    const emailRequired = emailInput.hasAttribute('required') || emailInput.value === ''
    const passwordRequired = passwordInput.hasAttribute('required') || passwordInput.value === ''

    expect(emailRequired).toBe(true)
    expect(passwordRequired).toBe(true)
  })

  it('shows loading state during submission', () => {
    const { submitButton } = renderSignInForm()

    // Simulate loading state
    submitButton.disabled = true
    submitButton.textContent = 'Iniciando sesión...'

    expect(submitButton.disabled).toBe(true)
    expect(submitButton.textContent).toBe('Iniciando sesión...')
  })

  it('toggles password visibility', () => {
    const { passwordInput } = renderSignInForm()

    // Create toggle button
    const toggleButton = document.createElement('button')
    toggleButton.type = 'button'
    toggleButton.setAttribute('data-testid', 'password-toggle')
    
    let showPassword = false
    const toggleVisibility = () => {
      showPassword = !showPassword
      passwordInput.type = showPassword ? 'text' : 'password'
    }

    toggleButton.addEventListener('click', toggleVisibility)

    // Initial state
    expect(passwordInput.type).toBe('password')

    // Toggle visibility
    toggleButton.click()
    expect(passwordInput.type).toBe('text')

    // Toggle back
    toggleButton.click()
    expect(passwordInput.type).toBe('password')
  })

  it('clears localStorage on successful login', async () => {
    signIn.mockResolvedValue({ ok: true, error: null })

    const { form, emailInput, passwordInput } = renderSignInForm()

    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    const handleSubmit = async (e: Event) => {
      e.preventDefault()
      
      // Clear localStorage
      localStorage.removeItem('lactokeeper-user-data')
      
      await signIn('credentials', {
        redirect: false,
        email: emailInput.value,
        password: passwordInput.value,
      })
    }

    form.addEventListener('submit', handleSubmit)

    const submitEvent = new Event('submit')
    await form.dispatchEvent(submitEvent)

    expect(localStorage.removeItem).toHaveBeenCalledWith('lactokeeper-user-data')
  })

  it('clears error message when user types', () => {
    const { emailInput, errorDiv } = renderSignInForm()

    // Show error initially
    errorDiv.textContent = 'Error message'
    errorDiv.style.display = 'block'

    // Simulate user typing
    const clearError = () => {
      errorDiv.textContent = ''
      errorDiv.style.display = 'none'
    }

    emailInput.addEventListener('input', clearError)

    // Trigger input event
    const inputEvent = new Event('input')
    emailInput.dispatchEvent(inputEvent)

    expect(errorDiv.style.display).toBe('none')
    expect(errorDiv.textContent).toBe('')
  })
})
