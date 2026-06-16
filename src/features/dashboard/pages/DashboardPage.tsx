import {
  CalendarClock,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  AppBadge,
  AppButton,
  AppCard,
  EmptyState,
  ProgressBar,
  StatCard,
} from "../../../components/ui";
import { PageIntro } from "../../../components/layout/PageIntro";
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
      <PageIntro
        actions={
          <AppButton
            disabled={isLoadingDashboard}
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={onRefresh}
            variant="primary"
          >
            {isLoadingDashboard ? "Refreshing..." : "Refresh dashboard"}
          </AppButton>
        }
        badge="Dashboard"
        description="Welcome back. Here is your financial overview, refreshed from your local wallet data."
        title="Dashboard"
      />

      {!dashboard ? (
        <AppCard tone="strong">
          <EmptyState title="No dashboard data loaded yet.">
            Refresh the dashboard to load your local financial overview.
          </EmptyState>
        </AppCard>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 max-2xl:grid-cols-2 max-md:grid-cols-1">
            <StatCard
              icon={<WalletCards className="h-5 w-5" aria-hidden="true" />}
              label="Total balance"
              value={formatMinor(dashboard.totalBalanceMinor)}
            />
            <StatCard
              detail="Income this month"
              icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
              label="Monthly income"
              tone="income"
              value={`+${formatMinor(dashboard.monthlyIncomeMinor)}`}
            />
            <StatCard
              detail="Expenses this month"
              icon={<TrendingDown className="h-5 w-5" aria-hidden="true" />}
              label="Monthly expenses"
              tone="expense"
              value={`-${formatMinor(dashboard.monthlyExpenseMinor)}`}
            />
            <StatCard
              detail={budgetRemainingMinor < 0 ? "Over active budgets" : "Across active budgets"}
              icon={<PiggyBank className="h-5 w-5" aria-hidden="true" />}
              label="Budget remaining"
              tone={budgetRemainingMinor < 0 ? "expense" : "primary"}
              value={formatMinor(budgetRemainingMinor)}
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] gap-5 max-xl:grid-cols-1">
            <AnalyticsCard dashboard={dashboard} />
            <AccountsCard dashboard={dashboard} />
          </div>

          <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] gap-5 max-xl:grid-cols-1">
            <RecentTransactionsCard dashboard={dashboard} />
            <UpcomingBillsCard dashboard={dashboard} />
          </div>

          <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
            <SavingsGoalsCard dashboard={dashboard} />
            <BudgetsCard dashboard={dashboard} />
          </div>
        </>
      )}
    </section>
  );
}

function AnalyticsCard({ dashboard }: { dashboard: DashboardSummary }) {
  const rows = [
    {
      label: "Income",
      tone: "income" as const,
      value: dashboard.monthlyIncomeMinor,
      formatted: `+${formatMinor(dashboard.monthlyIncomeMinor)}`,
    },
    {
      label: "Expenses",
      tone: "expense" as const,
      value: dashboard.monthlyExpenseMinor,
      formatted: `-${formatMinor(dashboard.monthlyExpenseMinor)}`,
    },
    {
      label: "Net movement",
      tone: dashboard.monthlyNetMinor >= 0 ? ("primary" as const) : ("expense" as const),
      value: Math.abs(dashboard.monthlyNetMinor),
      formatted: `${dashboard.monthlyNetMinor >= 0 ? "+" : "-"}${formatMinor(Math.abs(dashboard.monthlyNetMinor))}`,
    },
  ];
  const maxValue = Math.max(1, ...rows.map((row) => row.value));

  return (
    <AppCard
      description="Monthly movement from the local dashboard summary."
      title="Financial pulse"
      tone="strong"
    >
      <div className="grid gap-4">
        {rows.map((row) => (
          <div className="grid gap-2" key={row.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-app-text">{row.label}</span>
              <span className="text-sm font-semibold text-app-muted">{row.formatted}</span>
            </div>
            <ProgressBar
              className="h-3"
              tone={row.tone === "primary" ? "primary" : row.tone}
              value={(row.value / maxValue) * 100}
            />
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function AccountsCard({ dashboard }: { dashboard: DashboardSummary }) {
  return (
    <AppCard
      description="Balances across active local accounts."
      title="Accounts"
      tone="standard"
    >
      {dashboard.accounts.length === 0 ? (
        <EmptyState title="No accounts yet.">
          Account balances will appear here once accounts are created.
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {dashboard.accounts.map((account) => (
            <div
              className="flex items-center justify-between gap-4 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4"
              key={account.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 flex-none place-items-center rounded-app-sm bg-app-primary/10 text-app-primary">
                  <WalletCards className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="truncate font-semibold text-app-text">{account.name}</span>
              </div>
              <strong className="whitespace-nowrap text-card text-app-text">
                {formatMinor(account.balanceMinor)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

function RecentTransactionsCard({ dashboard }: { dashboard: DashboardSummary }) {
  return (
    <AppCard
      description="Your latest account activity across income and expenses."
      title="Recent transactions"
      tone="strong"
    >
      {dashboard.recentTransactions.length === 0 ? (
        <EmptyState title="No recent transactions.">
          New transactions will appear here once you add them.
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {dashboard.recentTransactions.map((transaction, index) => (
            <div
              className="flex items-center justify-between gap-4 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4 max-sm:flex-col max-sm:items-stretch"
              key={`${transaction.transactionDate}-${index}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-app-text">
                    {transaction.description || transaction.categoryName}
                  </span>
                  <AppBadge variant={transaction.transactionType}>
                    {transaction.transactionType}
                  </AppBadge>
                </div>
                <p className="mt-1 text-sm text-app-muted">
                  {transaction.transactionDate} / {transaction.accountName} /{" "}
                  {transaction.categoryName}
                </p>
              </div>
              <strong
                className={
                  transaction.transactionType === "income"
                    ? "whitespace-nowrap text-card text-app-income"
                    : "whitespace-nowrap text-card text-app-expense"
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
  );
}

function UpcomingBillsCard({ dashboard }: { dashboard: DashboardSummary }) {
  return (
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
              className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4"
              key={`${bill.name}-${bill.nextDueDate}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-app-text">{bill.name}</span>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-app-muted">
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    Due {bill.nextDueDate}
                  </p>
                </div>
                <AppBadge variant={bill.daysRemaining <= 3 ? "warning" : "neutral"}>
                  {bill.daysRemaining} days
                </AppBadge>
              </div>
              <strong className="mt-3 block text-card text-app-expense">
                -{formatMinor(bill.amountMinor)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

function SavingsGoalsCard({ dashboard }: { dashboard: DashboardSummary }) {
  return (
    <AppCard
      description="Progress toward active savings goals."
      title="Savings goals progress"
      tone="standard"
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
              icon={<Target className="h-4 w-4" aria-hidden="true" />}
              key={goal.name}
              label={goal.name}
              progress={goal.progressPercent}
              tone="primary"
              trailing={`${formatMinor(goal.remainingAmountMinor)} left`}
            />
          ))}
        </div>
      )}
    </AppCard>
  );
}

function BudgetsCard({ dashboard }: { dashboard: DashboardSummary }) {
  return (
    <AppCard
      description="How current budgets are tracking this month."
      title="Budget overview"
      tone="standard"
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
              icon={<ReceiptText className="h-4 w-4" aria-hidden="true" />}
              key={`${budget.name}-${budget.categoryName}`}
              label={budget.name}
              progress={budget.progressPercentage}
              tone={budget.isExceeded ? "expense" : budget.isNearLimit ? "warning" : "primary"}
              trailing={budget.categoryName}
            />
          ))}
        </div>
      )}
    </AppCard>
  );
}

type ProgressRowProps = {
  badge?: string;
  badgeVariant?: "income" | "expense" | "success" | "warning" | "neutral";
  detail: string;
  icon?: ReactNode;
  label: string;
  progress: number;
  tone?: "primary" | "income" | "expense" | "warning" | "peach";
  trailing: string;
};

function ProgressRow({
  badge,
  badgeVariant = "neutral",
  detail,
  icon,
  label,
  progress,
  tone = "primary",
  trailing,
}: ProgressRowProps) {
  return (
    <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon ? (
              <span className="grid h-7 w-7 place-items-center rounded-app-xs bg-app-primary/10 text-app-primary">
                {icon}
              </span>
            ) : null}
            <span className="font-semibold text-app-text">{label}</span>
          </div>
          <p className="mt-1 text-sm text-app-muted">{detail}</p>
        </div>
        {badge ? (
          <AppBadge variant={badgeVariant}>{badge}</AppBadge>
        ) : (
          <span className="text-sm font-semibold text-app-muted">{trailing}</span>
        )}
      </div>
      <ProgressBar className="mt-4" tone={tone} value={progress} />
      <div className="mt-2 flex justify-between gap-3 text-caption font-semibold text-app-muted">
        <span>{formatPercentage(progress)}</span>
        <span>{trailing}</span>
      </div>
    </div>
  );
}
