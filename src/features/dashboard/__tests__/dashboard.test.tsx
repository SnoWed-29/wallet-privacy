import { vi } from "vitest";
import { DashboardPage } from "../pages/DashboardPage";
import { emptyDashboardFixture } from "../../../test/mocks/fixtures";
import { createMockWalletState } from "../../../test/mocks/walletState";
import { renderWithProviders, screen } from "../../../test/test-utils";

const walletMock = vi.hoisted(() => ({
  state: undefined as ReturnType<typeof createMockWalletState> | undefined,
}));

vi.mock("../../wallet/WalletAppContext", () => ({
  useWalletAppContext: () => walletMock.state,
}));

describe("dashboard page", () => {
  beforeEach(() => {
    walletMock.state = createMockWalletState();
  });

  it("renders summary cards", () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Total balance")).toBeVisible();
    expect(screen.getByText("Monthly income")).toBeVisible();
    expect(screen.getByText("Monthly expenses")).toBeVisible();
    expect(screen.getByText("Budget remaining")).toBeVisible();
  });

  it("shows empty states when dashboard lists have no data", () => {
    walletMock.state = createMockWalletState({
      dashboard: emptyDashboardFixture(),
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("No recent transactions.")).toBeVisible();
    expect(screen.getByText("No bills due soon.")).toBeVisible();
    expect(screen.getByText("No active savings goals.")).toBeVisible();
    expect(screen.getByText("No active budgets.")).toBeVisible();
  });
});
