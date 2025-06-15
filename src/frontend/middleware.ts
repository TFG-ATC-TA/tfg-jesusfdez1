import { NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { NextRequest } from 'next/server'

// Importa la configuración de navegación (sin componentes React)
import { navRoutes } from './constants/nav-config'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isLoginPage = req.nextUrl.pathname === '/login'
  
  // Función para verificar si una ruta está permitida para un rol
  const isRouteAllowed = (pathname: string, userRole: string) => {
    return navRoutes.some(route => 
      pathname.startsWith(route.href) && route.roles.includes(userRole)
    )
  }

  // Manejo de página de login
  if (isLoginPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Si no está autenticado, redirigir al login
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si está autenticado, verificar permisos para rutas protegidas
  const userRole = token.role as string
  const pathname = req.nextUrl.pathname

  // Permitir acceso a la ruta raíz
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Para rutas conocidas (en navRoutes), verificar permisos
  const isKnownRoute = navRoutes.some(route => pathname.startsWith(route.href))
  
  if (isKnownRoute && !isRouteAllowed(pathname, userRole)) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Para cualquier otra ruta (incluidas las no existentes), 
  // permitir que Next.js las maneje normalmente
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/farms/:path*', '/users/:path*', '/devices/:path*', '/notifications/:path*', '/login'],
}
