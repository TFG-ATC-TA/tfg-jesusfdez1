/**
 * Layout para páginas de autenticación
 * Proporciona la estructura base para login y otras páginas de auth
 * Incluye configuración de metadatos y cargador de tema
 */

import ThemeColorLoader from '@/components/layout/theme-color-loader';

/**
 * Metadatos específicos para páginas de autenticación
 * Optimiza SEO y experiencia de usuario en páginas de login
 */
export const metadata = {
  title: 'LactoKeeper - Login',
  description: 'Página de autentificación de LactoKeeper',
}

/**
 * Layout de autenticación que envuelve las páginas de login
 * Incluye el cargador de color de tema para consistencia visual
 * @param children - Componentes hijos de las páginas de auth
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Cargador de color de tema para PWA */}
      <ThemeColorLoader />
      {children}
    </>
  )
}
