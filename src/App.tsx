import { FormEvent, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, navigationItems } from "./components/layout";
import { AppBadge, AppButton, AppCard, EmptyState } from "./components/ui";
import { TransactionsPage } from "./features/transactions/pages/TransactionsPage";
import "./styles/globals.css";

type TransactionType = "income" | "expense";

type Account = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  initialBalanceMinor: number;
  balanceMinor: number;
};

type Category = {
  id: string;
  name: string;
  categoryType: TransactionType;
  icon: string | null;
  color: string | null;
};

type Transaction = {
  id: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  amountMinor: number;
  description: string | null;
  transactionDate: string;
};

type Budget = {
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

type SavingsGoal = {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  remainingAmountMinor: number;
  progressPercent: number;
  deadlineDate: string | null;
};

type RecurringBill = {
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

type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

const savingContributionCategoryName = "Saving Contribution";

type DashboardSummary = {
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

type DashboardAccount = {
  id: string;
  name: string;
  balanceMinor: number;
};

type DashboardRecentTransaction = {
  amountMinor: number;
  transactionType: TransactionType;
  categoryName: string;
  accountName: string;
  description: string | null;
  transactionDate: string;
};

type DashboardBudget = {
  name: string;
  categoryName: string;
  amountMinor: number;
  spentMinor: number;
  remainingMinor: number;
  progressPercentage: number;
  isNearLimit: boolean;
  isExceeded: boolean;
};

type DashboardRecurringBill = {
  name: string;
  amountMinor: number;
  nextDueDate: string;
  daysRemaining: number;
};

type DashboardSavingsGoal = {
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  remainingAmountMinor: number;
  progressPercent: number;
};

type TransactionFormState = {
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  amount: string;
  description: string;
  transactionDate: string;
};

type TransactionFilterState = {
  accountId: string;
  categoryId: string;
  transactionType: TransactionType | "";
  startDate: string;
  endDate: string;
  search: string;
};

type BudgetFormState = {
  name: string;
  categoryId: string;
  amount: string;
  month: string;
  year: string;
};

type SavingsGoalFormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadlineDate: string;
};

type SavingsGoalContributionState = {
  accountId: string;
  amount: string;
};

type RecurringBillFormState = {
  name: string;
  accountId: string;
  categoryId: string;
  amount: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  description: string;
};

function App() {
  const [accountName, setAccountName] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactionAccountId, setTransactionAccountId] = useState("");
  const [transactionCategoryId, setTransactionCategoryId] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayInputValue());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionFilters, setTransactionFilters] =
    useState<TransactionFilterState>(emptyTransactionFilters);
  const [appliedTransactionFilters, setAppliedTransactionFilters] =
    useState<TransactionFilterState>(emptyTransactionFilters);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(
    defaultBudgetForm,
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsGoalForm, setSavingsGoalForm] =
    useState<SavingsGoalFormState>(emptySavingsGoalForm);
  const [savingsGoalContributions, setSavingsGoalContributions] = useState<
    Record<string, SavingsGoalContributionState>
  >({});
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [recurringBillForm, setRecurringBillForm] =
    useState<RecurringBillFormState>(defaultRecurringBillForm);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState("");
  const [editTransaction, setEditTransaction] =
    useState<TransactionFormState | null>(null);
  const [editingBudgetId, setEditingBudgetId] = useState("");
  const [editBudget, setEditBudget] = useState<BudgetFormState | null>(null);
  const [editingSavingsGoalId, setEditingSavingsGoalId] = useState("");
  const [editSavingsGoal, setEditSavingsGoal] =
    useState<SavingsGoalFormState | null>(null);
  const [editingRecurringBillId, setEditingRecurringBillId] = useState("");
  const [editRecurringBill, setEditRecurringBill] =
    useState<RecurringBillFormState | null>(null);
  const [editingAccountId, setEditingAccountId] = useState("");
  const [editAccountName, setEditAccountName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] =
    useState<TransactionType>("expense");
  const [error, setError] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isSavingSavingsGoal, setIsSavingSavingsGoal] = useState(false);
  const [isSavingRecurringBill, setIsSavingRecurringBill] = useState(false);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const [isUpdatingSavingsGoal, setIsUpdatingSavingsGoal] = useState(false);
  const [isUpdatingRecurringBill, setIsUpdatingRecurringBill] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [archivingAccountId, setArchivingAccountId] = useState("");
  const [archivingCategoryId, setArchivingCategoryId] = useState("");
  const [archivingBudgetId, setArchivingBudgetId] = useState("");
  const [archivingSavingsGoalId, setArchivingSavingsGoalId] = useState("");
  const [archivingRecurringBillId, setArchivingRecurringBillId] = useState("");
  const [contributingSavingsGoalId, setContributingSavingsGoalId] = useState("");
  const [payingRecurringBillId, setPayingRecurringBillId] = useState("");
  const [deletingTransactionId, setDeletingTransactionId] = useState("");
  const [isFilteringTransactions, setIsFilteringTransactions] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const matchingCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.categoryType === transactionType &&
          category.name !== savingContributionCategoryName,
      ),
    [categories, transactionType],
  );

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.categoryType === "expense"),
    [categories],
  );

  async function loadAccounts() {
    try {
      const savedAccounts = await invoke<Account[]>("list_accounts");
      setAccounts(savedAccounts);
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadCategories() {
    try {
      const savedCategories = await invoke<Category[]>("list_categories");
      setCategories(savedCategories);
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadTransactions(
    filters: TransactionFilterState = appliedTransactionFilters,
  ) {
    try {
      const savedTransactions = hasActiveTransactionFilters(filters)
        ? await invoke<Transaction[]>("filter_transactions", {
            request: {
              accountId: filters.accountId,
              categoryId: filters.categoryId,
              transactionType: filters.transactionType,
              startDate: filters.startDate,
              endDate: filters.endDate,
              search: filters.search,
            },
          })
        : await invoke<Transaction[]>("list_transactions");
      setTransactions(savedTransactions);
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadBudgets() {
    try {
      const savedBudgets = await invoke<Budget[]>("list_budgets");
      setBudgets(savedBudgets);
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadSavingsGoals() {
    try {
      const savedGoals = await invoke<SavingsGoal[]>("list_savings_goals");
      setSavingsGoals(savedGoals);
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadRecurringBills() {
    try {
      const savedBills = await invoke<RecurringBill[]>("list_recurring_bills");
      setRecurringBills(savedBills);
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadDashboard() {
    setIsLoadingDashboard(true);

    try {
      const summary = await invoke<DashboardSummary>("get_dashboard_summary");
      setDashboard(summary);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  useEffect(() => {
    loadAccounts();
    loadCategories();
    loadTransactions();
    loadBudgets();
    loadSavingsGoals();
    loadRecurringBills();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!transactionAccountId && accounts.length > 0) {
      setTransactionAccountId(accounts[0].id);
    }
  }, [accounts, transactionAccountId]);

  useEffect(() => {
    if (
      transactionCategoryId &&
      !matchingCategories.some((category) => category.id === transactionCategoryId)
    ) {
      setTransactionCategoryId("");
    }

    if (!transactionCategoryId && matchingCategories.length > 0) {
      setTransactionCategoryId(matchingCategories[0].id);
    }
  }, [matchingCategories, transactionCategoryId]);

  useEffect(() => {
    if (!budgetForm.categoryId && expenseCategories.length > 0) {
      setBudgetForm((current) => ({
        ...current,
        categoryId: expenseCategories[0].id,
      }));
    }
  }, [budgetForm.categoryId, expenseCategories]);

  useEffect(() => {
    if (!recurringBillForm.accountId && accounts.length > 0) {
      setRecurringBillForm((current) => ({
        ...current,
        accountId: accounts[0].id,
      }));
    }
  }, [accounts, recurringBillForm.accountId]);

  useEffect(() => {
    if (!recurringBillForm.categoryId && expenseCategories.length > 0) {
      setRecurringBillForm((current) => ({
        ...current,
        categoryId: expenseCategories[0].id,
      }));
    }
  }, [expenseCategories, recurringBillForm.categoryId]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingAccount(true);

    try {
      await invoke<Account>("create_account", {
        request: {
          name: accountName,
          currency: "MAD",
          accountType: "cash",
          initialBalanceMinor: 0,
        },
      });
      setAccountName("");
      await loadAccounts();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingCategory(true);

    try {
      await invoke<Category>("create_category", {
        request: {
          name: categoryName,
          categoryType,
          icon: "",
          color: "",
        },
      });
      setCategoryName("");
      await loadCategories();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function createTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const amountMinor = normalAmountToMinor(transactionAmount);
    if (amountMinor === null) {
      setError("Enter a transaction amount greater than 0.");
      return;
    }

    setIsSavingTransaction(true);

    try {
      await invoke<Transaction>("create_transaction", {
        request: {
          accountId: transactionAccountId,
          categoryId: transactionCategoryId,
          transactionType,
          amountMinor,
          description: transactionDescription,
          transactionDate,
        },
      });
      setTransactionAmount("");
      setTransactionDescription("");
      await loadTransactions();
      await loadAccounts();
      await loadBudgets();
      await loadSavingsGoals();
      await loadRecurringBills();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSavingTransaction(false);
    }
  }

  function startEditingTransaction(transaction: Transaction) {
    setError("");
    setEditingTransactionId(transaction.id);
    setEditTransaction({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      transactionType: transaction.transactionType,
      amount: minorToNormalAmount(transaction.amountMinor),
      description: transaction.description ?? "",
      transactionDate: transaction.transactionDate,
    });
  }

  function cancelEditingTransaction() {
    setEditingTransactionId("");
    setEditTransaction(null);
  }

  function startEditingAccount(account: Account) {
    setError("");
    setEditingAccountId(account.id);
    setEditAccountName(account.name);
  }

  function cancelEditingAccount() {
    setEditingAccountId("");
    setEditAccountName("");
  }

  async function updateAccount(
    event: FormEvent<HTMLFormElement>,
    account: Account,
  ) {
    event.preventDefault();
    setError("");
    setIsUpdatingAccount(true);

    try {
      await invoke<Account>("update_account", {
        request: {
          id: account.id,
          name: editAccountName,
          accountType: account.accountType,
          currency: account.currency,
        },
      });
      cancelEditingAccount();
      await loadAccounts();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUpdatingAccount(false);
    }
  }

  async function archiveAccount(id: string) {
    setError("");
    setArchivingAccountId(id);

    try {
      await invoke("archive_account", {
        request: { id },
      });
      if (editingAccountId === id) {
        cancelEditingAccount();
      }
      if (transactionAccountId === id) {
        setTransactionAccountId("");
      }
      await loadAccounts();
      await loadTransactions();
    } catch (err) {
      setError(String(err));
    } finally {
      setArchivingAccountId("");
    }
  }

  function startEditingCategory(category: Category) {
    setError("");
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryType(category.categoryType);
  }

  function cancelEditingCategory() {
    setEditingCategoryId("");
    setEditCategoryName("");
    setEditCategoryType("expense");
  }

  async function updateCategory(
    event: FormEvent<HTMLFormElement>,
    category: Category,
  ) {
    event.preventDefault();
    setError("");
    setIsUpdatingCategory(true);

    try {
      await invoke<Category>("update_category", {
        request: {
          id: category.id,
          name: editCategoryName,
          categoryType: editCategoryType,
          icon: category.icon ?? "",
          color: category.color ?? "",
        },
      });
      cancelEditingCategory();
      await loadCategories();
      await loadBudgets();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUpdatingCategory(false);
    }
  }

  async function archiveCategory(id: string) {
    setError("");
    setArchivingCategoryId(id);

    try {
      await invoke("archive_category", {
        request: { id },
      });
      if (editingCategoryId === id) {
        cancelEditingCategory();
      }
      if (transactionCategoryId === id) {
        setTransactionCategoryId("");
      }
      await loadCategories();
      await loadTransactions();
      await loadBudgets();
    } catch (err) {
      setError(String(err));
    } finally {
      setArchivingCategoryId("");
    }
  }

  async function updateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!editTransaction) {
      return;
    }

    const amountMinor = normalAmountToMinor(editTransaction.amount);
    if (amountMinor === null) {
      setError("Enter a transaction amount greater than 0.");
      return;
    }

    setIsUpdatingTransaction(true);

    try {
      await invoke<Transaction>("update_transaction", {
        request: {
          id: editingTransactionId,
          accountId: editTransaction.accountId,
          categoryId: editTransaction.categoryId,
          transactionType: editTransaction.transactionType,
          amountMinor,
          description: editTransaction.description,
          transactionDate: editTransaction.transactionDate,
        },
      });
      cancelEditingTransaction();
      await loadTransactions();
      await loadAccounts();
      await loadBudgets();
      await loadSavingsGoals();
      await loadRecurringBills();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUpdatingTransaction(false);
    }
  }

  async function deleteTransaction(id: string) {
    setError("");
    setDeletingTransactionId(id);

    try {
      await invoke("delete_transaction", {
        request: { id },
      });
      if (editingTransactionId === id) {
        cancelEditingTransaction();
      }
      await loadTransactions();
      await loadAccounts();
      await loadBudgets();
      await loadSavingsGoals();
      await loadRecurringBills();
    } catch (err) {
      setError(String(err));
    } finally {
      setDeletingTransactionId("");
    }
  }

  function updateTransactionFilter(changes: Partial<TransactionFilterState>) {
    setTransactionFilters((current) => ({
      ...current,
      ...changes,
    }));
  }

  async function applyTransactionFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsFilteringTransactions(true);

    try {
      setAppliedTransactionFilters(transactionFilters);
      await loadTransactions(transactionFilters);
    } finally {
      setIsFilteringTransactions(false);
    }
  }

  async function clearTransactionFilters() {
    const emptyFilters = emptyTransactionFilters();
    setError("");
    setTransactionFilters(emptyFilters);
    setAppliedTransactionFilters(emptyFilters);
    setIsFilteringTransactions(true);

    try {
      await loadTransactions(emptyFilters);
    } finally {
      setIsFilteringTransactions(false);
    }
  }

  function updateBudgetForm(changes: Partial<BudgetFormState>) {
    setBudgetForm((current) => ({
      ...current,
      ...changes,
    }));
  }

  function updateEditBudget(changes: Partial<BudgetFormState>) {
    setEditBudget((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ...changes,
      };
    });
  }

  async function createBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const amountMinor = normalAmountToMinor(budgetForm.amount);
    if (amountMinor === null) {
      setError("Enter a budget amount greater than 0.");
      return;
    }

    setIsSavingBudget(true);

    try {
      await invoke<Budget>("create_budget", {
        request: {
          name: budgetForm.name,
          categoryId: budgetForm.categoryId,
          amountMinor,
          month: Number(budgetForm.month),
          year: Number(budgetForm.year),
        },
      });
      setBudgetForm((current) => ({
        ...defaultBudgetForm(),
        categoryId: current.categoryId,
      }));
      await loadBudgets();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSavingBudget(false);
    }
  }

  function startEditingBudget(budget: Budget) {
    setError("");
    setEditingBudgetId(budget.id);
    setEditBudget({
      name: budget.name,
      categoryId: budget.categoryId,
      amount: minorToNormalAmount(budget.amountMinor),
      month: String(budget.month),
      year: String(budget.year),
    });
  }

  function cancelEditingBudget() {
    setEditingBudgetId("");
    setEditBudget(null);
  }

  async function updateBudget(
    event: FormEvent<HTMLFormElement>,
    budget: Budget,
  ) {
    event.preventDefault();
    setError("");

    if (!editBudget) {
      return;
    }

    const amountMinor = normalAmountToMinor(editBudget.amount);
    if (amountMinor === null) {
      setError("Enter a budget amount greater than 0.");
      return;
    }

    setIsUpdatingBudget(true);

    try {
      await invoke<Budget>("update_budget", {
        request: {
          id: budget.id,
          name: editBudget.name,
          categoryId: editBudget.categoryId,
          amountMinor,
          month: Number(editBudget.month),
          year: Number(editBudget.year),
        },
      });
      cancelEditingBudget();
      await loadBudgets();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUpdatingBudget(false);
    }
  }

  async function archiveBudget(id: string) {
    setError("");
    setArchivingBudgetId(id);

    try {
      await invoke("archive_budget", {
        request: { id },
      });
      if (editingBudgetId === id) {
        cancelEditingBudget();
      }
      await loadBudgets();
    } catch (err) {
      setError(String(err));
    } finally {
      setArchivingBudgetId("");
    }
  }

  function updateSavingsGoalForm(changes: Partial<SavingsGoalFormState>) {
    setSavingsGoalForm((current) => ({
      ...current,
      ...changes,
    }));
  }

  function updateEditSavingsGoal(changes: Partial<SavingsGoalFormState>) {
    setEditSavingsGoal((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ...changes,
      };
    });
  }

  function updateSavingsGoalContribution(
    goalId: string,
    changes: Partial<SavingsGoalContributionState>,
  ) {
    setSavingsGoalContributions((current) => ({
      ...current,
      [goalId]: {
        accountId: changes.accountId ?? current[goalId]?.accountId ?? "",
        amount: changes.amount ?? current[goalId]?.amount ?? "",
      },
    }));
  }

  async function createSavingsGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const targetAmountMinor = normalAmountToMinor(savingsGoalForm.targetAmount);
    if (targetAmountMinor === null) {
      setError("Enter a savings goal target amount greater than 0.");
      return;
    }

    const currentAmountMinor = optionalNormalAmountToMinor(
      savingsGoalForm.currentAmount,
    );
    if (currentAmountMinor === null) {
      setError("Enter a current amount of 0 or greater.");
      return;
    }

    setIsSavingSavingsGoal(true);

    try {
      await invoke<SavingsGoal>("create_savings_goal", {
        request: {
          name: savingsGoalForm.name,
          targetAmountMinor,
          currentAmountMinor,
          deadlineDate: savingsGoalForm.deadlineDate,
        },
      });
      setSavingsGoalForm(emptySavingsGoalForm());
      await loadSavingsGoals();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSavingSavingsGoal(false);
    }
  }

  function startEditingSavingsGoal(goal: SavingsGoal) {
    setError("");
    setEditingSavingsGoalId(goal.id);
    setEditSavingsGoal({
      name: goal.name,
      targetAmount: minorToNormalAmount(goal.targetAmountMinor),
      currentAmount: minorToNormalAmount(goal.currentAmountMinor),
      deadlineDate: goal.deadlineDate ?? "",
    });
  }

  function cancelEditingSavingsGoal() {
    setEditingSavingsGoalId("");
    setEditSavingsGoal(null);
  }

  async function updateSavingsGoal(
    event: FormEvent<HTMLFormElement>,
    goal: SavingsGoal,
  ) {
    event.preventDefault();
    setError("");

    if (!editSavingsGoal) {
      return;
    }

    const targetAmountMinor = normalAmountToMinor(editSavingsGoal.targetAmount);
    if (targetAmountMinor === null) {
      setError("Enter a savings goal target amount greater than 0.");
      return;
    }

    const currentAmountMinor = optionalNormalAmountToMinor(
      editSavingsGoal.currentAmount,
    );
    if (currentAmountMinor === null) {
      setError("Enter a current amount of 0 or greater.");
      return;
    }

    setIsUpdatingSavingsGoal(true);

    try {
      await invoke<SavingsGoal>("update_savings_goal", {
        request: {
          id: goal.id,
          name: editSavingsGoal.name,
          targetAmountMinor,
          currentAmountMinor,
          deadlineDate: editSavingsGoal.deadlineDate,
        },
      });
      cancelEditingSavingsGoal();
      await loadSavingsGoals();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUpdatingSavingsGoal(false);
    }
  }

  async function archiveSavingsGoal(id: string) {
    setError("");
    setArchivingSavingsGoalId(id);

    try {
      await invoke("archive_savings_goal", {
        request: { id },
      });
      if (editingSavingsGoalId === id) {
        cancelEditingSavingsGoal();
      }
      await loadSavingsGoals();
    } catch (err) {
      setError(String(err));
    } finally {
      setArchivingSavingsGoalId("");
    }
  }

  async function contributeToSavingsGoal(goal: SavingsGoal) {
    const contribution = savingsGoalContributions[goal.id] ?? {
      accountId: accounts[0]?.id ?? "",
      amount: "",
    };
    setError("");

    const amountMinor = normalAmountToMinor(contribution.amount);
    if (amountMinor === null) {
      setError("Enter a contribution amount greater than 0.");
      return;
    }

    setContributingSavingsGoalId(goal.id);

    try {
      await invoke<SavingsGoal>("contribute_to_savings_goal", {
        request: {
          savingsGoalId: goal.id,
          accountId: contribution.accountId,
          amountMinor,
          transactionDate: todayInputValue(),
          description: "",
        },
      });
      updateSavingsGoalContribution(goal.id, { amount: "" });
      await loadSavingsGoals();
      await loadTransactions();
      await loadAccounts();
      await loadCategories();
      if (dashboard) {
        await loadDashboard();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setContributingSavingsGoalId("");
    }
  }

  function updateRecurringBillForm(changes: Partial<RecurringBillFormState>) {
    setRecurringBillForm((current) => ({
      ...current,
      ...changes,
    }));
  }

  function updateEditRecurringBill(changes: Partial<RecurringBillFormState>) {
    setEditRecurringBill((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ...changes,
      };
    });
  }

  async function createRecurringBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const amountMinor = normalAmountToMinor(recurringBillForm.amount);
    if (amountMinor === null) {
      setError("Enter a recurring bill amount greater than 0.");
      return;
    }

    setIsSavingRecurringBill(true);

    try {
      await invoke<RecurringBill>("create_recurring_bill", {
        request: {
          name: recurringBillForm.name,
          accountId: recurringBillForm.accountId,
          categoryId: recurringBillForm.categoryId,
          amountMinor,
          frequency: recurringBillForm.frequency,
          nextDueDate: recurringBillForm.nextDueDate,
          description: recurringBillForm.description,
        },
      });
      setRecurringBillForm((current) => ({
        ...defaultRecurringBillForm(),
        accountId: current.accountId,
        categoryId: current.categoryId,
      }));
      await loadRecurringBills();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSavingRecurringBill(false);
    }
  }

  function startEditingRecurringBill(bill: RecurringBill) {
    setError("");
    setEditingRecurringBillId(bill.id);
    setEditRecurringBill({
      name: bill.name,
      accountId: bill.accountId,
      categoryId: bill.categoryId,
      amount: minorToNormalAmount(bill.amountMinor),
      frequency: bill.frequency,
      nextDueDate: bill.nextDueDate,
      description: bill.description ?? "",
    });
  }

  function cancelEditingRecurringBill() {
    setEditingRecurringBillId("");
    setEditRecurringBill(null);
  }

  async function updateRecurringBill(
    event: FormEvent<HTMLFormElement>,
    bill: RecurringBill,
  ) {
    event.preventDefault();
    setError("");

    if (!editRecurringBill) {
      return;
    }

    const amountMinor = normalAmountToMinor(editRecurringBill.amount);
    if (amountMinor === null) {
      setError("Enter a recurring bill amount greater than 0.");
      return;
    }

    setIsUpdatingRecurringBill(true);

    try {
      await invoke<RecurringBill>("update_recurring_bill", {
        request: {
          id: bill.id,
          name: editRecurringBill.name,
          accountId: editRecurringBill.accountId,
          categoryId: editRecurringBill.categoryId,
          amountMinor,
          frequency: editRecurringBill.frequency,
          nextDueDate: editRecurringBill.nextDueDate,
          description: editRecurringBill.description,
        },
      });
      cancelEditingRecurringBill();
      await loadRecurringBills();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUpdatingRecurringBill(false);
    }
  }

  async function archiveRecurringBill(id: string) {
    setError("");
    setArchivingRecurringBillId(id);

    try {
      await invoke("archive_recurring_bill", {
        request: { id },
      });
      if (editingRecurringBillId === id) {
        cancelEditingRecurringBill();
      }
      await loadRecurringBills();
    } catch (err) {
      setError(String(err));
    } finally {
      setArchivingRecurringBillId("");
    }
  }

  async function markRecurringBillPaid(id: string) {
    setError("");
    setPayingRecurringBillId(id);

    try {
      await invoke<RecurringBill>("mark_recurring_bill_paid", {
        request: {
          id,
          paidDate: todayInputValue(),
        },
      });
      await loadRecurringBills();
      await loadTransactions();
      await loadAccounts();
      await loadBudgets();
    } catch (err) {
      setError(String(err));
    } finally {
      setPayingRecurringBillId("");
    }
  }

  function updateEditTransaction(changes: Partial<TransactionFormState>) {
    setEditTransaction((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ...changes,
      };
    });
  }

  function editCategoriesFor(type: TransactionType) {
    return categories.filter(
      (category) =>
        category.categoryType === type &&
        category.name !== savingContributionCategoryName,
    );
  }

  function accountNameFor(id: string) {
    return accounts.find((account) => account.id === id)?.name ?? "Unknown account";
  }

  function categoryNameFor(id: string) {
    return (
      categories.find((category) => category.id === id)?.name ?? "Unknown category"
    );
  }

  return (
    <AppLayout
      eyebrow="Privacy-first desktop finance"
      navigationItems={navigationItems}
      status="Local data only"
      title="Wallet"
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
      <DashboardView
        dashboard={dashboard}
        isLoadingDashboard={isLoadingDashboard}
        onRefresh={loadDashboard}
      />
          }
        />
        <Route
          path="/transactions"
          element={
            <TransactionsPage
              accountNameFor={accountNameFor}
              accounts={accounts}
              categories={categories}
              categoryNameFor={categoryNameFor}
              deletingTransactionId={deletingTransactionId}
              editCategoriesFor={editCategoriesFor}
              editTransaction={editTransaction}
              editingTransactionId={editingTransactionId}
              formatMinor={formatMinor}
              isFilteringTransactions={isFilteringTransactions}
              isSavingTransaction={isSavingTransaction}
              isUpdatingTransaction={isUpdatingTransaction}
              matchingCategories={matchingCategories}
              onApplyFilters={applyTransactionFilters}
              onCancelEditingTransaction={cancelEditingTransaction}
              onClearFilters={clearTransactionFilters}
              onCreateTransaction={createTransaction}
              onDeleteTransaction={deleteTransaction}
              onStartEditingTransaction={startEditingTransaction}
              onUpdateEditTransaction={updateEditTransaction}
              onUpdateTransaction={updateTransaction}
              onUpdateTransactionFilter={updateTransactionFilter}
              setTransactionAccountId={setTransactionAccountId}
              setTransactionAmount={setTransactionAmount}
              setTransactionCategoryId={setTransactionCategoryId}
              setTransactionDate={setTransactionDate}
              setTransactionDescription={setTransactionDescription}
              setTransactionType={setTransactionType}
              transactionAccountId={transactionAccountId}
              transactionAmount={transactionAmount}
              transactionCategoryId={transactionCategoryId}
              transactionDate={transactionDate}
              transactionDescription={transactionDescription}
              transactionFilters={transactionFilters}
              transactions={transactions}
              transactionType={transactionType}
            />
          }
        />
        <Route
          path="/manage"
          element={
            <>
              <PageIntro
                description="Set up the wallet foundations used across transactions, budgets, bills, and goals."
                title="Manage Wallet"
              />

        <form className="simple-form" onSubmit={createAccount}>
          <label htmlFor="account-name">Account name</label>
          <div className="form-row">
            <input
              id="account-name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Cash"
            />
            <button type="submit" disabled={isSavingAccount}>
              {isSavingAccount ? "Creating..." : "Create"}
            </button>
          </div>
        </form>

        <form className="simple-form" onSubmit={createCategory}>
          <label htmlFor="category-name">Category name</label>
          <div className="form-row">
            <input
              id="category-name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Groceries"
            />
            <select
              value={categoryType}
              onChange={(event) =>
                setCategoryType(event.target.value as TransactionType)
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" disabled={isSavingCategory}>
              {isSavingCategory ? "Creating..." : "Create"}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        <section className="accounts-section" id="accounts">
          <h2>Accounts</h2>
          {accounts.length === 0 ? (
            <p className="empty">No accounts yet.</p>
          ) : (
            <ul className="accounts-list">
              {accounts.map((account) => (
                <li key={account.id}>
                  {editingAccountId === account.id ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => updateAccount(event, account)}
                    >
                      <input
                        value={editAccountName}
                        onChange={(event) =>
                          setEditAccountName(event.target.value)
                        }
                        placeholder="Account name"
                      />
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingAccount}>
                          {isUpdatingAccount ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditingAccount}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>
                          {account.name} - {account.currency}
                        </span>
                        <small>
                          {account.accountType} - Balance{" "}
                          {formatMinor(account.balanceMinor)}
                        </small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => startEditingAccount(account)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveAccount(account.id)}
                          disabled={archivingAccountId === account.id}
                        >
                          {archivingAccountId === account.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="list-section" id="categories">
          <h2>Categories</h2>
          {categories.length === 0 ? (
            <p className="empty">No categories yet.</p>
          ) : (
            <ul className="simple-list">
              {categories.map((category) => (
                <li key={category.id}>
                  {editingCategoryId === category.id ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => updateCategory(event, category)}
                    >
                      <input
                        value={editCategoryName}
                        onChange={(event) =>
                          setEditCategoryName(event.target.value)
                        }
                        placeholder="Category name"
                      />
                      <select
                        value={editCategoryType}
                        onChange={(event) =>
                          setEditCategoryType(
                            event.target.value as TransactionType,
                          )
                        }
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingCategory}>
                          {isUpdatingCategory ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditingCategory}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>{category.name}</span>
                        <small>{category.categoryType}</small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => startEditingCategory(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveCategory(category.id)}
                          disabled={archivingCategoryId === category.id}
                        >
                          {archivingCategoryId === category.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

            </>
          }
        />
        <Route
          path="/planning"
          element={
            <>
              <PageIntro
                description="Plan ahead with budgets, recurring bills, and savings goals."
                title="Planning"
              />
              {error && <p className="error">{error}</p>}

        <section className="list-section" id="budgets">
          <h2>Monthly Budgets</h2>
          <p className="empty">
            Budgets are monthly spending limits. Create expense transactions in
            the selected category to update usage.
          </p>
          <form className="simple-form" onSubmit={createBudget}>
            <div className="form-grid">
              <input
                value={budgetForm.name}
                onChange={(event) =>
                  updateBudgetForm({ name: event.target.value })
                }
                placeholder="Budget name"
              />
              <select
                value={budgetForm.categoryId}
                onChange={(event) =>
                  updateBudgetForm({ categoryId: event.target.value })
                }
              >
                <option value="">Select expense category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={budgetForm.amount}
                onChange={(event) =>
                  updateBudgetForm({ amount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Amount"
              />
              <select
                value={budgetForm.month}
                onChange={(event) =>
                  updateBudgetForm({ month: event.target.value })
                }
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <input
                value={budgetForm.year}
                onChange={(event) =>
                  updateBudgetForm({ year: event.target.value })
                }
                inputMode="numeric"
                placeholder="Year"
              />
              <button
                type="submit"
                disabled={isSavingBudget || expenseCategories.length === 0}
              >
                {isSavingBudget ? "Creating..." : "Create budget"}
              </button>
            </div>
          </form>

          {budgets.length === 0 ? (
            <p className="empty">No budgets yet.</p>
          ) : (
            <ul className="simple-list">
              {budgets.map((budget) => (
                <li key={budget.id}>
                  {editingBudgetId === budget.id && editBudget ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => updateBudget(event, budget)}
                    >
                      <input
                        value={editBudget.name}
                        onChange={(event) =>
                          updateEditBudget({ name: event.target.value })
                        }
                        placeholder="Budget name"
                      />
                      <select
                        value={editBudget.categoryId}
                        onChange={(event) =>
                          updateEditBudget({ categoryId: event.target.value })
                        }
                      >
                        <option value="">Select expense category</option>
                        {expenseCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editBudget.amount}
                        onChange={(event) =>
                          updateEditBudget({ amount: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="Amount"
                      />
                      <select
                        value={editBudget.month}
                        onChange={(event) =>
                          updateEditBudget({ month: event.target.value })
                        }
                      >
                        {monthOptions.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editBudget.year}
                        onChange={(event) =>
                          updateEditBudget({ year: event.target.value })
                        }
                        inputMode="numeric"
                        placeholder="Year"
                      />
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingBudget}>
                          {isUpdatingBudget ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditingBudget}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>
                          {budget.name} - {budget.categoryName}
                        </span>
                        <small>
                          {monthName(budget.month)} {budget.year} - Budget{" "}
                          {formatMinor(budget.amountMinor)} - Spent{" "}
                          {formatMinor(budget.spentMinor)} - Remaining{" "}
                          {formatMinor(budget.remainingMinor)} -{" "}
                          {formatPercentage(budget.progressPercentage)}
                          {budget.isExceeded
                            ? " - Exceeded"
                            : budget.isNearLimit
                              ? " - Near limit"
                              : ""}
                        </small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => startEditingBudget(budget)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveBudget(budget.id)}
                          disabled={archivingBudgetId === budget.id}
                        >
                          {archivingBudgetId === budget.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="list-section" id="savings-goals">
          <h2>Savings Goals</h2>
          <form className="simple-form" onSubmit={createSavingsGoal}>
            <div className="form-grid">
              <input
                value={savingsGoalForm.name}
                onChange={(event) =>
                  updateSavingsGoalForm({ name: event.target.value })
                }
                placeholder="Goal name"
              />
              <input
                value={savingsGoalForm.targetAmount}
                onChange={(event) =>
                  updateSavingsGoalForm({ targetAmount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Target amount"
              />
              <input
                value={savingsGoalForm.currentAmount}
                onChange={(event) =>
                  updateSavingsGoalForm({ currentAmount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Current amount"
              />
              <input
                type="date"
                value={savingsGoalForm.deadlineDate}
                onChange={(event) =>
                  updateSavingsGoalForm({ deadlineDate: event.target.value })
                }
              />
              <button type="submit" disabled={isSavingSavingsGoal}>
                {isSavingSavingsGoal ? "Creating..." : "Create goal"}
              </button>
            </div>
          </form>

          {savingsGoals.length === 0 ? (
            <p className="empty">No savings goals yet.</p>
          ) : (
            <ul className="simple-list">
              {savingsGoals.map((goal) => {
                const contribution = savingsGoalContributions[goal.id] ?? {
                  accountId: accounts[0]?.id ?? "",
                  amount: "",
                };

                return (
                  <li key={goal.id}>
                    {editingSavingsGoalId === goal.id && editSavingsGoal ? (
                      <form
                        className="edit-form"
                        onSubmit={(event) => updateSavingsGoal(event, goal)}
                      >
                        <input
                          value={editSavingsGoal.name}
                          onChange={(event) =>
                            updateEditSavingsGoal({ name: event.target.value })
                          }
                          placeholder="Goal name"
                        />
                        <input
                          value={editSavingsGoal.targetAmount}
                          onChange={(event) =>
                            updateEditSavingsGoal({
                              targetAmount: event.target.value,
                            })
                          }
                          inputMode="decimal"
                          placeholder="Target amount"
                        />
                        <input
                          value={editSavingsGoal.currentAmount}
                          onChange={(event) =>
                            updateEditSavingsGoal({
                              currentAmount: event.target.value,
                            })
                          }
                          inputMode="decimal"
                          placeholder="Current amount"
                        />
                        <input
                          type="date"
                          value={editSavingsGoal.deadlineDate}
                          onChange={(event) =>
                            updateEditSavingsGoal({
                              deadlineDate: event.target.value,
                            })
                          }
                        />
                        <div className="button-row">
                          <button
                            type="submit"
                            disabled={isUpdatingSavingsGoal}
                          >
                            {isUpdatingSavingsGoal ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingSavingsGoal}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <span>{goal.name}</span>
                          <small>
                            Target {formatMinor(goal.targetAmountMinor)} -
                            Current {formatMinor(goal.currentAmountMinor)} -
                            Remaining {formatMinor(goal.remainingAmountMinor)} -
                            {goal.progressPercent}%
                            {goal.deadlineDate
                              ? ` - Deadline ${goal.deadlineDate}`
                              : ""}
                          </small>
                        </div>
                        <div className="form-grid">
                          <select
                            value={contribution.accountId}
                            onChange={(event) =>
                              updateSavingsGoalContribution(goal.id, {
                                accountId: event.target.value,
                              })
                            }
                          >
                            <option value="">Select account</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                          <input
                            value={contribution.amount}
                            onChange={(event) =>
                              updateSavingsGoalContribution(goal.id, {
                                amount: event.target.value,
                              })
                            }
                            inputMode="decimal"
                            placeholder="Contribution amount"
                          />
                          <button
                            type="button"
                            onClick={() => contributeToSavingsGoal(goal)}
                            disabled={
                              contributingSavingsGoalId === goal.id ||
                              accounts.length === 0
                            }
                          >
                            {contributingSavingsGoalId === goal.id
                              ? "Contributing..."
                              : "Contribute"}
                          </button>
                        </div>
                        <div className="button-row">
                          <button
                            type="button"
                            onClick={() => startEditingSavingsGoal(goal)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveSavingsGoal(goal.id)}
                            disabled={archivingSavingsGoalId === goal.id}
                          >
                            {archivingSavingsGoalId === goal.id
                              ? "Archiving..."
                              : "Archive"}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="list-section" id="bills">
          <h2>Recurring Bills</h2>
          <form className="simple-form" onSubmit={createRecurringBill}>
            <div className="form-grid">
              <input
                value={recurringBillForm.name}
                onChange={(event) =>
                  updateRecurringBillForm({ name: event.target.value })
                }
                placeholder="Bill name"
              />
              <select
                value={recurringBillForm.accountId}
                onChange={(event) =>
                  updateRecurringBillForm({ accountId: event.target.value })
                }
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <select
                value={recurringBillForm.categoryId}
                onChange={(event) =>
                  updateRecurringBillForm({ categoryId: event.target.value })
                }
              >
                <option value="">Select expense category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={recurringBillForm.amount}
                onChange={(event) =>
                  updateRecurringBillForm({ amount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Amount"
              />
              <select
                value={recurringBillForm.frequency}
                onChange={(event) =>
                  updateRecurringBillForm({
                    frequency: event.target.value as RecurringFrequency,
                  })
                }
              >
                {recurringFrequencyOptions.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={recurringBillForm.nextDueDate}
                onChange={(event) =>
                  updateRecurringBillForm({ nextDueDate: event.target.value })
                }
              />
              <input
                value={recurringBillForm.description}
                onChange={(event) =>
                  updateRecurringBillForm({ description: event.target.value })
                }
                placeholder="Description"
              />
              <button
                type="submit"
                disabled={
                  isSavingRecurringBill ||
                  accounts.length === 0 ||
                  expenseCategories.length === 0
                }
              >
                {isSavingRecurringBill ? "Creating..." : "Create bill"}
              </button>
            </div>
          </form>

          {recurringBills.length === 0 ? (
            <p className="empty">No recurring bills yet.</p>
          ) : (
            <ul className="simple-list">
              {recurringBills.map((bill) => (
                <li key={bill.id}>
                  {editingRecurringBillId === bill.id && editRecurringBill ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => updateRecurringBill(event, bill)}
                    >
                      <input
                        value={editRecurringBill.name}
                        onChange={(event) =>
                          updateEditRecurringBill({ name: event.target.value })
                        }
                        placeholder="Bill name"
                      />
                      <select
                        value={editRecurringBill.accountId}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            accountId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editRecurringBill.categoryId}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            categoryId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select expense category</option>
                        {expenseCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editRecurringBill.amount}
                        onChange={(event) =>
                          updateEditRecurringBill({ amount: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="Amount"
                      />
                      <select
                        value={editRecurringBill.frequency}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            frequency: event.target.value as RecurringFrequency,
                          })
                        }
                      >
                        {recurringFrequencyOptions.map((frequency) => (
                          <option key={frequency} value={frequency}>
                            {frequency}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editRecurringBill.nextDueDate}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            nextDueDate: event.target.value,
                          })
                        }
                      />
                      <input
                        value={editRecurringBill.description}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            description: event.target.value,
                          })
                        }
                        placeholder="Description"
                      />
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingRecurringBill}>
                          {isUpdatingRecurringBill ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditingRecurringBill}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>
                          {bill.name} - {formatMinor(bill.amountMinor)}
                        </span>
                        <small>
                          {bill.frequency} - Next due {bill.nextDueDate} - Last
                          paid {bill.lastPaidDate ?? "Never"} -{" "}
                          {bill.categoryName} - {bill.accountName}
                          {bill.description ? ` - ${bill.description}` : ""}
                        </small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => markRecurringBillPaid(bill.id)}
                          disabled={payingRecurringBillId === bill.id}
                        >
                          {payingRecurringBillId === bill.id
                            ? "Paying..."
                            : "Mark paid"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingRecurringBill(bill)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveRecurringBill(bill.id)}
                          disabled={archivingRecurringBillId === bill.id}
                        >
                          {archivingRecurringBillId === bill.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

            </>
          }
        />
        <Route
          path="/reports"
          element={
            <PlaceholderPage
              description="Financial summaries and reports will be designed in a future UI pass."
              title="Reports"
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              description="Local app preferences and configuration will be designed in a future UI pass."
              title="Settings"
            />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const monthOptions = [
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

const recurringFrequencyOptions: RecurringFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

function defaultBudgetForm(): BudgetFormState {
  const today = new Date();

  return {
    name: "",
    categoryId: "",
    amount: "",
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
  };
}

function defaultRecurringBillForm(): RecurringBillFormState {
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

function emptySavingsGoalForm(): SavingsGoalFormState {
  return {
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadlineDate: "",
  };
}

function monthName(month: number) {
  return (
    monthOptions.find((monthOption) => Number(monthOption.value) === month)
      ?.label ?? String(month)
  );
}

function emptyTransactionFilters(): TransactionFilterState {
  return {
    accountId: "",
    categoryId: "",
    transactionType: "",
    startDate: "",
    endDate: "",
    search: "",
  };
}

function hasActiveTransactionFilters(filters: TransactionFilterState) {
  return Object.values(filters).some((value) => value.trim() !== "");
}

type PageIntroProps = {
  title: string;
  description: string;
};

function PageIntro({ title, description }: PageIntroProps) {
  return (
    <AppCard className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/70">
      <div className="max-w-3xl">
        <AppBadge variant="neutral">{title}</AppBadge>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-app-text">
          {title}
        </h2>
        <p className="mt-2 text-base text-app-muted">{description}</p>
      </div>
    </AppCard>
  );
}

function PlaceholderPage({ title, description }: PageIntroProps) {
  return (
    <section className="grid gap-5">
      <PageIntro description={description} title={title} />
      <AppCard>
        <EmptyState title={`${title} coming soon`}>
          This page is part of the new navigation structure and will be expanded
          in a future UI pass.
        </EmptyState>
      </AppCard>
    </section>
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

function normalAmountToMinor(value: string) {
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

function optionalNormalAmountToMinor(value: string) {
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

function formatMinor(value: number) {
  return (value / 100).toFixed(2);
}

function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}

function minorToNormalAmount(value: number) {
  return (value / 100).toFixed(2);
}

export default App;
