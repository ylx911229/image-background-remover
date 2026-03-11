"use client"

import { SessionProvider } from "next-auth/react"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PayPalScriptProvider
        options={{
          clientId: "AWpItvsSz5htPWbkgAkzqJXxISN8ei-pGt2kFDPlMfr_T17DMnTkLU0_xM3GFBlUyBmPsBs0PXMfQ2AV",
          currency: "USD",
          components: "buttons",
          intent: "capture",
        }}
      >
        {children}
      </PayPalScriptProvider>
    </SessionProvider>
  )
}
