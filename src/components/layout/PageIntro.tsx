import { ReactNode } from "react";
import { AppBadge, GlassPanel } from "../ui";

type PageIntroProps = {
  actions?: ReactNode;
  badge?: string;
  description: string;
  title: string;
};

export function PageIntro({
  actions,
  badge,
  description,
  title,
}: PageIntroProps) {
  return (
    <GlassPanel
      as="section"
      className="overflow-hidden p-5 sm:p-6"
      tone="light"
    >
      <div className="flex items-start justify-between gap-6 max-md:flex-col">
        <div className="min-w-0 max-w-3xl">
          {badge ?? title ? (
            <AppBadge variant="primary">{badge ?? title}</AppBadge>
          ) : null}
          <h2 className="mt-4 text-page text-app-text">{title}</h2>
          <p className="mt-2 text-base leading-6 text-app-muted">{description}</p>
        </div>
        {actions ? (
          <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
            {actions}
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
