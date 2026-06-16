import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type GlassTone = "standard" | "strong" | "light";

type GlassPanelProps = {
  as?: "div" | "section" | "article";
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: GlassTone;
};

const glassToneClass: Record<GlassTone, string> = {
  standard: "glass-surface",
  strong: "glass-surface-strong",
  light: "glass-surface-light",
};

export function GlassPanel({
  as: Component = "div",
  children,
  className,
  id,
  tone = "standard",
}: GlassPanelProps) {
  return (
    <Component
      className={cn("rounded-app p-5", glassToneClass[tone], className)}
      id={id}
    >
      {children}
    </Component>
  );
}

type AppCardProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  id?: string;
  title?: string;
  tone?: GlassTone;
};

export function AppCard({
  actions,
  children,
  className,
  description,
  id,
  title,
  tone = "standard",
}: AppCardProps) {
  return (
    <GlassPanel
      as="section"
      className={cn("scroll-mt-24 p-5 sm:p-6", className)}
      id={id}
      tone={tone}
    >
      {(title || description || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-card text-app-text">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-app-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </GlassPanel>
  );
}

type StatCardTone = "neutral" | "primary" | "income" | "expense" | "warning";

type StatCardProps = {
  detail?: ReactNode;
  icon?: ReactNode;
  label: string;
  tone?: StatCardTone;
  value: ReactNode;
};

const statToneClass: Record<StatCardTone, string> = {
  neutral: "text-app-text",
  primary: "text-app-primary",
  income: "text-app-income",
  expense: "text-app-expense",
  warning: "text-app-warning",
};

const statIconClass: Record<StatCardTone, string> = {
  neutral: "bg-white/72 text-app-muted",
  primary: "bg-app-primary/10 text-app-primary",
  income: "bg-app-income/10 text-app-income",
  expense: "bg-app-expense/10 text-app-expense",
  warning: "bg-app-warning/10 text-app-warning",
};

export function StatCard({
  detail,
  icon,
  label,
  tone = "neutral",
  value,
}: StatCardProps) {
  return (
    <AppCard className="min-h-[8.5rem] p-4 sm:p-5" tone="light">
      <div className="flex h-full min-w-0 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-caption font-medium uppercase tracking-[0.08em] text-app-muted">
            {label}
          </p>
          {icon ? (
            <div
              className={cn(
                "grid h-10 w-10 flex-none place-items-center rounded-app-sm",
                statIconClass[tone],
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>
        <div>
          <strong className={cn("block text-total", statToneClass[tone])}>
            {value}
          </strong>
          {detail ? (
            <p className="mt-1 text-caption font-medium text-app-muted">{detail}</p>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
}
