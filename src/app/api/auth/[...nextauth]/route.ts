import client from "@/db/index";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth, { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  adapter: MongoDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXT_AUTH_SECRET ?? "secret",
  callbacks: {
    async signIn({ user }: { user: User }) {
      if (!user.email) {
        return false;
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };