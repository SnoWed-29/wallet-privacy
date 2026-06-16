import { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/classNames";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function AppSelect({ className, ...props }: AppSelectProps) {
  return (
    <select
      className={cn(
        "w-full min-w-0 rounded-app-sm border border-[rgba(60,38,52,0.1)] bg-white/70 px-3.5 py-3 text-sm text-app-text shadow-none outline-none transition duration-200 focus:border-app-primary/45 focus:bg-white focus:ring-4 focus:ring-app-primary/15 disabled:bg-white/38 disabled:text-app-muted",
        className,
      )}
      {...props}
    />
  );
}
