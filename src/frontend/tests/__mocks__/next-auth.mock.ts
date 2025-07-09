// Mock para next-auth con roles específicos del sistema
export const mockSessionGanadero = {
  user: {
    id: '1',
    name: 'Juan',
    surname: 'Pérez',
    email: 'ganadero@lactokeeper.com',
    role: 'Ganadero',
  },
  expires: '2025-12-31',
}

export const mockSessionAdministrador = {
  user: {
    id: '2',
    name: 'María',
    surname: 'González',
    email: 'admin@lactokeeper.com',
    role: 'Administrador',
  },
  expires: '2025-12-31',
}

export const mockSessionVeterinario = {
  user: {
    id: '3',
    name: 'Carlos',
    surname: 'Martínez',
    email: 'veterinario@lactokeeper.com',
    role: 'Veterinario',
  },
  expires: '2025-12-31',
}

export const mockUseSessionGanadero = {
  data: mockSessionGanadero,
  status: 'authenticated',
  update: jest.fn(),
}

export const mockUseSessionAdministrador = {
  data: mockSessionAdministrador,
  status: 'authenticated',
  update: jest.fn(),
}

export const mockUseSessionVeterinario = {
  data: mockSessionVeterinario,
  status: 'authenticated',
  update: jest.fn(),
}

export const mockUseSessionUnauthenticated = {
  data: null,
  status: 'unauthenticated',
  update: jest.fn(),
}

export const mockUseSessionLoading = {
  data: null,
  status: 'loading',
  update: jest.fn(),
}

// Objeto con sesiones agrupadas para facilitar el acceso en tests
export const mockSessions = {
  ganadero: mockSessionGanadero,
  administrador: mockSessionAdministrador,
  veterinario: mockSessionVeterinario,
};
