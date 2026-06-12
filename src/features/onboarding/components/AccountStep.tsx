import type { FormEvent, ReactNode } from "react";
import { WalletCards } from "lucide-react";
import { AppButton, AppInput, AppSelect } from "../../../components/ui";

type AccountStepProps = {
  accountName: string;
  accountType: string;
  currency: string;
  initialBalance: string;
  isSaving: boolean;
  onBack: () => void;
  onChange: (changes: Partial<AccountStepState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type AccountStepState = {
  accountName: string;
  accountType: string;
  currency: string;
  initialBalance: string;
};

export function AccountStep({
  accountName,
  accountType,
  currency,
  initialBalance,
  isSaving,
  onBack,
  onChange,
  onSubmit,
}: AccountStepProps) {
  return (
    <form className="grid max-w-2xl gap-5" onSubmit={onSubmit}>
      <StepTitle
        description="Accounts represent where your money is stored."
        icon={<WalletCards className="h-6 w-6" aria-hidden="true" />}
        title="Create your first account"
      />
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Account name</span>
          <AppInput
            autoFocus
            onChange={(event) => onChange({ accountName: event.target.value })}
            placeholder="Cash"
            value={accountName}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Account type</span>
          <AppSelect
            onChange={(event) => onChange({ accountType: event.target.value })}
            value={accountType}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank Account</option>
            <option value="savings">Savings Account</option>
            <option value="credit">Credit Card</option>
          </AppSelect>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Currency</span>
          <AppInput
            onChange={(event) => onChange({ currency: event.target.value })}
            value={currency}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Starting balance</span>
          <AppInput
            inputMode="decimal"
            onChange={(event) => onChange({ initialBalance: event.target.value })}
            placeholder="0.00"
            value={initialBalance}
          />
        </label>
      </div>
      <StepActions>
        <AppButton onClick={onBack} variant="ghost">
          Back
        </AppButton>
        <AppButton disabled={isSaving} type="submit" variant="primary">
          {isSaving ? "Saving..." : "Create Account"}
        </AppButton>
      </StepActions>
    </form>
  );
}

export function StepTitle({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-app bg-emerald-50 text-app-primary">
        {icon}
      </div>
      <div>
        <h1 className="text-3xl font-extrabold leading-tight text-app-text max-sm:text-2xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-app-muted">{description}</p>
      </div>
    </div>
  );
}

export function StepActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-between gap-3 pt-2">{children}</div>;
}
