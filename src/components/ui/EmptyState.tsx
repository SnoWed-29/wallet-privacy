import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type EmptyStateProps = {
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ title, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-app-sm border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-app-muted",
        className,
      )}
    >
      {title ? (
        <p className="mb-1 font-extrabold text-slate-700">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
