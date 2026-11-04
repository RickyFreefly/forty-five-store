import type { ReactNode } from "react";

interface DashboardPanelProps {
  title: string;
  index: string;
  children: ReactNode;
  className?: string;
  as?: "div" | "button";
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

/** Shared chrome for every CategoryDashboard panel — dark card, hairline border, numbered header. */
export function DashboardPanel({
  title,
  index,
  children,
  className,
  as = "div",
  onClick,
  ariaLabel,
  ariaExpanded,
  ariaControls,
}: DashboardPanelProps) {
  const headerRow = (
    <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
      <span className="font-display text-[11px] leading-tight font-semibold tracking-[0.1em] text-paper uppercase">
        {title}
      </span>
      <span className="font-display tnum text-[11px] text-paper-dim">{index}</span>
    </div>
  );

  const body = <div className="flex flex-1 flex-col">{children}</div>;

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        className={`group flex h-full w-full flex-col border border-line bg-surface text-left transition hover:border-orange focus-visible:border-orange focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${className ?? ""}`}
      >
        {headerRow}
        {body}
      </button>
    );
  }

  return (
    <div className={`flex flex-col border border-line bg-surface ${className ?? ""}`}>
      {headerRow}
      {body}
    </div>
  );
}
