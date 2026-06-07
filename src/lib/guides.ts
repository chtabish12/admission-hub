// Curated, real-world step-by-step admission & visa guides.
// Each guide is country/route specific and includes per-step costs, documents
// and notes so students know exactly what to do and what it costs.

export type GuideCost = {
  amount: number;
  currency: "PKR" | "GBP" | "USD" | "EUR";
  approx?: boolean;
  /** e.g. refundable bank-statement funds */
  refundable?: boolean;
  note?: string;
};

export type GuideStep = {
  title: string;
  cost: GuideCost;
  description?: string;
  bullets?: string[];
  documents?: string[];
};

export type Guide = {
  slug: string;
  country: string;
  flag: string;
  title: string;
  summary: string;
  level: string;
  durationNote: string;
  currencyNote: string;
  steps: GuideStep[];
};

export const GUIDES: Guide[] = [
  {
    slug: "uk-student-visa",
    country: "UK",
    flag: "🇬🇧",
    title: "UK Study & Student Visa — step by step",
    summary:
      "A real, end-to-end walkthrough for applying to UK universities and securing a UK student visa from Pakistan — with the documents and costs you'll need at each stage.",
    level: "Undergraduate / Postgraduate",
    durationNote: "Plan for ~3–6 months end to end",
    currencyNote:
      "Many amounts are based on $/£ conversions, so exchange-rate changes apply and overall amounts may vary.",
    steps: [
      {
        title: "Give IELTS (Academic) test",
        cost: { amount: 46400, currency: "PKR" },
        description:
          "Try to score at least 7; however, many universities also accept 6 (no module's score should be less than 5.5).",
      },
      {
        title: "Apply to universities",
        cost: { amount: 0, currency: "GBP" },
        description:
          "Apply to several universities. Most UK universities have no application fee, so always keep multiple options to choose from later.",
        documents: [
          "Current passport",
          "IELTS Academic",
          "O Level / Matric degree",
          "A Level / FSc degree",
          "BSc degree",
          "BSc transcript",
          "SOP (Statement of Purpose / Personal Statement)",
          "CV (if any)",
        ],
        bullets: [
          "Wait for responses — some universities may schedule a short interview",
          "Some may send a conditional offer and request further documents",
          "Eventually the university sends an unconditional offer",
        ],
      },
      {
        title: "Accept the unconditional offer",
        cost: { amount: 3000, currency: "GBP" },
        description:
          "On accepting the unconditional offer you'll pay a deposit — a portion of your tuition fee (£3,000 in this example).",
      },
      {
        title: "University issues your CAS letter",
        cost: { amount: 0, currency: "GBP" },
        description:
          "The Confirmation of Acceptance for Studies can take up to a few weeks. Stay in touch with the university and email them if there's any delay.",
      },
      {
        title: "Maintain your bank statement",
        cost: { amount: 17407, currency: "GBP", approx: true, refundable: true, note: "Held for the statement only — can be withdrawn later." },
        description:
          "While you wait for the CAS, prepare your bank statement. It must be in your name or your parent/legal guardian's name, and cover 28 consecutive days.",
        bullets: [
          "Formula: Remaining tuition fee + (9 × living cost per month)",
          "Remaining tuition fee = Total tuition fee − deposit fee",
          "Living cost in London: £1,334 / month",
          "Living cost outside London: £1,023 / month",
          "Example: (11,200 − 3,000) + (9 × 1,023) = £17,407",
        ],
      },
      {
        title: "Get your TB test done",
        cost: { amount: 11000, currency: "PKR" },
        description:
          "While you wait for CAS and prepare the bank statement, get your TB test done. It's only available at selected centers — book an appointment and bring your passport and passport-size pictures (e.g. Aziz Medical Center, Canal Road).",
      },
      {
        title: "Apply for the student visa",
        cost: { amount: 93022, currency: "PKR" },
        description:
          "Once your bank statement is ready and you've received your CAS, apply for the student visa. You cannot proceed without the CAS number from your CAS letter.",
        documents: [
          "Current passport",
          "Personal bank statements",
          "Birth certificate",
          "Letter of permission from parent(s)/guardian(s) confirming use of their money and relationship to you",
          "CAS letter",
          "TB test",
          "IELTS Academic",
          "O Level / Matric degree",
          "A Level / FSc degree",
          "BSc degree",
          "BSc transcript",
          "CV (if any)",
        ],
      },
      {
        title: "Pay the IHS (health insurance) fee",
        cost: { amount: 188792, currency: "PKR" },
        description:
          "After submitting the visa application you'll be routed to pay the Immigration Health Surcharge on the same site, paid the same way as the visa fee.",
      },
      {
        title: "Set up biometric verification appointment",
        cost: { amount: 7000, currency: "PKR", approx: true },
        description:
          "The last step of the application is booking a biometric appointment. Optional add-ons (SMS notifications, document check, etc.) add to this amount.",
      },
      {
        title: "Get your biometric verification done",
        cost: { amount: 0, currency: "PKR" },
        description:
          "On your appointment date, visit the visa application center / UK embassy and complete biometric verification.",
      },
      {
        title: "Collect your visa",
        cost: { amount: 0, currency: "PKR" },
        description:
          "After biometric verification, wait around 6 weeks for your visa — ideally you'll receive it within about 15 working days.",
      },
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}

/** Sum costs grouped by currency (ignores zero amounts). */
export function totalsByCurrency(steps: GuideStep[]) {
  const totals: Record<string, { amount: number; refundable: number }> = {};
  for (const s of steps) {
    const { amount, currency, refundable } = s.cost;
    if (!amount) continue;
    totals[currency] ??= { amount: 0, refundable: 0 };
    totals[currency].amount += amount;
    if (refundable) totals[currency].refundable += amount;
  }
  return totals;
}

export function formatGuideCost(cost: GuideCost) {
  if (cost.amount === 0) return "Free";
  const symbols: Record<string, string> = {
    PKR: "Rs. ",
    GBP: "£",
    USD: "$",
    EUR: "€",
  };
  const prefix = cost.approx ? "~" : "";
  return `${prefix}${symbols[cost.currency]}${cost.amount.toLocaleString()}`;
}
