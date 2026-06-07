import { cn } from "@/lib/utils";

/** AdmissionHub logo — a graduation cap formed from a location pin. */
export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          aria-hidden="true"
        >
          {/* graduation cap */}
          <path
            d="M12 3 2 8l10 5 10-5-10-5Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          <path
            d="M6 10.5V14c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M21 8v4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight">
          Admission<span className="gradient-text">Hub</span>
        </span>
      )}
    </span>
  );
}
