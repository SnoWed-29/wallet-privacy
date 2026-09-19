import { cn } from "../../lib/classNames";

type ProgressBarProps = {
  className?: string;
  tone?: "primary" | "income" | "expense" | "warning" | "peach";
  value: number;
};

const progressTone = {
  primary: "bg-app-primary",
  income: "bg-app-income",
  expense: "bg-app-expense",
  warning: "bg-app-warning",
  peach: "bg-app-peach",
};

export function ProgressBar({
  className,
  tone = "primary",
  value,
}: ProgressBarProps) {
  const boundedValue = Math.max(0, Math.min(value, 100));

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(boundedValue)}
      className={cn(
        "h-2 overflow-hidden rounded-full bg-[rgba(60,38,52,0.08)]",
        className,
      )}
      role="progressbar"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none",
          progressTone[tone],
        )}
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}
