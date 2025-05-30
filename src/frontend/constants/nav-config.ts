// Configuración de navegación para el middleware (sin componentes React)
export interface NavRoute {
  href: string;
  roles: string[];
}

export const navRoutes: NavRoute[] = [
  { href: '/farms', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'] },
  { href: '/users', roles: ['Administrador'] },
  { href: '/devices', roles: ['Administrador'] },
  { href: '/notifications', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'] },
];
