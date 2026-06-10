export type TransactionType = "income" | "expense";

export type Account = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  initialBalanceMinor: number;
  balanceMinor: number;
};

export type Category = {
  id: string;
  name: string;
  categoryType: TransactionType;
  icon: string | null;
  color: string | null;
};

export type Transaction = {
  id: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  amountMinor: number;
  description: string | null;
  transactionDate: string;
};

export type TransactionFormState = {
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  amount: string;
  description: string;
  transactionDate: string;
};

export type TransactionFilterState = {
  accountId: string;
  categoryId: string;
  transactionType: TransactionType | "";
  startDate: string;
  endDate: string;
  search: string;
};
