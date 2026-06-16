import { CalendarClock } from "lucide-react";
import { AppButton, AppInput, AppSelect, FormField } from "../../../components/ui";
import type { Account, Category, RecurringBillFormState, RecurringFrequency } from "../../../types/wallet";
import { recurringFrequencyOptions } from "../../../utils/walletHelpers";
import { StepActions, StepTitle } from "./AccountStep";

type RecurringBillsStepProps = {
  accounts: Account[];
  billCount: number;
  categories: Category[];
  form: RecurringBillFormState;
  isSaving: boolean;
  onAdd: () => void;
  onBack: () => void;
  onChange: (changes: Partial<RecurringBillFormState>) => void;
  onContinue: () => void;
};

export function RecurringBillsStep({
  accounts,
  billCount,
  categories,
  form,
  isSaving,
  onAdd,
  onBack,
  onChange,
  onContinue,
}: RecurringBillsStepProps) {
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <StepTitle
        description="Recurring bills help you remember regular payments such as rent, internet, and subscriptions."
        icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />}
        title="Add recurring bills"
      />

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <FormField label="Bill name">
          {(id) => (
            <AppInput
              id={id}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Internet"
              value={form.name}
            />
          )}
        </FormField>
        <FormField label="Account">
          {(id) => (
            <AppSelect
              id={id}
              onChange={(event) => onChange({ accountId: event.target.value })}
              value={form.accountId}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </AppSelect>
          )}
        </FormField>
        <FormField label="Category">
          {(id) => (
            <AppSelect
              id={id}
              onChange={(event) => onChange({ categoryId: event.target.value })}
              value={form.categoryId}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </AppSelect>
          )}
        </FormField>
        <FormField label="Frequency">
          {(id) => (
            <AppSelect
              id={id}
              onChange={(event) => onChange({ frequency: event.target.value as RecurringFrequency })}
              value={form.frequency}
            >
              {recurringFrequencyOptions.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency}
                </option>
              ))}
            </AppSelect>
          )}
        </FormField>
        <FormField label="Amount">
          {(id) => (
            <AppInput
              id={id}
              inputMode="decimal"
              onChange={(event) => onChange({ amount: event.target.value })}
              placeholder="25.00"
              value={form.amount}
            />
          )}
        </FormField>
        <FormField label="Next due date">
          {(id) => (
            <AppInput
              id={id}
              onChange={(event) => onChange({ nextDueDate: event.target.value })}
              type="date"
              value={form.nextDueDate}
            />
          )}
        </FormField>
      </div>

      {billCount > 0 ? (
        <p className="rounded-app-sm border border-app-success/18 bg-app-success/8 p-3 text-sm font-semibold text-app-success">
          {billCount} recurring bill{billCount === 1 ? "" : "s"} added.
        </p>
      ) : null}

      <StepActions>
        <AppButton onClick={onBack} variant="ghost">
          Back
        </AppButton>
        <div className="flex flex-wrap gap-3">
          <AppButton disabled={isSaving} onClick={onContinue} variant="ghost">
            Skip for Now
          </AppButton>
          <AppButton
            disabled={isSaving || accounts.length === 0 || categories.length === 0}
            onClick={onAdd}
            variant="primary"
          >
            {isSaving ? "Saving..." : "Add Recurring Bill"}
          </AppButton>
          {billCount > 0 ? (
            <AppButton disabled={isSaving} onClick={onContinue} variant="secondary">
              Continue
            </AppButton>
          ) : null}
        </div>
      </StepActions>
    </div>
  );
}
