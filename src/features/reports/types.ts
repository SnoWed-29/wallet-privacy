import type { TransactionType } from "../../types/wallet";

export type ReportFilters = {
  startDate: string;
  endDate: string;
  accountId: string | null;
  categoryId: string | null;
  transactionType: TransactionType | null;
  currency: string | null;
  grouping: "daily" | "weekly" | "monthly";
  dayCount: number;
};

export type ReportFilterState = {
  startDate: string;
  endDate: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType | "";
  currency: string;
};

export type ReportsSummary = {
  filters: ReportFilters;
  availableCurrencies: string[];
  hasMixedCurrencies: boolean;
  currencySummaries: CurrencySummary[];
  trend: TrendPoint[];
  expenseCategories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  periodComparison: PeriodComparison[];
  budgetPerformance: BudgetPerformance[];
  accountGroups: AccountCurrencyGroup[];
  recurringBills: RecurringBillStats[];
  savingsGoals: SavingsGoalStats;
  yearlyOverview: YearlyOverview | null;
  matchingTransactions: ReportTransaction[];
};

export type CurrencySummary = {
  currency: string;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netCashFlowMinor: number;
  savingsRatePercent: number;
  averageDailySpendingMinor: number;
  transactionCount: number;
};

export type TrendPoint = {
  currency: string;
  periodStart: string;
  periodLabel: string;
  incomeMinor: number;
  expenseMinor: number;
  netCashFlowMinor: number;
};

export type CategoryTotal = {
  currency: string;
  categoryId: string;
  categoryName: string;
  totalMinor: number;
  percentage: number;
  transactionCount: number;
};

export type PeriodComparison = {
  currency: string;
  income: ComparisonMetric;
  expenses: ComparisonMetric;
  netCashFlow: ComparisonMetric;
};

export type ComparisonMetric = {
  currentMinor: number;
  previousMinor: number;
  changeMinor: number;
  changePercent: number | null;
};

export type BudgetPerformance = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  currency: string;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentageUsed: number;
  overBudgetMinor: number;
  status: "On track" | "Approaching limit" | "Over budget";
  month: number;
  year: number;
};

export type AccountCurrencyGroup = {
  currency: string;
  totalBalanceMinor: number;
  accounts: AccountStatistic[];
};

export type AccountStatistic = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  balanceMinor: number;
  percentageOfCurrencyTotal: number | null;
  isArchived: boolean;
};

export type RecurringBillStats = {
  currency: string;
  expectedBills: number;
  paidBills: number;
  unpaidBills: number;
  expectedAmountMinor: number;
  paidAmountMinor: number;
  upcomingAmountMinor: number;
};

export type SavingsGoalStats = {
  activeGoals: number;
  completedGoals: number;
  totalTargetsMinor: number;
  recordedContributions: ContributionCurrencyTotal[];
  overallProgressPercent: number;
  contributionHistory: SavingsContributionPoint[];
};

export type ContributionCurrencyTotal = {
  currency: string;
  amountMinor: number;
  transactionCount: number;
};

export type SavingsContributionPoint = {
  currency: string;
  date: string;
  amountMinor: number;
};

export type YearlyOverview = {
  year: number;
  currencySummaries: YearlyCurrencyOverview[];
};

export type YearlyCurrencyOverview = {
  currency: string;
  months: YearMonthPoint[];
  annualIncomeMinor: number;
  annualExpenseMinor: number;
  annualNetCashFlowMinor: number;
  averageMonthlyIncomeMinor: number;
  averageMonthlyExpenseMinor: number;
  highestExpenseMonth: string | null;
  bestNetCashFlowMonth: string | null;
};

export type YearMonthPoint = {
  month: number;
  label: string;
  incomeMinor: number;
  expenseMinor: number;
  netCashFlowMinor: number;
};

export type ReportTransaction = {
  id: string;
  accountId: string;
  accountName: string;
  accountType: string;
  currency: string;
  categoryId: string;
  categoryName: string;
  categoryType: TransactionType;
  transactionType: TransactionType;
  amountMinor: number;
  description: string | null;
  transactionDate: string;
};
