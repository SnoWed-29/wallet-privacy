import { beforeEach, expect, test, vi } from "vitest";
import {
  mockInvoke,
  mockTauriError,
  mockTauriSuccess,
  resetTauriMocks,
} from "../../test/mocks/tauri";
import { DataBackupSection } from "../../features/settings/components/DataBackupSection";
import { renderWithProviders, screen, userEvent, waitFor } from "../../test/test-utils";

beforeEach(() => {
  resetTauriMocks();
  vi.stubGlobal("showSaveFilePicker", vi.fn(async () => ({
    createWritable: async () => ({
      write: vi.fn(),
      close: vi.fn(),
    }),
  })));
});

test("renders export section", () => {
  renderWithProviders(<DataBackupSection />);

  expect(screen.getByRole("heading", { name: "Data Transfer" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /export data/i })).toBeInTheDocument();
});

test("plain export warns before writing portable JSON", async () => {
  mockTauriSuccess("export_wallet_data", JSON.stringify(validExport()));
  vi.mocked(window.confirm).mockReturnValueOnce(true);
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /export data/i }));

  expect(window.confirm).toHaveBeenCalledWith(
    "Plain Wallet exports are not encrypted. Store exported files somewhere safe. Continue?",
  );
  await waitFor(() => {
    expect(screen.getByText("Export complete")).toBeInTheDocument();
  });
});

test("canceling the plain export warning does not request export data", async () => {
  mockTauriSuccess("export_wallet_data", JSON.stringify(validExport()));
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /export data/i }));

  expect(commandCallCount("export_wallet_data")).toBe(0);
  expect(screen.queryByText("Export complete")).not.toBeInTheDocument();
});

test("export error shows error notification", async () => {
  mockTauriError("export_wallet_data", "Export failed in test");
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /export data/i }));

  await waitFor(() => {
    expect(screen.getByText("Export failed")).toBeInTheDocument();
    expect(screen.getByText("Export failed in test")).toBeInTheDocument();
  });
});

function commandCallCount(command: string) {
  return mockInvoke.mock.calls.filter(([calledCommand]) => calledCommand === command).length;
}

function validExport() {
  return {
    version: "1.0",
    exportedAt: "2026-06-12T00:00:00Z",
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    recurringBills: [],
    savingsGoals: [],
  };
}
