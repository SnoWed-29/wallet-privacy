import { TransactionsPage } from "./TransactionsPage";
import { useWalletAppContext } from "../../wallet/WalletAppContext";

export function TransactionsRoutePage() {
  const wallet = useWalletAppContext();

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
