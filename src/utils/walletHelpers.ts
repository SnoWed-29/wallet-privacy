import type {
  BudgetFormState,
  RecurringBillFormState,
  RecurringFrequency,
  SavingsGoalFormState,
  TransactionFilterState,
} from "../types/wallet";

export const savingContributionCategoryName = "Saving Contribution";

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const recurringFrequencyOptions: RecurringFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export function defaultBudgetForm(): BudgetFormState {
  const today = new Date();

  return {
    name: "",
    categoryId: "",
    amount: "",
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
  };
}

export function defaultRecurringBillForm(): RecurringBillFormState {
  return {
    name: "",
    accountId: "",
    categoryId: "",
    amount: "",
    frequency: "monthly",
    nextDueDate: todayInputValue(),
    description: "",
  };
}

export function emptySavingsGoalForm(): SavingsGoalFormState {
  return {
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadlineDate: "",
  };
}

export function monthName(month: number) {
  return (
    monthOptions.find((monthOption) => Number(monthOption.value) === month)
      ?.label ?? String(month)
  );
}

export function emptyTransactionFilters(): TransactionFilterState {
  return {
    accountId: "",
    categoryId: "",
    transactionType: "",
    startDate: "",
    endDate: "",
    search: "",
  };
}

export function hasActiveTransactionFilters(filters: TransactionFilterState) {
  return Object.values(filters).some((value) => value.trim() !== "");
}

export function normalAmountToMinor(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [units, decimals = ""] = trimmed.split(".");
  const amountMinor = Number(units) * 100 + Number(decimals.padEnd(2, "0"));

  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    return null;
  }

  return amountMinor;
}

export function optionalNormalAmountToMinor(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return 0;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [units, decimals = ""] = trimmed.split(".");
  const amountMinor = Number(units) * 100 + Number(decimals.padEnd(2, "0"));

  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    return null;
  }

  return amountMinor;
}

export function formatMinor(value: number) {
  return (value / 100).toFixed(2);
}

export function formatPercentage(value: number) {
  return value.toFixed(2) + "%";
}

export function minorToNormalAmount(value: number) {
  return (value / 100).toFixed(2);
}
