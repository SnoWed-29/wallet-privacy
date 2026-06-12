import { Check, ListChecks } from "lucide-react";
import { AppButton, AppInput, AppSelect } from "../../../components/ui";
import type { TransactionType } from "../../../types/wallet";
import { StepActions, StepTitle } from "./AccountStep";
import type { CategoryCreationResult } from "../types/onboarding.types";

export type RecommendedCategory = {
  name: string;
  categoryType: TransactionType;
};

type CategoriesStepProps = {
  customName: string;
  customType: TransactionType;
  isSaving: boolean;
  recommended: RecommendedCategory[];
  result: CategoryCreationResult | null;
  selected: string[];
  onAddCustom: () => void;
  onBack: () => void;
  onChangeCustomName: (value: string) => void;
  onChangeCustomType: (value: TransactionType) => void;
  onClearSelection: () => void;
  onContinue: () => void;
  onSelectAll: () => void;
  onSkip: () => void;
  onToggle: (key: string) => void;
};

export function categoryKey(category: RecommendedCategory) {
  return `${category.categoryType}:${category.name}`;
}

export function CategoriesStep({
  customName,
  customType,
  isSaving,
  recommended,
  result,
  selected,
  onAddCustom,
  onBack,
  onChangeCustomName,
  onChangeCustomType,
  onClearSelection,
  onContinue,
  onSelectAll,
  onSkip,
  onToggle,
}: CategoriesStepProps) {
  const incomeCategories = recommended.filter((category) => category.categoryType === "income");
  const expenseCategories = recommended.filter((category) => category.categoryType === "expense");
  const canContinue = result !== null && result.failed.length === 0;

  return (
    <div className="grid gap-6">
      <StepTitle
        description="Start with a few common categories, add your own, or skip this for later."
        icon={<ListChecks className="h-6 w-6" aria-hidden="true" />}
        title="Choose categories"
      />

      <section className="grid gap-4 rounded-app-sm border border-app-border bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-app-text">Recommended Categories</h2>
            <p className="mt-1 text-sm text-app-muted">
              Selected: <span className="font-extrabold text-app-text">{selected.length}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton disabled={isSaving} onClick={onSelectAll} variant="ghost">
              Select all
            </AppButton>
            <AppButton disabled={isSaving || selected.length === 0} onClick={onClearSelection} variant="ghost">
              Clear selection
            </AppButton>
          </div>
        </div>

        <CategoryGroup
          categories={incomeCategories}
          disabled={isSaving}
          label="Income"
          onToggle={onToggle}
          selected={selected}
        />
        <CategoryGroup
          categories={expenseCategories}
          disabled={isSaving}
          label="Expenses"
          onToggle={onToggle}
          selected={selected}
        />

        {result ? <CategoryResultPanel result={result} /> : null}
      </section>

      <section className="grid gap-3 rounded-app-sm border border-app-border bg-white p-4">
        <div>
          <h2 className="text-base font-extrabold text-app-text">Add a Custom Category</h2>
          <p className="mt-1 text-sm text-app-muted">
            Optional. This is separate from the recommended selections.
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_10rem_auto] gap-3 max-md:grid-cols-1">
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-slate-700">Custom category</span>
            <AppInput
              onChange={(event) => onChangeCustomName(event.target.value)}
              placeholder="Education"
              value={customName}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-slate-700">Type</span>
            <AppSelect
              onChange={(event) => onChangeCustomType(event.target.value as TransactionType)}
              value={customType}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </AppSelect>
          </label>
          <div className="flex items-end">
            <AppButton
              className="w-full"
              disabled={isSaving || !customName.trim()}
              onClick={onAddCustom}
              variant="secondary"
            >
              {isSaving ? "Saving..." : "Add Custom"}
            </AppButton>
          </div>
        </div>
      </section>

      <StepActions>
        <AppButton disabled={isSaving} onClick={onBack} variant="ghost">
          Back
        </AppButton>
        <div className="flex flex-wrap gap-3">
          <AppButton disabled={isSaving} onClick={onSkip} variant="ghost">
            Skip for Now
          </AppButton>
          <AppButton
            disabled={isSaving || (!canContinue && selected.length === 0)}
            onClick={onContinue}
            variant="primary"
          >
            {isSaving ? "Creating..." : canContinue ? "Continue" : "Create selected categories"}
          </AppButton>
        </div>
      </StepActions>
    </div>
  );
}

function CategoryGroup({
  categories,
  disabled,
  label,
  onToggle,
  selected,
}: {
  categories: RecommendedCategory[];
  disabled: boolean;
  label: string;
  onToggle: (key: string) => void;
  selected: string[];
}) {
  return (
    <div className="grid gap-2">
      <h3 className="m-0 text-sm font-extrabold uppercase tracking-wide text-app-muted">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const key = categoryKey(category);
          const checked = selected.includes(key);

          return (
            <button
              aria-pressed={checked}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                checked
                  ? "border-app-primary bg-emerald-50 text-app-text"
                  : "border-app-border bg-white text-slate-700 hover:bg-slate-50"
              }`}
              disabled={disabled}
              key={key}
              onClick={() => onToggle(key)}
              type="button"
            >
              {checked ? <Check className="h-4 w-4 text-app-primary" aria-hidden="true" /> : null}
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryResultPanel({ result }: { result: CategoryCreationResult }) {
  const hasFailures = result.failed.length > 0;

  return (
    <div
      className={`rounded-app-sm border p-3 text-sm ${
        hasFailures ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <p className="font-extrabold">Category result</p>
      <p className="mt-1">
        Created {result.created.length}, skipped {result.skipped.length}, failed {result.failed.length}.
      </p>
      {result.created.length ? <p className="mt-1">Created: {result.created.join(", ")}</p> : null}
      {result.skipped.length ? <p className="mt-1">Skipped existing: {result.skipped.join(", ")}</p> : null}
      {result.failed.length ? <p className="mt-1">Failed: {result.failed.join(", ")}</p> : null}
    </div>
  );
}
