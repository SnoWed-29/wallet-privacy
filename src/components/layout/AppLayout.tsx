import { ReactNode } from "react";
import { Sidebar, type NavigationItem } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  navigationItems: NavigationItem[];
  status?: string;
  title: string;
};

export function AppLayout({
  children,
  eyebrow,
  navigationItems,
  status,
  title,
}: AppLayoutProps) {
  return (
    <main className="wallet-app-bg min-h-screen p-4 text-app-text sm:p-5">
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-[15rem_minmax(0,1fr)] gap-5 sm:min-h-[calc(100vh-2.5rem)] max-xl:grid-cols-[4.75rem_minmax(0,1fr)] max-md:grid-cols-1">
        <Sidebar items={navigationItems} />
        <section className="grid min-w-0 content-start gap-5">
          <Topbar eyebrow={eyebrow} status={status} title={title} />
          <section className="mx-auto grid w-full max-w-[1480px] gap-5 pb-7">
            {children}
          </section>
        </section>
      </div>
    </main>
  );
}
