import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type EmptyStateProps = {
  title?: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function EmptyState({ title, children, className, icon }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-app-sm border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-app-muted",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-app-soft">
          {icon}
        </div>
      ) : null}
      {title ? (
        <p className="mb-1 font-extrabold text-slate-700">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
