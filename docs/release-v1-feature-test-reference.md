# Release v1 Feature and Test Reference

Generated from the local source audit on 2026-07-05. Use this as the release-v1 test blueprint for Wallet.

## Purpose

This file describes the app from the core outward: runtime architecture, persistent data, Tauri command contracts, frontend routes, feature behavior, validation rules, side effects, existing coverage, and release-v1 test cases.

The goal is to make tests answer one question clearly: "Can a user trust this local wallet app before version 1 ships?"

## Source Map

Primary files audited:

- Frontend app shell: `src/App.tsx`, `src/main.tsx`, `src/styles/globals.css`
- Global wallet state: `src/hooks/useWalletApp.ts`, `src/features/wallet/WalletAppContext.tsx`
- Shared types and helpers: `src/types/wallet.ts`, `src/utils/walletHelpers.ts`
- Feature pages: `src/features/dashboard`, `src/features/transactions`, `src/features/manage-wallet`, `src/features/planning`, `src/features/reports`, `src/features/settings`, `src/features/onboarding`
- UI components: `src/components/ui`, `src/components/layout`
- Backend app entry: `src-tauri/src/lib.rs`
- Database setup: `src-tauri/src/database/connection.rs`, `src-tauri/migrations`
- Backend domains: `src-tauri/src/domain`
- Backend repositories: `src-tauri/src/repositories`
- Data services: `src-tauri/src/services/export`, `src-tauri/src/services/import`, `src-tauri/src/services/backup`
- Security storage: `src-tauri/src/services/security`, `src/features/security`
- Tests: `src/**/*.test.tsx`, `src-tauri/tests`, `e2e`

## Architecture

Wallet is a local-first desktop finance app built with:

- React 19, TypeScript, Vite, React Router, Tailwind CSS, and lucide icons.
- Tauri v2 desktop shell.
- Rust backend exposed through Tauri `invoke` commands.
- SQLite storage through `sqlx`.
- Local JSON export, import, backup, and restore.

The app is privacy-first by design:

- Production finance data is stored locally in encrypted `wallet.encrypted.json` after password setup.
- The decrypted SQLite database is created in memory only while the wallet is unlocked.
- Existing unencrypted `wallet.db` files are migrated into encrypted storage during password setup, then renamed to `wallet.unencrypted-migrated-{timestamp}.db`.
- E2E mode uses `WALLET_TEST_MODE=true` and stores test data in `WALLET_TEST_DATA_DIR`, defaulting to a temp/test path.
- There is no cloud sync.
- Settings explicitly describe the app as local-only and include a Security & Privacy lock action.

The Tauri window is configured in `src-tauri/tauri.conf.json`:

- Product name: `wallet`
- Identifier: `com.snowed.wallet`
- Version: `0.2.1`
- Default size: `1440x900`
- Minimum size: `1100x700`
- Starts maximized and centered.

## Runtime Startup

Backend startup:

1. `src-tauri/src/lib.rs` starts the Tauri builder.
2. The opener plugin is registered.
3. `database::connection::app_data_dir(app.handle())` resolves the Tauri app data directory.
4. `AppState::locked(app_data_dir)` is registered without opening finance data.
5. The main window is maximized.
6. Security commands are available before unlock.
7. Finance commands require an unlocked runtime SQLite pool.
8. During setup or unlock, SQL migrations run against an in-memory SQLite database and default categories are seeded if missing:
   - `Recurring Bills`
   - `Saving Contribution`
9. Successful mutations persist a new encrypted snapshot.
10. All Tauri commands are registered.

Frontend startup:

1. `App` wraps everything in `ToastProvider`.
2. `useWalletSecurity` calls `get_security_status`.
3. While security status is loading, the app shows "Preparing your local wallet...".
4. If a password is configured and the wallet is locked, `UnlockPage` renders before any finance data provider loads.
5. If no password is configured, onboarding is shown with wallet data loading disabled until password setup succeeds.
6. Once unlocked, `WalletAppProvider` enables `useWalletApp`.
7. `useWalletApp` bootstraps data by calling these loaders in parallel:
   - `list_accounts`
   - `list_categories`
   - `list_transactions` or `filter_transactions`
   - `list_budgets`
   - `list_savings_goals`
   - `list_recurring_bills`
   - `get_dashboard_summary`
8. `OnboardingGate` opens onboarding unless localStorage says onboarding is complete.
9. Completed and unlocked users enter the app layout.

## App Routes

Routes are defined in `src/App.tsx`.

| Route | Screen | Behavior |
| --- | --- | --- |
| `/` | Redirect | Redirects to `/dashboard`. |
| `/dashboard` | Dashboard | Financial summary and current status. |
| `/transactions` | Transactions | Ledger, transaction form, filters, sorting, edit, delete. |
| `/manage` | Manage Wallet | Accounts and categories CRUD/archive. |
| `/planning` | Planning | Budgets, savings goals, recurring bills. |
| `/reports` | Reports | Analytics, filters, charts, drilldowns. |
| `/settings` | Settings | Preferences placeholders, data tools, about, onboarding restart. |
| `*` | Redirect | Unknown routes redirect to `/dashboard`. |

## Global State and Helpers

`useWalletApp` is the main frontend orchestration hook.

It owns:

- Entity arrays: accounts, categories, transactions, budgets, savings goals, recurring bills, dashboard summary.
- Create forms: account, category, transaction, budget, savings goal, recurring bill.
- Edit forms and editing IDs for every editable entity.
- Loading/saving flags for create, update, archive, delete, filter, contribution, payment, dashboard refresh, and bootstrap.
- Error state and toast presentation.
- Derived category lists.
- Formatting and lookup helpers.

Important global behavior:

- New transactions default to today's date from `todayInputValue()`.
- New budgets default to the current month and year.
- New recurring bills default to today's date and monthly frequency.
- The selected transaction account auto-selects the first active account when empty.
- The selected transaction category auto-selects the first category matching the transaction type.
- The selected budget category auto-selects the first expense category when empty.
- The selected recurring bill account and category auto-select the first account and first expense category when empty.
- The app filters out the `Saving Contribution` category from manual transaction category choices.
- Error messages are sanitized before display. SQL/database/stack-like errors become generic local wallet data messages.
- Successes and warnings are shown through `ToastProvider`.

Amount helpers:

- `normalAmountToMinor(value)` accepts only positive decimal strings with up to two decimal places.
- Valid examples: `1`, `1.2`, `1.23`, `0.01`.
- Invalid examples: empty, `0`, negative values, letters, more than two decimals.
- `optionalNormalAmountToMinor(value)` treats empty as zero and allows zero, but rejects negative or malformed values.
- `formatMinor(value)` renders minor units as a fixed two-decimal string.
- `minorToNormalAmount(value)` converts saved minor units into edit-form decimal strings.
- Percentages render with two decimals through `formatPercentage`.

Date helpers:

- Frontend date inputs use `YYYY-MM-DD`.
- Most backend date parsing assumes `YYYY-MM-DD`.
- Transaction creation currently validates only non-empty transaction dates in the transaction domain.
- Recurring bill dates and report dates are parsed strictly as `YYYY-MM-DD`.

## Data Model

SQLite migrations create six tables.

### Accounts

Table: `accounts`

Fields:

- `id`: text primary key.
- `name`: required text.
- `account_type`: required text, defaults to `cash` in service.
- `currency`: required text, defaults to `MAD` in service.
- `initial_balance_minor`: required integer, defaults to zero.
- `is_archived`: integer flag, default false.
- `created_at`, `updated_at`: required text timestamps.

Runtime model adds `balance_minor`, calculated as:

`initial_balance_minor + income transactions - expense transactions`

Normal account lists exclude archived accounts.

### Categories

Table: `categories`

Fields:

- `id`: text primary key.
- `name`: required text.
- `category_type`: required text, must be `income` or `expense`.
- `icon`: nullable text.
- `color`: nullable text.
- `is_archived`: integer flag, default false.
- `created_at`, `updated_at`: required text timestamps.

Normal category lists exclude archived categories.

Seeded categories:

- `Recurring Bills`, expense.
- `Saving Contribution`, expense.

### Transactions

Table: `transactions`

Fields:

- `id`: text primary key.
- `account_id`: required FK to accounts.
- `category_id`: required FK to categories.
- `transaction_type`: required text, must be `income` or `expense`.
- `amount_minor`: required positive integer.
- `description`: nullable text.
- `transaction_date`: required text.
- `created_at`, `updated_at`: required text timestamps.

Transactions are not archived. They can be permanently deleted.

### Budgets

Table: `budgets`

Fields:

- `id`: text primary key.
- `name`: required text.
- `category_id`: required FK to categories.
- `amount_minor`: required positive integer.
- `month`: required integer 1 through 12.
- `year`: required integer.
- `is_archived`: integer flag, default false.
- `created_at`, `updated_at`: required text timestamps.

Runtime budget models include:

- `category_name`
- `spent_minor`
- `remaining_minor`
- `progress_percentage`
- `is_near_limit`
- `is_exceeded`

Budget spending only counts expense transactions in the budget category and budget month.

### Savings Goals

Table: `savings_goals`

Fields:

- `id`: text primary key.
- `name`: required text.
- `target_amount_minor`: required positive integer.
- `current_amount_minor`: required non-negative integer, default zero.
- `deadline_date`: nullable text.
- `is_archived`: integer flag, default false.
- `created_at`, `updated_at`: required text timestamps.

Runtime model includes:

- `remaining_amount_minor`
- `progress_percent`, capped at 100 in repository queries.

### Recurring Bills

Table: `recurring_bills`

Fields:

- `id`: text primary key.
- `name`: required text.
- `account_id`: required FK to accounts.
- `category_id`: required FK to categories.
- `amount_minor`: required positive integer.
- `frequency`: required text.
- `next_due_date`: required text.
- `last_paid_date`: nullable text.
- `description`: nullable text.
- `is_archived`: integer flag, default false.
- `created_at`, `updated_at`: required text timestamps.

Runtime model includes:

- `account_name`
- `category_name`

## Tauri Command Map

Commands registered in `src-tauri/src/lib.rs`.

| Command | Domain/service | Main use |
| --- | --- | --- |
| `get_security_status` | Security | Report encrypted storage, legacy DB, and unlock state. |
| `setup_app_password` | Security | Create local password, migrate legacy data, and unlock runtime storage. |
| `unlock_wallet` | Security | Decrypt encrypted storage and open the in-memory runtime database. |
| `lock_wallet` | Security | Persist encrypted snapshot and close the runtime database. |
| `create_account` | Accounts | Create account. |
| `update_account` | Accounts | Rename/update account metadata. |
| `archive_account` | Accounts | Soft archive account. |
| `list_accounts` | Accounts | List active accounts with balances. |
| `create_category` | Categories | Create income or expense category. |
| `update_category` | Categories | Rename/update category type/icon/color. |
| `archive_category` | Categories | Soft archive category. |
| `list_categories` | Categories | List active categories. |
| `create_transaction` | Transactions | Create manual income/expense. |
| `update_transaction` | Transactions | Edit manual transaction. |
| `delete_transaction` | Transactions | Permanently delete transaction. |
| `list_transactions` | Transactions | List all transactions by date desc. |
| `filter_transactions` | Transactions | Filter by account/category/type/date/search. |
| `create_budget` | Budgets | Create monthly expense budget. |
| `list_budgets` | Budgets | List active budgets with progress. |
| `update_budget` | Budgets | Edit budget. |
| `archive_budget` | Budgets | Soft archive budget. |
| `create_savings_goal` | Savings Goals | Create goal. |
| `list_savings_goals` | Savings Goals | List active goals. |
| `update_savings_goal` | Savings Goals | Edit goal. |
| `archive_savings_goal` | Savings Goals | Soft archive goal. |
| `contribute_to_savings_goal` | Savings Goals | Add contribution and create linked expense transaction. |
| `create_recurring_bill` | Recurring Bills | Create bill schedule. |
| `list_recurring_bills` | Recurring Bills | List active bills by next due date. |
| `update_recurring_bill` | Recurring Bills | Edit bill schedule. |
| `archive_recurring_bill` | Recurring Bills | Soft archive bill. |
| `mark_recurring_bill_paid` | Recurring Bills | Create payment transaction and advance due date. |
| `get_dashboard_summary` | Dashboard | Load dashboard cards and lists. |
| `get_reports_summary` | Reports | Load report analytics. |
| `export_wallet_data` | Export | Return Wallet export JSON. |
| `validate_import_file` | Import | Validate and preview export JSON. |
| `import_wallet_data` | Import | Merge or replace from export JSON. |
| `create_wallet_backup` | Backup | Return backup JSON wrapper. |
| `validate_backup_file` | Backup | Validate and preview backup JSON. |
| `restore_wallet_backup` | Backup | Create safety backup, then replace data from backup. |

## Feature Details

## Security and Privacy

Source:

- `src/features/security/hooks/useWalletSecurity.ts`
- `src/features/security/pages/UnlockPage.tsx`
- `src/features/onboarding/components/PasswordStep.tsx`
- `src-tauri/src/services/security`
- `src-tauri/src/commands/security.rs`

Storage behavior:

- Production encrypted file: `wallet.encrypted.json` in the Tauri app data directory.
- Legacy unencrypted file: `wallet.db`.
- Runtime database while unlocked: in-memory SQLite with migrations and default category seed.
- Password KDF: Argon2id, 64 MiB, 3 iterations, 1 lane, 32-byte key.
- Cipher: ChaCha20-Poly1305.
- Envelope includes salt, verification ciphertext, payload ciphertext, timestamps, cipher name, KDF name, and version.
- Plain passwords and derived keys are not stored and must not be logged.

Security states:

- Fresh install: no encrypted storage, no password, onboarding required.
- Legacy install: `wallet.db` exists, password setup migrates data into encrypted storage.
- Returning install: encrypted storage exists, unlock required before app data loads.
- Unlocked: finance commands can access the in-memory SQLite pool.
- Locked: finance commands fail with an unlock-required error.

User-visible behavior:

- First-run onboarding requires a local password before account setup or import.
- Unlock screen appears before dashboard for configured wallets.
- Settings > Security & Privacy shows local encryption status and a Lock app action.
- Password changes are listed as a future improvement, not a v1 feature.
- Forgotten passwords are not recoverable by Wallet.

Release-v1 security tests:

- Fresh onboarding does not call finance commands before password setup.
- Password setup validates required, minimum length, and confirmation mismatch.
- Correct password creates encrypted storage and loads account setup.
- Returning encrypted wallet shows Unlock Wallet before dashboard.
- Wrong password keeps the wallet locked and does not load finance data.
- Correct password unlocks and then loads finance data.
- Lock action returns to Unlock Wallet.
- Encrypted storage file does not contain account names, transaction descriptions, category names, or the password.
- Legacy `wallet.db` migrates and is renamed after verified encrypted import.
- Security errors shown to users are sanitized.

## Onboarding

Source:

- `src/features/onboarding/pages/OnboardingPage.tsx`
- `src/features/onboarding/hooks/useOnboarding.ts`
- `src/features/onboarding/components`
- `src/features/onboarding/utils/onboarding.utils.ts`

Storage:

- localStorage key: `wallet.onboardingCompleted`
- event name: `wallet:onboarding-updated`

Statuses:

- `checking`: wallet data is still bootstrapping.
- `required`: onboarding should be shown.
- `completed`: normal app should be shown.

Rules:

- Missing localStorage value means onboarding is required.
- `false` means onboarding is required.
- `true` means normal app is allowed.
- Restart onboarding from Settings writes `false` and dispatches the update event.

Steps:

1. Welcome.
2. Password protection, only when no local password is configured.
3. Account.
4. Categories.
5. Budget.
6. Recurring bills.
7. Complete.

Welcome step:

- User can start guided setup.
- If no local password exists, guided setup moves to Protect your wallet first.
- Import before unlock routes to password setup and shows a protect-wallet message.
- Import after unlock opens the existing Import Data workflow.
- Successful import marks `summary.importedData = true`, reloads wallet data, closes import, and moves to completion.

Password step:

- Requires password and confirmation.
- Password must be at least 8 characters.
- Confirmation must match.
- Calls `setup_app_password` and reloads wallet data after success.
- Shows a legacy-data notice when an old `wallet.db` is present.

Account step:

- Requires non-empty account name unless an account was already created during this onboarding session or data was imported.
- Creates account with:
  - `currency: "MAD"`
  - `accountType: "cash"`
  - `initialBalanceMinor: 0`
- On success:
  - Account count increments.
  - Wallet data reloads.
  - User moves to categories.

Recommended categories:

- Salary, income.
- Other Income, income.
- Food, expense.
- Transport, expense.
- Housing, expense.
- Bills, expense.
- Shopping, expense.
- Entertainment, expense.
- Health, expense.

Category step:

- Selected recommended categories are created unless an existing category has the same lower-cased name and type.
- Existing categories are skipped.
- Failed category creates are reported and the user stays on the category step.
- User can select all, clear selection, toggle individual categories, skip, or add a custom category.
- Custom category:
  - Requires non-empty name.
  - Uses selected type, default expense.
  - Skips if same name and type already exists.
  - Reloads wallet data on success.

Budget step:

- Optional.
- Requires budget name, expense category, and valid positive amount to add.
- Category defaults to first available expense category.
- Uses frontend minor-unit validation.
- Creates budget with selected month and year.
- User can continue without adding a budget.

Recurring bill step:

- Optional.
- Requires bill name, account, expense category, and valid positive amount to add.
- Account defaults to first active account.
- Category defaults to first active expense category.
- Uses frequency and next due date from the recurring form.
- User can continue without adding a bill.

Completion step:

- Shows summary counts for accounts, categories, budgets, recurring bills, and imported data.
- Completing writes onboarding complete and navigates to `/dashboard`.

Release-v1 tests:

- Missing/false/true localStorage states.
- Bootstrap loading state does not flash dashboard.
- First-run password setup blocks finance data loading until encryption is ready.
- Password setup validation covers empty, short, and mismatched values.
- Import from welcome requires wallet protection first, then reaches the existing import flow after unlock.
- Account create sends exact DTO defaults.
- Empty account name warns.
- Recommended category selection creates only selected items.
- Existing categories are skipped.
- Partial category failure blocks progress.
- Custom category duplicate handling.
- Budget validation and create.
- Recurring bill validation and create.
- Completion persists `wallet.onboardingCompleted=true`.
- Restart onboarding from Settings persists false and immediately shows onboarding.

## App Layout and Navigation

Source:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/navigation.ts`
- `src/components/layout/PageIntro.tsx`

Behavior:

- The app shell wraps all completed-onboarding routes.
- Sidebar and topbar use `navigationItems`.
- App title: `Wallet`.
- Eyebrow: `Privacy-first desktop finance`.
- Status: `Local data only`.
- Route navigation should preserve global wallet state.
- Unknown routes redirect to dashboard.

Release-v1 tests:

- Every navigation item routes to the correct screen.
- Active navigation state is visible.
- Unknown route redirects to dashboard.
- Shell is not shown during onboarding required/checking states.
- Layout remains usable at the configured minimum desktop size.

## Dashboard

Source:

- `src/features/dashboard/pages/DashboardPage.tsx`
- `src-tauri/src/domain/dashboard/service.rs`
- `src-tauri/src/repositories/dashboard_repository.rs`

Purpose:

- Provide a current local financial overview.

Frontend sections:

- Page intro with "Refresh dashboard".
- Summary cards:
  - Total balance.
  - Monthly income.
  - Monthly expenses.
  - Budget remaining.
- Financial pulse:
  - Income progress bar.
  - Expenses progress bar.
  - Net movement progress bar.
- Accounts card:
  - Active account names and balances.
- Recent transactions:
  - Latest 10 transactions.
  - Shows description or category name.
  - Shows date, account, category, type badge, signed amount.
- Upcoming bills:
  - Recurring bills due in next 14 days.
  - Warning badge when days remaining <= 3.
- Savings goals progress:
  - Active goals with saved amount, target, remaining, progress.
- Budget overview:
  - Active current-month budgets with spent, limit, category, progress.
  - Status badge: Exceeded, Near limit, or On track.

Backend calculations:

- Current month is based on UTC date at runtime.
- Month range is first day of current month through first day of next month, end exclusive.
- Upcoming bills range is today through today plus 14 days, inclusive.
- Total balance sums active account balances.
- Monthly income and expense sum all transactions in the current month by transaction type.
- Monthly net is income minus expense.
- Recent transactions include all transactions, even if related account/category was later archived, because joins do not filter archive flags.
- Active budgets include non-archived budgets for current month/year.
- Active savings goals include non-archived goals.

Empty states:

- No dashboard data loaded yet.
- No accounts yet.
- No recent transactions.
- No bills due soon.
- No active savings goals.
- No active budgets.

Release-v1 tests:

- Initial dashboard summary renders all cards.
- Refresh calls `get_dashboard_summary` and disables button while loading.
- No summary shows empty state.
- Current-month income/expense ignore other months.
- Total balance includes initial balances and transaction deltas.
- Upcoming bills include only bills from today through 14 days.
- Budget remaining becomes expense-toned when negative.
- Budget status badges match progress thresholds.
- Recent transactions are ordered by transaction date desc then creation desc.

## Manage Wallet

Source:

- `src/features/manage-wallet/pages/ManageWalletPage.tsx`
- `src-tauri/src/domain/accounts/service.rs`
- `src-tauri/src/domain/categories/service.rs`

Purpose:

- Manage accounts and categories that power all other features.

Accounts UI:

- Form in the Accounts card header.
- Account name input.
- Add Account button.
- Table columns:
  - Account.
  - Type.
  - Currency.
  - Balance.
  - Actions.
- Inline edit row for account name.
- Archive action uses a confirmation prompt.

Create account behavior:

- Frontend sends:
  - `name: accountName`
  - `currency: "MAD"`
  - `accountType: "cash"`
  - `initialBalanceMinor: 0`
- Backend trims name.
- Name is required.
- Initial balance defaults to zero and cannot be negative.
- Currency defaults to `MAD`, is uppercased.
- Account type defaults to `cash`, is lowercased.
- On success:
  - Form is cleared.
  - Accounts reload.
  - Success toast: "Account added."

Update account behavior:

- Requires non-empty ID.
- Requires existing account.
- Requires non-empty trimmed name.
- Keeps existing account type and currency unless provided.
- On success:
  - Editing state clears.
  - Accounts reload.
  - Success toast: "Account updated."

Archive account behavior:

- Confirmation text: "Archive this account? Existing transactions will stay unchanged."
- Requires non-empty ID and existing account.
- Sets `is_archived = 1`.
- Existing transactions remain unchanged.
- If the archived account was being edited, edit state clears.
- If it was selected in transaction form, selected transaction account clears.
- Accounts and transactions reload.
- Success toast: "Item archived."

Account list behavior:

- Only active accounts are shown in normal lists.
- Account balances are calculated from initial balance plus all linked transactions.
- Archived accounts are excluded from account list, dashboard active accounts, and normal selection controls.

Categories UI:

- Form in Categories card header.
- Category name input.
- Type select: expense or income.
- Add Category button.
- Table columns:
  - Category.
  - Type.
  - Actions.
- Inline edit row for name and type.
- Archive action uses a confirmation prompt.

Create category behavior:

- Backend trims name.
- Name is required.
- Type is lowercased and must be `income` or `expense`.
- Empty icon/color become null.
- On success:
  - Form is cleared.
  - Categories reload.
  - Success toast: "Category added."

Update category behavior:

- Requires non-empty ID.
- Requires existing category.
- Requires non-empty name.
- Type must be income or expense.
- Empty icon/color become null.
- On success:
  - Editing state clears.
  - Categories and budgets reload.
  - Success toast: "Category updated."

Archive category behavior:

- Confirmation text: "Archive this category? Existing transactions will stay unchanged."
- Requires non-empty ID and existing category.
- Sets `is_archived = 1`.
- Existing transactions remain unchanged.
- If selected in transaction form, selected category clears.
- Categories, transactions, and budgets reload.
- Success toast: "Item archived."

Release-v1 tests:

- Account create validation.
- Account create command payload.
- Account edit/cancel/update.
- Account archive confirm cancel and confirm accept.
- Archived account disappears from normal lists but existing transactions still render with names where joins allow.
- Category create validation.
- Category create command payload.
- Category edit type change.
- Category archive confirm cancel and confirm accept.
- Archived category cannot be used by new transactions/budgets/bills.
- Seed categories are present after fresh DB initialization.

## Transactions

Source:

- `src/features/transactions/pages/TransactionsPage.tsx`
- `src/features/transactions/pages/TransactionsRoutePage.tsx`
- `src-tauri/src/domain/transactions/service.rs`
- `src-tauri/src/repositories/transaction_repository.rs`

Purpose:

- Record, search, filter, sort, edit, and delete local transaction history.

Create transaction UI:

- Account select.
- Type select: expense or income.
- Category select filtered by selected transaction type.
- Amount input.
- Description input.
- Date input.
- Add Transaction button.

Create transaction behavior:

- Frontend validates amount with `normalAmountToMinor`.
- Invalid amount warns: "Enter a transaction amount greater than 0."
- Backend validation:
  - Account is required.
  - Category is required.
  - Transaction type must be `income` or `expense`.
  - Amount must be greater than zero.
  - Transaction date is required.
  - Account must exist.
  - Account must not be archived.
  - Category must exist.
  - Category must not be archived.
  - Category cannot be `Saving Contribution`.
  - Category type must match transaction type.
- Description is trimmed; empty becomes null.
- On success:
  - Amount and description clear.
  - Transactions reload.
  - Accounts reload for balance changes.
  - Budgets reload for spending changes.
  - Savings goals reload.
  - Recurring bills reload.
  - Success toast: "Transaction added."

Transaction table:

- Default local sort: date descending.
- Sortable headers:
  - Date.
  - Category.
  - Account.
  - Amount.
  - Type.
- Sorting is client-side over the loaded transaction list.
- Existing backend order is transaction date desc, created_at desc.
- Amounts render with `+` for income and `-` for expense.
- Description fallback is category name.
- Edit and delete icon buttons are shown per row.

Edit transaction behavior:

- Editing row replaces normal table row.
- Editable fields:
  - Date.
  - Description.
  - Account.
  - Type.
  - Category.
  - Amount.
- Changing type automatically chooses the first category of that type.
- Frontend validates amount.
- Backend validates same fields as create and requires existing transaction ID.
- On success:
  - Edit state clears.
  - Transactions, accounts, budgets, savings goals, and recurring bills reload.
  - Success toast: "Transaction updated."

Delete transaction behavior:

- Confirmation text: "Delete this transaction? This cannot be undone."
- Backend requires non-empty existing transaction ID.
- Transaction row is deleted permanently.
- On success:
  - Edit state clears if deleting edited transaction.
  - Transactions, accounts, budgets, savings goals, and recurring bills reload.
  - Success toast: "Transaction deleted."

Filters UI:

- Search.
- Category.
- Account.
- Type.
- Start date.
- End date.
- Apply filters.
- Clear filters.

Filter behavior:

- If no filter values are active, frontend calls `list_transactions`.
- If any filter is active, frontend calls `filter_transactions`.
- Backend filter validation:
  - Account ID, when present, must exist.
  - Category ID, when present, must exist.
  - Transaction type, when present, must be income or expense.
  - Start date cannot be after end date when both are present.
- Search matches:
  - Transaction description.
  - Account name.
  - Category name.
- Search is case-insensitive.
- End date is inclusive.
- Start date is inclusive.

Route filter behavior:

- `/transactions` can receive query params:
  - `accountId`
  - `categoryId`
  - `transactionType`
  - `startDate`
  - `endDate`
  - `search`
- Valid transactionType query values are `income` and `expense`.
- If any query filter exists, the route applies filters immediately.

Release-v1 tests:

- Create disabled when no accounts or no matching categories.
- Invalid amount warning.
- Successful create sends correct minor-unit payload.
- Category options update when switching type.
- Manual transaction cannot use `Saving Contribution`.
- Account balance updates after income and expense.
- Budget spent/remaining updates after expense.
- Edit row saves and cancels.
- Delete confirm cancel and accept.
- Filter by every field.
- Search matches description, account, and category.
- Start date after end date returns validation error.
- Query-param drilldown applies filters.
- Client-side sorting toggles asc/desc and resets direction for new key.

## Planning

Source:

- `src/features/planning/pages/PlanningPage.tsx`
- Budget, savings goal, and recurring bill domains.

Purpose:

- Plan future money movement through monthly budgets, savings goals, and recurring bills.

## Monthly Budgets

Budget create UI:

- Budget name.
- Expense category.
- Amount.
- Month.
- Year.
- Create Monthly Budget button.

Budget year options:

- Current year minus 2.
- Current year minus 1.
- Current year.
- Current year plus 1.
- Current year plus 2.

Budget backend validation:

- Name is required.
- Category is required.
- Category must exist.
- Category must be an expense category.
- Category must not be archived.
- Amount must be greater than zero.
- Month must be 1 through 12.
- Year must be 1 through 9999.

Budget calculations:

- `spentMinor` is sum of expense transactions in the same category and budget month.
- `remainingMinor` is amount minus spent.
- `progressPercentage` is spent divided by amount.
- `isNearLimit` is true when progress is >= 80%.
- `isExceeded` is true when progress is >= 100%.
- UI status:
  - Over budget: `isExceeded`.
  - Near limit: `isNearLimit`.
  - On track: otherwise.

Budget edit:

- Inline edit form supports name, category, amount, month, year.
- Same backend validation as create.
- On success:
  - Editing state clears.
  - Budgets reload.
  - Toast: "Monthly budget updated."

Budget archive:

- Confirmation text: "Archive this monthly budget?"
- Requires existing non-empty ID.
- Sets `is_archived = 1`.
- Active budget list reloads.

Release-v1 budget tests:

- Create validation and command payload.
- Non-expense category rejected.
- Archived category rejected.
- Month/year boundaries.
- Spent/remaining/progress calculations.
- 79.99%, 80%, 100%, and over-budget statuses.
- Edit save and cancel.
- Archive confirm cancel and accept.

## Savings Goals

Create UI:

- Goal name.
- Target amount.
- Current amount.
- Deadline date.
- Create Savings Goal button.

Backend validation:

- Name is required.
- Target amount must be greater than zero.
- Current amount cannot be negative.
- Current amount cannot exceed target amount.
- Empty deadline becomes null.

Goal display:

- Progress bar.
- Target.
- Current.
- Remaining.
- Progress.
- Optional deadline.
- Contribution controls.
- Edit and archive actions.

Edit behavior:

- Supports name, target, current, deadline.
- Same validation as create.
- On success reloads goals and shows "Savings goal updated."

Archive behavior:

- Confirmation text: "Archive this savings goal?"
- Archived goals are hidden from normal lists and dashboard.

Contribution behavior:

- User selects account and amount.
- Defaults account to first active account when no saved contribution state exists.
- Frontend validates amount with `normalAmountToMinor`.
- Backend validation:
  - Savings goal is required.
  - Savings goal must exist.
  - Savings goal must not be archived.
  - Account is required.
  - Account must exist.
  - Account must not be archived.
  - Contribution amount must be greater than zero.
  - Contribution cannot make current amount exceed target amount.
- Backend side effects in one DB transaction:
  - Finds active `Saving Contribution` expense category, creating it if missing.
  - Inserts an expense transaction against the selected account and saving category.
  - Uses provided transaction date or today's UTC date.
  - Uses provided description or `Contribution to {goal.name}`.
  - Increments `current_amount_minor`.
- Frontend side effects:
  - Clears contribution amount.
  - Reloads savings goals, transactions, accounts, categories.
  - Reloads dashboard only if dashboard is already loaded.
  - Toast: "Savings contribution recorded."

Release-v1 savings tests:

- Create validation for empty name, zero/negative target, negative current, current over target.
- Deadline empty/null handling.
- Edit validation.
- Archive confirm cancel and accept.
- Contribution creates expense transaction and updates account balance.
- Contribution creates/uses Saving Contribution category.
- Contribution cannot exceed target.
- Archived goal/account rejection.
- Manual transaction cannot create Saving Contribution records directly.

## Recurring Bills

Create UI:

- Bill name.
- Account.
- Expense category.
- Amount.
- Frequency.
- Next due date.
- Description.
- Add Recurring Bill button.

Allowed frontend frequency options:

- `daily`
- `weekly`
- `monthly`
- `yearly`

Backend validation:

- Name is required.
- Account is required.
- Account must exist.
- Account must not be archived.
- Category is required.
- Category must exist.
- Category must not be archived.
- Category must be expense.
- Amount must be greater than zero.
- Frequency must be `daily`, `weekly`, `monthly`, or `yearly`.
- Next due date is required.
- Next due date must use `YYYY-MM-DD`.
- Description is trimmed; empty becomes null.

Display:

- Title: `{bill.name} - {amount}`
- Frequency badge.
- Next due date.
- Last paid date or `Never`.
- Category name.
- Account name.
- Optional description.
- Mark paid, edit, and archive actions.

Edit behavior:

- Supports same fields as create.
- Same validation as create.
- On success reloads bills and shows "Recurring bill updated."

Archive behavior:

- Confirmation text: "Archive this recurring bill?"
- Archived bills are hidden from normal lists, dashboard upcoming bills, and reports.

Mark paid behavior:

- Requires existing non-archived bill.
- Revalidates linked account and expense category.
- Uses provided paid date or today's UTC date.
- Paid date must use `YYYY-MM-DD`.
- Description is bill description or `Payment for {bill.name}`.
- In one DB transaction:
  - Inserts expense transaction for bill amount, account, category, and paid date.
  - Updates `last_paid_date`.
  - Updates `next_due_date`.
- Next due date advancement:
  - daily: paid date + 1 day.
  - weekly: paid date + 7 days.
  - monthly: paid date + 1 month.
  - yearly: paid date + 12 months.
- Frontend reloads recurring bills, transactions, accounts, and budgets.
- Toast: "Recurring bill marked paid."

Release-v1 recurring tests:

- Create validation for empty name/account/category, bad amount, bad date, bad frequency.
- Non-expense category rejected.
- Archived account/category rejected.
- Edit save/cancel.
- Archive confirm cancel and accept.
- Mark paid creates expense transaction.
- Mark paid advances due date for daily, weekly, monthly, yearly.
- Last paid date updates.
- Account balance and budget progress update after mark paid.

## Reports

Source:

- `src/features/reports/pages/ReportsPage.tsx`
- `src/features/reports/hooks/useReports.ts`
- `src/features/reports/components/ReportCharts.tsx`
- `src-tauri/src/domain/reports/service.rs`
- `src-tauri/src/repositories/report_repository.rs`

Purpose:

- Analyze local wallet activity with filtered summaries, charts, and drilldowns.

Default filters:

- Start date: first day of the current local frontend month.
- End date: last day of the current local frontend month.
- Account: all.
- Category: all.
- Type: income and expenses.
- Currency: all.

Backend report filter validation:

- Start date is required.
- End date is required.
- Both dates must use `YYYY-MM-DD`.
- Start date cannot be after end date.
- Optional account/category/currency values are trimmed.
- Currency is uppercased.
- Optional transaction type is lowercased and must be income or expense.

Grouping:

- `daily` for ranges up to 31 days.
- `weekly` for ranges up to 180 days.
- `monthly` for ranges over 180 days.

Comparison period:

- Immediately preceding equivalent period.
- Same number of days as the selected range.

Report filters UI:

- Start date.
- End date.
- Account.
- Category.
- Type.
- Currency.
- Apply filters.
- Reset filters.
- Refresh reports.

Report sections:

- Mixed currency guidance.
- No matching activity empty state.
- Currency summary cards.
- Income and expense trend.
- Expenses by category.
- Income by category.
- Period comparison.
- Budget performance.
- Account statistics.
- Recurring-bill statistics.
- Savings-goal statistics.
- Yearly overview for full calendar year ranges.
- Matching transactions preview.

Currency summaries:

- Grouped by currency.
- Total income.
- Total expenses.
- Net cash flow.
- Savings rate: `(income - expenses) / income * 100`.
- Average daily spending: expenses divided by day count.
- Transaction count.

Trend chart:

- Grouped by backend-selected grouping.
- Builds empty periods for currencies present in transactions.
- If no transactions exist, defaults to `MAD`.
- Shows income and expenses.

Category totals:

- Separate income and expense category sets.
- Group by currency, category ID, category name.
- Percentage is category total divided by total of that type in that currency.
- Sorted by currency, total descending, category name.
- Donut chart shows top five categories plus "Other".
- Category row actions:
  - Filter: applies report category filter.
  - Open: navigates to transactions with category and type filters.

Period comparison:

- Includes currencies from current and previous periods.
- Shows current, previous, delta, and percentage change.
- Percentage change is null when previous value is zero.

Budget performance:

- Includes active budgets that overlap selected period.
- Counts matching expense transactions in each budget's month and category.
- If no matching spend currency exists, uses selected currency or `MAD`.
- Status:
  - `Over budget` when spent exceeds limit.
  - `Approaching limit` when percentage used >= 80%.
  - `On track` otherwise.

Account statistics:

- Group accounts by currency.
- Includes archived accounts in reports.
- Balance includes all linked transactions.
- Percentage of currency total is shown only when total is positive.
- Accounts are ordered active first, newest first.

Recurring-bill statistics:

- Includes active recurring bills whose next due date or last paid date is in the period.
- Grouped by currency.
- Expected bills/amount count due bills in period.
- Paid bills/amount count last-paid dates in period.
- Unpaid/upcoming amount count due bills not paid in period.

Savings-goal statistics:

- Active goals count excludes archived.
- Completed goals count includes any goal whose current amount is at least target, including archived.
- Total targets and overall progress use active goals.
- Recorded contributions are expense transactions in the `Saving Contribution` category within matching transactions.
- Contribution totals are grouped by currency.

Yearly overview:

- Only appears when selected range is exactly January 1 through December 31 of the same year.
- Shows 12 monthly points for each currency.
- Includes annual income, expenses, net cash flow.
- Includes average monthly income/expense.
- Includes highest expense month when any expenses exist.
- Includes best net cash flow month when any non-zero net exists.

Matching transactions:

- Preview shows first 12 matching transactions.
- "View matching transactions" opens `/transactions` with current applied report filters.
- Report transactions are ordered by transaction date desc, created_at desc.

Charts:

- SVG-based trend, donut, category bars, and yearly bar chart.
- Empty chart states are shown when data is absent.
- Multiple currencies render separate trend/yearly chart sections.

Release-v1 reports tests:

- Default current-month range.
- Apply, reset, refresh.
- Validation for missing dates, invalid dates, and start after end.
- Currency filter uppercasing.
- Mixed currency warning.
- Grouping thresholds: 31, 32, 180, 181 days.
- Currency summaries and savings rate with zero income.
- Previous-period comparison with zero previous value.
- Category filter and transactions drilldown.
- Budget performance with selected currency fallback.
- Account statistics include archived accounts.
- Recurring paid/unpaid stats.
- Savings contribution totals.
- Full-year yearly overview.
- Matching transaction preview limited to 12 rows.

## Settings and Data Tools

Source:

- `src/features/settings/pages/SettingsPage.tsx`
- `src/features/settings/components/DataBackupSection.tsx`
- `src-tauri/src/services/export`
- `src-tauri/src/services/import`
- `src-tauri/src/services/backup`

Settings sections:

- General.
- Appearance.
- Data & Backup.
- About.

General placeholders:

- Default currency select is disabled and fixed to `MAD - Moroccan dirham`.
- Date format select is disabled and fixed to `YYYY-MM-DD`.
- Number format input is disabled and fixed to `1,234.56`.
- Empty state says preferences are not active yet.

Appearance placeholders:

- Theme select is disabled and fixed to Light.
- Typography and style info blocks describe local font and visual style.

About:

- Shows local-first privacy and storage info.
- Restart onboarding button sets onboarding completed to false.

## Export Data

Frontend behavior:

- Button: Export Data.
- Calls `export_wallet_data`.
- Parses returned JSON before saving.
- Saves file with name `wallet-export-YYYY-MM-DD.json`.
- Uses `window.showSaveFilePicker` when available.
- Falls back to Blob and temporary anchor download.
- Success toast: "Wallet data was exported to a JSON file."

Export JSON shape:

- `version`: currently `1.0`.
- `exportedAt`: timestamp.
- `accounts`.
- `categories`.
- `transactions`.
- `budgets`.
- `recurringBills`.
- `savingsGoals`.

Export includes active and archived records.

Release-v1 export tests:

- Success path with file picker.
- Success path with Blob fallback.
- JSON parse failure.
- Backend error toast.
- Export includes archived data.
- Exported computed fields do not break import shape expectations.

## Import Data

Frontend workflow:

1. Select JSON file.
2. Validate and preview with `validate_import_file`.
3. Choose mode:
   - Merge.
   - Replace.
4. Confirm:
   - Merge needs no typed confirmation.
   - Replace requires typing `REPLACE`.
5. Result.

Import validation:

- File must be valid JSON.
- Top-level JSON must be an object.
- Required top-level properties:
  - `version`
  - `exportedAt`
  - `accounts`
  - `categories`
  - `transactions`
  - `budgets`
  - `recurringBills`
  - `savingsGoals`
- Version must match export version `1.0`.
- `exportedAt` is required.
- IDs inside each entity collection must be non-empty and unique.
- Accounts require name, account type, currency, non-negative initial balance, created/updated timestamps.
- Categories require name, income/expense type, timestamps.
- Transactions require account ID, category ID, income/expense type, positive amount, transaction date, timestamps.
- Budgets require name, category ID, positive amount, month 1-12, year 1970 or later, timestamps.
- Recurring bills require name, account ID, category ID, positive amount, frequency, next due date, timestamps.
- Savings goals require name, positive target, non-negative current amount, current not greater than target, timestamps.

Important release risk:

- Normal recurring bill creation accepts `daily`, `weekly`, `monthly`, `yearly`.
- Import validation currently accepts `weekly`, `monthly`, `quarterly`, `yearly`.
- This mismatch should be covered by release-v1 tests and resolved before final release.

Reference validation:

- In merge mode, referenced account/category IDs may exist either in the import file or current DB.
- In replace mode, referenced account/category IDs must exist in the import file because existing DB data will be cleared.

Preview behavior:

- Counts duplicates and conflicts.
- Warns when an imported account name already exists and will get an `(Imported)` suffix in merge mode.
- Category with same name and type maps to existing category and counts as duplicate.
- Category with same name but different type counts as conflict and will be skipped in merge mode.
- Duplicate transactions are identified by account, resolved category, date, amount, type, and description.
- Duplicate budgets are identified by category, month, and year.
- Duplicate recurring bills are identified by name, amount, next due date, and frequency.
- Existing savings goal names get an `(Imported)` suffix in merge mode.
- Empty export warns that it contains no wallet records.

Merge mode:

- Does not clear existing DB data.
- Skips existing IDs.
- Account name conflicts get unique suffixes:
  - `{name} (Imported)`
  - `{name} (Imported) 2`, etc.
- Savings goal name conflicts get the same suffix pattern.
- Category same name/type maps imported category ID to existing category ID.
- Category same name/different type is skipped.
- Transactions and budgets can use resolved category IDs.
- Duplicates are skipped.

Replace mode:

- Clears finance data in dependency order:
  - recurring bills
  - budgets
  - transactions
  - savings goals
  - categories
  - accounts
- Inserts all import records.
- Uses original IDs and names.
- Requires typed confirmation in UI.

Release-v1 import tests:

- Invalid JSON.
- Missing required top-level property.
- Unsupported version.
- Duplicate IDs per entity type.
- Missing references in merge and replace modes.
- Merge duplicate skip logic.
- Merge account/savings goal suffix logic.
- Merge category name/type mapping.
- Merge category same-name different-type skip.
- Replace clears old data and imports all records.
- Replace button disabled until exact `REPLACE`.
- Cancel resets modal state.
- Recurring frequency mismatch risk test.

## Backup and Restore

Create backup behavior:

- Button: Create Backup.
- Calls `create_wallet_backup`.
- Backend persists the latest unlocked data before returning backup JSON.
- Backup JSON is encrypted by default and has the same envelope shape as `wallet.encrypted.json`.
- Parses returned JSON before saving.
- Saves file with name `wallet-backup-YYYY-MM-DD.json`.
- Success toast: "Wallet backup was saved as a JSON file."

Backup JSON shape:

- `version`.
- `cipher`.
- `kdf`.
- `salt`.
- `verificationNonce`.
- `verification`.
- `payloadNonce`.
- `payload`.
- `createdAt`.
- `updatedAt`.

Validate backup behavior:

- Wallet must be unlocked.
- File must be a valid encrypted wallet envelope.
- Backup must decrypt with the active wallet key.
- Decrypted data is previewed through the import preview path.
- Preview returns backup version `1.0`, app version, data counts, duplicates, conflicts, and warnings.

Restore workflow:

1. Select backup JSON file.
2. Validate and preview with `validate_backup_file`.
3. Warning explains current data will be replaced.
4. User must type `RESTORE`.
5. Calls `restore_wallet_backup`.
6. Backend creates safety backup JSON before replacing data.
7. Backend imports backup `data` in replace mode.
8. Result shows restored count and safety backup timestamp.
9. User can save safety backup with prefix `wallet-safety-backup`.

Release-v1 backup/restore tests:

- Backup success with file picker and Blob fallback.
- Backup backend error.
- Invalid encrypted backup JSON and missing envelope fields.
- Unsupported encrypted storage version/cipher/KDF.
- Preview forwards duplicates/conflicts/warnings.
- Restore button disabled until exact `RESTORE`.
- Restore creates encrypted safety backup before replacing.
- Restore result exposes encrypted safety backup JSON.
- Save safety backup success/failure.
- Restore cancel resets modal state.

## UI Components

Source:

- `src/components/ui`

Reusable components:

- `AppButton`.
- `IconButton`.
- `AppCard`.
- `StatCard`.
- `AppInput`.
- `AppSelect`.
- `AppModal`.
- `AppTable`.
- `TableHeader`.
- `TableBody`.
- `TableCell`.
- `AppBadge`.
- `FormField`.
- `FormSection`.
- `FilterChip`.
- `EmptyState`.
- `ProgressBar`.
- `ToastProvider`.
- `AppToast`.

Expected behavior:

- Buttons expose variants and disabled states.
- Icon buttons use accessible labels.
- Inputs and selects support accessible labels and errors.
- Modals open/close predictably.
- Tables support horizontal overflow for fixed minimum widths.
- Badges visually encode income, expense, success, warning, neutral, peach.
- Progress bars support primary, income, expense, warning, and peach tones.
- Toasts support success, error, warning, and info messages.

Release-v1 UI tests:

- Keyboard focus states.
- Modal close by explicit close button and overlay/escape if supported.
- Icon-only buttons have accessible names.
- Disabled buttons are not actionable.
- Tables do not overflow the viewport incoherently.
- Toast timing and manual dismissal.
- Forms remain usable at minimum window size and common smaller test viewports.

## Cross-Cutting Business Rules

Currency:

- Frontend account creation currently uses `MAD`.
- Backend defaults empty currency to `MAD`.
- Backend uppercases currency values.
- Reports separate totals by currency and never combine currencies by exchange rate.

Archived records:

- Normal account/category/budget/savings/recurring lists hide archived records.
- Existing transactions stay unchanged when accounts/categories are archived.
- New manual transactions cannot use archived accounts or categories.
- New budgets cannot use archived categories.
- New recurring bills cannot use archived accounts or categories.
- Savings contributions cannot use archived goals or accounts.
- Reports account statistics include archived accounts.
- Export includes archived records.

Seeded categories:

- `Recurring Bills` exists after database initialization.
- `Saving Contribution` exists after database initialization.
- If `Saving Contribution` is missing, a savings contribution recreates it.
- Manual transaction creation refuses `Saving Contribution`.

Balances:

- Account balance equals initial balance plus income minus expense.
- Recurring bill payments and savings goal contributions create expense transactions, so they reduce account balance.
- Deleting a transaction changes account balances and budget progress.

Budgets:

- Only expense transactions count toward budget spending.
- Budget spending is category and month based.
- Budget status threshold starts at 80%.
- Exceeded threshold starts at 100%.

Dates:

- Frontend uses local JavaScript dates for form defaults and report default month.
- Backend dashboard and recurring default dates use UTC.
- Tests around month boundaries should avoid ambiguous dates or explicitly mock time.

Errors:

- Backend validation errors should be user-readable.
- Frontend hides stack/SQL/database-looking errors behind generic messages.
- Not-found errors become "That item could not be found. Refresh the page and try again."

## Existing Test Inventory

Frontend tests:

- `src/App.test.tsx`: app shell renders without real Tauri backend.
- `src/components/ui/__tests__/ui-components.test.tsx`: common UI components and toasts.
- `src/features/dashboard/__tests__/dashboard.test.tsx`: dashboard summary and empty states.
- `src/features/manage-wallet/__tests__/manage-wallet.test.tsx`: account/category rendering and submit behavior.
- `src/features/transactions/__tests__/transactions.test.tsx`: transaction page rendering, validation, submit, filters, sorting, empty state.
- `src/features/planning/__tests__/planning.test.tsx`: planning sections, month/year selects, budget amount validation, savings contribution UI.
- `src/features/reports/__tests__/reports.test.tsx`: report summaries, charts, mixed currency guidance, filters, states, drilldown.
- `src/features/settings/__tests__/settings.test.tsx`: settings sections, hidden workflow details, onboarding restart.
- `src/features/onboarding/__tests__/onboarding.test.tsx`: onboarding gate, steps, account/category behavior, import entry, completion.
- `src/features/onboarding/__tests__/responsive.test.tsx`: responsive/reduced-motion classes.
- `src/tests/data-portability/*.test.tsx`: export, import, backup, restore UI workflows.

Backend tests:

- `src-tauri/tests/unit/*`: accounts, categories, transactions, budgets, savings goals, recurring bills, reports, import, export, backup.
- `src-tauri/tests/integration/*`: commands, database integration, data portability.
- `src-tauri/tests/functional/*`: finance workflows, validation, error handling.

E2E tests:

- `e2e/specs/first-launch.spec.ts`
- `e2e/specs/manage-wallet.spec.ts`
- `e2e/specs/transactions.spec.ts`
- `e2e/specs/planning.spec.ts`
- `e2e/specs/full-workflow.spec.ts`

E2E runner:

- Requires `tauri-driver` on PATH.
- Runs real Tauri app through WebDriver/WebdriverIO.
- Uses test DB directory under `.tmp/wallet-e2e-data`.

## Release-v1 Acceptance Matrix

Critical paths:

- Fresh install opens onboarding, not dashboard.
- Guided onboarding can create an account, categories, optional budget, optional bill, and finish.
- User can create account/category manually after onboarding.
- User can create income and expense transactions and see balances update.
- User can filter/search/sort/edit/delete transactions.
- User can create a budget and see spending update after expense transactions.
- User can create a savings goal and record a contribution.
- User can create a recurring bill and mark it paid.
- Dashboard reflects all core data after refresh.
- Reports reflect transaction, budget, recurring, account, and savings data.
- Report drilldown opens matching filtered transactions.
- Export creates valid Wallet JSON.
- Import merge does not destroy existing data.
- Import replace requires confirmation and replaces data.
- Backup creates valid backup JSON.
- Restore requires confirmation, creates safety backup, and restores backup data.
- Restart onboarding works from Settings.

Regression tests to prioritize before release:

- Amount parsing and minor-unit conversion.
- Account balance recalculation after every transaction-like side effect.
- Category type matching for transactions.
- Archive behavior across every entity.
- Data portability with archived records.
- Import duplicate/conflict behavior.
- Report date range boundaries.
- Mixed currency reports.
- Recurring due-date advancement.
- Savings contribution cannot exceed target.
- Frontend mock state stays in sync with `WalletAppState`.

## Known Release Risks To Test Or Fix

1. Recurring bill import frequency mismatch:
   - Live recurring bill domain supports `daily`, `weekly`, `monthly`, `yearly`.
   - Import validation supports `weekly`, `monthly`, `quarterly`, `yearly`.
   - This can reject valid exported daily bills or accept quarterly bills that normal app creation cannot create.

2. Frontend local date defaults vs backend UTC date calculations:
   - Frontend report defaults use local `Date`.
   - Backend dashboard and recurring payment defaults use `Utc::now()`.
   - Tests around midnight/month boundaries should explicitly control dates.

3. Transaction date validation is weaker than recurring/report date validation:
   - Transaction domain only checks non-empty date.
   - Reports and recurring payments parse strict `YYYY-MM-DD`.
   - Malformed transaction dates can affect report grouping or budget inclusion.

4. Category duplicate rules differ by path:
   - Onboarding skips existing same name/type.
   - Category domain itself does not enforce uniqueness.
   - Import has duplicate/conflict logic.
   - Manual create can create duplicate categories unless database constraints are added.

5. Account duplicate rules differ by path:
   - Account domain does not enforce unique names.
   - Import merge suffixes account name conflicts.

6. Export includes computed display fields:
   - Exported budgets, accounts, goals, and bills include frontend-facing computed fields, while import DTO ignores many of them.
   - Tests should ensure exported JSON can be imported cleanly.

7. Report savings completed count includes archived completed goals:
   - Active goals count excludes archived.
   - Completed goals count checks all goals.
   - Confirm this is intended before v1.

8. Normal list APIs hide archived records:
   - This is correct for the app UI, but release tests should confirm archived data still exports and reports account statistics can include archived accounts.

## Suggested Test File Plan

Frontend unit/feature tests:

- Add focused tests for `walletHelpers`.
- Expand `useWalletApp` tests around reload side effects and error sanitization.
- Add route query filter tests for `TransactionsRoutePage`.
- Add confirmation-cancel tests for archive/delete flows.
- Add data portability tests for replace confirmation exact text.
- Add reports date grouping threshold tests.

Rust unit/integration tests:

- Add transaction malformed-date tests or add strict validation first.
- Add import/export round-trip tests with all entity types, archived records, and daily recurring bills.
- Add recurring import frequency mismatch regression.
- Add dashboard boundary tests for current month/upcoming bills with fixed dates if possible.
- Add report yearly overview tests for full-year and non-full-year ranges.
- Add account/category duplicate policy tests once intended behavior is decided.

E2E tests:

- First launch to completed onboarding.
- Manual account/category/transaction/budget/dashboard flow.
- Savings contribution flow including generated transaction.
- Recurring bill mark-paid flow including due date advance.
- Reports filter to transactions drilldown.
- Export/import/restore smoke flow using test data directory.

## Pre-Release Verification Commands

Run from repository root unless noted:

```bash
npm ci
npm run typecheck
npm run test
npm run test:coverage
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run test:e2e
```

E2E prerequisite:

```bash
cargo install tauri-driver
```

## Release-v1 Definition Of Done

The app is ready for v1 testing signoff when:

- All critical paths pass locally and in CI.
- Exported JSON can be imported into a clean DB.
- Backup restore creates and exposes a safety backup.
- Reports match independently calculated fixtures.
- All archive paths preserve historical transaction correctness.
- All destructive actions require confirmation.
- The recurring frequency import mismatch is fixed or explicitly accepted with tests.
- The release workflow can build Windows and macOS artifacts from a version tag.




