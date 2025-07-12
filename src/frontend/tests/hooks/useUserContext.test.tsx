import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useUserContext, UserProvider } from '@/hooks/useUserContext';
import { 
  mockSessionGanadero, 
  mockSessionAdministrador, 
  mockSessionVeterinario
} from '../__mocks__/next-auth.mock';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: jest.fn(),
}));

const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    {children}
  </UserProvider>
);

describe('useUserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data for Ganadero role', () => {
    mockedUseSession.mockReturnValue({
      data: mockSessionGanadero,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUserContext(), {
      wrapper: MockWrapper,
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.role).toBe('Ganadero');
    expect(result.current.isGanadero).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVeterinario).toBe(false);
  });

  it('should return user data for Administrador role', () => {
    mockedUseSession.mockReturnValue({
      data: mockSessionAdministrador,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUserContext(), {
      wrapper: MockWrapper,
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.role).toBe('Administrador');
    expect(result.current.isGanadero).toBe(false);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isVeterinario).toBe(false);
  });

  it('should return user data for Veterinario role', () => {
    mockedUseSession.mockReturnValue({
      data: mockSessionVeterinario,
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUserContext(), {
      wrapper: MockWrapper,
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.role).toBe('Veterinario');
    expect(result.current.isGanadero).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVeterinario).toBe(true);
  });

  it('should handle no session', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUserContext(), {
      wrapper: MockWrapper,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isGanadero).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVeterinario).toBe(false);
  });

  it('should handle loading state', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useUserContext(), {
      wrapper: MockWrapper,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isGanadero).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVeterinario).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  describe('Role permissions', () => {
    it('should validate Ganadero permissions', () => {
      mockedUseSession.mockReturnValue({
        data: mockSessionGanadero,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUserContext(), {
        wrapper: MockWrapper,
      });

      // Ganadero should have access to farm management
      expect(result.current.isGanadero).toBe(true);
      expect(result.current.user?.permissions).toContain('farm_management');
      expect(result.current.user?.permissions).toContain('device_monitoring');
    });

    it('should validate Administrador permissions', () => {
      mockedUseSession.mockReturnValue({
        data: mockSessionAdministrador,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUserContext(), {
        wrapper: MockWrapper,
      });

      // Administrador should have all permissions
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.user?.permissions).toContain('user_management');
      expect(result.current.user?.permissions).toContain('system_config');
      expect(result.current.user?.permissions).toContain('farm_management');
    });

    it('should validate Veterinario permissions', () => {
      mockedUseSession.mockReturnValue({
        data: mockSessionVeterinario,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUserContext(), {
        wrapper: MockWrapper,
      });

      // Veterinario should have medical and consultation permissions
      expect(result.current.isVeterinario).toBe(true);
      expect(result.current.user?.permissions).toContain('medical_records');
      expect(result.current.user?.permissions).toContain('consultations');
    });
  });

  describe('Security validations', () => {
    it('should not expose sensitive data in user context', () => {
      mockedUseSession.mockReturnValue({
        data: mockSessionGanadero,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUserContext(), {
        wrapper: MockWrapper,
      });

      // Should not expose password or other sensitive fields
      expect(result.current.user).not.toHaveProperty('password');
      expect(result.current.user).not.toHaveProperty('accessToken');
    });

    it('should validate role consistency', () => {
      mockedUseSession.mockReturnValue({
        data: mockSessionAdministrador,
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUserContext(), {
        wrapper: MockWrapper,
      });

      // Only one role should be true at a time
      const roleFlags = [
        result.current.isGanadero,
        result.current.isAdmin,
        result.current.isVeterinario
      ];
      
      const trueCount = roleFlags.filter(Boolean).length;
      expect(trueCount).toBe(1); // Only one role should be true
    });
  });
});
