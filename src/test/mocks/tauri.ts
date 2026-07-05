import { vi } from "vitest";

type InvokeHandler = (args?: unknown) => unknown | Promise<unknown>;

const handlers = new Map<string, InvokeHandler>();

export const unlockedSecurityStatus = {
  hasEncryptedStorage: true,
  hasLegacyDatabase: false,
  isUnlocked: true,
  passwordConfigured: true,
  legacyMigrationRequired: false,
};

export const firstRunSecurityStatus = {
  hasEncryptedStorage: false,
  hasLegacyDatabase: false,
  isUnlocked: false,
  passwordConfigured: false,
  legacyMigrationRequired: false,
};

export const lockedSecurityStatus = {
  hasEncryptedStorage: true,
  hasLegacyDatabase: false,
  isUnlocked: false,
  passwordConfigured: true,
  legacyMigrationRequired: false,
};

export const legacyMigrationSecurityStatus = {
  hasEncryptedStorage: false,
  hasLegacyDatabase: true,
  isUnlocked: false,
  passwordConfigured: false,
  legacyMigrationRequired: true,
};

export const unlockedLegacySecurityStatus = {
  hasEncryptedStorage: true,
  hasLegacyDatabase: false,
  isUnlocked: true,
  passwordConfigured: true,
  legacyMigrationRequired: false,
};

export const mockInvoke = vi.fn((command: string, args?: unknown) => {
  const handler = handlers.get(command);

  if (!handler) {
    return Promise.reject(new Error(`No mock registered for Tauri command: ${command}`));
  }

  return Promise.resolve(handler(args));
});

export function mockTauriSuccess<T>(command: string, value: T) {
  handlers.set(command, () => value);
}

export function mockTauriHandler(command: string, handler: InvokeHandler) {
  handlers.set(command, handler);
}

export function mockTauriError(command: string, message: string) {
  handlers.set(command, () => Promise.reject(new Error(message)));
}

export function resetTauriMocks() {
  handlers.clear();
  mockTauriSuccess("get_security_status", unlockedSecurityStatus);
  mockInvoke.mockClear();
}

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));
