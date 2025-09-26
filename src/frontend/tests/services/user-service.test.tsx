import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DataService } from '@/services/data-service'

// Mock the fetch function
global.fetch = jest.fn()

// Mock the useSession hook
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'Ganadero'
      },
      accessToken: 'test-token'
    },
    status: 'authenticated'
  })
}))

// Test component that uses the DataService
const TestUserComponent: React.FC = () => {
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await DataService.getUsers()
      setUsers(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: any) => {
    setLoading(true)
    setError(null)
    try {
      const newUser = await DataService.createUser(userData)
      setUsers(prev => [...prev, newUser])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating user')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, userData: any) => {
    setLoading(true)
    setError(null)
    try {
      const updatedUser = await DataService.updateUser(id, userData)
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating user')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await DataService.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={loadUsers}>Load Users</button>
      <button onClick={() => createUser({ name: 'New User', email: 'new@example.com', role: 'Ganadero' as const })}>
        Create User
      </button>
      <button onClick={() => updateUser('1', { name: 'Updated User' })}>
        Update User
      </button>
      <button onClick={() => deleteUser('1')}>
        Delete User
      </button>
      
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        {users.map(user => (
          <div key={user.id} data-testid={`user-${user.id}`}>
            {user.name} - {user.email} - {user.role}
          </div>
        ))}
      </div>
    </div>
  )
}

describe('DataService', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Direct Service Methods', () => {
    describe('getUsers', () => {
      it('should fetch users successfully', async () => {
        const mockUsers = [
          { id: '1', name: 'User 1', email: 'user1@example.com', role: 'Ganadero' as const },
          { id: '2', name: 'User 2', email: 'user2@example.com', role: 'Administrador' as const }
        ]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers, total: 2 })
        } as Response)

        const result = await DataService.getUsers()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/list')
        )
        expect(result).toEqual({ data: mockUsers, total: 2 })
      })

      it('should handle pagination parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], total: 0 })
        } as Response)

        await DataService.getUsers({ page: 2, limit: 10 })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2&limit=10')
        )
      })

      it('should handle search parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], total: 0 })
        } as Response)

        await DataService.getUsers({ searchTerm: 'john', role: 'Ganadero' })

        const call = mockFetch.mock.calls[0]
        const url = call[0] as string
        expect(url).toContain('searchTerm=john')
        expect(url).toContain('role=Ganadero')
      })

      it('should throw error when fetch fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)

        await expect(DataService.getUsers()).rejects.toThrow('HTTP error! status: 500')
      })

      it('should throw error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        await expect(DataService.getUsers()).rejects.toThrow('Network error')
      })
    })

    describe('getUserById', () => {
      it('should fetch single user successfully', async () => {
        const mockUser = { id: '1', name: 'User 1', email: 'user1@example.com', role: 'Ganadero' as const }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser
        } as Response)

        const result = await DataService.getUserById('1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/1')
        )
        expect(result).toEqual(mockUser)
      })

      it('should handle user not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)

        await expect(DataService.getUserById('999')).rejects.toThrow('HTTP error! status: 404')
      })
    })

    describe('createUser', () => {
      it('should create user successfully', async () => {
        const newUser = { name: 'New User', email: 'new@example.com', role: 'Ganadero' as const }
        const createdUser = { id: '3', ...newUser }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createdUser
        } as Response)

        const result = await DataService.createUser(newUser)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify(newUser)
          })
        )
        expect(result).toEqual(createdUser)
      })

      it('should handle validation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        } as Response)

        await expect(DataService.createUser({})).rejects.toThrow('HTTP error! status: 400')
      })
    })

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        const updateData = { name: 'Updated User' }
        const updatedUser = { id: '1', name: 'Updated User', email: 'user1@example.com', role: 'Ganadero' as const }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedUser
        } as Response)

        const result = await DataService.updateUser('1', updateData)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/1'),
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify(updateData)
          })
        )
        expect(result).toEqual(updatedUser)
      })

      it('should handle unauthorized updates', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        } as Response)

        await expect(DataService.updateUser('1', {})).rejects.toThrow('HTTP error! status: 403')
      })
    })

    describe('deleteUser', () => {
      it('should delete user successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'User deleted successfully' })
        } as Response)

        await DataService.deleteUser('1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/1'),
          expect.objectContaining({
            method: 'DELETE'
          })
        )
      })

      it('should handle user not found on delete', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)

        await expect(DataService.deleteUser('999')).rejects.toThrow('HTTP error! status: 404')
      })
    })
  })

  describe('Component Integration', () => {
    it('should load users successfully in component', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com', role: 'Ganadero' as const },
        { id: '2', name: 'User 2', email: 'user2@example.com', role: 'Administrador' as const }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers, total: 2 })
      } as Response)

      render(<TestUserComponent />)

      const loadButton = screen.getByText('Load Users')
      fireEvent.click(loadButton)

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('user-1')).toBeInTheDocument()
        expect(screen.getByTestId('user-2')).toBeInTheDocument()
      })

      expect(screen.getByText('User 1 - user1@example.com - Ganadero')).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should handle error when loading users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      render(<TestUserComponent />)

      const loadButton = screen.getByText('Load Users')
      fireEvent.click(loadButton)

      await waitFor(() => {
        expect(screen.getByText('Error: HTTP error! status: 500')).toBeInTheDocument()
      })

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should create user successfully in component', async () => {
      const newUser = { id: '3', name: 'New User', email: 'new@example.com', role: 'Ganadero' as const }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newUser
      } as Response)

      render(<TestUserComponent />)

      const createButton = screen.getByText('Create User')
      fireEvent.click(createButton)

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('user-3')).toBeInTheDocument()
      })

      expect(screen.getByText('New User - new@example.com - Ganadero')).toBeInTheDocument()
    })

    it('should update user successfully in component', async () => {
      // First load a user
      const initialUser = { id: '1', name: 'User 1', email: 'user1@example.com', role: 'Ganadero' as const }
      const updatedUser = { id: '1', name: 'Updated User', email: 'user1@example.com', role: 'Ganadero' as const }

      // Mock the create call first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => initialUser
      } as Response)

      render(<TestUserComponent />)

      // Create initial user
      fireEvent.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(screen.getByTestId('user-1')).toBeInTheDocument()
      })

      // Mock the update call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser
      } as Response)

      // Update user
      fireEvent.click(screen.getByText('Update User'))

      await waitFor(() => {
        expect(screen.getByText('Updated User - user1@example.com - Ganadero')).toBeInTheDocument()
      })
    })

    it('should delete user successfully in component', async () => {
      // First create a user
      const user = { id: '1', name: 'User 1', email: 'user1@example.com', role: 'Ganadero' as const }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => user
      } as Response)

      render(<TestUserComponent />)

      // Create user
      fireEvent.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(screen.getByTestId('user-1')).toBeInTheDocument()
      })

      // Mock the delete call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'User deleted successfully' })
      } as Response)

      // Delete user
      fireEvent.click(screen.getByText('Delete User'))

      await waitFor(() => {
        expect(screen.queryByTestId('user-1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Role-based Operations', () => {
    it('should handle operations for different user roles', async () => {
      const ganadeloUser = { id: '1', name: 'Ganadero User', email: 'ganadero@example.com', role: 'Ganadero' as const }
      const adminUser = { id: '2', name: 'Admin User', email: 'admin@example.com', role: 'Administrador' as const }
      const vetUser = { id: '3', name: 'Vet User', email: 'vet@example.com', role: 'Veterinario' as const }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [ganadeloUser, adminUser, vetUser], total: 3 })
        } as Response)

      const result = await DataService.getUsers({ role: 'all' })

      expect(result.data).toHaveLength(3)
      expect(result.data.some(u => u.role === 'Ganadero')).toBeTruthy()
      expect(result.data.some(u => u.role === 'Administrador')).toBeTruthy()
      expect(result.data.some(u => u.role === 'Veterinario')).toBeTruthy()
    })

    it('should filter users by specific role', async () => {
      const ganadeloUsers = [
        { id: '1', name: 'Ganadero 1', email: 'ganadero1@example.com', role: 'Ganadero' as const },
        { id: '2', name: 'Ganadero 2', email: 'ganadero2@example.com', role: 'Ganadero' as const }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: ganadeloUsers, total: 2 })
      } as Response)

      const result = await DataService.getUsers({ role: 'Ganadero' })

      expect(result.data).toHaveLength(2)
      expect(result.data.every(u => u.role === 'Ganadero')).toBeTruthy()
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )

      await expect(DataService.getUsers()).rejects.toThrow('Network timeout')
    })

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      } as unknown as Response)

      await expect(DataService.getUsers()).rejects.toThrow('Invalid JSON')
    })

    it('should handle missing session token', async () => {
      // We need to temporarily mock useSession to return no token
      const originalConsoleError = console.error
      console.error = jest.fn() // Suppress error logs

      // The service should still attempt the request (handling will depend on backend)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response)

      await expect(DataService.getUsers()).rejects.toThrow('HTTP error! status: 401')

      console.error = originalConsoleError
    })
  })
})
