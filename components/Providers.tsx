"use client"

import { SessionProvider } from "next-auth/react"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
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
