import { AppBadge, AppButton, AppCard, EmptyState } from "../../../components/ui";
import { PageIntro } from "../../../components/layout/PageIntro";

export function ReportsPage() {
  const reportSections = [
    {
      title: "Monthly Summary",
      description:
        "A high-level view of balance, income, expenses, and net movement for the selected month.",
      badge: "Summary",
    },
    {
      title: "Spending by Category",
      description:
        "Understand where money is going across expense categories once charting is added.",
      badge: "Categories",
    },
    {
      title: "Income vs Expenses",
      description:
        "Compare money coming in against money going out over time without adding new calculations yet.",
      badge: "Trend",
    },
    {
      title: "Budget Usage",
      description:
        "Review budget progress, remaining amounts, and limit status from existing budget data.",
      badge: "Planning",
    },
    {
      title: "Savings Progress",
      description:
        "Track progress toward active savings goals in a future reporting view.",
      badge: "Goals",
    },
  ];

  return (
    <section className="grid gap-5">
      <PageIntro
        description="Review financial summaries and reporting placeholders for your local wallet data."
        title="Reports"
      />

      <div className="grid grid-cols-3 gap-5 max-2xl:grid-cols-2 max-lg:grid-cols-1">
        {reportSections.map((section) => (
          <AppCard
            className="min-h-56"
            key={section.title}
            title={section.title}
            description={section.description}
            actions={<AppBadge variant="neutral">{section.badge}</AppBadge>}
          >
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-slate-700">
                  Placeholder view
                </span>
                <AppBadge variant="warning">Coming soon</AppBadge>
              </div>
              <div className="grid gap-2">
                <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                <div className="h-3 w-2/3 rounded-full bg-slate-200" />
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      <AppCard
        actions={
          <AppButton disabled variant="ghost">
            Export report
          </AppButton>
        }
        description="Report export is intentionally disabled until reporting and export workflows are implemented."
        title="Report actions"
      >
        <EmptyState title="Reports are placeholders for now.">
          This layout prepares the reporting dashboard without adding chart
          logic, export behavior, or new finance calculations.
        </EmptyState>
      </AppCard>
    </section>
  );
}
