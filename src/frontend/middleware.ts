import { NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { NextRequest } from 'next/server'

// Importa los datos de navegación
import { navItems } from './constants/data'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isAuthPage = req.nextUrl.pathname === '/'
  
  // Función para verificar si una ruta está permitida para un rol
  const isRouteAllowed = (pathname: string, userRole: string) => {
    return navItems.some(item => 
      pathname.startsWith(item.href) && item.roles.includes(userRole)
    )
  }


  if (isAuthPage) {
    if (isAuth) {
      const userRole = token.role as string
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!isAuth) {
    // Redirect to the login page if not authenticated
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si el usuario está autenticado, verifica el acceso basado en el rol
  const userRole = token.role as string
  const pathname = req.nextUrl.pathname

  if (pathname === '/dashboard') {
    return NextResponse.next();
  } else if (pathname.startsWith('/dashboard')) {
    if (!isRouteAllowed(pathname, userRole)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    // Verifica si la ruta existe en navItems
    const exists = navItems.some(item => pathname === item.href)
    if (!exists) {
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard', '/dashboard/:path*'],
}
