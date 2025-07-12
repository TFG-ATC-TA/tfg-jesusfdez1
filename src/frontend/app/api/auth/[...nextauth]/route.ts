/**
 * Configuración de NextAuth para autenticación
 * Maneja la autenticación con credenciales y comunicación con el backend
 */

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

/**
 * Configuración principal de NextAuth
 * Define el proveedor de credenciales y callbacks para manejo de sesiones
 */
const handler = NextAuth({
  providers: [
    /**
     * Proveedor de credenciales para autenticación con email/password
     * Se comunica con el backend para validar las credenciales
     */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text"},
        password: { label: "Password", type: "password" }
      },
      /**
       * Función de autorización que valida las credenciales con el backend
       * @param credentials - Credenciales del usuario (email, password)
       * @returns Usuario autenticado o null si falla
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Use internal URL for server-side calls in Docker, fallback to public URL
          const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL
          const res = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          })

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error en la autenticación');
          }

          const data = await res.json()
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            surname: data.user.surname,
            role: data.user.role,
            accessToken: data.token
          }
        } catch (error) {
          console.error('Authentication error:', error)
          if (error instanceof Error) {
          throw new Error(error.message || 'Error en la autenticación');
          } else {
            throw new Error('Error en la autenticación');
          }
        }
      }
    })
  ],
  
  // Página personalizada de inicio de sesión
  pages: {
    signIn: '/',
  },
  
  /**
   * Callbacks para manejar tokens y sesiones
   */
  callbacks: {
    /**
     * Callback JWT que se ejecuta cuando se crea o actualiza un token
     * @param token - Token JWT actual
     * @param user - Datos del usuario (solo en login)
     * @returns Token actualizado
     */
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.surname = user.surname
        token.role = user.role
      }
      return token
    },
    
    /**
     * Callback de sesión que se ejecuta en cada petición
     * @param session - Sesión actual
     * @param token - Token JWT
     * @returns Sesión actualizada
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.accessToken = token.accessToken as string
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.surname = token.surname as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  
  // Estrategia de sesión basada en JWT
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }

