import { ButtonHTMLAttributes, ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/classNames";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "subtle";
type AppButtonSize = "sm" | "md" | "lg";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  size?: AppButtonSize;
  variant?: AppButtonVariant;
};

const buttonVariants: Record<AppButtonVariant, string> = {
  primary:
    "border-app-primary bg-app-primary text-white shadow-[0_12px_26px_rgba(156,67,166,0.24)] hover:border-app-primary/90 hover:bg-app-primary/90",
  secondary:
    "border-[rgba(156,67,166,0.18)] bg-white/70 text-app-text shadow-app-soft hover:border-app-primary/30 hover:bg-white",
  danger:
    "border-app-danger bg-app-danger text-white shadow-[0_12px_26px_rgba(219,81,94,0.22)] hover:border-app-danger/90 hover:bg-app-danger/90",
  ghost:
    "border-transparent bg-transparent text-app-muted shadow-none hover:bg-white/58 hover:text-app-text",
  subtle:
    "border-[rgba(60,38,52,0.08)] bg-white/48 text-app-text shadow-none hover:bg-white/72",
};

const buttonSizes: Record<AppButtonSize, string> = {
  sm: "min-h-9 rounded-app-xs px-3 py-1.5 text-caption font-semibold",
  md: "min-h-10 rounded-app-sm px-4 py-2 text-sm font-semibold",
  lg: "min-h-12 rounded-app-sm px-5 py-3 text-[0.9375rem] font-semibold",
};

export function AppButton({
  children,
  className,
  icon,
  size = "md",
  trailingIcon,
  type = "button",
  variant = "secondary",
  ...props
}: AppButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 border transition duration-200 motion-reduce:transition-none hover:-translate-y-px active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-primary/20",
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  size?: "sm" | "md";
  tone?: "neutral" | "primary" | "danger";
};

const iconButtonTone = {
  neutral: "border-[rgba(60,38,52,0.08)] bg-white/54 text-app-muted hover:bg-white/78 hover:text-app-text",
  primary:
    "border-app-primary/15 bg-app-primary/10 text-app-primary hover:bg-app-primary/15",
  danger:
    "border-app-danger/15 bg-app-danger/10 text-app-danger hover:bg-app-danger/15",
};

export function IconButton({
  className,
  icon: Icon,
  label,
  size = "md",
  tone = "neutral",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-grid place-items-center border shadow-none transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-primary/20 disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-9 w-9 rounded-app-xs" : "h-10 w-10 rounded-app-sm",
        iconButtonTone[tone],
        className,
      )}
      title={label}
      type={type}
      {...props}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]"} aria-hidden="true" strokeWidth={1.9} />
    </button>
  );
}
