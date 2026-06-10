import { cn } from "../../lib/classNames";
import { NavLink } from "react-router-dom";

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
};

type SidebarProps = {
  items: NavigationItem[];
  className?: string;
};

export function Sidebar({ items, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex w-64 flex-col gap-7 bg-app-sidebar px-4 py-7 text-white shadow-[16px_0_40px_rgba(15,23,42,0.14)] max-lg:static max-lg:w-auto max-lg:rounded-b-[1.375rem] max-lg:px-5 max-lg:py-5",
        className,
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white font-extrabold text-app-sidebar">
          W
        </div>
        <div>
          <strong className="block text-base">Wallet</strong>
          <span className="mt-0.5 block text-xs text-slate-400">
            Local finance
          </span>
        </div>
      </div>

      <nav className="grid gap-1.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 no-underline transition hover:translate-x-0.5 hover:bg-white/10 hover:text-white focus-visible:translate-x-0.5 focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none",
                isActive && "bg-white/10 text-white",
              )
            }
            to={item.href}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs font-extrabold text-white">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
