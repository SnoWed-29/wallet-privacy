# Wallet Project Agent Instructions

## Project Identity

Wallet is a local-first, privacy-first desktop personal finance application.

Use the phrase "Private by design" when discussing privacy. Do not describe the
app as providing perfect privacy.

The app must work without a mandatory online account, cloud backend, bank
connection, or internet connection. Data is user-owned and stored locally.

Keep the project focused on personal finance unless the user explicitly requests
a different module.

## Current Stack

- Tauri 2 desktop app
- React 19
- React Router
- TypeScript
- Vite
- Tailwind CSS
- Rust
- SQLite
- SQLx
- Vitest and Testing Library
- WebdriverIO E2E tests through `tauri-driver`

Use `npm.cmd` on Windows PowerShell when invoking npm scripts if `npm.ps1`
execution policy blocks plain `npm`.

## Current Product Surface

Implemented and wired:

- Onboarding gate with local completion state in `wallet.onboardingCompleted`
- Desktop app shell with sidebar, topbar, and routed feature pages
- Routes: `/dashboard`, `/transactions`, `/manage`, `/planning`, `/reports`,
  `/settings`
- Dashboard summary with totals, current-month income/expense/net, account
  balances, recent transactions, active budgets, upcoming recurring bills, and
  active savings goals
- Account and category management
- Transaction creation, editing, deletion, search, filtering, and client-side
  table sorting
- Budgets, savings goals, savings goal contributions, recurring bills, and
  mark-recurring-bill-paid flow
- Local JSON export, merge import, replace import, backup creation, backup
  validation, and destructive restore with safety backup
- Reports and analytics with filtered summaries, trend/category charts, period
  comparison, budget/account/bill/savings statistics, yearly overview, and
  matching transaction drill-down
- Shared design system components under `src/components/ui`
- Warm glass visual redesign using the local Funnel Display font and Tailwind
  tokens

Currently placeholder or not implemented:

- Report export behavior is not implemented yet.
- General settings and appearance controls are placeholders and are not
  persisted.
- Export/import/backup files are plain Wallet JSON; encryption is not
  implemented.
- There is no cloud sync, account authentication, bank integration, mobile app,
  notification system, calendar integration, reminder daemon, or recurring
  transaction automation beyond manual "mark paid".

Do not implement placeholder or roadmap items unless explicitly requested.

## Architecture

Use the existing modular monolith.

Primary flow:

```text
React -> Tauri command -> Rust service -> Rust repository -> SQLite
```

Rules:

- React never accesses SQLite directly.
- React never executes SQL.
- Tauri commands stay thin and delegate to services.
- Rust services own validation, request normalization, and business rules.
- Repositories own explicit SQL and parameter binding.
- Shared app state is `AppState` with a `SqlitePool`.
- Use transactions for multi-step mutations and destructive imports/restores.
- Add schema changes only through SQLx migrations.
- Avoid broad refactors during feature work.

## Key Paths

- Frontend entry: `src/main.tsx`
- Routes and app providers: `src/App.tsx`
- App orchestration hook: `src/hooks/useWalletApp.ts`
- Wallet context: `src/features/wallet/WalletAppContext.tsx`
- Shared wallet DTOs: `src/types/wallet.ts`
- Money/date/form helpers: `src/utils/walletHelpers.ts`
- Layout components: `src/components/layout`
- UI primitives: `src/components/ui`
- Feature pages: `src/features/*/pages`
- Backend entry: `src-tauri/src/lib.rs`
- Tauri commands: `src-tauri/src/commands`
- Domain services/models/DTOs: `src-tauri/src/domain`
- Repositories: `src-tauri/src/repositories`
- Cross-domain services: `src-tauri/src/services`
- Migrations: `src-tauri/migrations`
- Frontend tests: `src/**/*.test.tsx` and `src/**/*.test.ts`
- Backend tests: `src-tauri/tests`
- Desktop E2E tests: `e2e`

## Frontend Architecture

`src/App.tsx` wraps the app with:

- `ToastProvider`
- `WalletAppProvider`
- `OnboardingGate`
- `AppLayout`
- React Router routes

`useWalletApp.ts` is the main frontend orchestration layer. It owns:

- Loaded wallet data
- Form state
- Editing state
- Saving/loading/deleting flags
- Tauri `invoke` calls
- Toast notifications
- Wallet reloads after mutations
- Amount conversion between normal strings and minor units
- Confirmation prompts for destructive actions

Keep feature pages mostly presentational. Prefer adding state and command wiring
to `useWalletApp.ts` when a feature belongs to the global wallet workflow.

Use `showToast` for success and error feedback. Errors displayed in the UI
should be useful but should not dump sensitive data.

## Design System

Follow `docs/ui-design-system.md`.

Current design direction:

- Warm glass surfaces
- Local Funnel Display font
- Primary `#9C43A6`, coral `#DB515E`, peach `#FEA86A`
- Tailwind theme tokens under `app.*`
- Shared CSS variables in `src/styles/globals.css`
- Lucide icons only
- App cards, buttons, inputs, selects, modals, tables, badges, toasts, progress,
  empty states, and form helpers from `src/components/ui`

Frontend rules:

- Prefer shared UI primitives over raw repeated styling.
- Use existing Tailwind tokens instead of hard-coded colors when possible.
- Preserve responsive behavior at the minimum supported app size.
- Keep labels, accessible names, focus states, and test selectors stable when
  feasible.
- Do not introduce a new icon set, charting library, state library, design
  framework, or font without a clear request.
- Avoid changing Rust financial logic for purely visual changes.

## Onboarding

Onboarding lives under `src/features/onboarding`.

Flow:

- Welcome
- Account
- Categories
- Budget
- Recurring bills
- Complete

The account step creates a `cash` account in `MAD` with initial balance `0`.
Category, budget, and recurring bill steps are optional. The welcome step can
open the existing import workflow. Successful import during setup reloads wallet
data and jumps to completion.

Completion is stored in local storage under `wallet.onboardingCompleted`.
Settings can restart onboarding by setting that value to false.

## Backend Commands

Registered Tauri commands include:

- Accounts: `create_account`, `update_account`, `archive_account`,
  `list_accounts`
- Categories: `create_category`, `update_category`, `archive_category`,
  `list_categories`
- Transactions: `create_transaction`, `update_transaction`,
  `delete_transaction`, `list_transactions`, `filter_transactions`
- Budgets: `create_budget`, `list_budgets`, `update_budget`, `archive_budget`
- Savings goals: `create_savings_goal`, `list_savings_goals`,
  `update_savings_goal`, `archive_savings_goal`,
  `contribute_to_savings_goal`
- Recurring bills: `create_recurring_bill`, `list_recurring_bills`,
  `update_recurring_bill`, `archive_recurring_bill`,
  `mark_recurring_bill_paid`
- Dashboard: `get_dashboard_summary`
- Export/import/backup: `export_wallet_data`, `validate_import_file`,
  `import_wallet_data`, `create_wallet_backup`, `validate_backup_file`,
  `restore_wallet_backup`

Add new commands in `src-tauri/src/commands`, register them in
`src-tauri/src/lib.rs`, and route them through services.

## Database

The runtime database file is `wallet.db` in the Tauri app data directory.

In test mode, `WALLET_TEST_MODE=true` makes the backend use
`WALLET_TEST_DATA_DIR` or a temp fallback instead of the real app data
directory.

Migrations:

- `0001_create_accounts.sql`
- `0002_create_categories.sql`
- `0003_create_transactions.sql`
- `0004_create_budgets.sql`
- `0005_create_savings_goals.sql`
- `0006_create_recurring_bills.sql`

SQLite foreign keys are enabled in connection options and with
`PRAGMA foreign_keys = ON`.

Default seeded expense categories after migrations:

- `Recurring Bills`
- `Saving Contribution`

Seeding is idempotent by category name.

## Money Rules

Never store money as floating point.

Use integer minor units everywhere:

- Rust: `i64`
- SQLite: `INTEGER`
- Frontend DTOs: numeric minor-unit fields
- User inputs: normal strings converted by `normalAmountToMinor` and
  `optionalNormalAmountToMinor`

Examples:

- `10.99 MAD` is stored as `1099`
- `150.00 MAD` is stored as `15000`

Use `formatMinor`, `minorToNormalAmount`, and related helpers for display and
edit forms.

## Domain Rules

Accounts:

- Name is required after trimming.
- Initial balance defaults to `0` and cannot be negative.
- Currency defaults to `MAD` and is uppercased.
- Account type defaults to `cash` and is lowercased.
- Account balances are derived from initial balance plus income minus expenses.
- Normal account listings hide archived accounts.
- Archived accounts cannot receive new transactions.

Categories:

- Name is required after trimming.
- Type must be `income` or `expense`.
- Blank icon/color values become `NULL`.
- Normal category listings hide archived categories.
- Archived categories cannot be used for transactions, budgets, or recurring
  bills.
- `Saving Contribution` is reserved for savings goal contribution transactions.

Transactions:

- Account and category are required and must exist.
- Type must be `income` or `expense`.
- Category type must match transaction type.
- Amount must be greater than `0`.
- Transaction date is required.
- Blank descriptions become `NULL`.
- Manual transactions cannot use the `Saving Contribution` category.
- Filters can combine account, category, type, date range, and search.
- Search matches description, account name, and category name.

Budgets:

- Name, expense category, positive amount, month, and year are required.
- Month must be `1..12`; year must be valid.
- Budgets are monthly limits tied to an expense category, not an account.
- Budgets do not move money and do not create transactions.
- Spent/remaining/progress values are derived from matching expense
  transactions in the budget month.
- Near limit is `>= 80%`; exceeded is `>= 100%`.

Savings goals:

- Name is required.
- Target amount must be positive.
- Current amount defaults to `0`, cannot be negative, and cannot exceed target.
- Deadline is optional.
- Contributions require an active goal and active account.
- Contributions must be positive and cannot exceed the remaining target.
- Contributions create real expense transactions using `Saving Contribution`.
- Contribution updates run in a database transaction and roll back as one unit.

Recurring bills:

- Name, active account, active expense category, positive amount, frequency, and
  next due date are required.
- Frequency must be `daily`, `weekly`, `monthly`, or `yearly`.
- Dates must use `YYYY-MM-DD`.
- Marking paid creates a real expense transaction, updates `last_paid_date`, and
  advances `next_due_date` from the paid date.
- Daily advances 1 day, weekly 7 days, monthly 1 calendar month, yearly 12
  months.
- Payment updates run in a database transaction and roll back as one unit.

Dashboard:

- Read-only.
- Current month is determined in Rust.
- Monthly income/expense/net are computed from current-month transactions.
- Total balance uses active account balances.
- Recent transactions show the latest 10 by transaction date and creation time.
- Active budgets are current-month, non-archived budgets.
- Upcoming recurring bills are active bills due in the next 14 days.
- Active savings goals are non-archived goals with calculated progress.

## Data Portability

Settings -> Data & Backup supports:

- Export Wallet Data
- Import Wallet Data
- Create Backup
- Restore Backup

Export:

- Command: `export_wallet_data`
- Produces pretty JSON with `version`, `exportedAt`, accounts, categories,
  transactions, budgets, recurring bills, and savings goals.
- Current export/import data version is `1.0`.
- Empty collections are included as empty arrays.
- Export files are not encrypted by Wallet.

Import:

- Commands: `validate_import_file`, `import_wallet_data`
- Accepts Wallet JSON exports only.
- Validates JSON syntax, version, required fields, duplicate IDs, and entity
  references before import.
- Supports `merge` and `replace`.
- Merge preserves existing data, skips duplicates, and uses `(Imported)` suffixes
  for supported account and savings goal name conflicts.
- Replace clears finance data and imports the file inside a database
  transaction.

Backup and restore:

- Commands: `create_wallet_backup`, `validate_backup_file`,
  `restore_wallet_backup`
- Backup wraps the export format with `backupVersion`, `createdAt`,
  `appVersion`, and data counts.
- Current backup wrapper version is `1.0`.
- Restore validates first, creates a safety backup of current data, then reuses
  replace import.
- Restore is destructive and must require explicit UI confirmation.
- Safety backup JSON is returned to the frontend so the user can save it.

## Security And Privacy Rules

Always prioritize:

- Data integrity
- Input validation
- Explicit permissions
- Safe database access
- User-owned local data

Never:

- Log sensitive financial data.
- Store secrets in source.
- Add analytics, tracking, sync, cloud storage, auth, bank integrations, or
  network features without an explicit request.
- Add encryption casually. Design it deliberately if requested.
- Build SQL by string concatenation.
- Expose arbitrary SQL to the frontend.

## Testing And Verification

Frontend:

```text
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:coverage
npm.cmd run build
```

Backend:

```text
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

Desktop build:

```text
npm.cmd run tauri -- build
```

Desktop E2E:

```text
cargo install tauri-driver
npm.cmd run test:e2e
```

E2E tests are desktop Tauri tests, not browser-only Vite tests. The runner uses
`WALLET_TEST_MODE=true` and stores its database under `.tmp/wallet-e2e-data`.
If `tauri-driver` is missing, `npm.cmd run test:e2e` exits with setup
instructions.

Run checks appropriate to the files changed:

- UI-only change: typecheck, relevant Vitest tests, build.
- Rust domain or repository change: fmt, clippy, Rust tests.
- Import/export/backup change: frontend portability tests plus Rust
  import/export/backup/data portability tests.
- Full cross-layer feature: frontend checks, Rust checks, and Tauri build.

## Current Test Coverage Shape

Frontend tests cover:

- App shell and mocked Tauri backend startup
- Shared UI components and toasts
- Dashboard
- Transactions
- Manage Wallet
- Planning
- Settings
- Onboarding and responsive onboarding behavior
- Data export, import, backup, and restore UI flows

Rust tests cover:

- Unit validation for accounts, categories, transactions, budgets, savings
  goals, recurring bills, export, import, and backup
- Functional finance workflows and validation errors
- Integration coverage for isolated SQLite databases, command payload behavior,
  and data portability

E2E specs cover:

- First launch
- Manage wallet
- Transactions
- Planning
- Full workflow

## Feature Work Rules

Before implementing:

1. Inspect the existing code and tests.
2. Prefer existing patterns over new abstractions.
3. Identify whether the change is frontend-only, backend-only, or cross-layer.
4. Keep edits scoped to the feature.
5. Add or update focused tests when behavior changes.

When adding backend behavior:

- Add DTO fields deliberately.
- Validate in the service layer.
- Keep command handlers thin.
- Use repository methods for SQL.
- Use transactions for multi-step financial mutations.
- Update export/import/backup schemas if the new entity or field must be
  portable.
- Add migrations for schema changes.

When adding frontend behavior:

- Reuse `useWalletApp.ts` for wallet-wide state and Tauri command calls.
- Reuse UI primitives from `src/components/ui`.
- Keep route pages readable and feature-focused.
- Preserve the design system and accessibility conventions.
- Handle loading, empty, success, error, disabled, and destructive confirmation
  states.

When changing data portability:

- Keep export/import versions intentional.
- Validate before import or restore.
- Do not partially apply destructive operations.
- Preserve user data on validation or import failure.
- Update `docs/data-portability.md` and tests when the contract changes.

## Current Window And Runtime Notes

Tauri window config in `src-tauri/tauri.conf.json`:

- Default size: `1440x900`
- Minimum size: `1100x700`
- Resizable and maximizable
- Starts maximized in config and is also maximized during setup as a runtime
  fallback
- Dev URL: `http://localhost:1420`

Do not assume browser-only behavior is enough for desktop verification when a
change touches Tauri commands, filesystem flows, window behavior, or E2E-only
paths.

## Roadmap Guardrails

Future work requires explicit user approval:

- Report export
- Notifications and reminders
- Calendar integration
- Encryption
- Cloud sync
- Authentication
- Bank integrations
- Mobile support
- New non-finance modules such as notes, passwords, inventory, or documents

When in doubt, preserve the local-first finance app and ask before expanding
scope.
