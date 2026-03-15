import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/utils/db";
import { nanoid } from "nanoid";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Find user by email
        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // Validate password
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password!
        );

        if (!isPasswordCorrect) return null;

        // Return user object
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
    // Add OAuth providers here if needed:
    // GoogleProvider({ clientId, clientSecret })
    // GithubProvider({ clientId, clientSecret })
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Credentials login
      if (account?.provider === "credentials") return true;

      // OAuth login
      if (account?.provider === "github" || account?.provider === "google") {
        const existingUser = await prisma.user.findFirst({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: nanoid(),
              email: user.email!,
              role: "user",
              password: null, // OAuth users don't need a password
            },
          });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },

  jwt: {
    maxAge: 15 * 60, // 15 minutes
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};