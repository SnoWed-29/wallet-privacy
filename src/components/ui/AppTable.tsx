import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type AppTableProps = {
  children: ReactNode;
  className?: string;
  minWidth?: string;
};

export function AppTable({
  children,
  className,
  minWidth = "min-w-[48rem]",
}: AppTableProps) {
  return (
    <div className="overflow-x-auto rounded-app border border-white/70 bg-white/54 shadow-app-soft backdrop-blur-xl">
      <table
        className={cn(
          minWidth,
          "w-full border-collapse text-left text-sm text-app-text",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[rgba(60,38,52,0.08)] bg-white/42 text-caption uppercase tracking-[0.08em] text-app-muted">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-[rgba(60,38,52,0.08)]">{children}</tbody>
  );
}

export function TableCell({
  align = "left",
  children,
  className,
  header = false,
}: {
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
  header?: boolean;
}) {
  const Component = header ? "th" : "td";

  return (
    <Component
      className={cn(
        "px-4 py-3.5",
        header ? "font-semibold" : "align-middle",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </Component>
  );
}
