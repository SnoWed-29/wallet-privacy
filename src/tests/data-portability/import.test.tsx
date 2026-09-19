import { beforeEach, expect, test } from "vitest";
import { mockTauriSuccess, resetTauriMocks } from "../../test/mocks/tauri";
import { DataBackupSection } from "../../features/settings/components/DataBackupSection";
import { renderWithProviders, screen, userEvent, waitFor, within } from "../../test/test-utils";

beforeEach(() => {
  resetTauriMocks();
});

test("renders import section", () => {
  renderWithProviders(<DataBackupSection />);

  expect(screen.getByRole("heading", { name: "Data Transfer" })).toBeInTheDocument();
  expect(screen.queryByLabelText("Wallet JSON file")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import data/i })).toBeInTheDocument();
});

test("selecting valid import file shows preview and merge and replace options", async () => {
  mockTauriSuccess("validate_import_file", preview());
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /import data/i }));
  await user.upload(
    screen.getByLabelText("Wallet JSON file"),
    new File([JSON.stringify({ version: "1.0" })], "wallet-export.json", {
      type: "application/json",
    }),
  );

  await waitFor(() => {
    expect(screen.getByText("wallet-export.json")).toBeInTheDocument();
  });
  const dialog = screen.getByRole("dialog", { name: "Import Data" });
  expect(within(dialog).getByRole("button", { name: /merge/i })).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: /replace/i })).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: /^import data$/i })).toBeInTheDocument();
});

test("canceling import workflow closes modal", async () => {
  mockTauriSuccess("validate_import_file", preview());
  const user = userEvent.setup();
  renderWithProviders(<DataBackupSection />);

  await user.click(screen.getByRole("button", { name: /import data/i }));
  await user.upload(
    screen.getByLabelText("Wallet JSON file"),
    new File([JSON.stringify({ version: "1.0" })], "wallet-export.json"),
  );
  expect(await screen.findByText("Step 3: Choose Mode")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
