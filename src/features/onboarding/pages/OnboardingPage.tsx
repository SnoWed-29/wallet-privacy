import { invoke } from "@tauri-apps/api/core";
import { type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ui";
import { ImportWorkflowModal } from "../../settings/components/DataBackupSection";
import type { WalletSecurityState } from "../../security/hooks/useWalletSecurity";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import type {
  Account,
  Budget,
  BudgetFormState,
  Category,
  RecurringBill,
  RecurringBillFormState,
  TransactionType,
} from "../../../types/wallet";
import {
  defaultBudgetForm,
  defaultRecurringBillForm,
  normalAmountToMinor,
  savingContributionCategoryName,
} from "../../../utils/walletHelpers";
import { AccountStep, type AccountStepState } from "../components/AccountStep";
import { WelcomeStep } from "../components/WelcomeStep";
import {
  CategoriesStep,
  categoryKey,
  type RecommendedCategory,
} from "../components/CategoriesStep";
import { CompletionStep } from "../components/CompletionStep";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { onboardingSteps } from "../components/OnboardingProgress";
import { BudgetStep } from "../components/BudgetStep";
import { RecurringBillsStep } from "../components/RecurringBillsStep";
import { PasswordStep } from "../components/PasswordStep";
import type {
  CategoryCreationResult,
  OnboardingStepId,
  OnboardingSummary,
} from "../types/onboarding.types";

type OnboardingPageProps = {
  onComplete: () => void;
  security: WalletSecurityState;
};

const recommendedCategories: RecommendedCategory[] = [
  { name: "Salary", categoryType: "income" },
  { name: "Other Income", categoryType: "income" },
  { name: "Food", categoryType: "expense" },
  { name: "Transport", categoryType: "expense" },
  { name: "Housing", categoryType: "expense" },
  { name: "Bills", categoryType: "expense" },
  { name: "Shopping", categoryType: "expense" },
  { name: "Entertainment", categoryType: "expense" },
  { name: "Health", categoryType: "expense" },
];

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message && message.length < 140
    ? message
    : "Setup could not save that item. Check the details and try again.";
}

export function OnboardingPage({ onComplete, security }: OnboardingPageProps) {
  const wallet = useWalletAppContext();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStepId>("welcome");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountStepState>({
    accountName: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    recommendedCategories.map(categoryKey),
  );
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryType, setCustomCategoryType] = useState<TransactionType>("expense");
  const [categoryResult, setCategoryResult] = useState<CategoryCreationResult | null>(null);
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(defaultBudgetForm);
  const [recurringForm, setRecurringForm] = useState<RecurringBillFormState>(
    defaultRecurringBillForm,
  );
  const [summary, setSummary] = useState<OnboardingSummary>({
    accounts: 0,
    categories: 0,
    budgets: 0,
    recurringBills: 0,
    importedData: false,
  });

  const expenseCategories = useMemo(
    () =>
      wallet.categories.filter(
        (category) =>
          category.categoryType === "expense" && category.name !== savingContributionCategoryName,
      ),
    [wallet.categories],
  );

  function goTo(nextStep: OnboardingStepId) {
    setStep(nextStep);
  }

  function firstSetupStep() {
    return security.status?.passwordConfigured ? "account" : "password";
  }

  function openImportAfterProtection() {
    if (!security.status?.isUnlocked) {
      toast.info("Create your wallet password before importing data.", "Protect wallet first");
      goTo("password");
      return;
    }

    setIsImportOpen(true);
  }

  function back() {
    const index = onboardingSteps.indexOf(step);
    setStep(onboardingSteps[Math.max(0, index - 1)]);
  }

  async function handlePasswordSubmit(password: string) {
    if (security.status?.passwordConfigured && security.status.isUnlocked) {
      goTo("account");
      return;
    }

    setIsSavingPassword(true);
    try {
      await security.setupPassword(password);
      await wallet.reloadWalletData();
      toast.success("Wallet protection is ready.", "Setup saved");
      goTo("account");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accountCreated || summary.importedData) {
      goTo("categories");
      return;
    }

    const accountName = accountForm.accountName.trim();

    if (!accountName) {
      toast.warning("Enter an account name to continue.", "Account required");
      return;
    }

    setIsSavingAccount(true);
    try {
      await invoke<Account>("create_account", {
        request: {
          name: accountName,
          currency: "MAD",
          accountType: "cash",
          initialBalanceMinor: 0,
        },
      });
      setAccountCreated(true);
      setSummary((current) => ({ ...current, accounts: current.accounts + 1 }));
      await wallet.reloadWalletData();
      toast.success("First account created.", "Setup saved");
      goTo("categories");
    } catch (error) {
      toast.error(readableError(error), "Account setup failed");
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleCategoriesContinue() {
    if (categoryResult && categoryResult.failed.length === 0) {
      goTo("budget");
      return;
    }

    setIsSavingCategories(true);

    try {
      const result: CategoryCreationResult = { created: [], skipped: [], failed: [] };
      const existingKeys = new Set(
        wallet.categories.map((category) =>
          categoryKey({
            name: category.name.toLowerCase(),
            categoryType: category.categoryType,
          }),
        ),
      );
      const selected = recommendedCategories.filter((category) =>
        selectedCategories.includes(categoryKey(category)),
      );

      for (const category of selected) {
        const key = categoryKey({
          name: category.name.toLowerCase(),
          categoryType: category.categoryType,
        });
        if (existingKeys.has(key)) {
          result.skipped.push(category.name);
          continue;
        }

        try {
          await invoke<Category>("create_category", {
            request: {
              name: category.name,
              categoryType: category.categoryType,
              icon: null,
              color: null,
            },
          });
          existingKeys.add(key);
          result.created.push(category.name);
        } catch {
          result.failed.push(category.name);
        }
      }

      setCategoryResult(result);

      if (result.created.length > 0) {
        setSummary((current) => ({ ...current, categories: current.categories + result.created.length }));
        await wallet.reloadWalletData();
      }

      if (result.failed.length > 0) {
        toast.error(
          `Created ${result.created.length}, skipped ${result.skipped.length}, failed ${result.failed.length}.`,
          "Category setup needs attention",
        );
        return;
      }

      toast.success(
        `Created ${result.created.length} and skipped ${result.skipped.length} existing categories.`,
        "Categories ready",
      );
    } catch (error) {
      toast.error(readableError(error), "Category setup failed");
    } finally {
      setIsSavingCategories(false);
    }
  }

  async function handleAddCustomCategory() {
    const name = customCategoryName.trim();
    if (!name) {
      toast.warning("Enter a custom category name first.", "Category name required");
      return;
    }

    const exists = wallet.categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.categoryType === customCategoryType,
    );
    if (exists) {
      const result = { created: [], skipped: [name], failed: [] };
      setCategoryResult(result);
      toast.info("That category already exists, so Wallet skipped it.", "Category skipped");
      return;
    }

    setIsSavingCategories(true);
    try {
      await invoke<Category>("create_category", {
        request: {
          name,
          categoryType: customCategoryType,
          icon: null,
          color: null,
        },
      });
      setCategoryResult({ created: [name], skipped: [], failed: [] });
      setSummary((current) => ({ ...current, categories: current.categories + 1 }));
      setCustomCategoryName("");
      await wallet.reloadWalletData();
      toast.success("Custom category added.", "Setup saved");
    } catch (error) {
      setCategoryResult({ created: [], skipped: [], failed: [name] });
      toast.error(readableError(error), "Custom category failed");
    } finally {
      setIsSavingCategories(false);
    }
  }

  async function handleAddBudget() {
    const amountMinor = normalAmountToMinor(budgetForm.amount);
    const categoryId = budgetForm.categoryId || expenseCategories[0]?.id || "";
    if (!budgetForm.name.trim() || !categoryId || amountMinor === null) {
      toast.warning("Complete the budget name, category, and amount.", "Budget needs details");
      return;
    }

    setIsSavingBudget(true);
    try {
      await invoke<Budget>("create_budget", {
        request: {
          name: budgetForm.name,
          categoryId,
          amountMinor,
          month: Number(budgetForm.month),
          year: Number(budgetForm.year),
        },
      });
      setSummary((current) => ({ ...current, budgets: current.budgets + 1 }));
      setBudgetForm((current) => ({ ...defaultBudgetForm(), categoryId: current.categoryId }));
      await wallet.reloadWalletData();
      toast.success("Monthly budget added.", "Setup saved");
    } catch (error) {
      toast.error(readableError(error), "Budget setup failed");
    } finally {
      setIsSavingBudget(false);
    }
  }

  async function handleAddRecurringBill() {
    const amountMinor = normalAmountToMinor(recurringForm.amount);
    const accountId = recurringForm.accountId || wallet.accounts[0]?.id || "";
    const categoryId = recurringForm.categoryId || expenseCategories[0]?.id || "";
    if (
      !recurringForm.name.trim() ||
      !accountId ||
      !categoryId ||
      amountMinor === null
    ) {
      toast.warning("Complete the bill name, account, category, and amount.", "Bill needs details");
      return;
    }

    setIsSavingBill(true);
    try {
      await invoke<RecurringBill>("create_recurring_bill", {
        request: {
          name: recurringForm.name,
          accountId,
          categoryId,
          amountMinor,
          frequency: recurringForm.frequency,
          nextDueDate: recurringForm.nextDueDate,
          description: recurringForm.description,
        },
      });
      setSummary((current) => ({
        ...current,
        recurringBills: current.recurringBills + 1,
      }));
      setRecurringForm((current) => ({
        ...defaultRecurringBillForm(),
        accountId: current.accountId,
        categoryId: current.categoryId,
      }));
      await wallet.reloadWalletData();
      toast.success("Recurring bill added.", "Setup saved");
    } catch (error) {
      toast.error(readableError(error), "Recurring bill setup failed");
    } finally {
      setIsSavingBill(false);
    }
  }

  function handleComplete() {
    onComplete();
    navigate("/dashboard", { replace: true });
  }

  return (
    <OnboardingLayout currentStep={step}>
      {step === "welcome" ? (
        <WelcomeStep
          onGetStarted={() => goTo(firstSetupStep())}
          onImport={openImportAfterProtection}
        />
      ) : null}

      {step === "password" ? (
        <PasswordStep
          hasLegacyDatabase={Boolean(security.status?.hasLegacyDatabase)}
          isSaving={isSavingPassword}
          onBack={back}
          onSubmit={handlePasswordSubmit}
        />
      ) : null}

      {step === "account" ? (
        <AccountStep
          {...accountForm}
          isSaving={isSavingAccount}
          onBack={back}
          onChange={(changes) => setAccountForm((current) => ({ ...current, ...changes }))}
          onSubmit={handleAccountSubmit}
        />
      ) : null}

      {step === "categories" ? (
        <CategoriesStep
          customName={customCategoryName}
          customType={customCategoryType}
          isSaving={isSavingCategories}
          onAddCustom={handleAddCustomCategory}
          onBack={back}
          onChangeCustomName={setCustomCategoryName}
          onChangeCustomType={setCustomCategoryType}
          onClearSelection={() => {
            setCategoryResult(null);
            setSelectedCategories([]);
          }}
          onContinue={handleCategoriesContinue}
          onSelectAll={() => {
            setCategoryResult(null);
            setSelectedCategories(recommendedCategories.map(categoryKey));
          }}
          onSkip={() => goTo("budget")}
          onToggle={(key) => {
            setCategoryResult(null);
            setSelectedCategories((current) =>
              current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
            );
          }}
          recommended={recommendedCategories}
          result={categoryResult}
          selected={selectedCategories}
        />
      ) : null}

      {step === "budget" ? (
        <BudgetStep
          budgetCount={summary.budgets}
          categories={expenseCategories}
          form={{
            ...budgetForm,
            categoryId: budgetForm.categoryId || expenseCategories[0]?.id || "",
          }}
          isSaving={isSavingBudget}
          monthOptions={wallet.monthOptions}
          onAdd={handleAddBudget}
          onBack={back}
          onChange={(changes) => setBudgetForm((current) => ({ ...current, ...changes }))}
          onContinue={() => goTo("recurring")}
        />
      ) : null}

      {step === "recurring" ? (
        <RecurringBillsStep
          accounts={wallet.accounts}
          billCount={summary.recurringBills}
          categories={expenseCategories}
          form={{
            ...recurringForm,
            accountId: recurringForm.accountId || wallet.accounts[0]?.id || "",
            categoryId: recurringForm.categoryId || expenseCategories[0]?.id || "",
          }}
          isSaving={isSavingBill}
          onAdd={handleAddRecurringBill}
          onBack={back}
          onChange={(changes) => setRecurringForm((current) => ({ ...current, ...changes }))}
          onContinue={() => goTo("complete")}
        />
      ) : null}

      {step === "complete" ? <CompletionStep onComplete={handleComplete} summary={summary} /> : null}

      <ImportWorkflowModal
        onClose={() => setIsImportOpen(false)}
        onImported={async () => {
          setSummary((current) => ({ ...current, importedData: true }));
          await wallet.reloadWalletData();
          setIsImportOpen(false);
          goTo("complete");
        }}
        open={isImportOpen}
      />
    </OnboardingLayout>
  );
}
