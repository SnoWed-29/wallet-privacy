import { CheckCircle2 } from "lucide-react";
import { AppButton } from "../../../components/ui";
import type { OnboardingSummary } from "../types/onboarding.types";
import { StepTitle } from "./AccountStep";

type CompletionStepProps = {
  onComplete: () => void;
  summary: OnboardingSummary;
};

export function CompletionStep({ onComplete, summary }: CompletionStepProps) {
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <StepTitle
        description="Your Wallet is ready."
        icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
        title="Setup complete"
      />

      <div className="grid grid-cols-2 gap-3 text-sm max-sm:grid-cols-1">
        <SummaryTile label="Accounts created" value={summary.accounts} />
        <SummaryTile label="Categories selected" value={summary.categories} />
        <SummaryTile label="Budgets created" value={summary.budgets} />
        <SummaryTile label="Recurring bills created" value={summary.recurringBills} />
      </div>
      {summary.importedData ? (
        <p className="rounded-app-sm border border-app-success/18 bg-app-success/8 p-3 text-sm font-semibold text-app-success">
          Existing Wallet data was imported during setup.
        </p>
      ) : null}
      <div className="flex justify-end">
        <AppButton onClick={onComplete} variant="primary">
          Go to Dashboard
        </AppButton>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-app-text">{value}</p>
    </div>
  );
}
