import NextAuth, { DefaultSession } from 'next-auth';

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name: string
      email: string
      surname: string
      role: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    surname: string
    role: string
    accessToken?: string
  }
}
