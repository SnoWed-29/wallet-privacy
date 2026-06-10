import { HTMLAttributes } from "react";
import { cn } from "../../lib/classNames";

type AppBadgeVariant = "income" | "expense" | "success" | "warning" | "neutral";

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: AppBadgeVariant;
};

const badgeVariants: Record<AppBadgeVariant, string> = {
  income: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  expense: "bg-red-50 text-red-700 ring-red-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function AppBadge({
  variant = "neutral",
  className,
  ...props
}: AppBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ring-1",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
