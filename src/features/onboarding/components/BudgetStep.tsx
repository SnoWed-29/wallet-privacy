import { Landmark } from "lucide-react";
import { AppButton, AppInput, AppSelect, FormField } from "../../../components/ui";
import type { Category } from "../../../types/wallet";
import type { BudgetFormState } from "../../../types/wallet";
import { StepActions, StepTitle } from "./AccountStep";

type BudgetStepProps = {
  budgetCount: number;
  categories: Category[];
  form: BudgetFormState;
  isSaving: boolean;
  monthOptions: Array<{ value: string; label: string }>;
  onAdd: () => void;
  onBack: () => void;
  onChange: (changes: Partial<BudgetFormState>) => void;
  onContinue: () => void;
};

export function BudgetStep({
  budgetCount,
  categories,
  form,
  isSaving,
  monthOptions,
  onAdd,
  onBack,
  onChange,
  onContinue,
}: BudgetStepProps) {
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <StepTitle
        description="Monthly budgets help you watch spending. You can skip this and add budgets later."
        icon={<Landmark className="h-6 w-6" aria-hidden="true" />}
        title="Add a monthly budget"
      />

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <FormField label="Budget name">
          {(id) => (
            <AppInput
              id={id}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Food budget"
              value={form.name}
            />
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
        <FormField label="Month">
          {(id) => (
            <AppSelect
              id={id}
              onChange={(event) => onChange({ month: event.target.value })}
              value={form.month}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </AppSelect>
          )}
        </FormField>
        <FormField label="Year">
          {(id) => (
            <AppSelect
              id={id}
              onChange={(event) => onChange({ year: event.target.value })}
              value={form.year}
            >
              {[year - 1, year, year + 1].map((option) => (
                <option key={option} value={String(option)}>
                  {option}
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
              placeholder="500.00"
              value={form.amount}
            />
          )}
        </FormField>
      </div>

      {budgetCount > 0 ? (
        <p className="rounded-app-sm border border-app-success/18 bg-app-success/8 p-3 text-sm font-semibold text-app-success">
          {budgetCount} monthly budget{budgetCount === 1 ? "" : "s"} added.
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
          <AppButton disabled={isSaving || categories.length === 0} onClick={onAdd} variant="primary">
            {isSaving ? "Saving..." : "Add Monthly Budget"}
          </AppButton>
          {budgetCount > 0 ? (
            <AppButton disabled={isSaving} onClick={onContinue} variant="secondary">
              Continue
            </AppButton>
          ) : null}
        </div>
      </StepActions>
    </div>
  );
}
