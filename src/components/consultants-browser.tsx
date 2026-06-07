"use client";

import { useMemo, useState } from "react";
import { Globe2, Loader2, MapPin, Search } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { ConsultantCard, type ConsultantCardData } from "@/components/consultant-card";
import { parseList } from "@/lib/utils";
import { COUNTRIES, FIELDS } from "@/lib/constants";
import type { GoogleConsultant } from "@/app/api/consultants/google/route";

export function ConsultantsBrowser({
  platform,
  isLoggedIn,
  defaultCountry = "",
}: {
  platform: ConsultantCardData[];
  isLoggedIn: boolean;
  defaultCountry?: string;
}) {
  const [country, setCountry] = useState(defaultCountry);
  const [city, setCity] = useState("");
  const [field, setField] = useState("");

  const [googleResults, setGoogleResults] = useState<GoogleConsultant[] | null>(
    null
  );
  const [googleLive, setGoogleLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return platform.filter((c) => {
      if (country && c.country !== country) return false;
      if (city && !c.city.toLowerCase().includes(city.toLowerCase()))
        return false;
      if (field && !parseList(c.fields).includes(field)) return false;
      return true;
    });
  }, [platform, country, city, field]);

  async function fetchGoogle() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country) params.set("country", country);
      if (city) params.set("city", city);
      if (field) params.set("field", field);
      const res = await fetch(`/api/consultants/google?${params.toString()}`);
      const data = await res.json();
      setGoogleResults(data.results ?? []);
      setGoogleLive(!!data.live);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="City (e.g. London)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">All fields</option>
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Button onClick={fetchGoogle} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find nearby (Google)
          </Button>
        </div>
      </Card>

      {/* Approved platform consultants */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Verified consultants</h2>
          <p className="text-sm text-muted-foreground">
            Approved consultants who signed up and were vetted on AdmissionHub.
          </p>
        </div>
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No verified consultants match your filters yet. Try the Google search
            above to find experts near you.
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <ConsultantCard key={c.id} c={c} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}
      </section>

      {/* Google-sourced consultants */}
      {googleResults && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-accent" />
            <div>
              <h2 className="text-xl font-semibold">More consultants near you</h2>
              <p className="text-sm text-muted-foreground">
                Sourced from Google{" "}
                {googleLive ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    (live results)
                  </span>
                ) : (
                  <span>
                    (demo data — add a GOOGLE_PLACES_API_KEY for live results)
                  </span>
                )}
              </p>
            </div>
          </div>
          {googleResults.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No nearby consultants found. Try a different city or country.
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {googleResults.map((g) => (
                <ConsultantCard
                  key={g.id}
                  isLoggedIn={isLoggedIn}
                  c={{
                    id: g.id,
                    name: g.name,
                    country: g.country,
                    city: g.city,
                    company: g.address ?? null,
                    specialties: "[]",
                    fields: "[]",
                    bio: g.address ?? "",
                    rating: g.rating,
                    reviews: g.reviews,
                    approved: false,
                    source: "GOOGLE",
                    website: g.website ?? null,
                    phone: g.phone ?? null,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
