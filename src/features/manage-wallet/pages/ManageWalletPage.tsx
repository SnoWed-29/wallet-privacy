import { FormEvent } from "react";
import { AppBadge, AppButton, AppCard, AppInput, AppSelect, AppTable, EmptyState } from "../../../components/ui";
import { PageIntro } from "../../../components/layout/PageIntro";
import { useWalletAppContext } from "../../wallet/WalletAppContext";
import type { Account, Category, TransactionType } from "../../../types/wallet";

export function ManageWalletPage() {
  const wallet = useWalletAppContext();

  return (
    <ManageWalletView
      accountName={wallet.accountName}
      accounts={wallet.accounts}
      archivingAccountId={wallet.archivingAccountId}
      archivingCategoryId={wallet.archivingCategoryId}
      categories={wallet.categories}
      categoryName={wallet.categoryName}
      categoryType={wallet.categoryType}
      editAccountName={wallet.editAccountName}
      editCategoryName={wallet.editCategoryName}
      editCategoryType={wallet.editCategoryType}
      editingAccountId={wallet.editingAccountId}
      editingCategoryId={wallet.editingCategoryId}
      error={wallet.error}
      formatMinor={wallet.formatMinor}
      isSavingAccount={wallet.isSavingAccount}
      isSavingCategory={wallet.isSavingCategory}
      isUpdatingAccount={wallet.isUpdatingAccount}
      isUpdatingCategory={wallet.isUpdatingCategory}
      onArchiveAccount={wallet.archiveAccount}
      onArchiveCategory={wallet.archiveCategory}
      onCancelEditingAccount={wallet.cancelEditingAccount}
      onCancelEditingCategory={wallet.cancelEditingCategory}
      onCreateAccount={wallet.createAccount}
      onCreateCategory={wallet.createCategory}
      onStartEditingAccount={wallet.startEditingAccount}
      onStartEditingCategory={wallet.startEditingCategory}
      onUpdateAccount={wallet.updateAccount}
      onUpdateCategory={wallet.updateCategory}
      setAccountName={wallet.setAccountName}
      setCategoryName={wallet.setCategoryName}
      setCategoryType={wallet.setCategoryType}
      setEditAccountName={wallet.setEditAccountName}
      setEditCategoryName={wallet.setEditCategoryName}
      setEditCategoryType={wallet.setEditCategoryType}
    />
  );
}

type ManageWalletPageProps = {
  accounts: Account[];
  categories: Category[];
  accountName: string;
  categoryName: string;
  categoryType: TransactionType;
  editAccountName: string;
  editCategoryName: string;
  editCategoryType: TransactionType;
  editingAccountId: string;
  editingCategoryId: string;
  archivingAccountId: string;
  archivingCategoryId: string;
  isSavingAccount: boolean;
  isSavingCategory: boolean;
  isUpdatingAccount: boolean;
  isUpdatingCategory: boolean;
  error: string;
  setAccountName: (value: string) => void;
  setCategoryName: (value: string) => void;
  setCategoryType: (value: TransactionType) => void;
  setEditAccountName: (value: string) => void;
  setEditCategoryName: (value: string) => void;
  setEditCategoryType: (value: TransactionType) => void;
  onCreateAccount: (event: FormEvent<HTMLFormElement>) => void;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateAccount: (
    event: FormEvent<HTMLFormElement>,
    account: Account,
  ) => void;
  onUpdateCategory: (
    event: FormEvent<HTMLFormElement>,
    category: Category,
  ) => void;
  onStartEditingAccount: (account: Account) => void;
  onStartEditingCategory: (category: Category) => void;
  onCancelEditingAccount: () => void;
  onCancelEditingCategory: () => void;
  onArchiveAccount: (id: string) => void;
  onArchiveCategory: (id: string) => void;
  formatMinor: (value: number) => string;
};

function ManageWalletView({
  accounts,
  categories,
  accountName,
  categoryName,
  categoryType,
  editAccountName,
  editCategoryName,
  editCategoryType,
  editingAccountId,
  editingCategoryId,
  archivingAccountId,
  archivingCategoryId,
  isSavingAccount,
  isSavingCategory,
  isUpdatingAccount,
  isUpdatingCategory,
  error,
  setAccountName,
  setCategoryName,
  setCategoryType,
  setEditAccountName,
  setEditCategoryName,
  setEditCategoryType,
  onCreateAccount,
  onCreateCategory,
  onUpdateAccount,
  onUpdateCategory,
  onStartEditingAccount,
  onStartEditingCategory,
  onCancelEditingAccount,
  onCancelEditingCategory,
  onArchiveAccount,
  onArchiveCategory,
  formatMinor,
}: ManageWalletPageProps) {
  return (
    <section className="grid gap-5">
      <PageIntro
        description="Manage your accounts, wallets, and transaction categories."
        title="Manage Wallet"
      />

      {error && <p className="error">{error}</p>}

      <AppCard
        actions={
          <form
            className="flex min-w-[min(100%,28rem)] gap-2 max-sm:w-full max-sm:flex-col"
            onSubmit={onCreateAccount}
          >
            <AppInput
              aria-label="Account name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Cash"
            />
            <AppButton
              disabled={isSavingAccount}
              type="submit"
              variant="primary"
            >
              {isSavingAccount ? "Creating..." : "Add account"}
            </AppButton>
          </form>
        }
        description="Accounts represent the places where money lives, such as cash, checking, or a wallet."
        id="accounts"
        title="Accounts"
      >
        {accounts.length === 0 ? (
          <EmptyState title="No accounts yet">
            Add your first account to start tracking balances.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <AppTable>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-app-muted">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Account</th>
                  <th className="px-4 py-3 font-extrabold">Type</th>
                  <th className="px-4 py-3 font-extrabold">Currency</th>
                  <th className="px-4 py-3 text-right font-extrabold">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-right font-extrabold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {accounts.map((account) =>
                  editingAccountId === account.id ? (
                    <tr className="bg-emerald-50/40" key={account.id}>
                      <td className="px-4 py-4" colSpan={5}>
                        <form
                          className="flex items-center gap-2 max-sm:flex-col"
                          onSubmit={(event) => onUpdateAccount(event, account)}
                        >
                          <AppInput
                            value={editAccountName}
                            onChange={(event) =>
                              setEditAccountName(event.target.value)
                            }
                            placeholder="Account name"
                          />
                          <AppButton
                            disabled={isUpdatingAccount}
                            type="submit"
                            variant="primary"
                          >
                            {isUpdatingAccount ? "Saving..." : "Save"}
                          </AppButton>
                          <AppButton
                            onClick={onCancelEditingAccount}
                            variant="ghost"
                          >
                            Cancel
                          </AppButton>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr className="bg-white transition hover:bg-slate-50" key={account.id}>
                      <td className="px-4 py-4 font-extrabold text-app-text">
                        {account.name}
                      </td>
                      <td className="px-4 py-4">
                        <AppBadge variant="neutral">{account.accountType}</AppBadge>
                      </td>
                      <td className="px-4 py-4 text-sm text-app-muted">
                        {account.currency}
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-app-text">
                        {formatMinor(account.balanceMinor)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <AppButton
                            onClick={() => onStartEditingAccount(account)}
                            variant="ghost"
                          >
                            Edit
                          </AppButton>
                          <AppButton
                            disabled={archivingAccountId === account.id}
                            onClick={() => onArchiveAccount(account.id)}
                            variant="danger"
                          >
                            {archivingAccountId === account.id
                              ? "Archiving..."
                              : "Archive"}
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </AppTable>
          </div>
        )}
      </AppCard>

      <AppCard
        actions={
          <form
            className="grid min-w-[min(100%,34rem)] grid-cols-[1fr_10rem_auto] gap-2 max-md:grid-cols-1"
            onSubmit={onCreateCategory}
          >
            <AppInput
              aria-label="Category name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Groceries"
            />
            <AppSelect
              value={categoryType}
              onChange={(event) =>
                setCategoryType(event.target.value as TransactionType)
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </AppSelect>
            <AppButton
              disabled={isSavingCategory}
              type="submit"
              variant="primary"
            >
              {isSavingCategory ? "Creating..." : "Add category"}
            </AppButton>
          </form>
        }
        description="Categories keep transactions organized for filtering, budgets, and reporting."
        id="categories"
        title="Categories"
      >
        {categories.length === 0 ? (
          <EmptyState title="No categories yet">
            Add income and expense categories to organize your transactions.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <AppTable>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-app-muted">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Category</th>
                  <th className="px-4 py-3 font-extrabold">Type</th>
                  <th className="px-4 py-3 text-right font-extrabold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {categories.map((category) =>
                  editingCategoryId === category.id ? (
                    <tr className="bg-emerald-50/40" key={category.id}>
                      <td className="px-4 py-4" colSpan={3}>
                        <form
                          className="grid grid-cols-[1fr_10rem_auto_auto] gap-2 max-md:grid-cols-1"
                          onSubmit={(event) => onUpdateCategory(event, category)}
                        >
                          <AppInput
                            value={editCategoryName}
                            onChange={(event) =>
                              setEditCategoryName(event.target.value)
                            }
                            placeholder="Category name"
                          />
                          <AppSelect
                            value={editCategoryType}
                            onChange={(event) =>
                              setEditCategoryType(
                                event.target.value as TransactionType,
                              )
                            }
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </AppSelect>
                          <AppButton
                            disabled={isUpdatingCategory}
                            type="submit"
                            variant="primary"
                          >
                            {isUpdatingCategory ? "Saving..." : "Save"}
                          </AppButton>
                          <AppButton
                            onClick={onCancelEditingCategory}
                            variant="ghost"
                          >
                            Cancel
                          </AppButton>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr className="bg-white transition hover:bg-slate-50" key={category.id}>
                      <td className="px-4 py-4 font-extrabold text-app-text">
                        {category.name}
                      </td>
                      <td className="px-4 py-4">
                        <AppBadge variant={category.categoryType}>
                          {category.categoryType}
                        </AppBadge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <AppButton
                            onClick={() => onStartEditingCategory(category)}
                            variant="ghost"
                          >
                            Edit
                          </AppButton>
                          <AppButton
                            disabled={archivingCategoryId === category.id}
                            onClick={() => onArchiveCategory(category.id)}
                            variant="danger"
                          >
                            {archivingCategoryId === category.id
                              ? "Archiving..."
                              : "Archive"}
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </AppTable>
          </div>
        )}
      </AppCard>
    </section>
  );
}


