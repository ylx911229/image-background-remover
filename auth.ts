import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"
import { getCloudflareContext } from "@cloudflare/next-on-pages"

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  let adapter: ReturnType<typeof D1Adapter> | undefined
  
  try {
    const { env } = getCloudflareContext()
    if ((env as any).DB) {
      adapter = D1Adapter((env as any).DB)
    }
  } catch {
    // 本地开发环境无 CF context
  }
  
  return {
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    ],
    adapter,
    session: { strategy: adapter ? "database" : "jwt" },
    trustHost: true,
    // 不设置自定义 signIn 页面，用 next-auth 默认页面
  }
})
