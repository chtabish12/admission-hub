import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui";
import { ConsultantsBrowser } from "@/components/consultants-browser";

export const dynamic = "force-dynamic";

export default async function ConsultantsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const consultants = await prisma.consultant.findMany({
    where: { approved: true, source: "PLATFORM" },
    orderBy: { rating: "desc" },
  });

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Find a consultant</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Browse our verified consultants, or discover more experts near you
            sourced live from Google. Anyone can browse — sign in only when
            you&apos;re ready to connect.
          </p>
        </div>
        <Link href="/become-consultant">
          <Button variant="outline">
            <UserPlus className="h-4 w-4" /> Become a consultant
          </Button>
        </Link>
      </div>

      <ConsultantsBrowser
        platform={consultants}
        isLoggedIn={!!session}
        defaultCountry={sp.country ?? ""}
      />
    </div>
  );
}
