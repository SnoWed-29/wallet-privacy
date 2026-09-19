import { useEffect, useState } from "react";
import type { WalletAppState } from "../../../hooks/useWalletApp";
import {
  onboardingUpdatedEventName,
  readOnboardingCompleted,
  setOnboardingCompleted,
} from "../utils/onboarding.utils";

type OnboardingStatus = "checking" | "required" | "completed";

export function useOnboarding(wallet: WalletAppState) {
  const [status, setStatus] = useState<OnboardingStatus>("checking");

  useEffect(() => {
    function evaluateStatus() {
      const completed = readOnboardingCompleted();

      if (completed === true) {
        setStatus(wallet.isBootstrapping ? "checking" : "completed");
        return;
      }

      setStatus("required");
    }

    evaluateStatus();
    window.addEventListener(onboardingUpdatedEventName, evaluateStatus);
    window.addEventListener("storage", evaluateStatus);

    return () => {
      window.removeEventListener(onboardingUpdatedEventName, evaluateStatus);
      window.removeEventListener("storage", evaluateStatus);
    };
  }, [wallet.isBootstrapping]);

  return {
    completeOnboarding: () => {
      setOnboardingCompleted(true);
      setStatus("completed");
    },
    restartOnboarding: () => {
      setOnboardingCompleted(false);
      setStatus("required");
    },
    status,
  };
}