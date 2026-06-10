import { FormEvent, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Account, Budget, BudgetFormState, Category, DashboardSummary, RecurringBill, RecurringBillFormState, SavingsGoal, SavingsGoalContributionState, SavingsGoalFormState, Transaction, TransactionFilterState, TransactionFormState, TransactionType } from "../types/wallet";
import { defaultBudgetForm, defaultRecurringBillForm, emptySavingsGoalForm, emptyTransactionFilters, formatMinor, formatPercentage, hasActiveTransactionFilters, minorToNormalAmount, monthName, monthOptions, normalAmountToMinor, optionalNormalAmountToMinor, recurringFrequencyOptions, savingContributionCategoryName, todayInputValue } from "../utils/walletHelpers";

export function useWalletApp() {
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

  return {
    accountName,
    setAccountName,
    accounts,
    categoryName,
    setCategoryName,
    categoryType,
    setCategoryType,
    categories,
    transactionAccountId,
    setTransactionAccountId,
    transactionCategoryId,
    setTransactionCategoryId,
    transactionType,
    setTransactionType,
    transactionAmount,
    setTransactionAmount,
    transactionDescription,
    setTransactionDescription,
    transactionDate,
    setTransactionDate,
    transactions,
    transactionFilters,
    budgets,
    budgetForm,
    savingsGoals,
    savingsGoalForm,
    savingsGoalContributions,
    recurringBills,
    recurringBillForm,
    dashboard,
    editingTransactionId,
    editTransaction,
    editingBudgetId,
    editBudget,
    editingSavingsGoalId,
    editSavingsGoal,
    editingRecurringBillId,
    editRecurringBill,
    editingAccountId,
    editAccountName,
    setEditAccountName,
    editingCategoryId,
    editCategoryName,
    setEditCategoryName,
    editCategoryType,
    setEditCategoryType,
    error,
    isSavingAccount,
    isSavingCategory,
    isSavingBudget,
    isSavingSavingsGoal,
    isSavingRecurringBill,
    isUpdatingAccount,
    isUpdatingCategory,
    isUpdatingBudget,
    isUpdatingSavingsGoal,
    isUpdatingRecurringBill,
    isSavingTransaction,
    isUpdatingTransaction,
    archivingAccountId,
    archivingCategoryId,
    archivingBudgetId,
    archivingSavingsGoalId,
    archivingRecurringBillId,
    contributingSavingsGoalId,
    payingRecurringBillId,
    deletingTransactionId,
    isFilteringTransactions,
    isLoadingDashboard,
    matchingCategories,
    expenseCategories,
    loadDashboard,
    createAccount,
    createCategory,
    createTransaction,
    startEditingTransaction,
    cancelEditingTransaction,
    startEditingAccount,
    cancelEditingAccount,
    updateAccount,
    archiveAccount,
    startEditingCategory,
    cancelEditingCategory,
    updateCategory,
    archiveCategory,
    updateTransaction,
    deleteTransaction,
    updateTransactionFilter,
    applyTransactionFilters,
    clearTransactionFilters,
    updateBudgetForm,
    updateEditBudget,
    createBudget,
    startEditingBudget,
    cancelEditingBudget,
    updateBudget,
    archiveBudget,
    updateSavingsGoalForm,
    updateEditSavingsGoal,
    updateSavingsGoalContribution,
    createSavingsGoal,
    startEditingSavingsGoal,
    cancelEditingSavingsGoal,
    updateSavingsGoal,
    archiveSavingsGoal,
    contributeToSavingsGoal,
    updateRecurringBillForm,
    updateEditRecurringBill,
    createRecurringBill,
    startEditingRecurringBill,
    cancelEditingRecurringBill,
    updateRecurringBill,
    archiveRecurringBill,
    markRecurringBillPaid,
    updateEditTransaction,
    editCategoriesFor,
    accountNameFor,
    categoryNameFor,
    formatMinor,
    formatPercentage,
    monthName,
    monthOptions,
    recurringFrequencyOptions,
  };
}

export type WalletAppState = ReturnType<typeof useWalletApp>;
