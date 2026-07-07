export type PlanId = "free" | "plus" | "pro";

export type PaidPlanId = Exclude<PlanId, "free">;

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  credits: number;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    credits: 3,
  },
  plus: {
    id: "plus",
    name: "Plus",
    priceCents: 900,
    credits: 30,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 2900,
    credits: 150,
  },
};

export function getPaidPlan(planId: string | null): Plan | null {
  if (planId !== "plus" && planId !== "pro") {
    return null;
  }

  return PLANS[planId];
}

export function formatUsd(cents: number) {
  return (cents / 100).toFixed(2);
}
