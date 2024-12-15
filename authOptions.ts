import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./lib/prisma";

export const authOptions: NextAuthOptions = {
  // Use Prisma as the adapter for storing user accounts
  adapter: PrismaAdapter(prisma),

  // Configure GitHub as the authentication provider
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,

      // Dynamic scope handling based on user selection
      authorization: {
        params: {
          scope: "read:user user:email repo", // Default to full access
        },
      },

      // Custom profile data mapping
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  // Callbacks to customize session and token
  callbacks: {
    // Customize the session object
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      if (token.provider === "github" && token.accessToken) {
        session.user.accessToken = token.accessToken;
        session.user.provider = "github";
      }
      return session;
    },

    // Customize the JWT token
    async jwt({ token, account, profile }) {
      if (account?.provider === "github") {
        token.accessToken = account.access_token;
        token.provider = "github";
      }

      return token;
    },

    // Customize the sign-in process to handle different scopes
    async signIn({ account }) {
      // You can add additional validation or logging here
      if (account?.provider === "github") {
        // Log the scopes requested during sign-in
        console.log("GitHub Sign-In Scopes:", account.scope);
        return true;
      }
      return true;
    },
  },

  // Customize authentication pages
  pages: {
    signIn: "/auth/sign-in", // Custom sign-in page
    error: "/auth/error", // Uncomment if you want a custom error page
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXT_AUTH_SECRET,
};