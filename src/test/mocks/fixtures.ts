import type {
  Account,
  Budget,
  Category,
  DashboardSummary,
  RecurringBill,
  SavingsGoal,
  Transaction,
} from "../../types/wallet";

export const accountFixture: Account = {
  id: "account-1",
  name: "Checking",
  accountType: "cash",
  currency: "MAD",
  initialBalanceMinor: 100_000,
  balanceMinor: 125_000,
  isArchived: false,
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const incomeCategoryFixture: Category = {
  id: "category-income",
  name: "Salary",
  categoryType: "income",
  icon: null,
  color: null,
  isArchived: false,
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const expenseCategoryFixture: Category = {
  id: "category-expense",
  name: "Groceries",
  categoryType: "expense",
  icon: null,
  color: null,
  isArchived: false,
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const incomeTransactionFixture: Transaction = {
  id: "transaction-income",
  accountId: accountFixture.id,
  categoryId: incomeCategoryFixture.id,
  transactionType: "income",
  amountMinor: 200_000,
  description: "June salary",
  transactionDate: "2026-06-10",
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const expenseTransactionFixture: Transaction = {
  id: "transaction-expense",
  accountId: accountFixture.id,
  categoryId: expenseCategoryFixture.id,
  transactionType: "expense",
  amountMinor: 12_500,
  description: "Weekly groceries",
  transactionDate: "2026-06-09",
  createdAt: "2026-06-09T00:00:00Z",
  updatedAt: "2026-06-09T00:00:00Z",
};

export const budgetFixture: Budget = {
  id: "budget-1",
  name: "Food budget",
  categoryId: expenseCategoryFixture.id,
  categoryName: expenseCategoryFixture.name,
  amountMinor: 100_000,
  spentMinor: 25_000,
  remainingMinor: 75_000,
  progressPercentage: 25,
  isNearLimit: false,
  isExceeded: false,
  month: 6,
  year: 2026,
  isArchived: false,
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const savingsGoalFixture: SavingsGoal = {
  id: "goal-1",
  name: "Emergency fund",
  targetAmountMinor: 500_000,
  currentAmountMinor: 125_000,
  remainingAmountMinor: 375_000,
  progressPercent: 25,
  deadlineDate: "2026-12-31",
  isArchived: false,
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const recurringBillFixture: RecurringBill = {
  id: "bill-1",
  name: "Internet",
  accountId: accountFixture.id,
  accountName: accountFixture.name,
  categoryId: expenseCategoryFixture.id,
  categoryName: expenseCategoryFixture.name,
  amountMinor: 25_000,
  frequency: "monthly",
  nextDueDate: "2026-06-15",
  lastPaidDate: null,
  description: "Fiber internet",
  isArchived: false,
  createdAt: "2026-06-10T00:00:00Z",
  updatedAt: "2026-06-10T00:00:00Z",
};

export const dashboardFixture: DashboardSummary = {
  totalBalanceMinor: 125_000,
  monthlyIncomeMinor: 200_000,
  monthlyExpenseMinor: 50_000,
  monthlyNetMinor: 150_000,
  accounts: [{ id: accountFixture.id, name: accountFixture.name, balanceMinor: 125_000 }],
  recentTransactions: [
    {
      amountMinor: expenseTransactionFixture.amountMinor,
      transactionType: expenseTransactionFixture.transactionType,
      accountName: accountFixture.name,
      categoryName: expenseCategoryFixture.name,
      description: expenseTransactionFixture.description,
      transactionDate: expenseTransactionFixture.transactionDate,
    },
  ],
  activeBudgets: [
    {
      name: budgetFixture.name,
      categoryName: budgetFixture.categoryName,
      amountMinor: budgetFixture.amountMinor,
      spentMinor: budgetFixture.spentMinor,
      remainingMinor: budgetFixture.remainingMinor,
      progressPercentage: budgetFixture.progressPercentage,
      isNearLimit: budgetFixture.isNearLimit,
      isExceeded: budgetFixture.isExceeded,
    },
  ],
  upcomingRecurringBills: [
    {
      name: recurringBillFixture.name,
      amountMinor: recurringBillFixture.amountMinor,
      nextDueDate: recurringBillFixture.nextDueDate,
      daysRemaining: 5,
    },
  ],
  activeSavingsGoals: [
    {
      name: savingsGoalFixture.name,
      targetAmountMinor: savingsGoalFixture.targetAmountMinor,
      currentAmountMinor: savingsGoalFixture.currentAmountMinor,
      remainingAmountMinor: savingsGoalFixture.remainingAmountMinor,
      progressPercent: savingsGoalFixture.progressPercent,
    },
  ],
};

export function emptyDashboardFixture(): DashboardSummary {
  return {
    totalBalanceMinor: 0,
    monthlyIncomeMinor: 0,
    monthlyExpenseMinor: 0,
    monthlyNetMinor: 0,
    accounts: [],
    recentTransactions: [],
    activeBudgets: [],
    upcomingRecurringBills: [],
    activeSavingsGoals: [],
  };
}
