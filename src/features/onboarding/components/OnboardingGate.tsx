import { ReactNode } from "react";
import { OnboardingPage } from "../pages/OnboardingPage";
import { useOnboarding } from "../hooks/useOnboarding";
import { useWalletAppContext } from "../../wallet/WalletAppContext";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const wallet = useWalletAppContext();
  const onboarding = useOnboarding(wallet);

  if (onboarding.status === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-app-background p-6">
        <div className="rounded-app border border-app-border bg-white p-6 text-sm font-extrabold text-app-muted shadow-app">
          Preparing your local wallet...
        </div>
      </main>
    );
  }

  if (onboarding.status === "required") {
    return <OnboardingPage onComplete={onboarding.completeOnboarding} />;
  }

  return <>{children}</>;
}
