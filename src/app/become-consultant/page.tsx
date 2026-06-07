import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsultantApplyForm } from "@/components/consultant-apply-form";

export const metadata = {
  title: "Become a consultant — AdmissionHub",
};

export default async function BecomeConsultantPage() {
  const session = await getSession();
  let existing = null;
  if (session) {
    existing = await prisma.consultant.findUnique({
      where: { userId: session.userId },
    });
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Become a consultant</h1>
        <p className="mt-2 text-muted-foreground">
          Join AdmissionHub&apos;s network. Once an admin approves your profile,
          students will be able to find and connect with you.
        </p>
      </div>

      <ConsultantApplyForm
        isLoggedIn={!!session}
        defaultName={session?.name ?? ""}
        defaultEmail={session?.email ?? ""}
        existing={
          existing
            ? {
                company: existing.company,
                country: existing.country,
                city: existing.city,
                specialties: existing.specialties,
                fields: existing.fields,
                bio: existing.bio,
                website: existing.website,
                phone: existing.phone,
                approved: existing.approved,
              }
            : null
        }
      />
    </div>
  );
}
