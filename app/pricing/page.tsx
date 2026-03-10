"use client";

import { useState } from "react";
import Link from "next/link";

type PricingTab = "credits" | "subscription";

const creditPlans = [
  {
    name: "Starter",
    price: "$4.99",
    credits: 10,
    pricePerCredit: "$0.50",
    badge: null,
    features: [
      "10 HD background removals",
      "JPG / PNG / WebP support",
      "Commercial use allowed",
      "Never expires",
    ],
    highlighted: false,
  },
  {
    name: "Popular",
    price: "$12.99",
    credits: 30,
    pricePerCredit: "$0.43",
    badge: "Most Popular",
    features: [
      "30 HD background removals",
      "JPG / PNG / WebP support",
      "Commercial use allowed",
      "Never expires",
      "Save 14% vs Starter",
    ],
    highlighted: true,
  },
  {
    name: "Pro Pack",
    price: "$29.99",
    credits: 80,
    pricePerCredit: "$0.37",
    badge: "Best Value",
    features: [
      "80 HD background removals",
      "JPG / PNG / WebP support",
      "Commercial use allowed",
      "Never expires",
      "Save 26% vs Starter",
    ],
    highlighted: false,
  },
];

const subscriptionPlans = [
  {
    name: "Basic",
    price: "$9.99",
    period: "/ month",
    credits: 25,
    badge: null,
    features: [
      "25 HD removals per month",
      "Credits reset monthly",
      "Commercial use allowed",
      "Cancel anytime",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/ month",
    credits: 60,
    badge: "Best for Teams",
    features: [
      "60 HD removals per month",
      "Credits reset monthly",
      "Commercial use allowed",
      "Priority processing",
      "Cancel anytime",
    ],
    highlighted: true,
  },
];

const faqs = [
  {
    q: "Do credits expire?",
    a: "No! Credit pack credits never expire. Use them whenever you need.",
  },
  {
    q: "What file formats are supported?",
    a: "We support JPG, PNG, and WebP formats up to 10MB per image.",
  },
  {
    q: "Are my images stored?",
    a: "No. Images are processed and immediately deleted. We never store your files.",
  },
  {
    q: "Can I use images for commercial purposes?",
    a: "Yes, all paid plans include commercial use rights.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel anytime from your account settings. No questions asked.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, we offer refunds for unused credits within 7 days of purchase.",
  },
];

export default function PricingPage() {
  const [tab, setTab] = useState<PricingTab>("credits");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleBuy = () => {
    alert("Payment integration coming soon! We'll notify you when it's ready.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Nav */}
      <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-gray-800 hover:text-gray-600">
          🖼️ Image Background Remover
        </Link>
        <Link
          href="/"
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to App
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-500">
            Start free · No subscription required · Credits never expire
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setTab("credits")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "credits"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Credit Packs
            </button>
            <button
              onClick={() => setTab("subscription")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "subscription"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly Subscription
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save up to 20%
              </span>
            </button>
          </div>
        </div>

        {/* Credit Plans */}
        {tab === "credits" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {creditPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border-2 flex flex-col ${
                  plan.highlighted
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.credits} credits · {plan.pricePerCredit} each
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleBuy}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Buy {plan.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Subscription Plans */}
        {tab === "subscription" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border-2 flex flex-col ${
                  plan.highlighted
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.credits} credits per month
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleBuy}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Subscribe to {plan.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-16 text-sm text-gray-500">
          <span>✓ Secure payment</span>
          <span>✓ Cancel anytime</span>
          <span>✓ No hidden fees</span>
          <span>✓ 7-day refund guarantee</span>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <span className="text-gray-400 text-lg">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-500 mb-4">
            Not ready to commit? Start with 3 free credits.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Try for Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
