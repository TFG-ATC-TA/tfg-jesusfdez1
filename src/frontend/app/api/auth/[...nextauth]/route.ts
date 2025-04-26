import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text"},
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
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
  pages: {
    signIn: '/',
  },
  callbacks: {
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
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }

