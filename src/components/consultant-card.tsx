import { MapPin, Star, BadgeCheck, Globe, Phone, ExternalLink } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { parseList } from "@/lib/utils";
import { ConnectButton } from "@/components/connect-button";

export type ConsultantCardData = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  country: string;
  city: string;
  specialties: string; // JSON string
  fields: string; // JSON string
  bio: string;
  rating: number;
  reviews: number;
  approved: boolean;
  source: string;
  website?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
};

export function ConsultantCard({
  c,
  isLoggedIn = false,
}: {
  c: ConsultantCardData;
  isLoggedIn?: boolean;
}) {
  const specialties = parseList(c.specialties);
  const fields = parseList(c.fields);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
          {c.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold">{c.name}</h3>
            {c.approved && c.source === "PLATFORM" && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
            )}
          </div>
          {c.company && (
            <p className="truncate text-sm text-muted-foreground">{c.company}</p>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {c.city}, {c.country}
          </p>
        </div>
        {c.source === "GOOGLE" ? (
          <Badge variant="outline">Google</Badge>
        ) : c.approved ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <Badge>Pending</Badge>
        )}
      </div>

      {c.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>
      )}

      {(specialties.length > 0 || fields.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {specialties.slice(0, 3).map((s) => (
            <Badge key={`s-${s}`} variant="outline">
              {s}
            </Badge>
          ))}
          {fields.slice(0, 2).map((f) => (
            <Badge key={`f-${f}`}>{f}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{c.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({c.reviews})</span>
          </span>
          <div className="flex gap-1.5">
            {c.phone && (
              <a href={`tel:${c.phone}`} aria-label="Call">
                <Button variant="outline" size="sm">
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  {c.source === "GOOGLE" ? (
                    <ExternalLink className="h-3.5 w-3.5" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                  View
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Connecting with an approved consultant requires an account. */}
        {c.source === "PLATFORM" && c.approved && (
          <div className="mt-3">
            <ConnectButton
              isLoggedIn={isLoggedIn}
              email={c.email}
              phone={c.phone}
              name={c.name}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
