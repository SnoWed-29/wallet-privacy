import { vi } from "vitest";
import { ReportsPage } from "../pages/ReportsPage";
import type { ReportsSummary } from "../types";
import { accountFixture, expenseCategoryFixture, incomeCategoryFixture } from "../../../test/mocks/fixtures";
import { createMockWalletState } from "../../../test/mocks/walletState";
import { renderWithProviders, screen, userEvent } from "../../../test/test-utils";

const reportsMock = vi.hoisted(() => ({
  state: undefined as ReturnType<typeof createReportsState> | undefined,
}));

const walletMock = vi.hoisted(() => ({
  state: undefined as ReturnType<typeof createMockWalletState> | undefined,
}));

const navigationMock = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("../hooks/useReports", () => ({
  useReports: () => reportsMock.state,
}));

vi.mock("../../wallet/WalletAppContext", () => ({
  useWalletAppContext: () => walletMock.state,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigationMock.navigate,
  };
});

describe("reports page", () => {
  beforeEach(() => {
    walletMock.state = createMockWalletState();
    reportsMock.state = createReportsState();
    navigationMock.navigate.mockReset();
  });

  it("renders report summaries, charts, and mixed-currency guidance", () => {
    renderWithProviders(<ReportsPage />);

    expect(screen.getByRole("heading", { name: "Reports" })).toBeVisible();
    expect(screen.getByText("Income / MAD")).toBeVisible();
    expect(screen.getByText("Income / USD")).toBeVisible();
    expect(screen.getByText(/multiple currencies/i)).toBeVisible();
    expect(screen.getByText("Income and expense trend")).toBeVisible();
    expect(screen.getByText("Expenses by category")).toBeVisible();
    expect(screen.getByText("Budget performance")).toBeVisible();
    expect(screen.getByText("Yearly overview 2026")).toBeVisible();
  });

  it("applies and resets filters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);

    await user.selectOptions(screen.getByLabelText("Account"), accountFixture.id);
    await user.selectOptions(screen.getByLabelText("Type"), "expense");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));
    await user.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(reportsMock.state?.updateFilters).toHaveBeenCalledWith({
      accountId: accountFixture.id,
    });
    expect(reportsMock.state?.updateFilters).toHaveBeenCalledWith({
      transactionType: "expense",
    });
    expect(reportsMock.state?.applyFilters).toHaveBeenCalled();
    expect(reportsMock.state?.resetFilters).toHaveBeenCalled();
  });

  it("shows loading, error, and empty states", () => {
    reportsMock.state = createReportsState({
      error: "Unable to load reports.",
      isLoading: false,
      summary: null,
    });
    const { rerender } = renderWithProviders(<ReportsPage />);

    expect(screen.getByText("Unable to load reports.")).toBeVisible();

    reportsMock.state = createReportsState({
      isLoading: true,
      summary: null,
    });
    rerender(<ReportsPage />);
    expect(screen.getByText("Calculating reports from local data.")).toBeVisible();

    reportsMock.state = createReportsState({
      summary: { ...summaryFixture, matchingTransactions: [], currencySummaries: [] },
    });
    rerender(<ReportsPage />);
    expect(screen.getByText("No transactions match these filters.")).toBeVisible();
  });

  it("opens matching transactions with active filters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);

    await user.click(screen.getByRole("button", { name: /view matching transactions/i }));

    expect(navigationMock.navigate).toHaveBeenCalledWith(
      "/transactions?startDate=2026-01-01&endDate=2026-12-31",
    );
  });
});

function createReportsState(overrides: Partial<ReturnType<typeof createReportsState>> = {}) {
  return {
    appliedFilters: {
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      accountId: "",
      categoryId: "",
      transactionType: "",
      currency: "",
    },
    filters: {
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      accountId: "",
      categoryId: "",
      transactionType: "",
      currency: "",
    },
    summary: summaryFixture,
    isLoading: false,
    error: "",
    updateFilters: vi.fn(),
    applyFilters: vi.fn(),
    applyFilterChanges: vi.fn(),
    resetFilters: vi.fn(),
    reloadReports: vi.fn(),
    ...overrides,
  };
}

const summaryFixture: ReportsSummary = {
  filters: {
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    accountId: null,
    categoryId: null,
    transactionType: null,
    currency: null,
    grouping: "monthly",
    dayCount: 365,
  },
  availableCurrencies: ["MAD", "USD"],
  hasMixedCurrencies: true,
  currencySummaries: [
    {
      currency: "MAD",
      totalIncomeMinor: 200_000,
      totalExpenseMinor: 50_000,
      netCashFlowMinor: 150_000,
      savingsRatePercent: 75,
      averageDailySpendingMinor: 137,
      transactionCount: 2,
    },
    {
      currency: "USD",
      totalIncomeMinor: 100_000,
      totalExpenseMinor: 25_000,
      netCashFlowMinor: 75_000,
      savingsRatePercent: 75,
      averageDailySpendingMinor: 68,
      transactionCount: 2,
    },
  ],
  trend: [
    {
      currency: "MAD",
      periodStart: "2026-01-01",
      periodLabel: "Jan 2026",
      incomeMinor: 200_000,
      expenseMinor: 50_000,
      netCashFlowMinor: 150_000,
    },
    {
      currency: "USD",
      periodStart: "2026-01-01",
      periodLabel: "Jan 2026",
      incomeMinor: 100_000,
      expenseMinor: 25_000,
      netCashFlowMinor: 75_000,
    },
  ],
  expenseCategories: [
    {
      currency: "MAD",
      categoryId: expenseCategoryFixture.id,
      categoryName: expenseCategoryFixture.name,
      totalMinor: 50_000,
      percentage: 100,
      transactionCount: 1,
    },
  ],
  incomeCategories: [
    {
      currency: "MAD",
      categoryId: incomeCategoryFixture.id,
      categoryName: incomeCategoryFixture.name,
      totalMinor: 200_000,
      percentage: 100,
      transactionCount: 1,
    },
  ],
  periodComparison: [
    {
      currency: "MAD",
      income: {
        currentMinor: 200_000,
        previousMinor: 100_000,
        changeMinor: 100_000,
        changePercent: 100,
      },
      expenses: {
        currentMinor: 50_000,
        previousMinor: 25_000,
        changeMinor: 25_000,
        changePercent: 100,
      },
      netCashFlow: {
        currentMinor: 150_000,
        previousMinor: 75_000,
        changeMinor: 75_000,
        changePercent: 100,
      },
    },
  ],
  budgetPerformance: [
    {
      id: "budget-1",
      name: "Food budget",
      categoryId: expenseCategoryFixture.id,
      categoryName: expenseCategoryFixture.name,
      currency: "MAD",
      limitMinor: 100_000,
      spentMinor: 50_000,
      remainingMinor: 50_000,
      percentageUsed: 50,
      overBudgetMinor: 0,
      status: "On track",
      month: 1,
      year: 2026,
    },
  ],
  accountGroups: [
    {
      currency: "MAD",
      totalBalanceMinor: 150_000,
      accounts: [
        {
          id: accountFixture.id,
          name: accountFixture.name,
          accountType: accountFixture.accountType,
          currency: "MAD",
          balanceMinor: 150_000,
          percentageOfCurrencyTotal: 100,
          isArchived: false,
        },
      ],
    },
  ],
  recurringBills: [
    {
      currency: "MAD",
      expectedBills: 1,
      paidBills: 0,
      unpaidBills: 1,
      expectedAmountMinor: 25_000,
      paidAmountMinor: 0,
      upcomingAmountMinor: 25_000,
    },
  ],
  savingsGoals: {
    activeGoals: 1,
    completedGoals: 0,
    totalTargetsMinor: 500_000,
    recordedContributions: [
      {
        currency: "MAD",
        amountMinor: 10_000,
        transactionCount: 1,
      },
    ],
    overallProgressPercent: 25,
    contributionHistory: [
      {
        currency: "MAD",
        date: "2026-01-10",
        amountMinor: 10_000,
      },
    ],
  },
  yearlyOverview: {
    year: 2026,
    currencySummaries: [
      {
        currency: "MAD",
        months: Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          label: new Date(2026, index, 1).toLocaleString("en", {
            month: "short",
          }),
          incomeMinor: index === 0 ? 200_000 : 0,
          expenseMinor: index === 0 ? 50_000 : 0,
          netCashFlowMinor: index === 0 ? 150_000 : 0,
        })),
        annualIncomeMinor: 200_000,
        annualExpenseMinor: 50_000,
        annualNetCashFlowMinor: 150_000,
        averageMonthlyIncomeMinor: 16_666,
        averageMonthlyExpenseMinor: 4_166,
        highestExpenseMonth: "Jan",
        bestNetCashFlowMonth: "Jan",
      },
    ],
  },
  matchingTransactions: [
    {
      id: "transaction-1",
      accountId: accountFixture.id,
      accountName: accountFixture.name,
      accountType: accountFixture.accountType,
      currency: "MAD",
      categoryId: expenseCategoryFixture.id,
      categoryName: expenseCategoryFixture.name,
      categoryType: "expense",
      transactionType: "expense",
      amountMinor: 50_000,
      description: "Groceries",
      transactionDate: "2026-01-10",
    },
  ],
};
