import { expect, test, vi } from "vitest";
import { SettingsPage } from "../pages/SettingsPage";
import { renderWithProviders, screen, userEvent } from "../../../test/test-utils";
import { onboardingCompletedStorageKey } from "../../onboarding/utils/onboarding.utils";
import type { WalletSecurityState } from "../../security/hooks/useWalletSecurity";

test("renders settings as clear logical sections", () => {
  renderWithProviders(<SettingsPage />);

  expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "General" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Security & Privacy" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Data & Backup" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
});

test("keeps data details hidden until a workflow starts", () => {
  renderWithProviders(<SettingsPage />);

  expect(screen.queryByLabelText("Wallet JSON file")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Wallet backup JSON file")).not.toBeInTheDocument();
  expect(screen.queryByText("Step 3: Warning")).not.toBeInTheDocument();
});

test("locks the wallet from Security & Privacy", async () => {
  const security = createSecurityState();
  const user = userEvent.setup();
  renderWithProviders(<SettingsPage security={security} />);

  await user.click(screen.getByRole("button", { name: /lock app/i }));

  expect(security.lock).toHaveBeenCalledTimes(1);
});

test("allows onboarding to be restarted from settings", async () => {
  window.localStorage.setItem(onboardingCompletedStorageKey, "true");
  const user = userEvent.setup();
  renderWithProviders(<SettingsPage />);

  await user.click(screen.getByRole("button", { name: /restart onboarding/i }));

  expect(window.localStorage.getItem(onboardingCompletedStorageKey)).toBe("false");
});

function createSecurityState(): WalletSecurityState {
  const status = {
    hasEncryptedStorage: true,
    hasLegacyDatabase: false,
    isUnlocked: true,
    passwordConfigured: true,
    legacyMigrationRequired: false,
  };

  return {
    isChecking: false,
    status,
    lock: vi.fn(async () => ({ ...status, isUnlocked: false })),
    refresh: vi.fn(async () => status),
    setupPassword: vi.fn(async () => status),
    unlock: vi.fn(async () => status),
  };
}
