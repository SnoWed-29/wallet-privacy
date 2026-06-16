import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type EmptyStateProps = {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
};

export function EmptyState({ children, className, icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-app-sm border border-dashed border-[rgba(60,38,52,0.12)] bg-white/48 px-4 py-5 text-sm leading-6 text-app-muted backdrop-blur-xl",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-app-sm bg-app-primary/10 text-app-primary">
          {icon}
        </div>
      ) : null}
      {title ? (
        <p className="mb-1 font-semibold text-app-text">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
