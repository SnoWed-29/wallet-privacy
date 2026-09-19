type TopbarProps = {
  eyebrow: string;
  status?: string;
  title: string;
};

export function Topbar({ eyebrow, status, title }: TopbarProps) {
  return (
    <header className="glass-surface sticky top-4 z-[5] flex min-w-0 items-center justify-between gap-4 rounded-app-lg px-5 py-4 sm:top-5 max-sm:flex-col max-sm:items-stretch">
      <div className="min-w-0">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
          {eyebrow}
        </span>
        <h1 className="mt-1 truncate text-page text-app-text">{title}</h1>
      </div>
      {status ? (
        <div className="w-fit whitespace-nowrap rounded-full border border-white/70 bg-white/58 px-4 py-2 text-sm font-semibold text-app-muted shadow-app-soft">
          {status}
        </div>
      ) : null}
    </header>
  );
}
