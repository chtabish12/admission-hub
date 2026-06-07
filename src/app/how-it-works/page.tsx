import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JOURNEY_STEPS } from "@/lib/journey";
import { Button, Card, Badge } from "@/components/ui";

export const metadata = {
  title: "How it works — AdmissionHub",
};

export default function HowItWorksPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="mb-4">The AdmissionHub journey</Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          Your path to university, in {JOURNEY_STEPS.length} clear steps
        </h1>
        <p className="mt-4 text-muted-foreground">
          Everything you need — from discovering the right university to landing
          and starting your studies abroad. Browse it all freely; create an
          account whenever you want to track progress or connect with a
          consultant.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-3xl space-y-6">
        {JOURNEY_STEPS.map((step, i) => (
          <div key={step.key} className="flex gap-5">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
                {i + 1}
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <div className="my-2 w-0.5 flex-1 bg-border" />
              )}
            </div>
            <Card className="mb-2 flex-1 p-6">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-muted-foreground">{step.description}</p>
              <ul className="mt-4 space-y-2">
                {step.details.map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {d}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ))}
      </div>

      <Card className="mx-auto mt-12 max-w-3xl bg-gradient-to-br from-primary to-accent p-8 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold">Ready to begin?</h2>
        <p className="mx-auto mt-2 max-w-md text-primary-foreground/90">
          Create a free account to track your roadmap and connect with verified
          consultants.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup">
            <Button variant="secondary" size="lg">
              Create free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/universities">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Browse universities
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
