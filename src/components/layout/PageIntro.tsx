import { AppBadge, AppCard } from "../ui";

type PageIntroProps = {
  title: string;
  description: string;
};

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <AppCard className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/70">
      <div className="max-w-3xl">
        <AppBadge variant="neutral">{title}</AppBadge>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-app-text">
          {title}
        </h2>
        <p className="mt-2 text-base text-app-muted">{description}</p>
      </div>
    </AppCard>
  );
}
