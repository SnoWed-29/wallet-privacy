import { ReactNode } from "react";
import { OnboardingPage } from "../pages/OnboardingPage";
import { useOnboarding } from "../hooks/useOnboarding";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import type { WalletSecurityState } from "../../security/hooks/useWalletSecurity";

export function OnboardingGate({
  children,
  security,
}: {
  children: ReactNode;
  security: WalletSecurityState;
}) {
  const wallet = useWalletAppContext();
  const onboarding = useOnboarding(wallet);

  if (onboarding.status === "checking") {
    return (
      <main className="wallet-app-bg grid min-h-screen place-items-center p-6">
        <div className="glass-surface-strong rounded-app p-6 text-sm font-semibold text-app-muted">
          Preparing your local wallet...
        </div>
      </main>
    );
  }

  if (onboarding.status === "required") {
    return (
      <OnboardingPage
        onComplete={onboarding.completeOnboarding}
        security={security}
      />
    );
  }

  return <>{children}</>;
}