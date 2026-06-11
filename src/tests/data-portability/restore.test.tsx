import { beforeEach, expect, test } from "vitest";
import { mockTauriSuccess, resetTauriMocks } from "../../test/mocks/tauri";
import { DataBackupSection } from "../../features/settings/components/DataBackupSection";
import { renderWithProviders, screen, userEvent, waitFor } from "../../test/test-utils";

beforeEach(() => {
  resetTauriMocks();
});

test("renders restore section", () => {
  renderWithProviders(<DataBackupSection />);

  expect(screen.getByRole("heading", { name: "Restore Backup" })).toBeInTheDocument();
  expect(screen.getByText("Restoring a backup will replace your current Wallet data.")).toBeInTheDocument();
});

test("selecting backup file shows warning modal and requires confirmation", async () => {
  mockTauriSuccess("validate_backup_file", preview());
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.upload(
    screen.getByLabelText("Wallet backup JSON file"),
    new File([JSON.stringify({ backupVersion: "1.0" })], "wallet-backup.json"),
  );
  await user.click(await screen.findByRole("button", { name: /^restore backup$/i }));

  expect(screen.getByRole("heading", { name: "Confirm backup restore" })).toBeInTheDocument();
  expect(screen.getAllByText("Restoring a backup will replace your current Wallet data.")).toHaveLength(2);
  expect(screen.getByRole("button", { name: /replace current data/i })).toBeDisabled();

  await user.type(screen.getByLabelText(/type restore/i), "RESTORE");

  expect(screen.getByRole("button", { name: /replace current data/i })).toBeEnabled();
});

test("restore success notification appears after confirmation", async () => {
  mockTauriSuccess("validate_backup_file", preview());
  mockTauriSuccess("restore_wallet_backup", restoreResult());
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.upload(
    screen.getByLabelText("Wallet backup JSON file"),
    new File([JSON.stringify({ backupVersion: "1.0" })], "wallet-backup.json"),
  );
  await user.click(await screen.findByRole("button", { name: /^restore backup$/i }));
  await user.type(screen.getByLabelText(/type restore/i), "RESTORE");
  await user.click(screen.getByRole("button", { name: /replace current data/i }));

  await waitFor(() => {
    expect(screen.getByText("Restore complete")).toBeInTheDocument();
  });
});

function preview() {
  return {
    metadata: {
      backupVersion: "1.0",
      createdAt: "2026-06-12T00:00:00Z",
      appVersion: "0.2.1",
      dataCounts: counts(1),
    },
    summary: {
      version: "1.0",
      exportedAt: "2026-06-12T00:00:00Z",
      accounts: 1,
      categories: 0,
      transactions: 0,
      budgets: 0,
      recurringBills: 0,
      savingsGoals: 0,
    },
    duplicates: counts(0),
    conflicts: counts(0),
    warnings: [],
  };
}

function restoreResult() {
  return {
    restored: {
      mode: "replace",
      summary: preview().summary,
      imported: counts(1),
      skipped: counts(0),
      duplicates: counts(0),
      conflicts: counts(0),
      warnings: [],
    },
    safetyBackupJson: "{}",
    safetyBackupCreatedAt: "2026-06-12T00:01:00Z",
  };
}

function counts(accounts: number) {
  return {
    accounts,
    categories: 0,
    transactions: 0,
    budgets: 0,
    recurringBills: 0,
    savingsGoals: 0,
  };
}
