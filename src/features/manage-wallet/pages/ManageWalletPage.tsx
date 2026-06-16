import { FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { PageIntro } from "../../../components/layout/PageIntro";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  AppTable,
  EmptyState,
  IconButton,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui";
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

      <AppCard
        actions={
          <form
            className="grid min-w-[min(100%,30rem)] grid-cols-[minmax(0,1fr)_auto] gap-2 max-sm:grid-cols-1"
            onSubmit={onCreateAccount}
          >
            <AppInput
              aria-label="Account name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Cash"
            />
            <AppButton disabled={isSavingAccount} type="submit" variant="primary">
              {isSavingAccount ? "Creating..." : "Add Account"}
            </AppButton>
          </form>
        }
        description="Add and maintain the local accounts and wallets used for transactions."
        id="accounts"
        title="Accounts"
        tone="strong"
      >
        {accounts.length === 0 ? (
          <EmptyState title="No accounts yet">
            Add your first account to start tracking balances.
          </EmptyState>
        ) : (
          <AppTable minWidth="min-w-[48rem]">
            <TableHeader>
              <tr>
                <TableCell header>Account</TableCell>
                <TableCell header>Type</TableCell>
                <TableCell header>Currency</TableCell>
                <TableCell align="right" header>
                  Balance
                </TableCell>
                <TableCell align="right" header>
                  Actions
                </TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {accounts.map((account) =>
                editingAccountId === account.id ? (
                  <tr className="bg-app-primary/5" key={account.id}>
                    <td className="px-4 py-4" colSpan={5}>
                      <form
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 max-md:grid-cols-1"
                        onSubmit={(event) => onUpdateAccount(event, account)}
                      >
                        <AppInput
                          value={editAccountName}
                          onChange={(event) => setEditAccountName(event.target.value)}
                          placeholder="Account name"
                        />
                        <AppButton
                          disabled={isUpdatingAccount}
                          type="submit"
                          variant="primary"
                        >
                          {isUpdatingAccount ? "Saving..." : "Save"}
                        </AppButton>
                        <AppButton onClick={onCancelEditingAccount} variant="ghost">
                          Cancel
                        </AppButton>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr className="bg-white/36 transition hover:bg-white/62" key={account.id}>
                    <td className="px-4 py-4 font-semibold text-app-text">
                      {account.name}
                    </td>
                    <td className="px-4 py-4">
                      <AppBadge variant="neutral">{account.accountType}</AppBadge>
                    </td>
                    <td className="px-4 py-4 text-sm text-app-muted">
                      {account.currency}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-app-text">
                      {formatMinor(account.balanceMinor)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon={Pencil}
                          label="Edit account"
                          onClick={() => onStartEditingAccount(account)}
                        />
                        <IconButton
                          disabled={archivingAccountId === account.id}
                          icon={Trash2}
                          label={
                            archivingAccountId === account.id
                              ? "Archiving account"
                              : "Archive account"
                          }
                          onClick={() => onArchiveAccount(account.id)}
                          tone="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </TableBody>
          </AppTable>
        )}
      </AppCard>

      <AppCard
        actions={
          <form
            className="grid min-w-[min(100%,36rem)] grid-cols-[minmax(0,1fr)_10rem_auto] gap-2 max-md:grid-cols-1"
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
            <AppButton disabled={isSavingCategory} type="submit" variant="primary">
              {isSavingCategory ? "Creating..." : "Add Category"}
            </AppButton>
          </form>
        }
        description="Create income and expense categories so transactions stay organized."
        id="categories"
        title="Categories"
        tone="strong"
      >
        {categories.length === 0 ? (
          <EmptyState title="No categories yet">
            Add income and expense categories to organize your transactions.
          </EmptyState>
        ) : (
          <AppTable minWidth="min-w-[36rem]">
            <TableHeader>
              <tr>
                <TableCell header>Category</TableCell>
                <TableCell header>Type</TableCell>
                <TableCell align="right" header>
                  Actions
                </TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {categories.map((category) =>
                editingCategoryId === category.id ? (
                  <tr className="bg-app-primary/5" key={category.id}>
                    <td className="px-4 py-4" colSpan={3}>
                      <form
                        className="grid grid-cols-[minmax(0,1fr)_10rem_auto_auto] gap-2 max-md:grid-cols-1"
                        onSubmit={(event) => onUpdateCategory(event, category)}
                      >
                        <AppInput
                          value={editCategoryName}
                          onChange={(event) => setEditCategoryName(event.target.value)}
                          placeholder="Category name"
                        />
                        <AppSelect
                          value={editCategoryType}
                          onChange={(event) =>
                            setEditCategoryType(event.target.value as TransactionType)
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
                        <AppButton onClick={onCancelEditingCategory} variant="ghost">
                          Cancel
                        </AppButton>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr className="bg-white/36 transition hover:bg-white/62" key={category.id}>
                    <td className="px-4 py-4 font-semibold text-app-text">
                      {category.name}
                    </td>
                    <td className="px-4 py-4">
                      <AppBadge variant={category.categoryType}>
                        {category.categoryType}
                      </AppBadge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon={Pencil}
                          label="Edit category"
                          onClick={() => onStartEditingCategory(category)}
                        />
                        <IconButton
                          disabled={archivingCategoryId === category.id}
                          icon={Trash2}
                          label={
                            archivingCategoryId === category.id
                              ? "Archiving category"
                              : "Archive category"
                          }
                          onClick={() => onArchiveCategory(category.id)}
                          tone="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </TableBody>
          </AppTable>
        )}
      </AppCard>
    </section>
  );
}
