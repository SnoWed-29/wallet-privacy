import { ReactNode } from "react";
import { cn } from "../../lib/classNames";

type AppTableProps = {
  children: ReactNode;
  className?: string;
};

export function AppTable({ children, className }: AppTableProps) {
  return (
    <div className="overflow-hidden rounded-app border border-app-border bg-white">
      <table className={cn("w-full border-collapse text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}
