import { ReactNode, useId } from "react";
import { cn } from "../../lib/classNames";

type FormFieldProps = {
  children: (fieldId: string) => ReactNode;
  className?: string;
  error?: string;
  helperText?: string;
  label: string;
};

export function FormField({
  children,
  className,
  error,
  helperText,
  label,
}: FormFieldProps) {
  const fieldId = useId();

  return (
    <label className={cn("grid min-w-0 gap-2", className)} htmlFor={fieldId}>
      <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
        {label}
      </span>
      {children(fieldId)}
      {helperText && !error ? (
        <span className="text-caption text-app-muted">{helperText}</span>
      ) : null}
      {error ? (
        <span className="text-caption font-semibold text-app-danger">{error}</span>
      ) : null}
    </label>
  );
}

export function FormSection({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-app-sm border border-white/70 bg-white/52 p-4 shadow-app-soft backdrop-blur-xl",
        className,
      )}
    >
      {(title || description) && (
        <div>
          {title ? <h3 className="text-card text-app-text">{title}</h3> : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-app-muted">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
