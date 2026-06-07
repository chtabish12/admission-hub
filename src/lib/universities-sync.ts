import { prisma } from "@/lib/prisma";

/**
 * Auto-fetch real universities from the public Hipolabs API
 * (http://universities.hipolabs.com). That dataset has names, countries and
 * websites but no fees/ranking, so we enrich each record with sensible,
 * country-based estimates so the platform stays useful out of the box.
 */

// Maps our short country labels to the API's full names.
const COUNTRY_MAP: Record<string, string> = {
  USA: "United States",
  UK: "United Kingdom",
  Canada: "Canada",
  Australia: "Australia",
  Germany: "Germany",
  Singapore: "Singapore",
  Switzerland: "Switzerland",
  Netherlands: "Netherlands",
  Pakistan: "Pakistan",
};

// Rough annual tuition (USD) + currency per country, used for estimates.
const COUNTRY_FEES: Record<string, { min: number; max: number; currency: string }> = {
  USA: { min: 25000, max: 55000, currency: "USD" },
  UK: { min: 18000, max: 40000, currency: "GBP" },
  Canada: { min: 20000, max: 45000, currency: "CAD" },
  Australia: { min: 22000, max: 45000, currency: "AUD" },
  Germany: { min: 0, max: 5000, currency: "EUR" },
  Singapore: { min: 15000, max: 38000, currency: "USD" },
  Switzerland: { min: 1200, max: 4000, currency: "CHF" },
  Netherlands: { min: 8000, max: 20000, currency: "EUR" },
  Pakistan: { min: 4000, max: 12000, currency: "USD" },
};

const DEFAULT_FIELDS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Medicine",
  "Arts",
];

const DEFAULT_REQUIREMENTS = [
  "Completed secondary education / equivalent",
  "English language proficiency (IELTS/TOEFL)",
  "Academic transcripts",
  "Statement of purpose",
];

const DEFAULT_STEPS = [
  { title: "Create an application account", description: "Register on the university's admission portal." },
  { title: "Submit documents", description: "Upload transcripts, test scores and certificates." },
  { title: "Pay application fee", description: "Complete payment or request a waiver." },
  { title: "Track your application", description: "Monitor your status and respond to requests." },
];

type HipoUni = {
  name: string;
  country: string;
  web_pages?: string[];
  "state-province"?: string | null;
};

export async function syncUniversities(perCountry = 12) {
  let added = 0;
  let scanned = 0;

  for (const [shortName, fullName] of Object.entries(COUNTRY_MAP)) {
    try {
      const res = await fetch(
        `http://universities.hipolabs.com/search?country=${encodeURIComponent(fullName)}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;
      const list: HipoUni[] = await res.json();
      const fees = COUNTRY_FEES[shortName];

      for (const u of list.slice(0, perCountry)) {
        scanned++;
        const exists = await prisma.university.findFirst({
          where: { name: u.name, country: shortName },
        });
        if (exists) continue;

        await prisma.university.create({
          data: {
            name: u.name,
            country: shortName,
            city: u["state-province"]?.trim() || shortName,
            ranking: null,
            description: `${u.name} is a recognised higher-education institution in ${shortName}, offering a broad range of undergraduate and postgraduate programs.`,
            fields: JSON.stringify(DEFAULT_FIELDS),
            tuitionMin: fees.min,
            tuitionMax: fees.max,
            currency: fees.currency,
            acceptanceRate: null,
            website: u.web_pages?.[0] ?? null,
            imageUrl: null,
            requirements: JSON.stringify(DEFAULT_REQUIREMENTS),
            applicationSteps: JSON.stringify(DEFAULT_STEPS),
            deadlines: JSON.stringify([{ term: "Main intake", date: "Rolling" }]),
          },
        });
        added++;
      }
    } catch (err) {
      console.error(`Sync failed for ${fullName}:`, err);
    }
  }

  return { added, scanned };
}
