export const PAYMENT_FREQUENCIES = ["monthly", "yearly"];

export const TIERS = [
  {
    id: "standard",
    name: "Standard",
    price: {
      monthly: 25,
      yearly: 20,
    },
    description: "Perfect for small businesses getting started with review management",
    features: [
      "Multi-business review management",
      "Review response capabilities",
      "Basic analytics dashboard",
      "Email support",
      "Up to 5 business locations",
    ],
    cta: "Get Started",
  },
  {
    id: "premium",
    name: "Premium",
    price: {
      monthly: 50,
      yearly: 40,
    },
    description: "Advanced features for businesses seeking growth and efficiency",
    features: [
      "Everything in Standard",
      "AI-powered review responses",
      "Advanced analytics",
      "Priority support",
      "Unlimited business locations",
      "Custom response templates",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: {
      monthly: "Custom",
      yearly: "Custom",
    },
    description: "For large organizations with complex needs",
    features: [
      "Everything in Premium",
      "Custom AI training",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "SLA guarantees",
    ],
    cta: "Contact Us",
    highlighted: true,
  }
];