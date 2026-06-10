import { vi } from "vitest";
import { ManageWalletPage } from "../pages/ManageWalletPage";
import { createMockWalletState } from "../../../test/mocks/walletState";
import { renderWithProviders, screen, userEvent } from "../../../test/test-utils";

const walletMock = vi.hoisted(() => ({
  state: undefined as ReturnType<typeof createMockWalletState> | undefined,
}));

vi.mock("../../wallet/WalletAppContext", () => ({
  useWalletAppContext: () => walletMock.state,
}));

describe("manage wallet page", () => {
  beforeEach(() => {
    walletMock.state = createMockWalletState();
  });

  it("renders accounts and categories sections", () => {
    renderWithProviders(<ManageWalletPage />);

    expect(screen.getByRole("heading", { name: "Accounts" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeVisible();
  });

  it("validates account form through the submit handler", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManageWalletPage />);

    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(walletMock.state?.createAccount).toHaveBeenCalledOnce();
  });

  it("submits account form when a name is present", async () => {
    const user = userEvent.setup();
    walletMock.state = createMockWalletState({ accountName: "Cash wallet" });

    renderWithProviders(<ManageWalletPage />);

    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(walletMock.state.createAccount).toHaveBeenCalledOnce();
  });

  it("validates category form through the submit handler", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManageWalletPage />);

    await user.click(screen.getByRole("button", { name: "Add Category" }));

    expect(walletMock.state?.createCategory).toHaveBeenCalledOnce();
  });

  it("submits category form when a name is present", async () => {
    const user = userEvent.setup();
    walletMock.state = createMockWalletState({ categoryName: "Dining" });

    renderWithProviders(<ManageWalletPage />);

    await user.click(screen.getByRole("button", { name: "Add Category" }));

    expect(walletMock.state.createCategory).toHaveBeenCalledOnce();
  });
});
