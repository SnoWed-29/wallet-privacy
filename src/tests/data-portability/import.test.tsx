import { beforeEach, expect, test } from "vitest";
import { mockTauriSuccess, resetTauriMocks } from "../../test/mocks/tauri";
import { DataBackupSection } from "../../features/settings/components/DataBackupSection";
import { renderWithProviders, screen, userEvent, waitFor } from "../../test/test-utils";

beforeEach(() => {
  resetTauriMocks();
});

test("renders import section", () => {
  renderWithProviders(<DataBackupSection />);

  expect(screen.getByRole("heading", { name: "Import Data" })).toBeInTheDocument();
  expect(screen.getByLabelText("Wallet JSON file")).toBeInTheDocument();
});

test("selecting valid import file shows preview and merge and replace options", async () => {
  mockTauriSuccess("validate_import_file", preview());
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.upload(
    screen.getByLabelText("Wallet JSON file"),
    new File([JSON.stringify({ version: "1.0" })], "wallet-export.json", {
      type: "application/json",
    }),
  );

  await waitFor(() => {
    expect(screen.getByText("wallet-export.json")).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: /merge with current data/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /restore from file/i })).toBeInTheDocument();
});

test("canceling import confirmation closes modal", async () => {
  mockTauriSuccess("validate_import_file", preview());
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.upload(
    screen.getByLabelText("Wallet JSON file"),
    new File([JSON.stringify({ version: "1.0" })], "wallet-export.json"),
  );
  await user.click(await screen.findByRole("button", { name: /merge with current data/i }));
  expect(screen.getByRole("heading", { name: "Confirm merge import" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  await waitFor(() => {
    expect(screen.queryByRole("heading", { name: "Confirm merge import" })).not.toBeInTheDocument();
  });
});

function preview() {
  return {
    summary: {
      version: "1.0",
      exportedAt: "2026-06-12T00:00:00Z",
      accounts: 1,
      categories: 1,
      transactions: 0,
      budgets: 0,
      recurringBills: 0,
      savingsGoals: 0,
    },
    duplicates: emptyCounts(),
    conflicts: emptyCounts(),
    warnings: [],
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
