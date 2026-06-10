import { PageIntro } from "../../../components/layout/PageIntro";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import type { RecurringFrequency } from "../../../types/wallet";

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
    <>
              <PageIntro
                description="Plan ahead with budgets, recurring bills, and savings goals."
                title="Planning"
              />
<section className="list-section" id="budgets">
          <h2>Monthly Budgets</h2>
          <p className="empty">
            Create monthly spending limits for one category, month, and year.
          </p>
          <form className="simple-form" onSubmit={createBudget}>
            <div className="form-grid">
              <input
                value={budgetForm.name}
                onChange={(event) =>
                  updateBudgetForm({ name: event.target.value })
                }
                placeholder="Budget name"
              />
              <select
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
              </select>
              <input
                value={budgetForm.amount}
                onChange={(event) =>
                  updateBudgetForm({ amount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Amount"
              />
              <select
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
              </select>
              <select


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


              </select>
              <button
                type="submit"
                disabled={isSavingBudget || expenseCategories.length === 0}
              >
                {isSavingBudget ? "Creating..." : "Create Monthly Budget"}
              </button>
            </div>
          </form>

          {budgets.length === 0 ? (
            <p className="empty">No budgets yet.</p>
          ) : (
            <ul className="simple-list">
              {budgets.map((budget) => (
                <li key={budget.id}>
                  {editingBudgetId === budget.id && editBudget ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => updateBudget(event, budget)}
                    >
                      <input
                        value={editBudget.name}
                        onChange={(event) =>
                          updateEditBudget({ name: event.target.value })
                        }
                        placeholder="Budget name"
                      />
                      <select
                        value={editBudget.categoryId}
                        onChange={(event) =>
                          updateEditBudget({ categoryId: event.target.value })
                        }
                      >
                        <option value="">Select expense category</option>
                        {expenseCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editBudget.amount}
                        onChange={(event) =>
                          updateEditBudget({ amount: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="Amount"
                      />
                      <select
                        value={editBudget.month}
                        onChange={(event) =>
                          updateEditBudget({ month: event.target.value })
                        }
                      >
                        {monthOptions.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <select


                        value={editBudget.year}


                        onChange={(event) =>


                          updateEditBudget({ year: event.target.value })


                        }


                      >


                        {budgetYearOptions.map((year) => (


                          <option key={year} value={year}>


                            {year}


                          </option>


                        ))}


                      </select>
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingBudget}>
                          {isUpdatingBudget ? "Saving..." : "Save Monthly Budget"}
                        </button>
                        <button type="button" onClick={cancelEditingBudget}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>
                          {budget.name} - {budget.categoryName}
                        </span>
                        <small>
                          {monthName(budget.month)} {budget.year} - Budget{" "}
                          {formatMinor(budget.amountMinor)} - Spent{" "}
                          {formatMinor(budget.spentMinor)} - Remaining{" "}
                          {formatMinor(budget.remainingMinor)} -{" "}
                          {formatPercentage(budget.progressPercentage)}
                          {budget.isExceeded
                            ? " - Exceeded"
                            : budget.isNearLimit
                              ? " - Near limit"
                              : ""}
                        </small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => startEditingBudget(budget)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveBudget(budget.id)}
                          disabled={archivingBudgetId === budget.id}
                        >
                          {archivingBudgetId === budget.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="list-section" id="savings-goals">
          <h2>Savings Goals</h2>
          <form className="simple-form" onSubmit={createSavingsGoal}>
            <div className="form-grid">
              <input
                value={savingsGoalForm.name}
                onChange={(event) =>
                  updateSavingsGoalForm({ name: event.target.value })
                }
                placeholder="Goal name"
              />
              <input
                value={savingsGoalForm.targetAmount}
                onChange={(event) =>
                  updateSavingsGoalForm({ targetAmount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Target amount"
              />
              <input
                value={savingsGoalForm.currentAmount}
                onChange={(event) =>
                  updateSavingsGoalForm({ currentAmount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Current amount"
              />
              <input
                type="date"
                value={savingsGoalForm.deadlineDate}
                onChange={(event) =>
                  updateSavingsGoalForm({ deadlineDate: event.target.value })
                }
              />
              <button type="submit" disabled={isSavingSavingsGoal}>
                {isSavingSavingsGoal ? "Creating..." : "Create Savings Goal"}
              </button>
            </div>
          </form>

          {savingsGoals.length === 0 ? (
            <p className="empty">No savings goals yet.</p>
          ) : (
            <ul className="simple-list">
              {savingsGoals.map((goal) => {
                const contribution = savingsGoalContributions[goal.id] ?? {
                  accountId: accounts[0]?.id ?? "",
                  amount: "",
                };

                return (
                  <li key={goal.id}>
                    {editingSavingsGoalId === goal.id && editSavingsGoal ? (
                      <form
                        className="edit-form"
                        onSubmit={(event) => updateSavingsGoal(event, goal)}
                      >
                        <input
                          value={editSavingsGoal.name}
                          onChange={(event) =>
                            updateEditSavingsGoal({ name: event.target.value })
                          }
                          placeholder="Goal name"
                        />
                        <input
                          value={editSavingsGoal.targetAmount}
                          onChange={(event) =>
                            updateEditSavingsGoal({
                              targetAmount: event.target.value,
                            })
                          }
                          inputMode="decimal"
                          placeholder="Target amount"
                        />
                        <input
                          value={editSavingsGoal.currentAmount}
                          onChange={(event) =>
                            updateEditSavingsGoal({
                              currentAmount: event.target.value,
                            })
                          }
                          inputMode="decimal"
                          placeholder="Current amount"
                        />
                        <input
                          type="date"
                          value={editSavingsGoal.deadlineDate}
                          onChange={(event) =>
                            updateEditSavingsGoal({
                              deadlineDate: event.target.value,
                            })
                          }
                        />
                        <div className="button-row">
                          <button
                            type="submit"
                            disabled={isUpdatingSavingsGoal}
                          >
                            {isUpdatingSavingsGoal ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingSavingsGoal}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <span>{goal.name}</span>
                          <small>
                            Target {formatMinor(goal.targetAmountMinor)} -
                            Current {formatMinor(goal.currentAmountMinor)} -
                            Remaining {formatMinor(goal.remainingAmountMinor)} -
                            {goal.progressPercent}%
                            {goal.deadlineDate
                              ? ` - Deadline ${goal.deadlineDate}`
                              : ""}
                          </small>
                        </div>
                        <div className="form-grid">
                          <select
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
                          </select>
                          <input
                            value={contribution.amount}
                            onChange={(event) =>
                              updateSavingsGoalContribution(goal.id, {
                                amount: event.target.value,
                              })
                            }
                            inputMode="decimal"
                            placeholder="Contribution amount"
                          />
                          <button
                            type="button"
                            onClick={() => contributeToSavingsGoal(goal)}
                            disabled={
                              contributingSavingsGoalId === goal.id ||
                              accounts.length === 0
                            }
                          >
                            {contributingSavingsGoalId === goal.id
                              ? "Contributing..."
                              : "Contribute"}
                          </button>
                        </div>
                        <div className="button-row">
                          <button
                            type="button"
                            onClick={() => startEditingSavingsGoal(goal)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveSavingsGoal(goal.id)}
                            disabled={archivingSavingsGoalId === goal.id}
                          >
                            {archivingSavingsGoalId === goal.id
                              ? "Archiving..."
                              : "Archive"}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="list-section" id="bills">
          <h2>Recurring Bills</h2>
          <form className="simple-form" onSubmit={createRecurringBill}>
            <div className="form-grid">
              <input
                value={recurringBillForm.name}
                onChange={(event) =>
                  updateRecurringBillForm({ name: event.target.value })
                }
                placeholder="Bill name"
              />
              <select
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
              </select>
              <select
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
              </select>
              <input
                value={recurringBillForm.amount}
                onChange={(event) =>
                  updateRecurringBillForm({ amount: event.target.value })
                }
                inputMode="decimal"
                placeholder="Amount"
              />
              <select
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
              </select>
              <input
                type="date"
                value={recurringBillForm.nextDueDate}
                onChange={(event) =>
                  updateRecurringBillForm({ nextDueDate: event.target.value })
                }
              />
              <input
                value={recurringBillForm.description}
                onChange={(event) =>
                  updateRecurringBillForm({ description: event.target.value })
                }
                placeholder="Description"
              />
              <button
                type="submit"
                disabled={
                  isSavingRecurringBill ||
                  accounts.length === 0 ||
                  expenseCategories.length === 0
                }
              >
                {isSavingRecurringBill ? "Creating..." : "Add Recurring Bill"}
              </button>
            </div>
          </form>

          {recurringBills.length === 0 ? (
            <p className="empty">No recurring bills yet.</p>
          ) : (
            <ul className="simple-list">
              {recurringBills.map((bill) => (
                <li key={bill.id}>
                  {editingRecurringBillId === bill.id && editRecurringBill ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => updateRecurringBill(event, bill)}
                    >
                      <input
                        value={editRecurringBill.name}
                        onChange={(event) =>
                          updateEditRecurringBill({ name: event.target.value })
                        }
                        placeholder="Bill name"
                      />
                      <select
                        value={editRecurringBill.accountId}
                        onChange={(event) =>
                          updateEditRecurringBill({
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
                      </select>
                      <select
                        value={editRecurringBill.categoryId}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            categoryId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select expense category</option>
                        {expenseCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editRecurringBill.amount}
                        onChange={(event) =>
                          updateEditRecurringBill({ amount: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="Amount"
                      />
                      <select
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
                      </select>
                      <input
                        type="date"
                        value={editRecurringBill.nextDueDate}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            nextDueDate: event.target.value,
                          })
                        }
                      />
                      <input
                        value={editRecurringBill.description}
                        onChange={(event) =>
                          updateEditRecurringBill({
                            description: event.target.value,
                          })
                        }
                        placeholder="Description"
                      />
                      <div className="button-row">
                        <button type="submit" disabled={isUpdatingRecurringBill}>
                          {isUpdatingRecurringBill ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditingRecurringBill}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span>
                          {bill.name} - {formatMinor(bill.amountMinor)}
                        </span>
                        <small>
                          {bill.frequency} - Next due {bill.nextDueDate} - Last
                          paid {bill.lastPaidDate ?? "Never"} -{" "}
                          {bill.categoryName} - {bill.accountName}
                          {bill.description ? ` - ${bill.description}` : ""}
                        </small>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => markRecurringBillPaid(bill.id)}
                          disabled={payingRecurringBillId === bill.id}
                        >
                          {payingRecurringBillId === bill.id
                            ? "Paying..."
                            : "Mark paid"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingRecurringBill(bill)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveRecurringBill(bill.id)}
                          disabled={archivingRecurringBillId === bill.id}
                        >
                          {archivingRecurringBillId === bill.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

            </>
  );
}
