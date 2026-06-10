import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/classNames";

type AppInputProps = InputHTMLAttributes<HTMLInputElement>;

export function AppInput({ className, ...props }: AppInputProps) {
  return (
    <input
      className={cn(
        "w-full min-w-0 rounded-app-sm border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-app-text outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/15",
        className,
      )}
      {...props}
    />
  );
}
