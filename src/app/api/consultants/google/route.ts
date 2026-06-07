import { NextResponse } from "next/server";

export type GoogleConsultant = {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  rating: number;
  reviews: number;
  website?: string;
  phone?: string;
  source: "GOOGLE";
};

/**
 * Fetch nearby education consultants from Google.
 * Uses the Google Places "Text Search" API when GOOGLE_PLACES_API_KEY is set,
 * otherwise returns realistic mock results so the feature works out of the box.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || "";
  const country = searchParams.get("country")?.trim() || "";
  const field = searchParams.get("field")?.trim() || "";

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const location = [city, country].filter(Boolean).join(", ") || "your area";

  if (apiKey) {
    try {
      const query = `education / university admission consultants in ${location}`;
      const url = new URL(
        "https://maps.googleapis.com/maps/api/place/textsearch/json"
      );
      url.searchParams.set("query", query);
      url.searchParams.set("key", apiKey);

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      const data = await res.json();

      if (data.status === "OK" && Array.isArray(data.results)) {
        const results: GoogleConsultant[] = data.results
          .slice(0, 12)
          .map((p: any) => ({
            id: p.place_id,
            name: p.name,
            address: p.formatted_address,
            city,
            country,
            rating: p.rating ?? 0,
            reviews: p.user_ratings_total ?? 0,
            source: "GOOGLE" as const,
          }));
        return NextResponse.json({ results, live: true });
      }
    } catch (err) {
      console.error("Google Places error:", err);
      // fall through to mock data
    }
  }

  return NextResponse.json({
    results: mockResults(city, country, field),
    live: false,
  });
}

function mockResults(
  city: string,
  country: string,
  field: string
): GoogleConsultant[] {
  const place = city || country || "City";
  const focus = field ? ` (${field})` : "";
  const names = [
    "Horizon Study Abroad",
    "Apex Education Consultants",
    "NextStep Career & Admissions",
    "Pinnacle Overseas Advisors",
    "Summit Global Education",
    "Elite Pathway Consultants",
  ];
  return names.map((n, i) => ({
    id: `mock-${i}-${place}`,
    name: `${n}${focus}`,
    city: city || "—",
    country: country || "—",
    address: `${100 + i * 7} Main Street, ${place}`,
    rating: Number((4.2 + (i % 5) * 0.15).toFixed(1)),
    reviews: 40 + i * 23,
    phone: `+1 555 0${100 + i}`,
    website: `https://example.com/${n.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    source: "GOOGLE" as const,
  }));
}
