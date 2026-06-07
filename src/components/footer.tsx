import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Your complete journey to top universities — discover, plan, apply
            and get expert consultancy, all in one place.
          </p>
        </div>
        <FooterCol
          title="Platform"
          links={[
            { href: "/universities", label: "Find universities" },
            { href: "/consultants", label: "Find consultants" },
            { href: "/guides", label: "Guides" },
            { href: "/how-it-works", label: "How it works" },
            { href: "/dashboard", label: "Dashboard" },
          ]}
        />
        <FooterCol
          title="Get started"
          links={[
            { href: "/signup", label: "Create account" },
            { href: "/login", label: "Log in" },
            { href: "/become-consultant", label: "Become a consultant" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: "/how-it-works", label: "About" },
            { href: "#", label: "Contact" },
            { href: "#", label: "Privacy" },
          ]}
        />
      </div>
      <div className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AdmissionHub. Built for students, worldwide.
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
