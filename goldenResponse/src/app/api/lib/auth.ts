import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/db/client/prismaClient"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {}
      },

      async authorize(credentials:any) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as Record<string, unknown>).id = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = (token as Record<string, string>).id
      }
      return session
    }
  },

  secret: process.env.NEXTAUTH_SECRET
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
    }
  }
}