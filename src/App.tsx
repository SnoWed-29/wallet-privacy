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
  const [editingTransactionId, setEditingTransactionId] = useState("");
  const [editTransaction, setEditTransaction] =
    useState<TransactionFormState | null>(null);
  const [error, setError] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState("");

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

  async function loadTransactions() {
    try {
      const savedTransactions =
        await invoke<Transaction[]>("list_transactions");
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
                  <span>
                    {account.name} - {account.currency}
                  </span>
                  <small>
                    {account.accountType} - Balance{" "}
                    {formatMinor(account.balanceMinor)}
                  </small>
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
                  <span>{category.name}</span>
                  <small>{category.categoryType}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="list-section">
          <h2>Transactions</h2>
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
