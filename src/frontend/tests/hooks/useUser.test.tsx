import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useUser, UserProvider } from '@/hooks/useUserContext';
import { 
  mockSessionGanadero, 
  mockSessionAdministrador, 
  mockSessionVeterinario 
} from '../__mocks__/next-auth.mock';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

describe('useUser Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data for Ganadero role', () => {
    mockUseSession.mockReturnValue({
      data: mockSessionGanadero,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: AllProviders,
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.role).toBe('Ganadero');
    expect(result.current.user?.email).toBe('ganadero@lactokeeper.com');
    expect(result.current.isLoading).toBe(false);
  });

  it('should return user data for Administrador role', () => {
    mockUseSession.mockReturnValue({
      data: mockSessionAdministrador,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: AllProviders,
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.role).toBe('Administrador');
    expect(result.current.user?.email).toBe('admin@lactokeeper.com');
    expect(result.current.isLoading).toBe(false);
  });

  it('should return user data for Veterinario role', () => {
    mockUseSession.mockReturnValue({
      data: mockSessionVeterinario,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: AllProviders,
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.role).toBe('Veterinario');
    expect(result.current.user?.email).toBe('veterinario@lactokeeper.com');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle no session (unauthenticated)', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: AllProviders,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: AllProviders,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should have updateUser function', () => {
    mockUseSession.mockReturnValue({
      data: mockSessionGanadero,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: AllProviders,
    });

    expect(result.current.updateUser).toBeDefined();
    expect(typeof result.current.updateUser).toBe('function');
  });

  describe('Role-based functionality', () => {
    it('should correctly identify Ganadero role', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionGanadero,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: AllProviders,
      });

      expect(result.current.user?.role).toBe('Ganadero');
      expect(result.current.user?.name).toBe('Juan');
      expect(result.current.user?.surname).toBe('Pérez');
    });

    it('should correctly identify Administrador role', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionAdministrador,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: AllProviders,
      });

      expect(result.current.user?.role).toBe('Administrador');
      expect(result.current.user?.name).toBe('María');
      expect(result.current.user?.surname).toBe('González');
    });

    it('should correctly identify Veterinario role', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionVeterinario,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: AllProviders,
      });

      expect(result.current.user?.role).toBe('Veterinario');
      expect(result.current.user?.name).toBe('Carlos');
      expect(result.current.user?.surname).toBe('Martínez');
    });
  });

  describe('Security validations', () => {
    it('should not expose sensitive data in user context', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionGanadero,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: AllProviders,
      });

      // Should not expose password or other sensitive fields
      expect(result.current.user).not.toHaveProperty('password');
      expect(result.current.user).not.toHaveProperty('accessToken');
      expect(result.current.user).not.toHaveProperty('refreshToken');
    });

    it('should validate user object structure', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionGanadero,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: AllProviders,
      });

      const user = result.current.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('surname');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');

      // Validate types
      expect(typeof user?.id).toBe('string');
      expect(typeof user?.name).toBe('string');
      expect(typeof user?.surname).toBe('string');
      expect(typeof user?.email).toBe('string');
      expect(typeof user?.role).toBe('string');
    });
  });
});
