import { type LucideIcon, WalletCards } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/classNames";

export type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type SidebarProps = {
  className?: string;
  items: NavigationItem[];
};

export function Sidebar({ className, items }: SidebarProps) {
  const primaryItems = items.filter((item) => item.href !== "/settings");
  const secondaryItems = items.filter((item) => item.href === "/settings");

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "glass-surface sticky top-4 z-10 flex h-[calc(100vh-2rem)] min-h-[42rem] flex-col rounded-app-lg px-3.5 py-4 text-app-text sm:top-5 sm:h-[calc(100vh-2.5rem)]",
        "max-xl:items-center max-xl:px-2.5 max-md:sticky max-md:top-4 max-md:h-auto max-md:min-h-0 max-md:flex-row max-md:items-center max-md:justify-between max-md:gap-3 max-md:overflow-x-auto",
        className,
      )}
      data-testid="app-sidebar"
    >
      <div className="flex min-w-0 items-center gap-3 px-1.5 max-xl:justify-center max-md:flex-none">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-app-sm bg-app-primary text-white shadow-[0_12px_26px_rgba(156,67,166,0.24)]">
          <WalletCards className="h-5 w-5" aria-hidden="true" strokeWidth={1.9} />
        </div>
        <div className="min-w-0 max-xl:hidden max-md:block">
          <strong className="block truncate text-base font-bold">Wallet</strong>
          <span className="mt-0.5 block truncate text-caption text-app-muted">
            Local finance
          </span>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2 max-xl:items-center max-md:mt-0 max-md:flex-row max-md:overflow-x-auto">
        {primaryItems.map((item) => (
          <SidebarLink item={item} key={item.href} />
        ))}
        <div className="flex-1 max-md:hidden" />
        {secondaryItems.map((item) => (
          <SidebarLink item={item} key={item.href} />
        ))}
      </nav>
    </aside>
  );
}

type SidebarLinkProps = {
  item: NavigationItem;
};

function SidebarLink({ item }: SidebarLinkProps) {
  const Icon = item.icon;

  return (
    <NavLink
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          "group relative flex min-h-11 w-full items-center gap-3 rounded-app-sm px-3 py-2.5 text-sm font-semibold text-app-muted no-underline transition duration-200 motion-reduce:transition-none",
          "hover:bg-white/58 hover:text-app-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-primary/20",
          "max-xl:h-11 max-xl:w-11 max-xl:justify-center max-xl:px-0 max-md:w-auto max-md:px-3",
          isActive && "bg-white/72 text-app-text shadow-app-soft",
        )
      }
      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      title={item.label}
      to={item.href}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "grid h-8 w-8 flex-none place-items-center rounded-app-xs transition",
              isActive
                ? "bg-app-primary/12 text-app-primary"
                : "bg-white/48 text-app-muted group-hover:text-app-primary",
            )}
          >
            <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" strokeWidth={1.9} />
          </span>
          <span className="truncate max-xl:hidden max-md:inline">{item.label}</span>
          {isActive ? (
            <span
              className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-app-primary via-app-coral to-app-peach max-xl:left-1 max-xl:h-1 max-xl:w-7 max-xl:translate-y-[1.2rem] max-xl:rounded-full max-md:hidden"
              aria-hidden="true"
            />
          ) : null}
        </>
      )}
    </NavLink>
  );
}
