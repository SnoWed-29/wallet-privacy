import type { FormEvent, ReactNode } from "react";
import { WalletCards } from "lucide-react";
import { AppButton, AppInput, FormField } from "../../../components/ui";

type AccountStepProps = {
  accountName: string;
  isSaving: boolean;
  onBack: () => void;
  onChange: (changes: Partial<AccountStepState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type AccountStepState = {
  accountName: string;
};

export function AccountStep({
  accountName,
  isSaving,
  onBack,
  onChange,
  onSubmit,
}: AccountStepProps) {
  return (
    <form className="mx-auto grid max-w-2xl gap-5" onSubmit={onSubmit}>
      <StepTitle
        description="Accounts represent where your money is stored."
        icon={<WalletCards className="h-6 w-6" aria-hidden="true" />}
        title="Create your first account"
      />
      <FormField label="Account name">
        {(id) => (
          <AppInput
            autoFocus
            id={id}
            onChange={(event) => onChange({ accountName: event.target.value })}
            placeholder="Cash"
            value={accountName}
          />
        )}
      </FormField>
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
      <div className="grid h-12 w-12 place-items-center rounded-app bg-app-primary/10 text-app-primary">
        {icon}
      </div>
      <div>
        <h1 className="text-page text-app-text max-sm:text-section">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-app-muted">{description}</p>
      </div>
    </div>
  );
}

export function StepActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-between gap-3 pt-2">{children}</div>;
}
