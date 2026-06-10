import { AppBadge, AppButton, AppCard, EmptyState } from "../../../components/ui";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import type { DashboardSummary } from "../../../types/wallet";
import { formatMinor, formatPercentage } from "../../../utils/walletHelpers";

export function DashboardPage() {
  const { dashboard, isLoadingDashboard, loadDashboard } = useWalletAppContext();

  return (
    <DashboardView
      dashboard={dashboard}
      isLoadingDashboard={isLoadingDashboard}
      onRefresh={loadDashboard}
    />
  );
}

type DashboardViewProps = {
  dashboard: DashboardSummary | null;
  isLoadingDashboard: boolean;
  onRefresh: () => void;
};

function DashboardView({
  dashboard,
  isLoadingDashboard,
  onRefresh,
}: DashboardViewProps) {
  const budgetRemainingMinor =
    dashboard?.activeBudgets.reduce(
      (total, budget) => total + budget.remainingMinor,
      0,
    ) ?? 0;

  return (
    <section className="grid gap-5" id="dashboard">
      <AppCard className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/70">
        <div className="flex items-start justify-between gap-6 max-md:flex-col">
          <div className="max-w-2xl">
            <AppBadge variant="success">Dashboard</AppBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-app-text">
              Dashboard
            </h2>
            <p className="mt-2 text-base text-app-muted">
              Welcome back. Here is your financial overview, refreshed from your
              local wallet data.
            </p>
          </div>
          <AppButton
            disabled={isLoadingDashboard}
            onClick={onRefresh}
            variant="primary"
          >
            {isLoadingDashboard ? "Refreshing..." : "Refresh dashboard"}
          </AppButton>
        </div>
      </AppCard>

      {!dashboard ? (
        <AppCard>
          <EmptyState title="No dashboard data loaded yet.">
            Refresh the dashboard to load your local financial overview.
          </EmptyState>
        </AppCard>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
            <SummaryCard
              label="Total balance"
              tone="neutral"
              value={formatMinor(dashboard.totalBalanceMinor)}
            />
            <SummaryCard
              label="Monthly income"
              tone="positive"
              value={`+${formatMinor(dashboard.monthlyIncomeMinor)}`}
            />
            <SummaryCard
              label="Monthly expenses"
              tone="negative"
              value={`-${formatMinor(dashboard.monthlyExpenseMinor)}`}
            />
            <SummaryCard
              label="Budget remaining"
              tone={budgetRemainingMinor < 0 ? "negative" : "positive"}
              value={formatMinor(budgetRemainingMinor)}
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-5 max-xl:grid-cols-1">
            <AppCard
              description="Your latest account activity across income and expenses."
              title="Recent transactions"
            >
              {dashboard.recentTransactions.length === 0 ? (
                <EmptyState title="No recent transactions.">
                  New transactions will appear here once you add them.
                </EmptyState>
              ) : (
                <div className="grid gap-3">
                  {dashboard.recentTransactions.map((transaction, index) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl border border-app-border bg-slate-50/70 p-4 max-sm:flex-col max-sm:items-stretch"
                      key={`${transaction.transactionDate}-${index}`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-app-text">
                            {transaction.description ||
                              transaction.categoryName}
                          </span>
                          <AppBadge variant={transaction.transactionType}>
                            {transaction.transactionType}
                          </AppBadge>
                        </div>
                        <p className="mt-1 text-sm text-app-muted">
                          {transaction.transactionDate} •{" "}
                          {transaction.accountName} •{" "}
                          {transaction.categoryName}
                        </p>
                      </div>
                      <strong
                        className={
                          transaction.transactionType === "income"
                            ? "text-lg font-extrabold text-emerald-600"
                            : "text-lg font-extrabold text-red-500"
                        }
                      >
                        {transaction.transactionType === "income" ? "+" : "-"}
                        {formatMinor(transaction.amountMinor)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>

            <AppCard
              description="Bills due soon from recurring bill schedules."
              title="Upcoming bills"
            >
              {dashboard.upcomingRecurringBills.length === 0 ? (
                <EmptyState title="No bills due soon.">
                  You have no recurring bills due in the next 14 days.
                </EmptyState>
              ) : (
                <div className="grid gap-3">
                  {dashboard.upcomingRecurringBills.map((bill) => (
                    <div
                      className="rounded-xl border border-app-border bg-slate-50/70 p-4"
                      key={`${bill.name}-${bill.nextDueDate}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-extrabold text-app-text">
                            {bill.name}
                          </span>
                          <p className="mt-1 text-sm text-app-muted">
                            Due {bill.nextDueDate}
                          </p>
                        </div>
                        <AppBadge
                          variant={bill.daysRemaining <= 3 ? "warning" : "neutral"}
                        >
                          {bill.daysRemaining} days
                        </AppBadge>
                      </div>
                      <strong className="mt-3 block text-lg font-extrabold text-red-500">
                        -{formatMinor(bill.amountMinor)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>
          </div>

          <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
            <AppCard
              description="Progress toward active savings goals."
              title="Savings goals progress"
            >
              {dashboard.activeSavingsGoals.length === 0 ? (
                <EmptyState title="No active savings goals.">
                  Active goals will show progress here once created.
                </EmptyState>
              ) : (
                <div className="grid gap-4">
                  {dashboard.activeSavingsGoals.map((goal) => (
                    <ProgressRow
                      detail={`${formatMinor(goal.currentAmountMinor)} saved of ${formatMinor(goal.targetAmountMinor)}`}
                      key={goal.name}
                      label={goal.name}
                      progress={goal.progressPercent}
                      trailing={`${formatMinor(goal.remainingAmountMinor)} left`}
                    />
                  ))}
                </div>
              )}
            </AppCard>

            <AppCard
              description="How current budgets are tracking this month."
              title="Budget overview"
            >
              {dashboard.activeBudgets.length === 0 ? (
                <EmptyState title="No active budgets.">
                  Monthly budgets will appear here once you create them.
                </EmptyState>
              ) : (
                <div className="grid gap-4">
                  {dashboard.activeBudgets.map((budget) => (
                    <ProgressRow
                      badge={
                        budget.isExceeded
                          ? "Exceeded"
                          : budget.isNearLimit
                            ? "Near limit"
                            : "On track"
                      }
                      badgeVariant={
                        budget.isExceeded
                          ? "expense"
                          : budget.isNearLimit
                            ? "warning"
                            : "success"
                      }
                      detail={`${formatMinor(budget.spentMinor)} spent of ${formatMinor(budget.amountMinor)}`}
                      key={`${budget.name}-${budget.categoryName}`}
                      label={budget.name}
                      progress={budget.progressPercentage}
                      trailing={budget.categoryName}
                    />
                  ))}
                </div>
              )}
            </AppCard>
          </div>
        </>
      )}
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
};

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-red-500"
        : "text-app-text";

  return (
    <AppCard className="p-5">
      <p className="text-sm font-bold text-app-muted">{label}</p>
      <strong className={`mt-3 block text-2xl font-extrabold ${toneClass}`}>
        {value}
      </strong>
    </AppCard>
  );
}

type ProgressRowProps = {
  label: string;
  detail: string;
  progress: number;
  trailing: string;
  badge?: string;
  badgeVariant?: "income" | "expense" | "success" | "warning" | "neutral";
};

function ProgressRow({
  label,
  detail,
  progress,
  trailing,
  badge,
  badgeVariant = "neutral",
}: ProgressRowProps) {
  const boundedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="rounded-xl border border-app-border bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-extrabold text-app-text">{label}</span>
          <p className="mt-1 text-sm text-app-muted">{detail}</p>
        </div>
        {badge ? (
          <AppBadge variant={badgeVariant}>{badge}</AppBadge>
        ) : (
          <span className="text-sm font-bold text-app-muted">{trailing}</span>
        )}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-app-primary"
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs font-bold text-app-muted">
        <span>{formatPercentage(progress)}</span>
        <span>{trailing}</span>
      </div>
    </div>
  );
}


