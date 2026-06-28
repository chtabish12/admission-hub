import { prisma } from "@/lib/prisma";
import { FIELDS } from "@/lib/constants";
import { toExternalUrl } from "@/lib/utils";

/**
 * Auto-fetch real universities from the public Hipolabs API
 * (http://universities.hipolabs.com). That dataset has names, countries and
 * websites but no fees/ranking, so we enrich each record with sensible,
 * country-based estimates so the platform stays useful out of the box.
 *
 * Works for ANY country the user searches for — known countries get tuned fee
 * estimates, anything else falls back to a generic global estimate.
 */

// Maps our short country labels to the API's full names. Anything not listed
// here is sent to the API as-is (so "France", "Japan", etc. all work).
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

// Rough annual tuition (USD unless noted) + currency per country, used for
// estimates. Keyed by the label we store on the record.
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
  France: { min: 200, max: 12000, currency: "EUR" },
  Italy: { min: 1000, max: 12000, currency: "EUR" },
  Spain: { min: 1500, max: 13000, currency: "EUR" },
  Ireland: { min: 10000, max: 25000, currency: "EUR" },
  Sweden: { min: 0, max: 18000, currency: "EUR" },
  Japan: { min: 5000, max: 12000, currency: "USD" },
  China: { min: 3000, max: 10000, currency: "USD" },
  "New Zealand": { min: 18000, max: 35000, currency: "NZD" },
  India: { min: 1000, max: 8000, currency: "USD" },
  "United Arab Emirates": { min: 10000, max: 30000, currency: "USD" },
  Malaysia: { min: 4000, max: 12000, currency: "USD" },
  Turkey: { min: 2000, max: 10000, currency: "USD" },
};

// Used when we have no tuned estimate for a country.
const DEFAULT_FEES = { min: 5000, max: 30000, currency: "USD" };

// Hipolabs doesn't expose per-university programs, so we list the full course
// catalogue — this lets students filter/select any course on any university.
const DEFAULT_FIELDS = FIELDS;

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

/** Title-cases free-text input so "france" / "FRANCE" become "France". */
function normalizeCountry(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Fetch universities for a single country from the public API, enrich them
 * with fee/requirement estimates and store any new ones in the database.
 * Accepts any country name (short labels like "USA"/"UK" are mapped to the
 * API's full names automatically). New rows are inserted in a single bulk
 * write so we can store plenty per country (for proper pagination) cheaply.
 */
export async function fetchUniversitiesForCountry(
  rawCountry: string,
  perCountry = 60
): Promise<{ added: number; scanned: number; country: string }> {
  const label = COUNTRY_MAP[rawCountry] ? rawCountry : normalizeCountry(rawCountry);
  const fullName = COUNTRY_MAP[rawCountry] ?? label;
  const fees = COUNTRY_FEES[label] ?? DEFAULT_FEES;

  try {
    const res = await fetch(
      `http://universities.hipolabs.com/search?country=${encodeURIComponent(fullName)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { added: 0, scanned: 0, country: label };
    const list: HipoUni[] = await res.json();

    // De-duplicate the API response by name, then cap to the page budget.
    const seen = new Set<string>();
    const slice = list
      .filter((u) => {
        if (!u.name || seen.has(u.name)) return false;
        seen.add(u.name);
        return true;
      })
      .slice(0, perCountry);
    const scanned = slice.length;

    // Skip universities we already stored for this country (one query, not N).
    const existing = await prisma.university.findMany({
      where: { country: label, name: { in: slice.map((u) => u.name) } },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name));
    const toCreate = slice.filter((u) => !existingNames.has(u.name));

    if (toCreate.length > 0) {
      await prisma.university.createMany({
        data: toCreate.map((u) => ({
          name: u.name,
          country: label,
          city: u["state-province"]?.trim() || label,
          ranking: null,
          description: `${u.name} is a recognised higher-education institution in ${label}, offering a broad range of undergraduate and postgraduate programs.`,
          fields: JSON.stringify(DEFAULT_FIELDS),
          tuitionMin: fees.min,
          tuitionMax: fees.max,
          currency: fees.currency,
          acceptanceRate: null,
          website: toExternalUrl(u.web_pages?.[0]),
          imageUrl: null,
          requirements: JSON.stringify(DEFAULT_REQUIREMENTS),
          applicationSteps: JSON.stringify(DEFAULT_STEPS),
          deadlines: JSON.stringify([{ term: "Main intake", date: "Rolling" }]),
        })),
      });
    }

    return { added: toCreate.length, scanned, country: label };
  } catch (err) {
    console.error(`Fetch failed for ${fullName}:`, err);
    return { added: 0, scanned: 0, country: label };
  }
}

/** Bulk-sync the built-in list of countries (used by the admin sync endpoint). */
export async function syncUniversities(perCountry = 12) {
  let added = 0;
  let scanned = 0;

  for (const shortName of Object.keys(COUNTRY_MAP)) {
    const result = await fetchUniversitiesForCountry(shortName, perCountry);
    added += result.added;
    scanned += result.scanned;
  }

  return { added, scanned };
}
