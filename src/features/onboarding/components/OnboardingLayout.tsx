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
    <main className="min-h-screen bg-app-background bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_34rem)] p-6 text-app-text max-sm:p-4">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl content-start gap-7">
        <header className="grid gap-5 rounded-app border border-app-border bg-white/85 p-5 shadow-app backdrop-blur max-sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-app-sidebar text-white">
                <WalletCards className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <strong className="block text-lg text-app-text">Wallet</strong>
                <span className="text-sm text-app-muted">Private local finance</span>
              </div>
            </div>
            <div className="flex max-w-xl items-center gap-3 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-900 max-sm:rounded-app-sm">
              <ShieldCheck className="h-5 w-5 flex-none" aria-hidden="true" />
              <span>Your financial data remains on this device.</span>
            </div>
          </div>

          <OnboardingProgress currentStep={currentStep} />
        </header>

        <section className="grid justify-items-center pb-8">
          <div className="w-full max-w-4xl rounded-app border border-app-border bg-white p-8 shadow-app motion-safe:animate-[walletStepIn_180ms_ease-out] max-md:p-6 max-sm:p-4">
            {children}
          </div>
        </section>
      </section>
    </main>
  );
}
