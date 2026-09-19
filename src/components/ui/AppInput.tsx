import { InputHTMLAttributes, TextareaHTMLAttributes, useId } from "react";
import { cn } from "../../lib/classNames";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

const fieldClass =
  "w-full min-w-0 rounded-app-sm border border-[rgba(60,38,52,0.1)] bg-white/70 px-3.5 py-3 text-sm text-app-text shadow-none outline-none transition duration-200 placeholder:text-app-muted/58 focus:border-app-primary/45 focus:bg-white focus:ring-4 focus:ring-app-primary/15 disabled:bg-white/38 disabled:text-app-muted";

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
          fieldClass,
          error &&
            "border-app-danger bg-app-danger/5 focus:border-app-danger focus:ring-app-danger/15",
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-caption font-semibold text-app-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </>
  );
}

type AppTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export function AppTextarea({ className, error, id, ...props }: AppTextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <>
      <textarea
        aria-describedby={error ? errorId : props["aria-describedby"]}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn(
          fieldClass,
          "min-h-28 resize-y",
          error &&
            "border-app-danger bg-app-danger/5 focus:border-app-danger focus:ring-app-danger/15",
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-caption font-semibold text-app-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </>
  );
}
