import { Landmark } from "lucide-react";
import { AppButton, AppInput, AppSelect } from "../../../components/ui";
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
    <div className="grid max-w-3xl gap-5">
      <StepTitle
        description="Monthly budgets help you watch spending. You can skip this and add budgets later."
        icon={<Landmark className="h-6 w-6" aria-hidden="true" />}
        title="Add a monthly budget"
      />

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Budget name</span>
          <AppInput
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Food budget"
            value={form.name}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Category</span>
          <AppSelect
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
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Month</span>
          <AppSelect onChange={(event) => onChange({ month: event.target.value })} value={form.month}>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </AppSelect>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Year</span>
          <AppSelect onChange={(event) => onChange({ year: event.target.value })} value={form.year}>
            {[year - 1, year, year + 1].map((option) => (
              <option key={option} value={String(option)}>
                {option}
              </option>
            ))}
          </AppSelect>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-700">Amount</span>
          <AppInput
            inputMode="decimal"
            onChange={(event) => onChange({ amount: event.target.value })}
            placeholder="500.00"
            value={form.amount}
          />
        </label>
      </div>

      {budgetCount > 0 ? (
        <p className="rounded-app-sm border border-emerald-200 bg-emerald-50 p-3 text-sm font-extrabold text-emerald-900">
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
