"use client";

import { CheckCircle2, CircleDollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CreditSummary = {
  freeUsed: number;
  freeRemaining: number;
  purchasedRemaining: number;
  totalRemaining: number;
};

type CreditResponse = {
  authenticated: boolean;
  credits: CreditSummary | null;
};

type CreditStatusProps = {
  compact?: boolean;
};

function getPaymentMessage() {
  if (typeof window === "undefined") {
    return null;
  }

  const payment = new URLSearchParams(window.location.search).get("payment");

  if (payment === "success") {
    return {
      tone: "success" as const,
      title: "Payment successful",
      body: "Your image credits have been added to your account.",
    };
  }

  if (payment === "cancelled") {
    return {
      tone: "neutral" as const,
      title: "Payment cancelled",
      body: "No charge was completed. You can choose a plan whenever you are ready.",
    };
  }

  if (payment === "pending") {
    return {
      tone: "neutral" as const,
      title: "Payment pending",
      body: "PayPal has not completed the capture yet. Credits will appear after confirmation.",
    };
  }

  return null;
}

export function CreditStatus({ compact = false }: CreditStatusProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [credits, setCredits] = useState<CreditSummary | null>(null);
  const paymentMessage = useMemo(() => getPaymentMessage(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadCredits() {
      try {
        const response = await fetch("/api/credits", {
          cache: "no-store",
          credentials: "include",
        });
        const body = (await response.json().catch(() => null)) as
          | CreditResponse
          | null;

        if (!cancelled) {
          setAuthenticated(Boolean(body?.authenticated));
          setCredits(body?.credits || null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCredits();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          Loading credits
        </div>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Image credits</p>
            <p className="mt-1 text-sm text-slate-600">
              Sign in to use your free credits and view purchased credits.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/api/auth/google/start"
          >
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  const freeRemaining = credits?.freeRemaining || 0;
  const purchasedRemaining = credits?.purchasedRemaining || 0;
  const totalRemaining = credits?.totalRemaining || 0;

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      {paymentMessage ? (
        <div
          className={[
            "mb-4 rounded-md border px-3 py-2 text-sm",
            paymentMessage.tone === "success"
              ? "border-mint/30 bg-teal-50 text-teal-900"
              : "border-line bg-cloud text-slate-700",
          ].join(" ")}
        >
          <div className="flex gap-2">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
            <div>
              <p className="font-semibold">{paymentMessage.title}</p>
              <p className="mt-1 leading-5">{paymentMessage.body}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-mint/10 text-mint">
            <CircleDollarSign aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Available credits</p>
            <p className="mt-1 text-sm text-slate-600">
              1 successful background removal uses 1 credit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[320px]">
          <div className="rounded-md border border-line bg-cloud px-3 py-2">
            <p className="text-xl font-bold text-ink">{totalRemaining}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="rounded-md border border-line bg-cloud px-3 py-2">
            <p className="text-xl font-bold text-ink">{purchasedRemaining}</p>
            <p className="text-xs text-slate-500">Paid</p>
          </div>
          <div className="rounded-md border border-line bg-cloud px-3 py-2">
            <p className="text-xl font-bold text-ink">{freeRemaining}</p>
            <p className="text-xs text-slate-500">Free</p>
          </div>
        </div>
      </div>

      {!compact && totalRemaining <= 0 ? (
        <div className="mt-4 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-red-800">
          You are out of credits. Choose Plus or Pro to keep processing images.
        </div>
      ) : null}
    </section>
  );
}
