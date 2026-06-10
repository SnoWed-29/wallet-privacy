import { InputHTMLAttributes, useId } from "react";
import { cn } from "../../lib/classNames";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function AppInput({ className, error, id, ...props }: AppInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <>
      <input
        aria-describedby={error ? errorId : props["aria-describedby"]}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn(
          "w-full min-w-0 rounded-app-sm border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-app-text outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/15",
          error && "border-app-danger bg-red-50 focus:border-app-danger focus:ring-red-500/15",
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-sm font-semibold text-app-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </>
  );
}
