# Wallet Project Agent Instructions

## Project Overview

Wallet is a local-first, privacy-first desktop personal finance application.

The application is open source and stores user data locally on the user's machine.

The project must work without a mandatory online account, cloud backend, or internet connection.

Current technology stack:

* Tauri 2
* React 19
* TypeScript
* Vite
* Rust
* SQLite
* SQLx

---

## Product Vision

Wallet helps users:

* Track income and expenses
* Manage multiple accounts and wallets
* Organize transactions using categories
* Create budgets
* Track recurring bills and subscriptions
* Define savings goals
* View financial reports
* Import and export data
* Create encrypted backups

Future modules may include:

* Secure notes
* Password management
* Personal inventory
* Document storage

For now, remain focused on the personal finance application.

---

## Core Principles

Always respect these principles:

* Local-first
* Privacy-first
* Offline-first
* Open source
* User-owned data
* No mandatory cloud services
* No mandatory user account
* Strong data portability
* Maintainable architecture
* Security before convenience
* Data integrity before advanced features

Never describe the application as providing perfect privacy.

Use the term:

"Private by design"

when discussing privacy features.

---

## Development Philosophy

Build the application in phases.

Do not introduce unnecessary complexity.

Prefer:

* Simplicity
* Maintainability
* Explicit code
* Clear architecture

over:

* Premature optimization
* Complex abstractions
* Enterprise patterns that provide little value

---

## Current Development Phase

Phase 1:

Core financial foundation.

Implemented:

* SQLite initialization in the Tauri app data directory
* SQLx migrations embedded from `src-tauri/migrations`
* Shared application state with a SQLite connection pool
* Accounts module
* Create account
* List non-archived accounts
* Categories module
* Create category
* List non-archived categories
* Basic React UI for manually testing accounts and categories

Not yet implemented:

* Account editing
* Account archiving UI or command
* Category editing
* Category archiving UI or command
* Transactions
* Budgets
* Savings goals
* Recurring bills
* Reports
* Import/export
* Backups
* Encryption
* Cloud synchronization
* Mobile support
* Authentication
* Bank integrations

Do not implement not-yet-implemented features unless explicitly requested.

---

## Architecture

Use a modular monolith.

Communication flow:

React
-> Tauri Command
-> Service
-> Repository
-> SQLite

Rules:

* React never accesses SQLite directly.
* React never executes SQL.
* Rust contains business rules.
* Rust validates all requests.
* Repositories contain database queries.
* Commands should remain thin.
* Domain modules own validation and request normalization.
* Repository methods should use explicit SQL and parameter binding.

---

## Backend Folder Structure

Current backend structure:

src-tauri/src/

main.rs
lib.rs

database/
mod.rs
connection.rs

commands/
mod.rs
accounts.rs
categories.rs

domain/
mod.rs

accounts/
mod.rs
model.rs
dto.rs
service.rs

categories/
mod.rs
model.rs
dto.rs
service.rs

repositories/
mod.rs
account_repository.rs
category_repository.rs

state/
mod.rs
app_state.rs

errors/
mod.rs
app_error.rs

Migrations:

src-tauri/migrations/
0001_create_accounts.sql
0002_create_categories.sql

---

## Tauri Commands

Currently registered commands:

* `create_account`
* `list_accounts`
* `create_category`
* `list_categories`

Command handlers should delegate to services and avoid business logic.

---

## Account Module

Current account fields:

* id
* name
* account_type
* currency
* initial_balance_minor
* is_archived
* created_at
* updated_at

Rules:

* Name is required after trimming.
* Initial balance defaults to 0.
* Initial balance cannot be negative.
* Currency is uppercased after trimming.
* Currency defaults to MAD when omitted or blank.
* Account type is lowercased after trimming.
* Account type defaults to cash when omitted or blank.
* New accounts are created with `is_archived = false`.
* Archived accounts are hidden from normal account listings.
* Accounts are listed newest first by `created_at`.

Current limitations:

* The frontend creates only cash accounts in MAD with an initial balance of 0.
* There is no edit, archive, restore, or delete flow yet.

---

## Category Module

Current category fields:

* id
* name
* category_type
* icon
* color
* is_archived
* created_at
* updated_at

Rules:

* Name is required after trimming.
* Category type is lowercased after trimming.
* Category type must be either `income` or `expense`.
* Blank icon values are stored as NULL.
* Blank color values are stored as NULL.
* New categories are created with `is_archived = false`.
* Archived categories are hidden from normal category listings.
* Categories are listed newest first by `created_at`.

Current limitations:

* The frontend supports only name and type input.
* The frontend sends blank icon and color values.
* There is no edit, archive, restore, or delete flow yet.
* Categories are not connected to transactions yet because transactions do not exist.

---

## Money Handling Rules

Never store money using floating point numbers.

Incorrect:

10.99

Correct:

1099

Store all monetary values using integer minor units.

Examples:

* 10.99 MAD -> 1099
* 150.00 MAD -> 15000

Use:

* i64 in Rust
* INTEGER in SQLite

---

## Database Rules

Use:

* SQLite
* SQLx
* Explicit SQL queries
* Migrations

Current database behavior:

* The database file is `wallet.db`.
* The database is created in the Tauri app data directory.
* The database is created automatically if missing.
* Migrations run during Tauri setup.
* Foreign keys are enabled in the SQLite connection options and with `PRAGMA foreign_keys = ON`.

Always:

* Use parameterized queries.
* Use transactions where appropriate.
* Enable foreign keys for new connections.
* Validate data before insertion.
* Store timestamps as RFC 3339 strings unless the project chooses a different convention later.

Never:

* Build SQL using string concatenation.
* Expose arbitrary SQL to the frontend.
* Add schema changes without a migration.

---

## Frontend Rules

Current frontend scope:

* Single React screen in `src/App.tsx`
* Account creation form
* Account list
* Category creation form
* Category type selector for income or expense
* Category list
* Error display
* Basic saving state for create actions
* Empty states for accounts and categories
* Responsive stacked form rows on narrow screens

Keep UI simple.

Do not add:

* Routing
* Tailwind redesigns
* Dashboards
* Charts
* State libraries
* Advanced layouts

until requested.

Focus on functionality first.

---

## Code Quality Rules

When implementing features:

1. Inspect existing code first.
2. Reuse current architecture.
3. Make the smallest necessary change.
4. Avoid unrelated refactors.
5. Explain changes after implementation.

Prefer readability over cleverness.

This project should remain approachable for developers who are new to Rust and Tauri.

---

## Security Rules

Always prioritize:

* Data integrity
* Input validation
* Explicit permissions
* Safe database access

Never:

* Log sensitive financial information
* Store secrets in source code
* Store encryption keys in plaintext files

Future encryption features should be designed carefully and not added prematurely.

---

## Testing

After backend modifications run:

cargo check

from `src-tauri`.

After frontend modifications run:

npm run build

For full manual application verification run:

npm run tauri dev

Expected behavior:

* Application starts successfully.
* SQLite database is created automatically.
* Migrations run automatically.
* Accounts can be created.
* Accounts can be listed.
* Categories can be created.
* Categories can be listed.
* Data persists after restart.

---

## Definition of Success for Current Phase

A user can:

1. Launch the application.
2. Create an account.
3. View existing accounts.
4. Create income and expense categories.
5. View existing categories.
6. Restart the application.
7. See previously created accounts and categories.

without requiring internet access.

After this foundation is stable, development can move to transactions.
