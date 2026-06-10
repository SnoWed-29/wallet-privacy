type TopbarProps = {
  eyebrow: string;
  title: string;
  status?: string;
};

export function Topbar({ eyebrow, title, status }: TopbarProps) {
  return (
    <header className="sticky top-0 z-[5] -mx-9 -mt-7 mb-8 flex items-center justify-between gap-6 bg-app-background/90 px-9 pb-5 pt-6 backdrop-blur-lg max-lg:-mx-5 max-lg:-mt-6 max-lg:mb-6 max-lg:px-5 max-sm:flex-col max-sm:items-stretch">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {eyebrow}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight text-app-text">
          {title}
        </h1>
      </div>
      {status ? (
        <div className="w-fit whitespace-nowrap rounded-full border border-app-border bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-app-soft">
          {status}
        </div>
      ) : null}
    </header>
  );
}
