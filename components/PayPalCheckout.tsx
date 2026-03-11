"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalCheckoutProps {
  type: "order" | "subscription";
  planName: string;
  onSuccess: (data: { creditsAdded?: number; newTotal?: number; subscriptionId?: string }) => void;
  onError?: (err: any) => void;
}

export default function PayPalCheckout({ type, planName, onSuccess, onError }: PayPalCheckoutProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">Loading PayPal...</span>
      </div>
    );
  }

  if (type === "order") {
    return (
      <div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        {processing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm text-center">
            Processing payment...
          </div>
        )}
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
          disabled={processing}
          createOrder={async () => {
            setError(null);
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planName }),
            });
            const data = await res.json() as { orderId?: string; error?: string };
            if (!data.orderId) throw new Error(data.error || "Failed to create order");
            return data.orderId;
          }}
          onApprove={async (data) => {
            setProcessing(true);
            try {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID, planName }),
              });
              const result = await res.json() as { success?: boolean; creditsAdded?: number; newTotal?: number; error?: string };
              if (result.success) {
                onSuccess({ creditsAdded: result.creditsAdded, newTotal: result.newTotal });
              } else {
                setError(result.error || "Payment capture failed");
              }
            } catch (err: any) {
              setError(err.message);
              onError?.(err);
            } finally {
              setProcessing(false);
            }
          }}
          onError={(err) => {
            setError("Payment failed. Please try again.");
            onError?.(err);
          }}
          onCancel={() => {
            setError("Payment cancelled.");
          }}
        />
      </div>
    );
  }

  // Subscription
  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      {processing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm text-center">
          Setting up subscription...
        </div>
      )}
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "subscribe" }}
        disabled={processing}
        createSubscription={async () => {
          setError(null);
          const res = await fetch("/api/paypal/create-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planName }),
          });
          const data = await res.json() as { subscriptionId?: string; error?: string };
          if (!data.subscriptionId) throw new Error(data.error || "Failed to create subscription");
          return data.subscriptionId;
        }}
        onApprove={async (data) => {
          setProcessing(true);
          try {
            onSuccess({ subscriptionId: data.subscriptionID });
          } finally {
            setProcessing(false);
          }
        }}
        onError={(err) => {
          setError("Subscription setup failed. Please try again.");
          onError?.(err);
        }}
        onCancel={() => {
          setError("Subscription cancelled.");
        }}
      />
    </div>
  );
}
