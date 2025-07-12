/**
 * Configuración de navegación para el middleware
 * Define las rutas disponibles y los roles que pueden acceder a cada una
 * Se usa en el middleware para verificar permisos de acceso
 * Proporciona control de acceso basado en roles (RBAC)
 */

/**
 * Interfaz para definir una ruta de navegación
 * Especifica la URL y los roles autorizados
 * Permite configuración flexible de permisos por ruta
 */
export interface NavRoute {
  href: string;
  roles: string[];
}

/**
 * Array de rutas configuradas con sus permisos de acceso
 * Cada ruta define qué roles pueden acceder a ella
 * Se utiliza en el middleware para validación de acceso
 */
export const navRoutes: NavRoute[] = [
  { href: '/farms', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'] },
  { href: '/users', roles: ['Administrador'] },
  { href: '/devices', roles: ['Administrador'] },
  { href: '/notifications', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'] },
];
