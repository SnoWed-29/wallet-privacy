import { HTMLAttributes } from "react";
import { cn } from "../../lib/classNames";

type AppBadgeVariant =
  | "income"
  | "expense"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary"
  | "peach";

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: AppBadgeVariant;
};

const badgeVariants: Record<AppBadgeVariant, string> = {
  income: "bg-app-income/10 text-app-income ring-app-income/16",
  expense: "bg-app-expense/10 text-app-expense ring-app-expense/16",
  success: "bg-app-success/10 text-app-success ring-app-success/16",
  warning: "bg-app-warning/12 text-app-warning ring-app-warning/18",
  danger: "bg-app-danger/10 text-app-danger ring-app-danger/16",
  info: "bg-app-info/10 text-app-info ring-app-info/16",
  neutral: "bg-white/58 text-app-muted ring-[rgba(60,38,52,0.08)]",
  primary: "bg-app-primary/10 text-app-primary ring-app-primary/16",
  peach: "bg-app-peach/18 text-app-coral ring-app-peach/24",
};

export function AppBadge({
  variant = "neutral",
  className,
  ...props
}: AppBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-caption font-semibold ring-1",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
