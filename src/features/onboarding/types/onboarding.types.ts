export type OnboardingStepId =
  | "welcome"
  | "account"
  | "categories"
  | "budget"
  | "recurring"
  | "complete";

export type OnboardingSummary = {
  accounts: number;
  categories: number;
  budgets: number;
  recurringBills: number;
  importedData: boolean;
};

export type CategoryCreationResult = {
  created: string[];
  skipped: string[];
  failed: string[];
};
