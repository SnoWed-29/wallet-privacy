import { FormEvent, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

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
  const [editingTransactionId, setEditingTransactionId] = useState("");
  const [editTransaction, setEditTransaction] =
    useState<TransactionFormState | null>(null);
  const [editingAccountId, setEditingAccountId] = useState("");
  const [editAccountName, setEditAccountName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] =
    useState<TransactionType>("expense");
  const [error, setError] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [archivingAccountId, setArchivingAccountId] = useState("");
  const [archivingCategoryId, setArchivingCategoryId] = useState("");
  const [deletingTransactionId, setDeletingTransactionId] = useState("");
  const [isFilteringTransactions, setIsFilteringTransactions] = useState(false);

  const matchingCategories = useMemo(
    () =>
      categories.filter((category) => category.categoryType === transactionType),
    [categories, transactionType],
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

  useEffect(() => {
    loadAccounts();
    loadCategories();
    loadTransactions();
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
    return categories.filter((category) => category.categoryType === type);
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
    <main className="container">
      <section className="wallet-panel">
        <h1>Wallet</h1>

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

        <form className="simple-form" onSubmit={createTransaction}>
          <label htmlFor="transaction-account">Transaction</label>
          <div className="form-grid">
            <select
              id="transaction-account"
              value={transactionAccountId}
              onChange={(event) => setTransactionAccountId(event.target.value)}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <select
              value={transactionType}
              onChange={(event) =>
                setTransactionType(event.target.value as TransactionType)
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select
              value={transactionCategoryId}
              onChange={(event) => setTransactionCategoryId(event.target.value)}
            >
              <option value="">Select category</option>
              {matchingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={transactionAmount}
              onChange={(event) => setTransactionAmount(event.target.value)}
              inputMode="decimal"
              placeholder="Amount"
            />
            <input
              value={transactionDescription}
              onChange={(event) => setTransactionDescription(event.target.value)}
              placeholder="Description"
            />
            <input
              type="date"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
            />
            <button
              type="submit"
              disabled={
                isSavingTransaction ||
                accounts.length === 0 ||
                matchingCategories.length === 0
              }
            >
              {isSavingTransaction ? "Creating..." : "Create transaction"}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        <section className="accounts-section">
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

        <section className="list-section">
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

        <section className="list-section">
          <h2>Transactions</h2>
          <form className="simple-form" onSubmit={applyTransactionFilters}>
            <div className="form-grid">
              <select
                value={transactionFilters.accountId}
                onChange={(event) =>
                  updateTransactionFilter({ accountId: event.target.value })
                }
              >
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <select
                value={transactionFilters.categoryId}
                onChange={(event) =>
                  updateTransactionFilter({ categoryId: event.target.value })
                }
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={transactionFilters.transactionType}
                onChange={(event) =>
                  updateTransactionFilter({
                    transactionType: event.target.value as TransactionType | "",
                  })
                }
              >
                <option value="">All types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="date"
                value={transactionFilters.startDate}
                onChange={(event) =>
                  updateTransactionFilter({ startDate: event.target.value })
                }
              />
              <input
                type="date"
                value={transactionFilters.endDate}
                onChange={(event) =>
                  updateTransactionFilter({ endDate: event.target.value })
                }
              />
              <input
                value={transactionFilters.search}
                onChange={(event) =>
                  updateTransactionFilter({ search: event.target.value })
                }
                placeholder="Search"
              />
              <div className="button-row">
                <button type="submit" disabled={isFilteringTransactions}>
                  {isFilteringTransactions ? "Filtering..." : "Apply filters"}
                </button>
                <button type="button" onClick={clearTransactionFilters}>
                  Clear filters
                </button>
              </div>
            </div>
          </form>
          {transactions.length === 0 ? (
            <p className="empty">No transactions yet.</p>
          ) : (
            <ul className="simple-list">
              {transactions.map((transaction) => (
                <li className="transaction-item" key={transaction.id}>
                  {editingTransactionId === transaction.id && editTransaction ? (
                    <form className="edit-form" onSubmit={updateTransaction}>
                      <select
                        value={editTransaction.accountId}
                        onChange={(event) =>
                          updateEditTransaction({ accountId: event.target.value })
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
                        value={editTransaction.transactionType}
                        onChange={(event) => {
                          const nextType = event.target.value as TransactionType;
                          const nextCategory =
                            editCategoriesFor(nextType)[0]?.id ?? "";
                          updateEditTransaction({
                            transactionType: nextType,
                            categoryId: nextCategory,
                          });
                        }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <select
                        value={editTransaction.categoryId}
                        onChange={(event) =>
                          updateEditTransaction({ categoryId: event.target.value })
                        }
                      >
                        <option value="">Select category</option>
                        {editCategoriesFor(editTransaction.transactionType).map(
                          (category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ),
                        )}
                      </select>
                      <input
                        value={editTransaction.amount}
                        onChange={(event) =>
                          updateEditTransaction({ amount: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="Amount"
                      />
                      <input
                        value={editTransaction.description}
                        onChange={(event) =>
                          updateEditTransaction({
                            description: event.target.value,
                          })
                        }
                        placeholder="Description"
                      />
                      <input
                        type="date"
                        value={editTransaction.transactionDate}
                        onChange={(event) =>
                          updateEditTransaction({
                            transactionDate: event.target.value,
                          })
                        }
                      />
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingTransaction}>
                          {isUpdatingTransaction ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditingTransaction}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>
                          {transaction.description ||
                            categoryNameFor(transaction.categoryId)}
                        </span>
                        <small>
                          {transaction.transactionDate} -{" "}
                          {accountNameFor(transaction.accountId)} -{" "}
                          {transaction.transactionType === "income" ? "+" : "-"}
                          {formatMinor(transaction.amountMinor)}
                        </small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => startEditingTransaction(transaction)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          disabled={deletingTransactionId === transaction.id}
                        >
                          {deletingTransactionId === transaction.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
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

function formatMinor(value: number) {
  return (value / 100).toFixed(2);
}

function minorToNormalAmount(value: number) {
  return (value / 100).toFixed(2);
}

export default App;
