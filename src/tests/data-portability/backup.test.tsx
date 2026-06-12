import { beforeEach, expect, test, vi } from "vitest";
import { mockTauriError, mockTauriSuccess, resetTauriMocks } from "../../test/mocks/tauri";
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

test("renders backup section", () => {
  renderWithProviders(<DataBackupSection />);

  expect(screen.getByRole("heading", { name: "Safety & Recovery" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /create backup/i })).toBeInTheDocument();
});

test("clicking create backup shows success notification", async () => {
  mockTauriSuccess("create_wallet_backup", JSON.stringify(validBackup()));
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /create backup/i }));

  await waitFor(() => {
    expect(screen.getByText("Backup complete")).toBeInTheDocument();
  });
});

test("backup error shows error notification", async () => {
  mockTauriError("create_wallet_backup", "Backup failed in test");
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /create backup/i }));

  await waitFor(() => {
    expect(screen.getByText("Backup failed")).toBeInTheDocument();
    expect(screen.getByText("Backup failed in test")).toBeInTheDocument();
  });
});

function validBackup() {
  return {
    backupVersion: "1.0",
    createdAt: "2026-06-12T00:00:00Z",
    appVersion: "0.2.1",
    dataCounts: emptyCounts(),
    data: {
      version: "1.0",
      exportedAt: "2026-06-12T00:00:00Z",
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      recurringBills: [],
      savingsGoals: [],
    },
  };
}

function emptyCounts() {
  return {
    accounts: 0,
    categories: 0,
    transactions: 0,
    budgets: 0,
    recurringBills: 0,
    savingsGoals: 0,
  };
}
