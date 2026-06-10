import type { FormEvent } from "react";
import { vi } from "vitest";
import { TransactionsPage } from "../pages/TransactionsPage";
import {
  accountFixture,
  expenseCategoryFixture,
  expenseTransactionFixture,
  incomeCategoryFixture,
  incomeTransactionFixture,
} from "../../../test/mocks/fixtures";
import {
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
  within,
} from "../../../test/test-utils";
import type { TransactionFilterState, TransactionFormState } from "../../../types/wallet";

function renderTransactionsPage(
  overrides: Partial<Parameters<typeof TransactionsPage>[0]> = {},
) {
  const props = {
    accounts: [accountFixture],
    categories: [incomeCategoryFixture, expenseCategoryFixture],
    matchingCategories: [expenseCategoryFixture],
    transactions: [expenseTransactionFixture, incomeTransactionFixture],
    transactionAccountId: accountFixture.id,
    transactionCategoryId: expenseCategoryFixture.id,
    transactionType: "expense",
    transactionAmount: "",
    transactionDescription: "",
    transactionDate: "2026-06-10",
    transactionFilters: {
      accountId: "",
      categoryId: "",
      transactionType: "",
      startDate: "",
      endDate: "",
      search: "",
    } satisfies TransactionFilterState,
    editingTransactionId: "",
    editTransaction: null,
    isSavingTransaction: false,
    isUpdatingTransaction: false,
    isFilteringTransactions: false,
    deletingTransactionId: "",
    onApplyFilters: vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault()),
    onClearFilters: vi.fn(),
    onCreateTransaction: vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault()),
    onDeleteTransaction: vi.fn(),
    onUpdateTransaction: vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault()),
    onCancelEditingTransaction: vi.fn(),
    onStartEditingTransaction: vi.fn(),
    onUpdateTransactionFilter: vi.fn(),
    setTransactionAccountId: vi.fn(),
    setTransactionCategoryId: vi.fn(),
    setTransactionType: vi.fn(),
    setTransactionAmount: vi.fn(),
    setTransactionDescription: vi.fn(),
    setTransactionDate: vi.fn(),
    updateEditTransaction: vi.fn(),
    editCategoriesFor: vi.fn(() => [expenseCategoryFixture]),
    accountNameFor: vi.fn(() => accountFixture.name),
    categoryNameFor: vi.fn((id: string) =>
      id === incomeCategoryFixture.id
        ? incomeCategoryFixture.name
        : expenseCategoryFixture.name,
    ),
    formatMinor: vi.fn((amount: number) => `${(amount / 100).toFixed(2)} MAD`),
    ...overrides,
  };

  renderWithProviders(<TransactionsPage {...props} />);

  return props;
}

describe("transactions page", () => {
  it("renders the transactions page and opens the add transaction form", async () => {
    const user = userEvent.setup();
    renderTransactionsPage();

    expect(screen.getByRole("heading", { name: "Transactions" })).toBeVisible();
    await user.click(screen.getAllByRole("button", { name: "Add Transaction" })[0]);

    expect(screen.getByRole("heading", { name: "Record money movement" })).toBeVisible();
  });

  it("validates required fields through disabled submit state", () => {
    renderTransactionsPage({
      accounts: [],
      categories: [],
      matchingCategories: [],
      transactionAccountId: "",
      transactionCategoryId: "",
    });

    expect(screen.getAllByRole("button", { name: "Add Transaction" })[1]).toBeDisabled();
  });

  it("submits a valid transaction", async () => {
    const user = userEvent.setup();
    const props = renderTransactionsPage({ transactionAmount: "120.50" });

    await user.click(screen.getAllByRole("button", { name: "Add Transaction" })[1]);

    expect(props.onCreateTransaction).toHaveBeenCalledOnce();
  });

  it("updates search and filter fields", async () => {
    const user = userEvent.setup();
    const props = renderTransactionsPage();

    fireEvent.change(screen.getByPlaceholderText("Search by description or notes"), {
      target: { value: "groceries" },
    });
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(props.onUpdateTransactionFilter).toHaveBeenCalledWith({
      search: expect.stringContaining("groceries"),
    });
    expect(props.onApplyFilters).toHaveBeenCalledOnce();
  });

  it("sorts the table by date and amount", async () => {
    const user = userEvent.setup();
    renderTransactionsPage();

    await user.click(screen.getByRole("button", { name: /Date/ }));
    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Weekly groceries")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Amount/ }));
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("June salary")).toBeVisible();
  });

  it("shows an empty state when there are no transactions", () => {
    renderTransactionsPage({ transactions: [] });

    expect(screen.getByText("No transactions yet")).toBeVisible();
  });
});
