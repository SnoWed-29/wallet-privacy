import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type AppCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AppCard({
  title,
  description,
  actions,
  children,
  className,
  id,
}: AppCardProps) {
  return (
    <section
      className={cn(
        "scroll-mt-24 rounded-app border border-app-border bg-app-card p-6 shadow-app",
        className,
      )}
      id={id}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4 max-sm:flex-col">
          <div>
            {title ? (
              <h2 className="text-lg font-extrabold leading-snug text-app-text">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-app-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
