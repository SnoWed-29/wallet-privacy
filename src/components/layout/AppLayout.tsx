import { ReactNode } from "react";
import { Sidebar, type NavigationItem } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppLayoutProps = {
  navigationItems: NavigationItem[];
  eyebrow: string;
  title: string;
  status?: string;
  children: ReactNode;
};

export function AppLayout({
  navigationItems,
  eyebrow,
  title,
  status,
  children,
}: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-app-background bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_32rem)]">
      <Sidebar items={navigationItems} />
      <section className="min-h-screen pl-64 max-lg:pl-0">
        <div className="min-h-screen px-9 pb-12 pt-7 max-lg:px-5 max-lg:pb-9 max-lg:pt-6">
          <Topbar eyebrow={eyebrow} title={title} status={status} />
          <section className="grid w-full max-w-[1180px] gap-5">
            {children}
          </section>
        </div>
      </section>
    </main>
  );
}
