import { beforeEach, describe, expect, test } from "vitest";
import {
  mockInvoke,
  mockTauriHandler,
  mockTauriSuccess,
  resetTauriMocks,
} from "../../../test/mocks/tauri";
import App from "../../../App";
import {
  accountFixture,
  dashboardFixture,
  emptyDashboardFixture,
  expenseCategoryFixture,
  incomeCategoryFixture,
} from "../../../test/mocks/fixtures";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../test/test-utils";
import type { Account, Category } from "../../../types/wallet";
import { onboardingCompletedStorageKey } from "../utils/onboarding.utils";

describe("onboarding", () => {
  beforeEach(() => {
    resetTauriMocks();
    window.localStorage.clear();
  });

  test("missing onboarding setting shows onboarding even when accounts exist", async () => {
    mockWalletBootstrap({ accounts: [accountFixture], dashboard: dashboardFixture });

    renderWithProviders(<App />, { route: "/dashboard" });

    expect(await screen.findByRole("heading", { name: "Welcome to Wallet" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(onboardingCompletedStorageKey)).toBeNull();
  });

  test("false onboarding setting shows onboarding", async () => {
    window.localStorage.setItem(onboardingCompletedStorageKey, "false");
    mockWalletBootstrap();

    renderWithProviders(<App />, { route: "/dashboard" });

    expect(await screen.findByRole("heading", { name: "Welcome to Wallet" })).toBeVisible();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  test("true onboarding setting opens the normal app", async () => {
    window.localStorage.setItem(onboardingCompletedStorageKey, "true");
    mockWalletBootstrap({ accounts: [accountFixture], dashboard: dashboardFixture });

    renderWithProviders(<App />, { route: "/dashboard" });

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Welcome to Wallet" })).not.toBeInTheDocument();
  });

  test("restart onboarding persists false and immediately opens onboarding", async () => {
    window.localStorage.setItem(onboardingCompletedStorageKey, "true");
    mockWalletBootstrap({ accounts: [accountFixture], dashboard: dashboardFixture });
    const user = userEvent.setup();

    renderWithProviders(<App />, { route: "/settings" });

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /restart onboarding/i }));

    expect(window.localStorage.getItem(onboardingCompletedStorageKey)).toBe("false");
    expect(await screen.findByRole("heading", { name: "Welcome to Wallet" })).toBeVisible();
  });

  test("loading state does not flash the dashboard before onboarding is resolved", async () => {
    const accounts = deferred<Account[]>();
    mockWalletBootstrap({ accountsPromise: accounts.promise });

    renderWithProviders(<App />, { route: "/dashboard" });

    expect(screen.getByText("Preparing your local wallet...")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();

    accounts.resolve([]);

    expect(await screen.findByRole("heading", { name: "Welcome to Wallet" })).toBeVisible();
  });

  test("welcome actions advance setup and open the existing import flow", async () => {
    mockWalletBootstrap();
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    expect(await screen.findByRole("heading", { name: "Welcome to Wallet" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /import existing data/i }));

    expect(screen.getByRole("dialog", { name: "Import Data" })).toBeInTheDocument();
    expect(screen.getByLabelText("Wallet JSON file")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close modal/i }));
    await user.click(screen.getByRole("button", { name: /get started/i }));

    expect(screen.getByRole("heading", { name: "Create your first account" })).toBeVisible();
  });

  test("account step validates and submits only the real account DTO fields", async () => {
    mockWalletBootstrap();
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await user.click(await screen.findByRole("button", { name: /get started/i }));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Enter an account name to continue.")).toBeInTheDocument();
    expect(commandCallCount("create_account")).toBe(0);

    await user.type(screen.getByLabelText("Account name"), "Cash");
    await user.selectOptions(screen.getByLabelText("Account type"), "bank");
    await user.type(screen.getByLabelText("Starting balance"), "100.00");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("heading", { name: "Choose categories" })).toBeVisible();
    expect(lastCommandRequest("create_account")).toEqual({
      name: "Cash",
      accountType: "bank",
      currency: "MAD",
      initialBalanceMinor: 10_000,
    });
    expect(lastCommandRequest("create_account")).not.toHaveProperty("balanceMinor");
    expect(lastCommandRequest("create_account")).not.toHaveProperty("createdAt");
  });

  test("account step shows backend validation errors clearly", async () => {
    mockWalletBootstrap();
    mockTauriHandler("create_account", () => Promise.reject(new Error("Account name already exists.")));
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await user.click(await screen.findByRole("button", { name: /get started/i }));
    await user.type(screen.getByLabelText("Account name"), "Cash");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Account name already exists.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Create your first account" })).toBeVisible();
  });

  test("category multi-select supports selecting and deselecting categories", async () => {
    mockWalletBootstrap();
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await advanceToCategories(user);
    await user.click(screen.getByRole("button", { name: /clear selection/i }));

    expect(screen.getByText("Selected:")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    const food = screen.getByRole("button", { name: "Food" });
    await user.click(food);
    expect(food).toHaveAttribute("aria-pressed", "true");

    await user.click(food);
    expect(food).toHaveAttribute("aria-pressed", "false");
  });

  test("selected categories are created and unselected categories are not created", async () => {
    mockWalletBootstrap();
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await advanceToCategories(user);
    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    await user.click(screen.getByRole("button", { name: "Food" }));
    await user.click(screen.getByRole("button", { name: "Transport" }));
    await user.click(screen.getByRole("button", { name: /create selected categories/i }));

    expect(await screen.findByText("Created 2, skipped 0, failed 0.")).toBeVisible();
    expect(commandRequests("create_category").map((request) => request.name)).toEqual([
      "Food",
      "Transport",
    ]);
    expect(commandRequests("create_category").map((request) => request.name)).not.toContain("Housing");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Add a monthly budget" })).toBeVisible();
  });

  test("existing category duplicates are skipped without creating them", async () => {
    mockWalletBootstrap();
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await advanceToCategories(user);
    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    await user.click(screen.getByRole("button", { name: "Salary" }));
    await user.click(screen.getByRole("button", { name: /create selected categories/i }));

    expect(await screen.findByText("Created 0, skipped 1, failed 0.")).toBeVisible();
    expect(screen.getByText("Skipped existing: Salary")).toBeVisible();
    expect(commandCallCount("create_category")).toBe(0);
  });

  test("category creation reports failures and stays on the category step", async () => {
    mockWalletBootstrap({ failCategories: ["Food"] });
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await advanceToCategories(user);
    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    await user.click(screen.getByRole("button", { name: "Food" }));
    await user.click(screen.getByRole("button", { name: "Transport" }));
    await user.click(screen.getByRole("button", { name: /create selected categories/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Created 1, skipped 0, failed 1.").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Failed: Food")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Choose categories" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Add a monthly budget" })).not.toBeInTheDocument();
  });

  test("optional steps can be skipped and completion persists true", async () => {
    mockWalletBootstrap();
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/dashboard" });

    await advanceToCategories(user);
    await user.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(await screen.findByRole("heading", { name: "Add a monthly budget" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(await screen.findByRole("heading", { name: "Add recurring bills" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(await screen.findByRole("heading", { name: "Setup complete" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /go to dashboard/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem(onboardingCompletedStorageKey)).toBe("true");
    });
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("renders primary onboarding controls at the minimum supported window size", async () => {
    resizeViewport(1180, 720);
    mockWalletBootstrap();

    renderWithProviders(<App />, { route: "/dashboard" });

    expect(await screen.findByRole("heading", { name: "Welcome to Wallet" })).toBeVisible();
    expect(screen.getByRole("button", { name: /get started/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /import existing data/i })).toBeVisible();
    expect(screen.getByLabelText("Onboarding progress")).toBeVisible();
  });
});

async function advanceToCategories(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /get started/i }));
  await user.type(screen.getByLabelText("Account name"), "Cash");
  await user.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByRole("heading", { name: "Choose categories" })).toBeVisible();
}

function mockWalletBootstrap({
  accounts = [],
  accountsPromise,
  categories = [incomeCategoryFixture, expenseCategoryFixture],
  dashboard = emptyDashboardFixture(),
  failCategories = [],
}: {
  accounts?: Account[];
  accountsPromise?: Promise<Account[]>;
  categories?: Category[];
  dashboard?: typeof dashboardFixture;
  failCategories?: string[];
} = {}) {
  let currentAccounts = accounts;
  let currentCategories: Category[] = categories;
  const categoryFailures = new Set(failCategories);

  mockTauriHandler("list_accounts", () => accountsPromise ?? currentAccounts);
  mockTauriHandler("list_categories", () => currentCategories);
  mockTauriSuccess("list_transactions", []);
  mockTauriSuccess("filter_transactions", []);
  mockTauriSuccess("list_budgets", []);
  mockTauriSuccess("list_savings_goals", []);
  mockTauriSuccess("list_recurring_bills", []);
  mockTauriSuccess("get_dashboard_summary", dashboard);

  mockTauriHandler("create_account", (args) => {
    const request = readRequest(args);
    const account: Account = {
      ...accountFixture,
      id: `account-${currentAccounts.length + 1}`,
      name: String(request.name),
      accountType: String(request.accountType),
      currency: String(request.currency),
      initialBalanceMinor: Number(request.initialBalanceMinor),
      balanceMinor: Number(request.initialBalanceMinor),
    };
    currentAccounts = [...currentAccounts, account];
    return account;
  });

  mockTauriHandler("create_category", (args) => {
    const request = readRequest(args);
    const name = String(request.name);
    if (categoryFailures.has(name)) {
      throw new Error(`Could not create ${name}`);
    }

    const category: Category = {
      ...expenseCategoryFixture,
      id: `category-${currentCategories.length + 1}`,
      name,
      categoryType: request.categoryType === "income" ? "income" : "expense",
    };
    currentCategories = [...currentCategories, category];
    return category;
  });
}

function readRequest(args: unknown) {
  return (args as { request: Record<string, unknown> }).request;
}

function commandCallCount(command: string) {
  return mockInvoke.mock.calls.filter(([calledCommand]) => calledCommand === command).length;
}

function commandRequests(command: string) {
  return mockInvoke.mock.calls
    .filter(([calledCommand]) => calledCommand === command)
    .map(([, args]) => readRequest(args));
}

function lastCommandRequest(command: string) {
  const requests = commandRequests(command);
  return requests[requests.length - 1];
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function resizeViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}
