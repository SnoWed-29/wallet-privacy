import { vi } from "vitest";
import { PlanningPage } from "../pages/PlanningPage";
import { createMockWalletState } from "../../../test/mocks/walletState";
import { renderWithProviders, screen, userEvent } from "../../../test/test-utils";

const walletMock = vi.hoisted(() => ({
  state: undefined as ReturnType<typeof createMockWalletState> | undefined,
}));

vi.mock("../../wallet/WalletAppContext", () => ({
  useWalletAppContext: () => walletMock.state,
}));

describe("planning page", () => {
  beforeEach(() => {
    walletMock.state = createMockWalletState();
  });

  it("renders budget, savings goal, and recurring bill sections", () => {
    renderWithProviders(<PlanningPage />);

    expect(screen.getByRole("heading", { name: "Monthly Budgets" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Savings Goals" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recurring Bills" })).toBeVisible();
  });

  it("uses select controls for month and year", () => {
    renderWithProviders(<PlanningPage />);

    expect(screen.getByDisplayValue("June").tagName).toBe("SELECT");
    expect(screen.getByDisplayValue("2026").tagName).toBe("SELECT");
  });

  it("validates budget amount through the create budget flow", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningPage />);

    await user.type(screen.getByPlaceholderText("Budget name"), "Food");
    await user.click(screen.getByRole("button", { name: "Create Monthly Budget" }));

    expect(walletMock.state.createBudget).toHaveBeenCalledOnce();
  });

  it("supports contribute to savings goal UI flow", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningPage />);

    await user.type(screen.getByPlaceholderText("Contribution amount"), "100");
    await user.click(screen.getByRole("button", { name: "Contribute" }));

    expect(walletMock.state.updateSavingsGoalContribution).toHaveBeenCalled();
    expect(walletMock.state.contributeToSavingsGoal).toHaveBeenCalledOnce();
  });
});
