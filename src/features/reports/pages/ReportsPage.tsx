import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Gauge,
  ListFilter,
  RefreshCw,
  Target,
} from "lucide-react";
import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageIntro } from "../../../components/layout/PageIntro";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  AppTable,
  EmptyState,
  ProgressBar,
  StatCard,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import { formatMinor, formatPercentage } from "../../../utils/walletHelpers";
import {
  CategoryBars,
  DonutChart,
  TrendChart,
  YearlyBarChart,
} from "../components/ReportCharts";
import { useReports } from "../hooks/useReports";
import type {
  BudgetPerformance,
  CategoryTotal,
  CurrencySummary,
  PeriodComparison,
  ReportFilterState,
  ReportsSummary,
} from "../types";

export function ReportsPage() {
  const navigate = useNavigate();
  const wallet = useWalletAppContext();
  const {
    appliedFilters,
    filters,
    summary,
    isLoading,
    error,
    updateFilters,
    applyFilters,
    applyFilterChanges,
    resetFilters,
    reloadReports,
  } = useReports();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters();
  }

  function viewMatchingTransactions(extraFilters: Partial<ReportFilterState> = {}) {
    const nextFilters = { ...appliedFilters, ...extraFilters };
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(nextFilters)) {
      if (value) {
        params.set(key, value);
      }
    }

    navigate(`/transactions?${params.toString()}`);
  }

  return (
    <section className="grid gap-5">
      <PageIntro
        actions={
          <AppButton
            disabled={isLoading}
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            onClick={reloadReports}
            variant="primary"
          >
            {isLoading ? "Refreshing..." : "Refresh reports"}
          </AppButton>
        }
        badge="Reports"
        description="Analyze local wallet activity with filtered summaries, charts, and drill-downs."
        title="Reports"
      />

      <ReportFilters
        accounts={wallet.accounts}
        availableCurrencies={summary?.availableCurrencies ?? []}
        categories={wallet.categories}
        filters={filters}
        isLoading={isLoading}
        onReset={resetFilters}
        onSubmit={handleSubmit}
        updateFilters={updateFilters}
      />

      {error ? (
        <AppCard title="Reports unavailable" tone="strong">
          <EmptyState title={error}>
            Check the selected filters, then refresh reports.
          </EmptyState>
        </AppCard>
      ) : null}

      {isLoading && !summary ? (
        <AppCard title="Loading reports" tone="strong">
          <EmptyState title="Calculating reports from local data.">
            This may take a moment for large transaction histories.
          </EmptyState>
        </AppCard>
      ) : null}

      {summary ? (
        <ReportsContent
          onCategorySelect={(categoryId) => applyFilterChanges({ categoryId })}
          onViewTransactions={viewMatchingTransactions}
          summary={summary}
        />
      ) : null}
    </section>
  );
}

function ReportFilters({
  accounts,
  availableCurrencies,
  categories,
  filters,
  isLoading,
  onReset,
  onSubmit,
  updateFilters,
}: {
  accounts: Array<{ id: string; name: string; currency: string }>;
  availableCurrencies: string[];
  categories: Array<{ id: string; name: string; categoryType: string }>;
  filters: ReportFilterState;
  isLoading: boolean;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateFilters: (changes: Partial<ReportFilterState>) => void;
}) {
  const currencies = availableCurrencies.length
    ? availableCurrencies
    : Array.from(new Set(accounts.map((account) => account.currency))).sort();

  return (
    <AppCard
      description="All report sections update from these filters. Reports default to the current month."
      title="Report filters"
      tone="strong"
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-6 gap-3 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              Start date
            </span>
            <AppInput
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilters({ startDate: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              End date
            </span>
            <AppInput
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilters({ endDate: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              Account
            </span>
            <AppSelect
              value={filters.accountId}
              onChange={(event) => updateFilters({ accountId: event.target.value })}
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              Category
            </span>
            <AppSelect
              value={filters.categoryId}
              onChange={(event) => updateFilters({ categoryId: event.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              Type
            </span>
            <AppSelect
              value={filters.transactionType}
              onChange={(event) =>
                updateFilters({
                  transactionType: event.target.value as ReportFilterState["transactionType"],
                })
              }
            >
              <option value="">Income and expenses</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </AppSelect>
          </label>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              Currency
            </span>
            <AppSelect
              value={filters.currency}
              onChange={(event) => updateFilters({ currency: event.target.value })}
            >
              <option value="">All currencies</option>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </AppSelect>
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <AppButton
            disabled={isLoading}
            icon={<ListFilter className="h-4 w-4" aria-hidden="true" />}
            type="submit"
            variant="primary"
          >
            {isLoading ? "Applying..." : "Apply filters"}
          </AppButton>
          <AppButton onClick={onReset} type="button" variant="ghost">
            Reset filters
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
}

function ReportsContent({
  onCategorySelect,
  onViewTransactions,
  summary,
}: {
  onCategorySelect: (categoryId: string) => void;
  onViewTransactions: (filters?: Partial<ReportFilterState>) => void;
  summary: ReportsSummary;
}) {
  const hasTransactions = summary.matchingTransactions.length > 0;

  return (
    <>
      {summary.hasMixedCurrencies ? (
        <AppCard title="Currency handling" tone="strong">
          <p className="text-sm leading-6 text-app-muted">
            This report includes multiple currencies. Totals are separated by
            currency and are not combined because Wallet does not use exchange
            rates.
          </p>
        </AppCard>
      ) : null}

      {!hasTransactions ? (
        <AppCard title="No matching activity" tone="strong">
          <EmptyState title="No transactions match these filters.">
            Reports will appear once local transactions exist for the selected
            period.
          </EmptyState>
        </AppCard>
      ) : null}

      <SummarySection summaries={summary.currencySummaries} />
      <TrendSection summary={summary} />
      <CategorySection
        expenseCategories={summary.expenseCategories}
        incomeCategories={summary.incomeCategories}
        onCategorySelect={onCategorySelect}
        onViewTransactions={onViewTransactions}
      />
      <ComparisonSection comparisons={summary.periodComparison} />
      <BudgetSection budgets={summary.budgetPerformance} />
      <AccountSection summary={summary} />
      <RecurringSection summary={summary} />
      <SavingsSection summary={summary} />
      <YearlySection summary={summary} />
      <MatchingTransactionsSection
        onViewTransactions={onViewTransactions}
        summary={summary}
      />
    </>
  );
}

function SummarySection({ summaries }: { summaries: CurrencySummary[] }) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4">
      {summaries.map((summary) => (
        <div className="grid grid-cols-6 gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1" key={summary.currency}>
          <StatCard
            icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
            label={`Income / ${summary.currency}`}
            tone="income"
            value={`+${money(summary.totalIncomeMinor, summary.currency)}`}
          />
          <StatCard
            icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
            label={`Expenses / ${summary.currency}`}
            tone="expense"
            value={`-${money(summary.totalExpenseMinor, summary.currency)}`}
          />
          <StatCard
            icon={<Gauge className="h-5 w-5" aria-hidden="true" />}
            label={`Net cash flow / ${summary.currency}`}
            tone={summary.netCashFlowMinor >= 0 ? "income" : "expense"}
            value={signedMoney(summary.netCashFlowMinor, summary.currency)}
          />
          <StatCard
            icon={<Target className="h-5 w-5" aria-hidden="true" />}
            label="Savings rate"
            tone="primary"
            value={formatPercentage(summary.savingsRatePercent)}
          />
          <StatCard
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
            label="Daily spending"
            tone="warning"
            value={money(summary.averageDailySpendingMinor, summary.currency)}
          />
          <StatCard
            icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
            label="Transactions"
            value={summary.transactionCount}
          />
        </div>
      ))}
    </section>
  );
}

function TrendSection({ summary }: { summary: ReportsSummary }) {
  const currencies = currenciesFor(summary);

  return (
    <AppCard
      description={`Grouped ${summary.filters.grouping} for the selected period.`}
      title="Income and expense trend"
      tone="strong"
    >
      <div className="grid gap-5">
        {currencies.map((currency) => (
          <div className="grid gap-2" key={currency}>
            <h3 className="text-sm font-semibold text-app-text">{currency}</h3>
            <TrendChart data={summary.trend} currency={currency} />
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function CategorySection({
  expenseCategories,
  incomeCategories,
  onCategorySelect,
  onViewTransactions,
}: {
  expenseCategories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  onCategorySelect: (categoryId: string) => void;
  onViewTransactions: (filters?: Partial<ReportFilterState>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
      <CategoryCard
        categories={expenseCategories}
        onCategorySelect={onCategorySelect}
        onViewTransactions={onViewTransactions}
        title="Expenses by category"
        transactionType="expense"
      />
      <CategoryCard
        categories={incomeCategories}
        onCategorySelect={onCategorySelect}
        onViewTransactions={onViewTransactions}
        title="Income by category"
        transactionType="income"
      />
    </div>
  );
}

function CategoryCard({
  categories,
  onCategorySelect,
  onViewTransactions,
  title,
  transactionType,
}: {
  categories: CategoryTotal[];
  onCategorySelect: (categoryId: string) => void;
  onViewTransactions: (filters?: Partial<ReportFilterState>) => void;
  title: string;
  transactionType: "income" | "expense";
}) {
  return (
    <AppCard description="Categories are separated by transaction type." title={title}>
      <div className="grid gap-5">
        <DonutChart data={categories} title={title} />
        <CategoryBars data={categories} />
        {categories.length > 0 ? (
          <div className="grid gap-2">
            {categories.slice(0, 6).map((category) => (
              <div
                className="flex items-center justify-between gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-3 max-sm:flex-col max-sm:items-stretch"
                key={`${category.currency}-${category.categoryId}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-app-text">{category.categoryName}</p>
                  <p className="text-sm text-app-muted">
                    {money(category.totalMinor, category.currency)} / {category.transactionCount} transactions
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <AppButton
                    onClick={() => onCategorySelect(category.categoryId)}
                    type="button"
                    variant="secondary"
                  >
                    Filter
                  </AppButton>
                  <AppButton
                    icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    onClick={() =>
                      onViewTransactions({
                        categoryId: category.categoryId,
                        transactionType,
                      })
                    }
                    type="button"
                    variant="ghost"
                  >
                    Open
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AppCard>
  );
}

function ComparisonSection({ comparisons }: { comparisons: PeriodComparison[] }) {
  if (comparisons.length === 0) {
    return null;
  }

  return (
    <AppCard
      description="Compared with the immediately preceding equivalent period."
      title="Period comparison"
      tone="strong"
    >
      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {comparisons.map((comparison) => (
          <div className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4" key={comparison.currency}>
            <h3 className="text-card text-app-text">{comparison.currency}</h3>
            <ComparisonRow currency={comparison.currency} label="Income" metric={comparison.income} />
            <ComparisonRow currency={comparison.currency} label="Expenses" metric={comparison.expenses} />
            <ComparisonRow currency={comparison.currency} label="Net cash flow" metric={comparison.netCashFlow} />
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function ComparisonRow({
  currency,
  label,
  metric,
}: {
  currency: string;
  label: string;
  metric: PeriodComparison["income"];
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <span className="text-right text-app-muted">
        {signedMoney(metric.changeMinor, currency)}
        <span className="block text-caption">
          {metric.changePercent === null ? "No previous value" : formatPercentage(metric.changePercent)}
        </span>
      </span>
    </div>
  );
}

function BudgetSection({ budgets }: { budgets: BudgetPerformance[] }) {
  return (
    <AppCard
      description="Budget spending counts matching expense transactions in each budget month."
      title="Budget performance"
    >
      {budgets.length === 0 ? (
        <EmptyState title="No matching budgets.">
          Monthly budgets that overlap this period will appear here.
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {budgets.map((budget) => (
            <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4" key={`${budget.id}-${budget.currency}`}>
              <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                <div>
                  <h3 className="text-card text-app-text">{budget.name}</h3>
                  <p className="text-sm text-app-muted">
                    {budget.categoryName} / {budget.month}/{budget.year}
                  </p>
                </div>
                <AppBadge
                  variant={
                    budget.status === "Over budget"
                      ? "expense"
                      : budget.status === "Approaching limit"
                        ? "warning"
                        : "success"
                  }
                >
                  {budget.status}
                </AppBadge>
              </div>
              <ProgressBar
                className="mt-4"
                tone={budget.status === "Over budget" ? "expense" : budget.status === "Approaching limit" ? "warning" : "primary"}
                value={budget.percentageUsed}
              />
              <div className="mt-3 grid grid-cols-5 gap-2 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
                <Metric label="Limit" value={money(budget.limitMinor, budget.currency)} />
                <Metric label="Spent" value={money(budget.spentMinor, budget.currency)} />
                <Metric label="Remaining" value={money(budget.remainingMinor, budget.currency)} />
                <Metric label="Used" value={formatPercentage(budget.percentageUsed)} />
                <Metric label="Over" value={money(budget.overBudgetMinor, budget.currency)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

function AccountSection({ summary }: { summary: ReportsSummary }) {
  return (
    <AppCard
      description="Account balances are grouped by currency. Distribution percentages appear only inside each currency group."
      title="Account statistics"
      tone="strong"
    >
      {summary.accountGroups.length === 0 ? (
        <EmptyState title="No accounts match these filters." />
      ) : (
        <div className="grid gap-4">
          {summary.accountGroups.map((group) => (
            <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4" key={group.currency}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-card text-app-text">{group.currency}</h3>
                <strong className="text-app-text">{money(group.totalBalanceMinor, group.currency)}</strong>
              </div>
              <div className="mt-3 grid gap-3">
                {group.accounts.map((account) => (
                  <div className="grid gap-2" key={account.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-semibold text-app-text">
                        {account.name}
                        {account.isArchived ? " (archived)" : ""}
                      </span>
                      <span className="whitespace-nowrap text-app-muted">
                        {money(account.balanceMinor, account.currency)}
                      </span>
                    </div>
                    {account.percentageOfCurrencyTotal !== null ? (
                      <ProgressBar value={account.percentageOfCurrencyTotal} />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

function RecurringSection({ summary }: { summary: ReportsSummary }) {
  return (
    <AppCard
      description="Expected recurring bills are shown separately from actual expense transactions."
      title="Recurring-bill statistics"
    >
      {summary.recurringBills.length === 0 ? (
        <EmptyState title="No recurring bills match this period." />
      ) : (
        <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-1">
          {summary.recurringBills.map((bill) => (
            <div className="grid gap-2 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4" key={bill.currency}>
              <h3 className="text-card text-app-text">{bill.currency}</h3>
              <Metric label="Expected bills" value={String(bill.expectedBills)} />
              <Metric label="Paid bills" value={String(bill.paidBills)} />
              <Metric label="Unpaid bills" value={String(bill.unpaidBills)} />
              <Metric label="Expected amount" value={money(bill.expectedAmountMinor, bill.currency)} />
              <Metric label="Paid amount" value={money(bill.paidAmountMinor, bill.currency)} />
              <Metric label="Upcoming amount" value={money(bill.upcomingAmountMinor, bill.currency)} />
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

function SavingsSection({ summary }: { summary: ReportsSummary }) {
  const stats = summary.savingsGoals;

  return (
    <AppCard
      description="Savings targets are not treated as balances. Contributions come from recorded contribution transactions."
      title="Savings-goal statistics"
      tone="strong"
    >
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 max-xl:grid-cols-1">
        <div className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4">
          <Metric label="Active goals" value={String(stats.activeGoals)} />
          <Metric label="Completed goals" value={String(stats.completedGoals)} />
          <Metric label="Total targets" value={formatMinor(stats.totalTargetsMinor)} />
          <Metric label="Overall progress" value={formatPercentage(stats.overallProgressPercent)} />
          <ProgressBar value={stats.overallProgressPercent} />
        </div>
        <div className="grid gap-3">
          {stats.recordedContributions.length === 0 ? (
            <EmptyState title="No recorded contributions in this period." />
          ) : (
            stats.recordedContributions.map((total) => (
              <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/44 p-4" key={total.currency}>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-app-text">{total.currency}</span>
                  <span className="font-semibold text-app-muted">
                    {money(total.amountMinor, total.currency)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-app-muted">
                  {total.transactionCount} contribution transactions
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </AppCard>
  );
}

function YearlySection({ summary }: { summary: ReportsSummary }) {
  if (!summary.yearlyOverview) {
    return null;
  }

  return (
    <AppCard
      description="Shown when the selected period is a complete calendar year."
      title={`Yearly overview ${summary.yearlyOverview.year}`}
    >
      <div className="grid gap-5">
        {summary.yearlyOverview.currencySummaries.map((overview) => (
          <div className="grid gap-3" key={overview.currency}>
            <div className="flex flex-wrap items-center gap-3">
              <AppBadge variant="neutral">{overview.currency}</AppBadge>
              <span className="text-sm text-app-muted">
                Annual net {signedMoney(overview.annualNetCashFlowMinor, overview.currency)}
              </span>
              <span className="text-sm text-app-muted">
                Highest expense {overview.highestExpenseMonth ?? "None"}
              </span>
              <span className="text-sm text-app-muted">
                Best net cash flow {overview.bestNetCashFlowMonth ?? "None"}
              </span>
            </div>
            <YearlyBarChart data={overview.months} currency={overview.currency} />
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function MatchingTransactionsSection({
  onViewTransactions,
  summary,
}: {
  onViewTransactions: (filters?: Partial<ReportFilterState>) => void;
  summary: ReportsSummary;
}) {
  const transactions = summary.matchingTransactions.slice(0, 12);

  return (
    <AppCard
      actions={
        <AppButton
          icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onViewTransactions()}
          variant="primary"
        >
          View matching transactions
        </AppButton>
      }
      description="A compact preview of transactions included in the current report."
      title="Matching transactions"
      tone="strong"
    >
      {transactions.length === 0 ? (
        <EmptyState title="No matching transactions." />
      ) : (
        <AppTable minWidth="min-w-[56rem]">
          <TableHeader>
            <tr>
              <TableCell header>Date</TableCell>
              <TableCell header>Description</TableCell>
              <TableCell header>Category</TableCell>
              <TableCell header>Account</TableCell>
              <TableCell header>Type</TableCell>
              <TableCell align="right" header>Amount</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <tr className="bg-white/36" key={transaction.id}>
                <TableCell>{transaction.transactionDate}</TableCell>
                <TableCell>{transaction.description || transaction.categoryName}</TableCell>
                <TableCell>{transaction.categoryName}</TableCell>
                <TableCell>{transaction.accountName}</TableCell>
                <TableCell>
                  <AppBadge variant={transaction.transactionType}>
                    {transaction.transactionType}
                  </AppBadge>
                </TableCell>
                <TableCell align="right">
                  {transaction.transactionType === "income" ? "+" : "-"}
                  {money(transaction.amountMinor, transaction.currency)}
                </TableCell>
              </tr>
            ))}
          </TableBody>
        </AppTable>
      )}
    </AppCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-app-xs border border-[rgba(60,38,52,0.08)] bg-white/44 p-3">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
        {label}
      </p>
      <p className="mt-1 font-semibold text-app-text">{value}</p>
    </div>
  );
}

function currenciesFor(summary: ReportsSummary) {
  const currencies = new Set<string>();
  summary.currencySummaries.forEach((item) => currencies.add(item.currency));
  summary.trend.forEach((item) => currencies.add(item.currency));
  return Array.from(currencies.size ? currencies : new Set(["MAD"])).sort();
}

function money(value: number, currency: string) {
  return `${formatMinor(value)} ${currency}`;
}

function signedMoney(value: number, currency: string) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${money(Math.abs(value), currency)}`;
}
