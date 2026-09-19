import { FormEvent, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { PageIntro } from "../../../components/layout/PageIntro";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  AppTable,
  EmptyState,
  FormField,
  FormSection,
  IconButton,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui";
import {
  type Account,
  type Category,
  type Transaction,
  type TransactionFilterState,
  type TransactionFormState,
  type TransactionType,
} from "../types";

type SortKey = "date" | "amount" | "type" | "category" | "account";
type SortDirection = "asc" | "desc";

type TransactionsPageProps = {
  accounts: Account[];
  categories: Category[];
  matchingCategories: Category[];
  transactions: Transaction[];
  transactionAccountId: string;
  transactionCategoryId: string;
  transactionType: TransactionType;
  transactionAmount: string;
  transactionDescription: string;
  transactionDate: string;
  transactionFilters: TransactionFilterState;
  editingTransactionId: string;
  editTransaction: TransactionFormState | null;
  isSavingTransaction: boolean;
  isUpdatingTransaction: boolean;
  isFilteringTransactions: boolean;
  deletingTransactionId: string;
  onCreateTransaction: (event: FormEvent<HTMLFormElement>) => void;
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => void;
  onClearFilters: () => void;
  onStartEditingTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEditingTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransactionFilter: (changes: Partial<TransactionFilterState>) => void;
  onUpdateEditTransaction: (changes: Partial<TransactionFormState>) => void;
  setTransactionAccountId: (value: string) => void;
  setTransactionCategoryId: (value: string) => void;
  setTransactionType: (value: TransactionType) => void;
  setTransactionAmount: (value: string) => void;
  setTransactionDescription: (value: string) => void;
  setTransactionDate: (value: string) => void;
  editCategoriesFor: (type: TransactionType) => Category[];
  accountNameFor: (id: string) => string;
  categoryNameFor: (id: string) => string;
  formatMinor: (value: number) => string;
};

export function TransactionsPage({
  accounts,
  categories,
  matchingCategories,
  transactions,
  transactionAccountId,
  transactionCategoryId,
  transactionType,
  transactionAmount,
  transactionDescription,
  transactionDate,
  transactionFilters,
  editingTransactionId,
  editTransaction,
  isSavingTransaction,
  isUpdatingTransaction,
  isFilteringTransactions,
  deletingTransactionId,
  onCreateTransaction,
  onApplyFilters,
  onClearFilters,
  onStartEditingTransaction,
  onUpdateTransaction,
  onCancelEditingTransaction,
  onDeleteTransaction,
  onUpdateTransactionFilter,
  onUpdateEditTransaction,
  setTransactionAccountId,
  setTransactionCategoryId,
  setTransactionType,
  setTransactionAmount,
  setTransactionDescription,
  setTransactionDate,
  editCategoriesFor,
  accountNameFor,
  categoryNameFor,
  formatMinor,
}: TransactionsPageProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function scrollToCreateForm() {
    document.getElementById("add-transaction-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "date" || nextKey === "amount" ? "desc" : "asc");
  }

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((first, second) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const firstValue = transactionSortValue(
        first,
        sortKey,
        accountNameFor,
        categoryNameFor,
      );
      const secondValue = transactionSortValue(
        second,
        sortKey,
        accountNameFor,
        categoryNameFor,
      );

      if (firstValue < secondValue) {
        return -1 * direction;
      }

      if (firstValue > secondValue) {
        return 1 * direction;
      }

      return 0;
    });
  }, [accountNameFor, categoryNameFor, sortDirection, sortKey, transactions]);

  return (
    <section className="grid gap-5">
      <PageIntro
        actions={
          <AppButton
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={scrollToCreateForm}
            variant="primary"
          >
            Add Transaction
          </AppButton>
        }
        badge="Transactions"
        description="View, search, filter, create, edit, and delete your local transaction history."
        title="Transactions"
      />

      <AppCard
        description="Add a new income or expense without leaving the transactions page."
        id="add-transaction-form"
        title="Record money movement"
        tone="strong"
      >
        <form className="grid gap-4" onSubmit={onCreateTransaction}>
          <FormSection>
            <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <FormField label="Account">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={transactionAccountId}
                    onChange={(event) => setTransactionAccountId(event.target.value)}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </AppSelect>
                )}
              </FormField>
              <FormField label="Type">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={transactionType}
                    onChange={(event) =>
                      setTransactionType(event.target.value as TransactionType)
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </AppSelect>
                )}
              </FormField>
              <FormField label="Category">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={transactionCategoryId}
                    onChange={(event) => setTransactionCategoryId(event.target.value)}
                  >
                    <option value="">Select category</option>
                    {matchingCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </AppSelect>
                )}
              </FormField>
              <FormField label="Amount">
                {(id) => (
                  <AppInput
                    id={id}
                    value={transactionAmount}
                    onChange={(event) => setTransactionAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="Amount"
                  />
                )}
              </FormField>
              <FormField label="Description">
                {(id) => (
                  <AppInput
                    id={id}
                    value={transactionDescription}
                    onChange={(event) =>
                      setTransactionDescription(event.target.value)
                    }
                    placeholder="Description"
                  />
                )}
              </FormField>
              <FormField label="Date">
                {(id) => (
                  <AppInput
                    id={id}
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                  />
                )}
              </FormField>
            </div>
          </FormSection>
          <div className="flex justify-end">
            <AppButton
              disabled={
                isSavingTransaction ||
                accounts.length === 0 ||
                matchingCategories.length === 0
              }
              type="submit"
              variant="primary"
            >
              {isSavingTransaction ? "Creating..." : "Add Transaction"}
            </AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard
        description="Search and narrow the ledger without changing your saved data."
        title="Filter transactions"
      >
        <form className="grid gap-4" onSubmit={onApplyFilters}>
          <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
            <FormField label="Search">
              {(id) => (
                <AppInput
                  id={id}
                  value={transactionFilters.search}
                  onChange={(event) =>
                    onUpdateTransactionFilter({ search: event.target.value })
                  }
                  placeholder="Search by description or notes"
                />
              )}
            </FormField>
            <FormField label="Category">
              {(id) => (
                <AppSelect
                  id={id}
                  value={transactionFilters.categoryId}
                  onChange={(event) =>
                    onUpdateTransactionFilter({ categoryId: event.target.value })
                  }
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </AppSelect>
              )}
            </FormField>
            <FormField label="Account">
              {(id) => (
                <AppSelect
                  id={id}
                  value={transactionFilters.accountId}
                  onChange={(event) =>
                    onUpdateTransactionFilter({ accountId: event.target.value })
                  }
                >
                  <option value="">All accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </AppSelect>
              )}
            </FormField>
            <FormField label="Type">
              {(id) => (
                <AppSelect
                  id={id}
                  value={transactionFilters.transactionType}
                  onChange={(event) =>
                    onUpdateTransactionFilter({
                      transactionType: event.target.value as TransactionType | "",
                    })
                  }
                >
                  <option value="">All types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </AppSelect>
              )}
            </FormField>
            <FormField label="Start date">
              {(id) => (
                <AppInput
                  id={id}
                  type="date"
                  value={transactionFilters.startDate}
                  onChange={(event) =>
                    onUpdateTransactionFilter({ startDate: event.target.value })
                  }
                />
              )}
            </FormField>
            <FormField label="End date">
              {(id) => (
                <AppInput
                  id={id}
                  type="date"
                  value={transactionFilters.endDate}
                  onChange={(event) =>
                    onUpdateTransactionFilter({ endDate: event.target.value })
                  }
                />
              )}
            </FormField>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <AppButton
              disabled={isFilteringTransactions}
              icon={<Filter className="h-4 w-4" aria-hidden="true" />}
              type="submit"
              variant="secondary"
            >
              {isFilteringTransactions ? "Filtering..." : "Apply filters"}
            </AppButton>
            <AppButton onClick={onClearFilters} variant="ghost">
              Clear filters
            </AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard
        description="A complete ledger of your recorded income and expenses."
        title="Transaction table"
        tone="strong"
      >
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet">
            <p>
              Start tracking your finances by creating your first transaction.
            </p>
            <AppButton
              className="mt-4"
              icon={<Search className="h-4 w-4" aria-hidden="true" />}
              onClick={scrollToCreateForm}
              variant="primary"
            >
              Add Transaction
            </AppButton>
          </EmptyState>
        ) : (
          <AppTable minWidth="min-w-[58rem]">
            <TableHeader>
              <tr>
                <SortHeader
                  activeKey={sortKey}
                  direction={sortDirection}
                  label="Date"
                  onSort={updateSort}
                  sortKey="date"
                />
                <TableCell header>Description</TableCell>
                <SortHeader
                  activeKey={sortKey}
                  direction={sortDirection}
                  label="Category"
                  onSort={updateSort}
                  sortKey="category"
                />
                <SortHeader
                  activeKey={sortKey}
                  direction={sortDirection}
                  label="Account"
                  onSort={updateSort}
                  sortKey="account"
                />
                <SortHeader
                  activeKey={sortKey}
                  align="right"
                  direction={sortDirection}
                  label="Amount"
                  onSort={updateSort}
                  sortKey="amount"
                />
                <SortHeader
                  activeKey={sortKey}
                  direction={sortDirection}
                  label="Type"
                  onSort={updateSort}
                  sortKey="type"
                />
                <TableCell align="right" header>
                  Actions
                </TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction) => (
                <TransactionRow
                  accountName={accountNameFor(transaction.accountId)}
                  accounts={accounts}
                  categoryName={categoryNameFor(transaction.categoryId)}
                  deletingTransactionId={deletingTransactionId}
                  editCategoriesFor={editCategoriesFor}
                  editTransaction={editTransaction}
                  editingTransactionId={editingTransactionId}
                  formatMinor={formatMinor}
                  isUpdatingTransaction={isUpdatingTransaction}
                  key={transaction.id}
                  onCancelEditingTransaction={onCancelEditingTransaction}
                  onDeleteTransaction={onDeleteTransaction}
                  onStartEditingTransaction={onStartEditingTransaction}
                  onUpdateEditTransaction={onUpdateEditTransaction}
                  onUpdateTransaction={onUpdateTransaction}
                  transaction={transaction}
                />
              ))}
            </TableBody>
          </AppTable>
        )}
      </AppCard>
    </section>
  );
}

type TransactionRowProps = {
  accounts: Account[];
  transaction: Transaction;
  accountName: string;
  categoryName: string;
  editingTransactionId: string;
  editTransaction: TransactionFormState | null;
  isUpdatingTransaction: boolean;
  deletingTransactionId: string;
  onStartEditingTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEditingTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateEditTransaction: (changes: Partial<TransactionFormState>) => void;
  editCategoriesFor: (type: TransactionType) => Category[];
  formatMinor: (value: number) => string;
};

type SortHeaderProps = {
  activeKey: SortKey;
  align?: "left" | "right";
  direction: SortDirection;
  label: string;
  onSort: (sortKey: SortKey) => void;
  sortKey: SortKey;
};

function SortHeader({
  activeKey,
  align = "left",
  direction,
  label,
  onSort,
  sortKey,
}: SortHeaderProps) {
  const isActive = activeKey === sortKey;
  const Icon = !isActive ? ArrowDownUp : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={align === "right" ? "px-4 py-3.5 text-right" : "px-4 py-3.5"}>
      <button
        className="inline-flex min-h-0 items-center gap-1.5 rounded-md border-0 bg-transparent p-0 text-caption font-semibold uppercase tracking-[0.08em] text-app-muted shadow-none transition hover:bg-transparent hover:text-app-text hover:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-primary/20"
        type="button"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}

function transactionSortValue(
  transaction: Transaction,
  sortKey: SortKey,
  accountNameFor: (id: string) => string,
  categoryNameFor: (id: string) => string,
) {
  switch (sortKey) {
    case "amount":
      return transaction.amountMinor;
    case "type":
      return transaction.transactionType;
    case "category":
      return categoryNameFor(transaction.categoryId).toLowerCase();
    case "account":
      return accountNameFor(transaction.accountId).toLowerCase();
    case "date":
    default:
      return transaction.transactionDate;
  }
}

function TransactionRow({
  accounts,
  transaction,
  accountName,
  categoryName,
  editingTransactionId,
  editTransaction,
  isUpdatingTransaction,
  deletingTransactionId,
  onStartEditingTransaction,
  onUpdateTransaction,
  onCancelEditingTransaction,
  onDeleteTransaction,
  onUpdateEditTransaction,
  editCategoriesFor,
  formatMinor,
}: TransactionRowProps) {
  const isEditing = editingTransactionId === transaction.id && editTransaction;

  if (isEditing) {
    return (
      <tr className="bg-app-primary/5">
        <td className="px-4 py-4" colSpan={7}>
          <form className="grid gap-3" onSubmit={onUpdateTransaction}>
            <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <AppInput
                type="date"
                value={editTransaction.transactionDate}
                onChange={(event) =>
                  onUpdateEditTransaction({
                    transactionDate: event.target.value,
                  })
                }
              />
              <AppInput
                value={editTransaction.description}
                onChange={(event) =>
                  onUpdateEditTransaction({
                    description: event.target.value,
                  })
                }
                placeholder="Description"
              />
              <AppSelect
                value={editTransaction.accountId}
                onChange={(event) =>
                  onUpdateEditTransaction({ accountId: event.target.value })
                }
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </AppSelect>
              <AppSelect
                value={editTransaction.transactionType}
                onChange={(event) => {
                  const nextType = event.target.value as TransactionType;
                  const nextCategory = editCategoriesFor(nextType)[0]?.id ?? "";
                  onUpdateEditTransaction({
                    transactionType: nextType,
                    categoryId: nextCategory,
                  });
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </AppSelect>
              <AppSelect
                value={editTransaction.categoryId}
                onChange={(event) =>
                  onUpdateEditTransaction({ categoryId: event.target.value })
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
              </AppSelect>
              <AppInput
                value={editTransaction.amount}
                onChange={(event) =>
                  onUpdateEditTransaction({ amount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Amount"
              />
            </div>
            <div className="flex justify-end gap-2">
              <AppButton
                disabled={isUpdatingTransaction}
                type="submit"
                variant="primary"
              >
                {isUpdatingTransaction ? "Saving..." : "Save"}
              </AppButton>
              <AppButton onClick={onCancelEditingTransaction} variant="ghost">
                Cancel
              </AppButton>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white/36 transition hover:bg-white/62">
      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-app-muted">
        {transaction.transactionDate}
      </td>
      <td className="min-w-56 px-4 py-4">
        <span className="font-semibold text-app-text">
          {transaction.description || categoryName}
        </span>
      </td>
      <td className="px-4 py-4">
        <AppBadge variant="neutral">{categoryName}</AppBadge>
      </td>
      <td className="px-4 py-4 text-sm text-app-muted">{accountName}</td>
      <td
        className={
          transaction.transactionType === "income"
            ? "whitespace-nowrap px-4 py-4 text-right font-semibold text-app-income"
            : "whitespace-nowrap px-4 py-4 text-right font-semibold text-app-expense"
        }
      >
        {transaction.transactionType === "income" ? "+" : "-"}
        {formatMinor(transaction.amountMinor)}
      </td>
      <td className="px-4 py-4">
        <AppBadge variant={transaction.transactionType}>
          {transaction.transactionType}
        </AppBadge>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <IconButton
            icon={Pencil}
            label="Edit transaction"
            onClick={() => onStartEditingTransaction(transaction)}
          />
          <IconButton
            disabled={deletingTransactionId === transaction.id}
            icon={Trash2}
            label={
              deletingTransactionId === transaction.id
                ? "Deleting transaction"
                : "Delete transaction"
            }
            onClick={() => onDeleteTransaction(transaction.id)}
            tone="danger"
          />
        </div>
      </td>
    </tr>
  );
}
