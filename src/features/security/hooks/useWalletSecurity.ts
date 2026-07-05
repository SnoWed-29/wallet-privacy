import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

type SecurityStatus = {
  hasEncryptedStorage: boolean;
  hasLegacyDatabase: boolean;
  isUnlocked: boolean;
  passwordConfigured: boolean;
  legacyMigrationRequired: boolean;
};

function readableSecurityError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const message = rawMessage.replace(/^Error:\s*/i, "").trim();

  if (!message) {
    return "Wallet could not complete that security action.";
  }

  if (
    message.includes("\n") ||
    message.toLowerCase().includes("sql") ||
    message.toLowerCase().includes("database") ||
    message.toLowerCase().includes("stack")
  ) {
    return "Wallet could not unlock local data. Check the password and try again.";
  }

  return message.length > 160
    ? "Wallet could not complete that security action."
    : message;
}

export function useWalletSecurity() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const refresh = useCallback(async () => {
    setIsChecking(true);
    try {
      const nextStatus = await invoke<SecurityStatus>("get_security_status");
      setStatus(nextStatus);
      return nextStatus;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setupPassword(password: string) {
    try {
      const nextStatus = await invoke<SecurityStatus>("setup_app_password", {
        request: { password },
      });
      setStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      throw new Error(readableSecurityError(error));
    }
  }

  async function unlock(password: string) {
    try {
      const nextStatus = await invoke<SecurityStatus>("unlock_wallet", {
        request: { password },
      });
      setStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      throw new Error(readableSecurityError(error));
    }
  }

  async function lock() {
    try {
      const nextStatus = await invoke<SecurityStatus>("lock_wallet");
      setStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      throw new Error(readableSecurityError(error));
    }
  }

  return {
    isChecking,
    lock,
    refresh,
    setupPassword,
    status,
    unlock,
  };
}

export type WalletSecurityState = ReturnType<typeof useWalletSecurity>;
export type { SecurityStatus };