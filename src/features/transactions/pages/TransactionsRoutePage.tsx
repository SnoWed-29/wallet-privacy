import { TransactionsPage } from "./TransactionsPage";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { TransactionFilterState, TransactionType } from "../../../types/wallet";

export function TransactionsRoutePage() {
  const wallet = useWalletAppContext();
  const location = useLocation();

  useEffect(() => {
    const filters = filtersFromSearch(location.search);

    if (filters) {
      void wallet.applyTransactionFilterValues(filters);
    }
  }, [location.search]);

  return (
    <TransactionsPage
      accountNameFor={wallet.accountNameFor}
      accounts={wallet.accounts}
      categories={wallet.categories}
      categoryNameFor={wallet.categoryNameFor}
      deletingTransactionId={wallet.deletingTransactionId}
      editCategoriesFor={wallet.editCategoriesFor}
      editTransaction={wallet.editTransaction}
      editingTransactionId={wallet.editingTransactionId}
      formatMinor={wallet.formatMinor}
      isFilteringTransactions={wallet.isFilteringTransactions}
      isSavingTransaction={wallet.isSavingTransaction}
      isUpdatingTransaction={wallet.isUpdatingTransaction}
      matchingCategories={wallet.matchingCategories}
      onApplyFilters={wallet.applyTransactionFilters}
      onCancelEditingTransaction={wallet.cancelEditingTransaction}
      onClearFilters={wallet.clearTransactionFilters}
      onCreateTransaction={wallet.createTransaction}
      onDeleteTransaction={wallet.deleteTransaction}
      onStartEditingTransaction={wallet.startEditingTransaction}
      onUpdateEditTransaction={wallet.updateEditTransaction}
      onUpdateTransaction={wallet.updateTransaction}
      onUpdateTransactionFilter={wallet.updateTransactionFilter}
      setTransactionAccountId={wallet.setTransactionAccountId}
      setTransactionAmount={wallet.setTransactionAmount}
      setTransactionCategoryId={wallet.setTransactionCategoryId}
      setTransactionDate={wallet.setTransactionDate}
      setTransactionDescription={wallet.setTransactionDescription}
      setTransactionType={wallet.setTransactionType}
      transactionAccountId={wallet.transactionAccountId}
      transactionAmount={wallet.transactionAmount}
      transactionCategoryId={wallet.transactionCategoryId}
      transactionDate={wallet.transactionDate}
      transactionDescription={wallet.transactionDescription}
      transactionFilters={wallet.transactionFilters}
      transactions={wallet.transactions}
      transactionType={wallet.transactionType}
    />
  );
}

function filtersFromSearch(search: string): TransactionFilterState | null {
  const params = new URLSearchParams(search);
  const transactionType = params.get("transactionType") ?? "";
  const filters: TransactionFilterState = {
    accountId: params.get("accountId") ?? "",
    categoryId: params.get("categoryId") ?? "",
    transactionType:
      transactionType === "income" || transactionType === "expense"
        ? (transactionType as TransactionType)
        : "",
    startDate: params.get("startDate") ?? "",
    endDate: params.get("endDate") ?? "",
    search: params.get("search") ?? "",
  };

  return Object.values(filters).some((value) => value !== "") ? filters : null;
}
