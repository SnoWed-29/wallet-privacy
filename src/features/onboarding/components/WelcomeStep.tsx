import { Download, Sparkles } from "lucide-react";
import { AppButton } from "../../../components/ui";

type WelcomeStepProps = {
  onGetStarted: () => void;
  onImport: () => void;
};

export function WelcomeStep({ onGetStarted, onImport }: WelcomeStepProps) {
  return (
    <div className="grid max-w-2xl gap-6">
      <div className="grid h-14 w-14 place-items-center rounded-app bg-emerald-50 text-app-primary">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-4xl font-extrabold leading-tight text-app-text max-sm:text-3xl">
          Welcome to Wallet
        </h1>
        <p className="mt-3 text-base leading-relaxed text-app-muted">
          A private-by-design personal finance application. Your financial data remains on your
          device.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <AppButton onClick={onGetStarted} variant="primary">
          Get Started
        </AppButton>
        <AppButton className="gap-2" onClick={onImport} variant="ghost">
          <Download className="h-4 w-4" aria-hidden="true" />
          Import Existing Data
        </AppButton>
      </div>
    </div>
  );
}
