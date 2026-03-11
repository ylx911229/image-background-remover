"use client"

import { SessionProvider } from "next-auth/react"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PayPalScriptProvider
        options={{
          clientId: "AUpQH7LeuVvDSXksc4LxJKeNjW717pyjAr_Uw6e9q-fSTc_BRPeiaTiB9QxRnOaR02DYeh8zUakbVuc0",
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
