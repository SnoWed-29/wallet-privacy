import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/classNames";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
};

const buttonVariants: Record<AppButtonVariant, string> = {
  primary:
    "border-app-primary bg-app-primary text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] hover:bg-emerald-600 hover:border-emerald-600",
  secondary:
    "border-slate-900 bg-slate-900 text-white shadow-[0_10px_22px_rgba(17,24,39,0.14)] hover:bg-slate-700 hover:border-slate-700",
  danger:
    "border-app-danger bg-app-danger text-white shadow-[0_10px_22px_rgba(239,68,68,0.2)] hover:bg-red-600 hover:border-red-600",
  ghost:
    "border-app-border bg-white text-slate-700 shadow-none hover:bg-slate-50",
};

export function AppButton({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-app-sm border px-4 py-2 text-sm font-extrabold transition hover:-translate-y-px hover:shadow-app-soft active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        buttonVariants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
