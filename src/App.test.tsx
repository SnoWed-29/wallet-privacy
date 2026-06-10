import App from "./App";
import {
  dashboardFixture,
  expenseCategoryFixture,
  incomeCategoryFixture,
} from "./test/mocks/fixtures";
import {
  mockTauriSuccess,
  resetTauriMocks,
} from "./test/mocks/tauri";
import { renderWithProviders, screen } from "./test/test-utils";

describe("App", () => {
  beforeEach(() => {
    resetTauriMocks();
    mockTauriSuccess("list_accounts", []);
    mockTauriSuccess("list_categories", [incomeCategoryFixture, expenseCategoryFixture]);
    mockTauriSuccess("list_transactions", []);
    mockTauriSuccess("filter_transactions", []);
    mockTauriSuccess("list_budgets", []);
    mockTauriSuccess("list_savings_goals", []);
    mockTauriSuccess("list_recurring_bills", []);
    mockTauriSuccess("get_dashboard_summary", dashboardFixture);
  });

  it("renders the desktop app shell without calling a real Tauri backend", async () => {
    renderWithProviders(<App />, { route: "/dashboard" });

    expect(screen.getByTestId("app-sidebar")).toBeVisible();
    expect(screen.getByRole("link", { name: /Dashboard/ })).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
