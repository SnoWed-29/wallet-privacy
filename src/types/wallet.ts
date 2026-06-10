export type TransactionType = "income" | "expense";

export type Account = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  initialBalanceMinor: number;
  balanceMinor: number;
};

export type Category = {
  id: string;
  name: string;
  categoryType: TransactionType;
  icon: string | null;
  color: string | null;
};

export type Transaction = {
  id: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  amountMinor: number;
  description: string | null;
  transactionDate: string;
};

export type Budget = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  amountMinor: number;
  spentMinor: number;
  remainingMinor: number;
  progressPercentage: number;
  isNearLimit: boolean;
  isExceeded: boolean;
  month: number;
  year: number;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  remainingAmountMinor: number;
  progressPercent: number;
  deadlineDate: string | null;
};

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurringBill = {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  amountMinor: number;
  frequency: RecurringFrequency;
  nextDueDate: string;
  lastPaidDate: string | null;
  description: string | null;
};

export type DashboardSummary = {
  totalBalanceMinor: number;
  monthlyIncomeMinor: number;
  monthlyExpenseMinor: number;
  monthlyNetMinor: number;
  accounts: DashboardAccount[];
  recentTransactions: DashboardRecentTransaction[];
  activeBudgets: DashboardBudget[];
  upcomingRecurringBills: DashboardRecurringBill[];
  activeSavingsGoals: DashboardSavingsGoal[];
};

export type DashboardAccount = {
  id: string;
  name: string;
  balanceMinor: number;
};

export type DashboardRecentTransaction = {
  amountMinor: number;
  transactionType: TransactionType;
  categoryName: string;
  accountName: string;
  description: string | null;
  transactionDate: string;
};

export type DashboardBudget = {
  name: string;
  categoryName: string;
  amountMinor: number;
  spentMinor: number;
  remainingMinor: number;
  progressPercentage: number;
  isNearLimit: boolean;
  isExceeded: boolean;
};

export type DashboardRecurringBill = {
  name: string;
  amountMinor: number;
  nextDueDate: string;
  daysRemaining: number;
};

export type DashboardSavingsGoal = {
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  remainingAmountMinor: number;
  progressPercent: number;
};

export type TransactionFormState = {
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  amount: string;
  description: string;
  transactionDate: string;
};

export type TransactionFilterState = {
  accountId: string;
  categoryId: string;
  transactionType: TransactionType | "";
  startDate: string;
  endDate: string;
  search: string;
};

export type BudgetFormState = {
  name: string;
  categoryId: string;
  amount: string;
  month: string;
  year: string;
};

export type SavingsGoalFormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadlineDate: string;
};

export type SavingsGoalContributionState = {
  accountId: string;
  amount: string;
};

export type RecurringBillFormState = {
  name: string;
  accountId: string;
  categoryId: string;
  amount: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  description: string;
};
