import { BarChart3, Download, LineChart, PieChart, Target } from "lucide-react";
import { PageIntro } from "../../../components/layout/PageIntro";
import { AppBadge, AppButton, AppCard, EmptyState } from "../../../components/ui";

export function ReportsPage() {
  const reportSections = [
    {
      title: "Monthly Summary",
      description:
        "A high-level view of balance, income, expenses, and net movement for the selected month.",
      badge: "Summary",
      icon: BarChart3,
    },
    {
      title: "Spending by Category",
      description:
        "Understand where money is going across expense categories once charting is added.",
      badge: "Categories",
      icon: PieChart,
    },
    {
      title: "Income vs Expenses",
      description:
        "Compare money coming in against money going out over time without adding new calculations yet.",
      badge: "Trend",
      icon: LineChart,
    },
    {
      title: "Budget Usage",
      description:
        "Review budget progress, remaining amounts, and limit status from existing budget data.",
      badge: "Planning",
      icon: BarChart3,
    },
    {
      title: "Savings Progress",
      description:
        "Track progress toward active savings goals in a future reporting view.",
      badge: "Goals",
      icon: Target,
    },
  ];

  return (
    <section className="grid gap-5">
      <PageIntro
        description="Review financial summaries and reporting placeholders for your local wallet data."
        title="Reports"
      />

      <div className="grid grid-cols-3 gap-5 max-2xl:grid-cols-2 max-lg:grid-cols-1">
        {reportSections.map((section) => {
          const Icon = section.icon;

          return (
            <AppCard
              className="min-h-56"
              key={section.title}
              title={section.title}
              description={section.description}
              actions={<AppBadge variant="neutral">{section.badge}</AppBadge>}
              tone="standard"
            >
              <div className="mt-4 rounded-app-sm border border-dashed border-[rgba(60,38,52,0.12)] bg-white/44 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-app-sm bg-app-primary/10 text-app-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-app-text">
                      Placeholder view
                    </span>
                  </div>
                  <AppBadge variant="warning">Coming soon</AppBadge>
                </div>
                <div className="grid gap-2">
                  <div className="h-3 w-3/4 rounded-full bg-app-primary/12" />
                  <div className="h-3 w-1/2 rounded-full bg-app-coral/12" />
                  <div className="h-3 w-2/3 rounded-full bg-app-peach/22" />
                </div>
              </div>
            </AppCard>
          );
        })}
      </div>

      <AppCard
        actions={
          <AppButton
            disabled
            icon={<Download className="h-4 w-4" aria-hidden="true" />}
            variant="ghost"
          >
            Export report
          </AppButton>
        }
        description="Report export is intentionally disabled until reporting and export workflows are implemented."
        title="Report actions"
        tone="strong"
      >
        <EmptyState title="Reports are placeholders for now.">
          This layout prepares the reporting dashboard without adding chart
          logic, export behavior, or new finance calculations.
        </EmptyState>
      </AppCard>
    </section>
  );
}
