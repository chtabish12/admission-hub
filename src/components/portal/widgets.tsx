import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui";

const ACCENTS: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
};

export function StatCard({
  label,
  value,
  change,
  trend = "up",
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  const a = ACCENTS[accent] ?? ACCENTS.emerald;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", a.bg)}>
          <Icon className={cn("h-5 w-5", a.text)} />
        </div>
        {change && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold leading-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BarChart({
  data,
  labels,
  color = "#10b981",
  height = 200,
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex w-full items-end gap-2" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max((v / max) * (height - 28), 4)}px`,
              background: color,
              opacity: 0.35 + (0.65 * v) / max,
            }}
          />
          <span className="text-[10px] text-muted-foreground">{labels[i] ?? ""}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  segments,
  size = 160,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="16" className="stroke-secondary" />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = `${frac * c} ${c}`;
          const el = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset * c}
              transform="rotate(-90 80 80)"
              strokeLinecap="butt"
            />
          );
          offset += frac;
          return el;
        })}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-foreground text-xl font-bold"
        >
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-muted-foreground text-[10px]">
          Total
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  color = "#10b981",
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${(value / 100) * c} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute text-xs font-bold">{label ?? `${value}%`}</span>
    </div>
  );
}

export function Sparkline({
  data,
  color = "#10b981",
  width = 96,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
    )
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
