/**
 * Middleware de Next.js para autenticación y autorización
 * Maneja la protección de rutas basada en roles de usuario
 * Proporciona control de acceso granular y redirecciones inteligentes
 */

import { NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { NextRequest } from 'next/server'

// Importa la configuración de navegación (sin componentes React)
import { navRoutes } from './constants/nav-config'

/**
 * Middleware principal que se ejecuta en cada petición
 * Verifica autenticación y autorización basada en roles
 * Implementa RBAC (Role-Based Access Control) para seguridad
 * @param req - Petición de Next.js
 * @returns NextResponse con redirección o continuación
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isLoginPage = req.nextUrl.pathname === '/login'
  
  /**
   * Función para verificar si una ruta está permitida para un rol específico
   * Compara la ruta actual con la configuración de permisos
   * @param pathname - Ruta a verificar
   * @param userRole - Rol del usuario autenticado
   * @returns boolean - True si el rol tiene acceso a la ruta
   */
  const isRouteAllowed = (pathname: string, userRole: string) => {
    return navRoutes.some(route => 
      pathname.startsWith(route.href) && route.roles.includes(userRole)
    )
  }

  // Manejo de página de login
  if (isLoginPage) {
    if (isAuth) {
      // Si ya está autenticado, redirigir al dashboard
      return NextResponse.redirect(new URL('/', req.url))
    }
    // Si no está autenticado, permitir acceso al login
    return NextResponse.next()
  }

  // Si no está autenticado, redirigir al login
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si está autenticado, verificar permisos para rutas protegidas
  const userRole = token.role as string
  const pathname = req.nextUrl.pathname

  // Permitir acceso a la ruta raíz (dashboard)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Para rutas conocidas (en navRoutes), verificar permisos
  const isKnownRoute = navRoutes.some(route => pathname.startsWith(route.href))
  
  if (isKnownRoute && !isRouteAllowed(pathname, userRole)) {
    // Si no tiene permisos, redirigir al dashboard
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Para cualquier otra ruta (incluidas las no existentes), 
  // permitir que Next.js las maneje normalmente
  return NextResponse.next()
}

/**
 * Configuración del middleware
 * Define las rutas que deben ser procesadas por el middleware
 * Incluye rutas principales y subrutas con comodines
 */
export const config = {
  matcher: ['/', '/farms/:path*', '/users/:path*', '/devices/:path*', '/notifications/:path*', '/login'],
}
