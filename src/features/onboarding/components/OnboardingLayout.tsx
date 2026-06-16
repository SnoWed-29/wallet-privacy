import { ReactNode } from "react";
import { ShieldCheck, WalletCards } from "lucide-react";
import type { OnboardingStepId } from "../types/onboarding.types";
import { OnboardingProgress } from "./OnboardingProgress";

type OnboardingLayoutProps = {
  children: ReactNode;
  currentStep: OnboardingStepId;
};

export function OnboardingLayout({ children, currentStep }: OnboardingLayoutProps) {
  return (
    <main className="wallet-app-bg min-h-screen p-5 text-app-text max-sm:p-4">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl content-center gap-5">
        <header className="glass-surface mx-auto grid w-full gap-5 rounded-app-lg p-5 max-sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-app-sm bg-app-primary text-white shadow-[0_12px_26px_rgba(156,67,166,0.24)]">
                <WalletCards className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <strong className="block text-lg font-bold text-app-text">Wallet</strong>
                <span className="text-sm text-app-muted">Private local finance</span>
              </div>
            </div>
            <div className="flex max-w-xl items-center gap-3 rounded-full border border-app-primary/12 bg-white/52 px-4 py-2 text-sm font-semibold text-app-muted max-sm:rounded-app-sm">
              <ShieldCheck className="h-5 w-5 flex-none text-app-primary" aria-hidden="true" />
              <span>Your financial data remains on this device.</span>
            </div>
          </div>

          <OnboardingProgress currentStep={currentStep} />
        </header>

        <section className="grid justify-items-center pb-4">
          <div className="glass-surface-strong w-full max-w-4xl rounded-app-lg p-8 motion-safe:animate-[walletStepIn_180ms_ease-out] max-md:p-6 max-sm:p-4">
            {children}
          </div>
        </section>
      </section>
    </main>
  );
}
