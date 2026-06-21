"use client";

import { useRouter, usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Select } from "@/components/ui";

/**
 * Picks which course/program the application guide is for. Changing it navigates
 * to ?course=… so the page re-renders with that course's saved progress.
 */
export function CourseSelector({
  courses,
  selected,
}: {
  courses: string[];
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm text-muted-foreground">Course:</span>
      <Select
        value={selected}
        onChange={(e) =>
          router.push(`${pathname}?course=${encodeURIComponent(e.target.value)}`)
        }
        className="h-9 w-auto min-w-[12rem]"
      >
        {courses.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    </div>
  );
}
