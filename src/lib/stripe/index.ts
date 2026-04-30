// Stripe Configuration
// Handles billing, subscriptions, and credit purchases

import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
})

// Credit packages (in credits)
export const CREDIT_PACKAGES = {
    small: { credits: 50_000, priceId: "price_credits_50k" },
    medium: { credits: 100_000, priceId: "price_credits_100k" },
    large: { credits: 500_000, priceId: "price_credits_500k" },
    xlarge: { credits: 1_000_000, priceId: "price_credits_1m" },
} as const

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
    basic: {
        name: "Basic",
        creditsPerMonth: 100_000,
        priceId: "price_sub_basic",
        priceMonthly: 1000, // $10.00 in cents
    },
    pro: {
        name: "Pro",
        creditsPerMonth: 500_000,
        priceId: "price_sub_pro",
        priceMonthly: 5000, // $50.00 in cents
    },
    enterprise: {
        name: "Enterprise",
        creditsPerMonth: 2_000_000,
        priceId: "price_sub_enterprise",
        priceMonthly: 20000, // $200.00 in cents
    },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS
export type CreditPackage = keyof typeof CREDIT_PACKAGES
