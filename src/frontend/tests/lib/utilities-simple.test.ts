/**
 * @jest-environment jsdom
 */

describe('Utility Functions', () => {
  describe('cn - CSS class name utility', () => {
    // Mock implementation of cn function (like clsx + twMerge)
    const cn = (...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) => {
      const classes: string[] = []
      
      inputs.forEach(input => {
        if (typeof input === 'string' && input.trim()) {
          classes.push(input.trim())
        } else if (typeof input === 'object' && input !== null) {
          Object.entries(input).forEach(([className, condition]) => {
            if (condition && className.trim()) {
              classes.push(className.trim())
            }
          })
        }
      })
      
      return classes.join(' ')
    }

    it('combines multiple string classes', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('handles undefined and null values', () => {
      const result = cn('class1', undefined, 'class2', null, 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('handles empty strings', () => {
      const result = cn('class1', '', 'class2', '   ', 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('handles boolean values', () => {
      const result = cn('class1', false, 'class2', true, 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('handles object syntax with conditions', () => {
      const result = cn('base-class', {
        'active-class': true,
        'inactive-class': false,
        'conditional-class': true
      })
      expect(result).toBe('base-class active-class conditional-class')
    })

    it('works with no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles complex combinations', () => {
      const isActive = true
      const size: 'large' | 'small' = 'large'
      
      const result = cn(
        'base-class',
        'component-class',
        {
          'active': isActive,
          'inactive': !isActive,
          'disabled': false
        },
        size === 'large' && 'large-class',
        size === 'small' && 'small-class'
      )
      
      expect(result).toBe('base-class component-class active large-class')
    })

    it('handles tailwind-like class merging scenario', () => {
      // Simulate common Tailwind CSS usage
      const baseClasses = 'px-4 py-2 rounded'
      const variantClasses = 'bg-blue-500 text-white'
      const conditionalClasses = {
        'hover:bg-blue-600': true,
        'disabled:opacity-50': false
      }
      
      const result = cn(baseClasses, variantClasses, conditionalClasses)
      expect(result).toBe('px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600')
    })

    it('handles dynamic class generation', () => {
      const getVariantClass = (variant: string) => {
        switch (variant) {
          case 'primary': return 'bg-blue-500'
          case 'secondary': return 'bg-gray-500'
          default: return 'bg-white'
        }
      }
      
      const getSizeClass = (size: string) => {
        switch (size) {
          case 'sm': return 'text-sm px-2 py-1'
          case 'lg': return 'text-lg px-4 py-2'
          default: return 'text-base px-3 py-1.5'
        }
      }
      
      const result = cn(
        'base-button',
        getVariantClass('primary'),
        getSizeClass('lg'),
        { 'active': true }
      )
      
      expect(result).toBe('base-button bg-blue-500 text-lg px-4 py-2 active')
    })

    it('trims whitespace from classes', () => {
      const result = cn('  class1  ', '  class2  ', '  class3  ')
      expect(result).toBe('class1 class2 class3')
    })

    it('handles mixed input types', () => {
      const result = cn(
        'string-class',
        123 as any, // This would be filtered out in real implementation
        { 'object-class': true },
        undefined,
        'another-string',
        { 'false-class': false, 'true-class': true }
      )
      
      // Our mock implementation filters out non-string, non-object values
      expect(result).toBe('string-class object-class another-string true-class')
    })
  })

  describe('formatDate utility', () => {
    // Mock date formatting utility
    const formatDate = (date: Date, format: string = 'dd/MM/yyyy'): string => {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      
      switch (format) {
        case 'dd/MM/yyyy':
          return `${day}/${month}/${year}`
        case 'yyyy-MM-dd':
          return `${year}-${month}-${day}`
        case 'MM/dd/yyyy':
          return `${month}/${day}/${year}`
        default:
          return `${day}/${month}/${year}`
      }
    }

    it('formats date in default format', () => {
      const date = new Date(2023, 11, 25) // December 25, 2023
      const result = formatDate(date)
      expect(result).toBe('25/12/2023')
    })

    it('formats date in ISO format', () => {
      const date = new Date(2023, 11, 25)
      const result = formatDate(date, 'yyyy-MM-dd')
      expect(result).toBe('2023-12-25')
    })

    it('formats date in US format', () => {
      const date = new Date(2023, 11, 25)
      const result = formatDate(date, 'MM/dd/yyyy')
      expect(result).toBe('12/25/2023')
    })

    it('handles single digit days and months', () => {
      const date = new Date(2023, 0, 5) // January 5, 2023
      const result = formatDate(date)
      expect(result).toBe('05/01/2023')
    })
  })

  describe('debounce utility', () => {
    // Mock debounce implementation
    const debounce = <T extends (...args: any[]) => any>(
      func: T,
      delay: number
    ): ((...args: Parameters<T>) => void) => {
      let timeoutId: NodeJS.Timeout
      
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
      }
    }

    it('delays function execution', (done) => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledWith('test')
        done()
      }, 150)
    })

    it('cancels previous calls', (done) => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenCalledWith('third')
        done()
      }, 150)
    })
  })

  describe('validation utilities', () => {
    const isEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const isStrongPassword = (password: string): boolean => {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
      return strongPasswordRegex.test(password)
    }

    it('validates correct email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true)
      expect(isEmail('user.name@domain.co.uk')).toBe(true)
      expect(isEmail('test+tag@example.org')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(isEmail('invalid-email')).toBe(false)
      expect(isEmail('@example.com')).toBe(false)
      expect(isEmail('test@')).toBe(false)
      expect(isEmail('test@.com')).toBe(false)
    })

    it('validates strong passwords', () => {
      expect(isStrongPassword('StrongPass1')).toBe(true)
      expect(isStrongPassword('MyPassword123')).toBe(true)
      expect(isStrongPassword('SecureP@ss1')).toBe(true)
    })

    it('rejects weak passwords', () => {
      expect(isStrongPassword('weak')).toBe(false)
      expect(isStrongPassword('password')).toBe(false)
      expect(isStrongPassword('PASSWORD')).toBe(false)
      expect(isStrongPassword('12345678')).toBe(false)
      expect(isStrongPassword('NoNumbers')).toBe(false)
    })
  })
})
