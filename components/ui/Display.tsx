import React from "react";
import type { AccountStatus } from "@/lib/cooldown/types";

export const STATUS_COLOR: Record<AccountStatus, string> = {
  // CSS variables so status colors follow the active theme.
  ready: "var(--color-sage)",
  cooldown: "var(--color-caramel)",
  ban: "var(--color-berry)",
};

type CardProps = React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" };

export function Card({ as: Tag = "section", className = "", children, ...rest }: CardProps) {
  return (
    <Tag className={`rounded-[22px] border border-line bg-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function StatusPill({ status, children }: { status: AccountStatus; children: React.ReactNode }) {
  const cls =
    status === "ready"
      ? "bg-sage/12 text-sage"
      : status === "ban"
        ? "bg-berry/12 text-berry-ink"
        : "bg-caramel/12 text-caramel";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium ${cls}`}>
      <span className="size-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
      {children}
    </span>
  );
}

export function Progress({
  value,
  color,
  className = "h-2",
  track = "bg-soft",
  label,
}: {
  value: number;
  color: string;
  className?: string;
  track?: string;
  label?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-label={label}
      className={`rounded-full overflow-hidden ${track} ${className}`}
    >
      <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export function Dot({ color, className = "size-2" }: { color: string; className?: string }) {
  return <span aria-hidden className={`inline-block rounded-full shrink-0 ${className}`} style={{ background: color }} />;
}
