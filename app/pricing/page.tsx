import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    credits: "3 images/month",
    description: "For quick tests and occasional edits.",
    cta: "Start free",
    planId: "free",
    featured: false,
    features: [
      "Transparent PNG downloads",
      "White or solid color backgrounds",
      "JPG, PNG, and WebP uploads",
      "10 MB file size limit",
    ],
  },
  {
    name: "Plus",
    price: "$9",
    period: "/mo",
    credits: "30 images/month",
    description: "For creators and small shops that need clean cutouts weekly.",
    cta: "Choose Plus",
    planId: "plus",
    featured: true,
    features: [
      "Everything in Free",
      "30 successful removals per month",
      "No watermark on exports",
      "Browser-based white background exports",
      "Best value for light product photo work",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    credits: "150 images/month",
    description: "For ecommerce teams and frequent image cleanup.",
    cta: "Choose Pro",
    planId: "pro",
    featured: false,
    features: [
      "Everything in Plus",
      "150 successful removals per month",
      "Higher monthly processing allowance",
      "Priority for batch workflow upgrades",
      "Built for repeated catalog edits",
    ],
  },
];

const policyItems = [
  "1 credit is used only when a background removal succeeds.",
  "Monthly credits reset each billing cycle and do not roll over.",
  "When credits run out, upgrade or wait for the next cycle.",
  "Your original images are not stored by the app.",
];

const faqs = [
  {
    question: "Why are the plans based on image credits?",
    answer:
      "Each successful background removal has an API cost, so credit limits keep the service predictable while still giving users simple monthly plans.",
  },
  {
    question: "What happens if an image fails?",
    answer:
      "Failed removals should not consume a credit. Credits are intended for successful transparent PNG results.",
  },
  {
    question: "Can I process more than 150 images per month?",
    answer:
      "For now, Pro is the largest public plan. Higher-volume usage should be priced separately so API costs stay under control.",
  },
  {
    question: "Can I cancel later?",
    answer:
      "Yes. The pricing model is designed for monthly subscriptions, so users can downgrade or cancel before the next billing cycle.",
  },
];

export default function PricingPage() {
  return (
    <main>
      <header className="border-b border-line/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="text-base font-semibold text-ink" href="/">
            Image Background Remover
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link className="transition hover:text-ink" href="/pricing">
              Pricing
            </Link>
            <Link className="transition hover:text-ink" href="/#faq">
              FAQ
            </Link>
            <AuthButton />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-coral">
            Simple pricing
          </p>
          <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Pick the monthly image limit that fits your workflow.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Start free, then upgrade when you need more clean cutouts for
            product photos, portraits, logos, and social posts.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              className={[
                "relative flex min-h-[560px] flex-col rounded-lg border bg-white p-6 shadow-sm",
                plan.featured
                  ? "border-gold shadow-tool"
                  : "border-line",
              ].join(" ")}
              key={plan.name}
            >
              {plan.featured ? (
                <span className="absolute right-5 top-5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">
                  Most popular
                </span>
              ) : null}

              <div>
                <h2 className="text-2xl font-bold text-ink">{plan.name}</h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>
                <p className="mt-6 text-sm font-semibold text-mint">
                  {plan.credits}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-normal text-ink">
                    {plan.price}
                  </span>
                  <span className="pb-2 text-base text-slate-500">
                    {plan.period}
                  </span>
                </div>
              </div>

              {plan.planId === "free" ? (
                <Link
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-bold text-ink transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-mint"
                  href="/api/auth/google/start?redirect=/pricing"
                >
                  {plan.cta}
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              ) : (
                <form action="/api/paypal/create-order" method="post">
                  <input name="plan" type="hidden" value={plan.planId} />
                  <button
                    className={[
                      "mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-mint",
                      plan.featured
                        ? "bg-mint text-white hover:bg-teal-600"
                        : "border border-line bg-white text-ink hover:border-slate-400",
                    ].join(" ")}
                    type="submit"
                  >
                    {plan.cta}
                    <ArrowRight aria-hidden="true" size={17} />
                  </button>
                </form>
              )}

              <div className="mt-7 border-t border-line pt-6">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      className="flex gap-3 text-sm leading-6 text-slate-700"
                      key={feature}
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-mint"
                        size={17}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-mint/10 text-mint">
              <ShieldCheck aria-hidden="true" size={23} />
            </div>
            <h2 className="text-2xl font-bold text-ink">Credit rules</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The plans are intentionally small and predictable because every
              successful image uses a paid background-removal API call.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {policyItems.map((item) => (
              <div
                className="rounded-lg border border-line bg-cloud p-5 text-sm leading-6 text-slate-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-ink">Pricing FAQ</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <article
              className="rounded-lg border border-line bg-white p-5"
              key={item.question}
            >
              <h3 className="text-base font-semibold text-ink">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Image Background Remover</span>
          <span>Free, Plus, and Pro plans for transparent PNG exports.</span>
        </div>
      </footer>
    </main>
  );
}
