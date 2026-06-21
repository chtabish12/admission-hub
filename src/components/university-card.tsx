import Link from "next/link";
import { MapPin, TrendingUp } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { UniversityThumb } from "@/components/university-thumb";
import { formatMoney, parseList } from "@/lib/utils";

export type UniversityCardData = {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking: number | null;
  description: string;
  fields: string;
  tuitionMin: number;
  tuitionMax: number;
  currency: string;
  acceptanceRate: number | null;
  website: string | null;
  imageUrl: string | null;
};

export function UniversityCard({
  uni,
  course,
}: {
  uni: UniversityCardData;
  course?: string;
}) {
  const fields = parseList(uni.fields);
  const href = course
    ? `/universities/${uni.id}?course=${encodeURIComponent(course)}`
    : `/universities/${uni.id}`;
  return (
    <Link href={href} className="group">
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-40 w-full overflow-hidden bg-secondary">
          <UniversityThumb imageUrl={uni.imageUrl} name={uni.name} />
          {uni.ranking && (
            <Badge className="absolute left-3 top-3 bg-background/90 backdrop-blur">
              #{uni.ranking} World
            </Badge>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 className="font-semibold leading-tight group-hover:text-primary">
              {uni.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {uni.city}, {uni.country}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {fields.slice(0, 3).map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
            {fields.length > 3 && (
              <Badge variant="outline">+{fields.length - 3}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="font-medium">
              {formatMoney(uni.tuitionMin, uni.currency)}
              <span className="text-muted-foreground"> / yr</span>
            </span>
            {uni.acceptanceRate != null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                {uni.acceptanceRate}% accept
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
