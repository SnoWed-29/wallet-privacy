import { FormEvent, ReactNode } from "react";
import {
  CalendarClock,
  Pencil,
  PiggyBank,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { PageIntro } from "../../../components/layout/PageIntro";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  EmptyState,
  FormField,
  FormSection,
  IconButton,
  ProgressBar,
} from "../../../components/ui";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import type {
  Budget,
  RecurringBill,
  RecurringFrequency,
  SavingsGoal,
} from "../../../types/wallet";

export function PlanningPage() {
  const {
    createBudget,
    budgetForm,
    updateBudgetForm,
    expenseCategories,
    isSavingBudget,
    budgets,
    editingBudgetId,
    editBudget,
    updateBudget,
    updateEditBudget,
    isUpdatingBudget,
    cancelEditingBudget,
    formatMinor,
    formatPercentage,
    monthName,
    startEditingBudget,
    archiveBudget,
    archivingBudgetId,
    savingsGoalForm,
    createSavingsGoal,
    updateSavingsGoalForm,
    isSavingSavingsGoal,
    savingsGoals,
    savingsGoalContributions,
    accounts,
    editingSavingsGoalId,
    editSavingsGoal,
    updateSavingsGoal,
    updateEditSavingsGoal,
    isUpdatingSavingsGoal,
    cancelEditingSavingsGoal,
    updateSavingsGoalContribution,
    contributeToSavingsGoal,
    contributingSavingsGoalId,
    startEditingSavingsGoal,
    archiveSavingsGoal,
    archivingSavingsGoalId,
    recurringBillForm,
    createRecurringBill,
    updateRecurringBillForm,
    recurringFrequencyOptions,
    isSavingRecurringBill,
    recurringBills,
    editingRecurringBillId,
    editRecurringBill,
    updateRecurringBill,
    updateEditRecurringBill,
    isUpdatingRecurringBill,
    cancelEditingRecurringBill,
    markRecurringBillPaid,
    payingRecurringBillId,
    startEditingRecurringBill,
    archiveRecurringBill,
    archivingRecurringBillId,
    monthOptions,
  } = useWalletAppContext();

  const currentYear = new Date().getFullYear();
  const budgetYearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  return (
    <section className="grid gap-5">
      <PageIntro
        description="Plan ahead with budgets, recurring bills, and savings goals."
        title="Planning"
      />

      <AppCard
        description="Create monthly spending limits for one category, month, and year."
        id="budgets"
        title="Monthly Budgets"
        tone="strong"
      >
        <form className="grid gap-4" onSubmit={createBudget}>
          <FormSection>
            <div className="grid grid-cols-5 gap-3 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <FormField label="Budget">
                {(id) => (
                  <AppInput
                    id={id}
                    value={budgetForm.name}
                    onChange={(event) =>
                      updateBudgetForm({ name: event.target.value })
                    }
                    placeholder="Budget name"
                  />
                )}
              </FormField>
              <FormField label="Category">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={budgetForm.categoryId}
                    onChange={(event) =>
                      updateBudgetForm({ categoryId: event.target.value })
                    }
                  >
                    <option value="">Select expense category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </AppSelect>
                )}
              </FormField>
              <FormField label="Amount">
                {(id) => (
                  <AppInput
                    id={id}
                    value={budgetForm.amount}
                    onChange={(event) =>
                      updateBudgetForm({ amount: event.target.value })
                    }
                    inputMode="decimal"
                    placeholder="Amount"
                  />
                )}
              </FormField>
              <FormField label="Month">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={budgetForm.month}
                    onChange={(event) =>
                      updateBudgetForm({ month: event.target.value })
                    }
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
                    value={budgetForm.year}
                    onChange={(event) =>
                      updateBudgetForm({ year: event.target.value })
                    }
                  >
                    {budgetYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </AppSelect>
                )}
              </FormField>
            </div>
          </FormSection>
          <div className="flex justify-end">
            <AppButton
              type="submit"
              disabled={isSavingBudget || expenseCategories.length === 0}
              variant="primary"
            >
              {isSavingBudget ? "Creating..." : "Create Monthly Budget"}
            </AppButton>
          </div>
        </form>

        <div className="mt-5">
          {budgets.length === 0 ? (
            <EmptyState title="No budgets yet.">
              Monthly limits will appear here once created.
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {budgets.map((budget) =>
                editingBudgetId === budget.id && editBudget ? (
                  <BudgetEditForm
                    budget={budget}
                    budgetYearOptions={budgetYearOptions}
                    cancelEditingBudget={cancelEditingBudget}
                    expenseCategories={expenseCategories}
                    isUpdatingBudget={isUpdatingBudget}
                    key={budget.id}
                    monthOptions={monthOptions}
                    updateBudget={updateBudget}
                    updateEditBudget={updateEditBudget}
                    editBudget={editBudget}
                  />
                ) : (
                  <BudgetCard
                    archivingBudgetId={archivingBudgetId}
                    archiveBudget={archiveBudget}
                    budget={budget}
                    formatMinor={formatMinor}
                    formatPercentage={formatPercentage}
                    key={budget.id}
                    monthName={monthName}
                    startEditingBudget={startEditingBudget}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </AppCard>

      <AppCard id="savings-goals" title="Savings Goals" tone="strong">
        <form className="grid gap-4" onSubmit={createSavingsGoal}>
          <FormSection>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <FormField label="Goal">
                {(id) => (
                  <AppInput
                    id={id}
                    value={savingsGoalForm.name}
                    onChange={(event) =>
                      updateSavingsGoalForm({ name: event.target.value })
                    }
                    placeholder="Goal name"
                  />
                )}
              </FormField>
              <FormField label="Target">
                {(id) => (
                  <AppInput
                    id={id}
                    value={savingsGoalForm.targetAmount}
                    onChange={(event) =>
                      updateSavingsGoalForm({ targetAmount: event.target.value })
                    }
                    inputMode="decimal"
                    placeholder="Target amount"
                  />
                )}
              </FormField>
              <FormField label="Current">
                {(id) => (
                  <AppInput
                    id={id}
                    value={savingsGoalForm.currentAmount}
                    onChange={(event) =>
                      updateSavingsGoalForm({ currentAmount: event.target.value })
                    }
                    inputMode="decimal"
                    placeholder="Current amount"
                  />
                )}
              </FormField>
              <FormField label="Deadline">
                {(id) => (
                  <AppInput
                    id={id}
                    type="date"
                    value={savingsGoalForm.deadlineDate}
                    onChange={(event) =>
                      updateSavingsGoalForm({ deadlineDate: event.target.value })
                    }
                  />
                )}
              </FormField>
            </div>
          </FormSection>
          <div className="flex justify-end">
            <AppButton type="submit" disabled={isSavingSavingsGoal} variant="primary">
              {isSavingSavingsGoal ? "Creating..." : "Create Savings Goal"}
            </AppButton>
          </div>
        </form>

        <div className="mt-5">
          {savingsGoals.length === 0 ? (
            <EmptyState title="No savings goals yet.">
              Goals and contributions will appear here once created.
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {savingsGoals.map((goal) => {
                const contribution = savingsGoalContributions[goal.id] ?? {
                  accountId: accounts[0]?.id ?? "",
                  amount: "",
                };

                return editingSavingsGoalId === goal.id && editSavingsGoal ? (
                  <SavingsGoalEditForm
                    cancelEditingSavingsGoal={cancelEditingSavingsGoal}
                    editSavingsGoal={editSavingsGoal}
                    goal={goal}
                    isUpdatingSavingsGoal={isUpdatingSavingsGoal}
                    key={goal.id}
                    updateEditSavingsGoal={updateEditSavingsGoal}
                    updateSavingsGoal={updateSavingsGoal}
                  />
                ) : (
                  <SavingsGoalCard
                    accounts={accounts}
                    archiveSavingsGoal={archiveSavingsGoal}
                    archivingSavingsGoalId={archivingSavingsGoalId}
                    contributeToSavingsGoal={contributeToSavingsGoal}
                    contributingSavingsGoalId={contributingSavingsGoalId}
                    contribution={contribution}
                    formatMinor={formatMinor}
                    goal={goal}
                    key={goal.id}
                    startEditingSavingsGoal={startEditingSavingsGoal}
                    updateSavingsGoalContribution={updateSavingsGoalContribution}
                  />
                );
              })}
            </div>
          )}
        </div>
      </AppCard>

      <AppCard id="bills" title="Recurring Bills" tone="strong">
        <form className="grid gap-4" onSubmit={createRecurringBill}>
          <FormSection>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <FormField label="Bill">
                {(id) => (
                  <AppInput
                    id={id}
                    value={recurringBillForm.name}
                    onChange={(event) =>
                      updateRecurringBillForm({ name: event.target.value })
                    }
                    placeholder="Bill name"
                  />
                )}
              </FormField>
              <FormField label="Account">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={recurringBillForm.accountId}
                    onChange={(event) =>
                      updateRecurringBillForm({ accountId: event.target.value })
                    }
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
                    value={recurringBillForm.categoryId}
                    onChange={(event) =>
                      updateRecurringBillForm({ categoryId: event.target.value })
                    }
                  >
                    <option value="">Select expense category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </AppSelect>
                )}
              </FormField>
              <FormField label="Amount">
                {(id) => (
                  <AppInput
                    id={id}
                    value={recurringBillForm.amount}
                    onChange={(event) =>
                      updateRecurringBillForm({ amount: event.target.value })
                    }
                    inputMode="decimal"
                    placeholder="Amount"
                  />
                )}
              </FormField>
              <FormField label="Frequency">
                {(id) => (
                  <AppSelect
                    id={id}
                    value={recurringBillForm.frequency}
                    onChange={(event) =>
                      updateRecurringBillForm({
                        frequency: event.target.value as RecurringFrequency,
                      })
                    }
                  >
                    {recurringFrequencyOptions.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {frequency}
                      </option>
                    ))}
                  </AppSelect>
                )}
              </FormField>
              <FormField label="Next due">
                {(id) => (
                  <AppInput
                    id={id}
                    type="date"
                    value={recurringBillForm.nextDueDate}
                    onChange={(event) =>
                      updateRecurringBillForm({ nextDueDate: event.target.value })
                    }
                  />
                )}
              </FormField>
              <FormField className="xl:col-span-2" label="Description">
                {(id) => (
                  <AppInput
                    id={id}
                    value={recurringBillForm.description}
                    onChange={(event) =>
                      updateRecurringBillForm({ description: event.target.value })
                    }
                    placeholder="Description"
                  />
                )}
              </FormField>
            </div>
          </FormSection>
          <div className="flex justify-end">
            <AppButton
              type="submit"
              disabled={
                isSavingRecurringBill ||
                accounts.length === 0 ||
                expenseCategories.length === 0
              }
              variant="primary"
            >
              {isSavingRecurringBill ? "Creating..." : "Add Recurring Bill"}
            </AppButton>
          </div>
        </form>

        <div className="mt-5">
          {recurringBills.length === 0 ? (
            <EmptyState title="No recurring bills yet.">
              Regular payments will appear here once added.
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {recurringBills.map((bill) =>
                editingRecurringBillId === bill.id && editRecurringBill ? (
                  <RecurringBillEditForm
                    accounts={accounts}
                    bill={bill}
                    cancelEditingRecurringBill={cancelEditingRecurringBill}
                    editRecurringBill={editRecurringBill}
                    expenseCategories={expenseCategories}
                    isUpdatingRecurringBill={isUpdatingRecurringBill}
                    key={bill.id}
                    recurringFrequencyOptions={recurringFrequencyOptions}
                    updateEditRecurringBill={updateEditRecurringBill}
                    updateRecurringBill={updateRecurringBill}
                  />
                ) : (
                  <RecurringBillCard
                    archiveRecurringBill={archiveRecurringBill}
                    archivingRecurringBillId={archivingRecurringBillId}
                    bill={bill}
                    formatMinor={formatMinor}
                    key={bill.id}
                    markRecurringBillPaid={markRecurringBillPaid}
                    payingRecurringBillId={payingRecurringBillId}
                    startEditingRecurringBill={startEditingRecurringBill}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </AppCard>
    </section>
  );
}

function PlanItem({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <article className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4 shadow-app-soft">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-app-sm bg-app-primary/10 text-app-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-card text-app-text">{title}</h3>
          {children}
        </div>
      </div>
    </article>
  );
}

function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-2">{children}</div>;
}

function BudgetCard({
  archivingBudgetId,
  archiveBudget,
  budget,
  formatMinor,
  formatPercentage,
  monthName,
  startEditingBudget,
}: {
  archivingBudgetId: string;
  archiveBudget: (id: string) => void;
  budget: Budget;
  formatMinor: (value: number) => string;
  formatPercentage: (value: number) => string;
  monthName: (month: number) => string;
  startEditingBudget: (budget: Budget) => void;
}) {
  const status = budget.isExceeded
    ? "Exceeded"
    : budget.isNearLimit
      ? "Near limit"
      : "On track";

  return (
    <PlanItem
      icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
      title={`${budget.name} - ${budget.categoryName}`}
    >
      <div className="mt-2 grid gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-app-muted">
          <span>
            {monthName(budget.month)} {budget.year}
          </span>
          <AppBadge
            variant={
              budget.isExceeded ? "expense" : budget.isNearLimit ? "warning" : "success"
            }
          >
            {status}
          </AppBadge>
        </div>
        <ProgressBar
          tone={budget.isExceeded ? "expense" : budget.isNearLimit ? "warning" : "primary"}
          value={budget.progressPercentage}
        />
        <div className="grid grid-cols-4 gap-2 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
          <Metric label="Budget" value={formatMinor(budget.amountMinor)} />
          <Metric label="Spent" value={formatMinor(budget.spentMinor)} />
          <Metric label="Remaining" value={formatMinor(budget.remainingMinor)} />
          <Metric label="Used" value={formatPercentage(budget.progressPercentage)} />
        </div>
        <ActionRow>
          <IconButton
            icon={Pencil}
            label="Edit budget"
            onClick={() => startEditingBudget(budget)}
          />
          <IconButton
            disabled={archivingBudgetId === budget.id}
            icon={Trash2}
            label={archivingBudgetId === budget.id ? "Archiving budget" : "Archive budget"}
            onClick={() => archiveBudget(budget.id)}
            tone="danger"
          />
        </ActionRow>
      </div>
    </PlanItem>
  );
}

function BudgetEditForm({
  budget,
  budgetYearOptions,
  cancelEditingBudget,
  editBudget,
  expenseCategories,
  isUpdatingBudget,
  monthOptions,
  updateBudget,
  updateEditBudget,
}: {
  budget: Budget;
  budgetYearOptions: number[];
  cancelEditingBudget: () => void;
  editBudget: {
    name: string;
    categoryId: string;
    amount: string;
    month: string;
    year: string;
  };
  expenseCategories: Array<{ id: string; name: string }>;
  isUpdatingBudget: boolean;
  monthOptions: Array<{ value: string; label: string }>;
  updateBudget: (event: FormEvent<HTMLFormElement>, budget: Budget) => void;
  updateEditBudget: (changes: Partial<typeof editBudget>) => void;
}) {
  return (
    <form
      className="rounded-app-sm border border-app-primary/15 bg-white/54 p-4"
      onSubmit={(event) => updateBudget(event, budget)}
    >
      <div className="grid grid-cols-5 gap-3 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <AppInput
          value={editBudget.name}
          onChange={(event) => updateEditBudget({ name: event.target.value })}
          placeholder="Budget name"
        />
        <AppSelect
          value={editBudget.categoryId}
          onChange={(event) => updateEditBudget({ categoryId: event.target.value })}
        >
          <option value="">Select expense category</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </AppSelect>
        <AppInput
          value={editBudget.amount}
          onChange={(event) => updateEditBudget({ amount: event.target.value })}
          inputMode="decimal"
          placeholder="Amount"
        />
        <AppSelect
          value={editBudget.month}
          onChange={(event) => updateEditBudget({ month: event.target.value })}
        >
          {monthOptions.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </AppSelect>
        <AppSelect
          value={editBudget.year}
          onChange={(event) => updateEditBudget({ year: event.target.value })}
        >
          {budgetYearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </AppSelect>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <AppButton type="submit" disabled={isUpdatingBudget} variant="primary">
          {isUpdatingBudget ? "Saving..." : "Save Monthly Budget"}
        </AppButton>
        <AppButton type="button" onClick={cancelEditingBudget} variant="ghost">
          Cancel
        </AppButton>
      </div>
    </form>
  );
}

function SavingsGoalCard({
  accounts,
  archiveSavingsGoal,
  archivingSavingsGoalId,
  contributeToSavingsGoal,
  contributingSavingsGoalId,
  contribution,
  formatMinor,
  goal,
  startEditingSavingsGoal,
  updateSavingsGoalContribution,
}: {
  accounts: Array<{ id: string; name: string }>;
  archiveSavingsGoal: (id: string) => void;
  archivingSavingsGoalId: string;
  contributeToSavingsGoal: (goal: SavingsGoal) => void;
  contributingSavingsGoalId: string;
  contribution: { accountId: string; amount: string };
  formatMinor: (value: number) => string;
  goal: SavingsGoal;
  startEditingSavingsGoal: (goal: SavingsGoal) => void;
  updateSavingsGoalContribution: (
    id: string,
    changes: Partial<{ accountId: string; amount: string }>,
  ) => void;
}) {
  return (
    <PlanItem
      icon={<PiggyBank className="h-5 w-5" aria-hidden="true" />}
      title={goal.name}
    >
      <div className="mt-2 grid gap-3">
        <ProgressBar value={goal.progressPercent} />
        <div className="grid grid-cols-4 gap-2 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
          <Metric label="Target" value={formatMinor(goal.targetAmountMinor)} />
          <Metric label="Current" value={formatMinor(goal.currentAmountMinor)} />
          <Metric label="Remaining" value={formatMinor(goal.remainingAmountMinor)} />
          <Metric label="Progress" value={`${goal.progressPercent}%`} />
        </div>
        {goal.deadlineDate ? (
          <p className="text-sm text-app-muted">Deadline {goal.deadlineDate}</p>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 max-md:grid-cols-1">
          <AppSelect
            value={contribution.accountId}
            onChange={(event) =>
              updateSavingsGoalContribution(goal.id, {
                accountId: event.target.value,
              })
            }
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </AppSelect>
          <AppInput
            value={contribution.amount}
            onChange={(event) =>
              updateSavingsGoalContribution(goal.id, {
                amount: event.target.value,
              })
            }
            inputMode="decimal"
            placeholder="Contribution amount"
          />
          <AppButton
            type="button"
            onClick={() => contributeToSavingsGoal(goal)}
            disabled={contributingSavingsGoalId === goal.id || accounts.length === 0}
            variant="primary"
          >
            {contributingSavingsGoalId === goal.id ? "Contributing..." : "Contribute"}
          </AppButton>
        </div>
        <ActionRow>
          <IconButton
            icon={Pencil}
            label="Edit savings goal"
            onClick={() => startEditingSavingsGoal(goal)}
          />
          <IconButton
            disabled={archivingSavingsGoalId === goal.id}
            icon={Trash2}
            label={
              archivingSavingsGoalId === goal.id
                ? "Archiving savings goal"
                : "Archive savings goal"
            }
            onClick={() => archiveSavingsGoal(goal.id)}
            tone="danger"
          />
        </ActionRow>
      </div>
    </PlanItem>
  );
}

function SavingsGoalEditForm({
  cancelEditingSavingsGoal,
  editSavingsGoal,
  goal,
  isUpdatingSavingsGoal,
  updateEditSavingsGoal,
  updateSavingsGoal,
}: {
  cancelEditingSavingsGoal: () => void;
  editSavingsGoal: {
    name: string;
    targetAmount: string;
    currentAmount: string;
    deadlineDate: string;
  };
  goal: SavingsGoal;
  isUpdatingSavingsGoal: boolean;
  updateEditSavingsGoal: (changes: Partial<typeof editSavingsGoal>) => void;
  updateSavingsGoal: (event: FormEvent<HTMLFormElement>, goal: SavingsGoal) => void;
}) {
  return (
    <form
      className="rounded-app-sm border border-app-primary/15 bg-white/54 p-4"
      onSubmit={(event) => updateSavingsGoal(event, goal)}
    >
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <AppInput
          value={editSavingsGoal.name}
          onChange={(event) => updateEditSavingsGoal({ name: event.target.value })}
          placeholder="Goal name"
        />
        <AppInput
          value={editSavingsGoal.targetAmount}
          onChange={(event) =>
            updateEditSavingsGoal({ targetAmount: event.target.value })
          }
          inputMode="decimal"
          placeholder="Target amount"
        />
        <AppInput
          value={editSavingsGoal.currentAmount}
          onChange={(event) =>
            updateEditSavingsGoal({ currentAmount: event.target.value })
          }
          inputMode="decimal"
          placeholder="Current amount"
        />
        <AppInput
          type="date"
          value={editSavingsGoal.deadlineDate}
          onChange={(event) =>
            updateEditSavingsGoal({ deadlineDate: event.target.value })
          }
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <AppButton type="submit" disabled={isUpdatingSavingsGoal} variant="primary">
          {isUpdatingSavingsGoal ? "Saving..." : "Save"}
        </AppButton>
        <AppButton type="button" onClick={cancelEditingSavingsGoal} variant="ghost">
          Cancel
        </AppButton>
      </div>
    </form>
  );
}

function RecurringBillCard({
  archiveRecurringBill,
  archivingRecurringBillId,
  bill,
  formatMinor,
  markRecurringBillPaid,
  payingRecurringBillId,
  startEditingRecurringBill,
}: {
  archiveRecurringBill: (id: string) => void;
  archivingRecurringBillId: string;
  bill: RecurringBill;
  formatMinor: (value: number) => string;
  markRecurringBillPaid: (id: string) => void;
  payingRecurringBillId: string;
  startEditingRecurringBill: (bill: RecurringBill) => void;
}) {
  return (
    <PlanItem
      icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
      title={`${bill.name} - ${formatMinor(bill.amountMinor)}`}
    >
      <div className="mt-2 grid gap-3">
        <div className="flex flex-wrap gap-2 text-sm text-app-muted">
          <AppBadge variant="peach">{bill.frequency}</AppBadge>
          <span>Next due {bill.nextDueDate}</span>
          <span>Last paid {bill.lastPaidDate ?? "Never"}</span>
          <span>{bill.categoryName}</span>
          <span>{bill.accountName}</span>
        </div>
        {bill.description ? (
          <p className="text-sm leading-6 text-app-muted">{bill.description}</p>
        ) : null}
        <ActionRow>
          <AppButton
            type="button"
            onClick={() => markRecurringBillPaid(bill.id)}
            disabled={payingRecurringBillId === bill.id}
            variant="secondary"
          >
            {payingRecurringBillId === bill.id ? "Paying..." : "Mark paid"}
          </AppButton>
          <IconButton
            icon={Pencil}
            label="Edit recurring bill"
            onClick={() => startEditingRecurringBill(bill)}
          />
          <IconButton
            disabled={archivingRecurringBillId === bill.id}
            icon={Trash2}
            label={
              archivingRecurringBillId === bill.id
                ? "Archiving recurring bill"
                : "Archive recurring bill"
            }
            onClick={() => archiveRecurringBill(bill.id)}
            tone="danger"
          />
        </ActionRow>
      </div>
    </PlanItem>
  );
}

function RecurringBillEditForm({
  accounts,
  bill,
  cancelEditingRecurringBill,
  editRecurringBill,
  expenseCategories,
  isUpdatingRecurringBill,
  recurringFrequencyOptions,
  updateEditRecurringBill,
  updateRecurringBill,
}: {
  accounts: Array<{ id: string; name: string }>;
  bill: RecurringBill;
  cancelEditingRecurringBill: () => void;
  editRecurringBill: {
    name: string;
    accountId: string;
    categoryId: string;
    amount: string;
    frequency: RecurringFrequency;
    nextDueDate: string;
    description: string;
  };
  expenseCategories: Array<{ id: string; name: string }>;
  isUpdatingRecurringBill: boolean;
  recurringFrequencyOptions: RecurringFrequency[];
  updateEditRecurringBill: (changes: Partial<typeof editRecurringBill>) => void;
  updateRecurringBill: (
    event: FormEvent<HTMLFormElement>,
    bill: RecurringBill,
  ) => void;
}) {
  return (
    <form
      className="rounded-app-sm border border-app-primary/15 bg-white/54 p-4"
      onSubmit={(event) => updateRecurringBill(event, bill)}
    >
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <AppInput
          value={editRecurringBill.name}
          onChange={(event) =>
            updateEditRecurringBill({ name: event.target.value })
          }
          placeholder="Bill name"
        />
        <AppSelect
          value={editRecurringBill.accountId}
          onChange={(event) =>
            updateEditRecurringBill({ accountId: event.target.value })
          }
        >
          <option value="">Select account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </AppSelect>
        <AppSelect
          value={editRecurringBill.categoryId}
          onChange={(event) =>
            updateEditRecurringBill({ categoryId: event.target.value })
          }
        >
          <option value="">Select expense category</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </AppSelect>
        <AppInput
          value={editRecurringBill.amount}
          onChange={(event) =>
            updateEditRecurringBill({ amount: event.target.value })
          }
          inputMode="decimal"
          placeholder="Amount"
        />
        <AppSelect
          value={editRecurringBill.frequency}
          onChange={(event) =>
            updateEditRecurringBill({
              frequency: event.target.value as RecurringFrequency,
            })
          }
        >
          {recurringFrequencyOptions.map((frequency) => (
            <option key={frequency} value={frequency}>
              {frequency}
            </option>
          ))}
        </AppSelect>
        <AppInput
          type="date"
          value={editRecurringBill.nextDueDate}
          onChange={(event) =>
            updateEditRecurringBill({ nextDueDate: event.target.value })
          }
        />
        <AppInput
          value={editRecurringBill.description}
          onChange={(event) =>
            updateEditRecurringBill({ description: event.target.value })
          }
          placeholder="Description"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <AppButton type="submit" disabled={isUpdatingRecurringBill} variant="primary">
          {isUpdatingRecurringBill ? "Saving..." : "Save"}
        </AppButton>
        <AppButton type="button" onClick={cancelEditingRecurringBill} variant="ghost">
          Cancel
        </AppButton>
      </div>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-app-xs border border-[rgba(60,38,52,0.08)] bg-white/44 p-3">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
        {label}
      </p>
      <p className="mt-1 font-semibold text-app-text">{value}</p>
    </div>
  );
}
