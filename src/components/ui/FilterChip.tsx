import { ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/classNames";

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
};

export function FilterChip({
  active = false,
  children,
  className,
  type = "button",
  ...props
}: FilterChipProps) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-primary/20 disabled:cursor-not-allowed disabled:opacity-55",
        active
          ? "border-app-primary/22 bg-app-primary/10 text-app-text"
          : "border-[rgba(60,38,52,0.08)] bg-white/54 text-app-muted hover:bg-white/76 hover:text-app-text",
        className,
      )}
      type={type}
      {...props}
    >
      {active ? (
        <Check className="h-4 w-4 text-app-primary" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
