import type { CategoryTotal, TrendPoint, YearMonthPoint } from "../types";
import { formatMinor } from "../../../utils/walletHelpers";

const palette = ["#9C43A6", "#DB515E", "#FEA86A", "#288F5F", "#5862AA", "#B47516"];

type TrendChartProps = {
  data: TrendPoint[];
  currency: string;
};

export function TrendChart({ data, currency }: TrendChartProps) {
  const points = data.filter((point) => point.currency === currency);
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [
      point.incomeMinor,
      point.expenseMinor,
      Math.abs(point.netCashFlowMinor),
    ]),
  );
  const width = 640;
  const height = 220;
  const padding = 32;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (points.length === 0) {
    return <ChartEmpty label="No trend data for this currency." />;
  }

  const xFor = (index: number) =>
    padding + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const yFor = (value: number) => padding + chartHeight - (value / maxValue) * chartHeight;
  const pathFor = (key: "incomeMinor" | "expenseMinor") =>
    points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point[key])}`)
      .join(" ");

  return (
    <div className="overflow-hidden rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-3">
      <svg
        aria-label={`Income and expense trend for ${currency}`}
        className="h-64 w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
          stroke="rgba(60,38,52,0.14)"
        />
        <path d={pathFor("incomeMinor")} fill="none" stroke="#288F5F" strokeWidth="4" />
        <path d={pathFor("expenseMinor")} fill="none" stroke="#DB515E" strokeWidth="4" />
        {points.map((point, index) => (
          <g key={`${point.periodStart}-${point.currency}`}>
            <circle cx={xFor(index)} cy={yFor(point.incomeMinor)} fill="#288F5F" r="4">
              <title>{`${point.periodLabel} income: ${formatMinor(point.incomeMinor)} ${currency}`}</title>
            </circle>
            <circle cx={xFor(index)} cy={yFor(point.expenseMinor)} fill="#DB515E" r="4">
              <title>{`${point.periodLabel} expenses: ${formatMinor(point.expenseMinor)} ${currency}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-caption font-semibold text-app-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-app-income" />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-app-expense" />
          Expenses
        </span>
      </div>
    </div>
  );
}

type DonutChartProps = {
  data: CategoryTotal[];
  title: string;
};

export function DonutChart({ data, title }: DonutChartProps) {
  const topItems = topDonutItems(data);
  const total = topItems.reduce((sum, item) => sum + item.totalMinor, 0);

  if (total <= 0) {
    return <ChartEmpty label={`No ${title.toLowerCase()} data.`} />;
  }

  let offset = 25;

  return (
    <div className="grid gap-4 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
      <svg
        aria-label={title}
        className="mx-auto h-44 w-44"
        role="img"
        viewBox="0 0 42 42"
      >
        <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="rgba(60,38,52,0.08)" strokeWidth="6" />
        {topItems.map((item, index) => {
          const dash = (item.totalMinor / total) * 100;
          const segment = (
            <circle
              cx="21"
              cy="21"
              fill="transparent"
              key={item.categoryName}
              r="15.915"
              stroke={palette[index % palette.length]}
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
              strokeWidth="6"
            >
              <title>{`${item.categoryName}: ${item.percentage.toFixed(1)}%`}</title>
            </circle>
          );
          offset -= dash;
          return segment;
        })}
      </svg>
      <div className="grid content-center gap-2">
        {topItems.map((item, index) => (
          <div className="flex min-w-0 items-center justify-between gap-3 text-sm" key={item.categoryName}>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 flex-none rounded-full"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              <span className="truncate font-semibold text-app-text">{item.categoryName}</span>
            </span>
            <span className="whitespace-nowrap text-app-muted">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryBars({ data }: { data: CategoryTotal[] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.totalMinor));

  if (data.length === 0) {
    return <ChartEmpty label="No category breakdown for this period." />;
  }

  return (
    <div className="grid gap-3">
      {data.map((item) => (
        <div className="grid gap-1.5" key={`${item.currency}-${item.categoryId}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-app-text">{item.categoryName}</span>
            <span className="whitespace-nowrap text-app-muted">
              {formatMinor(item.totalMinor)} {item.currency}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/64">
            <div
              className="h-full rounded-full bg-app-primary"
              style={{ width: `${Math.max(3, (item.totalMinor / maxValue) * 100)}%` }}
            />
          </div>
          <p className="text-caption text-app-muted">
            {item.transactionCount} transactions / {item.percentage.toFixed(1)}%
          </p>
        </div>
      ))}
    </div>
  );
}

export function YearlyBarChart({
  data,
  currency,
}: {
  data: YearMonthPoint[];
  currency: string;
}) {
  const maxValue = Math.max(1, ...data.flatMap((month) => [month.incomeMinor, month.expenseMinor]));

  return (
    <div className="overflow-x-auto rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4">
      <div className="flex min-w-[42rem] items-end gap-3">
        {data.map((month) => (
          <div className="grid flex-1 gap-2 text-center" key={month.month}>
            <div className="flex h-36 items-end justify-center gap-1.5">
              <div
                className="w-4 rounded-t bg-app-income"
                title={`${month.label} income: ${formatMinor(month.incomeMinor)} ${currency}`}
                style={{ height: `${Math.max(2, (month.incomeMinor / maxValue) * 100)}%` }}
              />
              <div
                className="w-4 rounded-t bg-app-expense"
                title={`${month.label} expenses: ${formatMinor(month.expenseMinor)} ${currency}`}
                style={{ height: `${Math.max(2, (month.expenseMinor / maxValue) * 100)}%` }}
              />
            </div>
            <span className="text-caption font-semibold text-app-muted">{month.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function topDonutItems(data: CategoryTotal[]) {
  const sorted = [...data].sort((a, b) => b.totalMinor - a.totalMinor);
  const top = sorted.slice(0, 5);
  const other = sorted.slice(5);
  const otherTotal = other.reduce((sum, item) => sum + item.totalMinor, 0);
  const total = sorted.reduce((sum, item) => sum + item.totalMinor, 0);

  if (otherTotal <= 0) {
    return top;
  }

  return [
    ...top,
    {
      currency: sorted[0]?.currency ?? "",
      categoryId: "other",
      categoryName: "Other",
      totalMinor: otherTotal,
      percentage: total > 0 ? (otherTotal / total) * 100 : 0,
      transactionCount: other.reduce((sum, item) => sum + item.transactionCount, 0),
    },
  ];
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="grid min-h-44 place-items-center rounded-app-sm border border-dashed border-[rgba(60,38,52,0.12)] bg-white/44 p-5 text-center text-sm font-semibold text-app-muted">
      {label}
    </div>
  );
}
