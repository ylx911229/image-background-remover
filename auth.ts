import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  // D1 binding available in Cloudflare Pages production
  const db = (process.env as any).DB || (req as any).context?.cloudflare?.env?.DB
  
  return {
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    ],
    adapter: db ? D1Adapter(db) : undefined,
    session: { strategy: db ? "database" : "jwt" },
    pages: {
      signIn: "/auth/signin",
    },
    trustHost: true,
  }
})
