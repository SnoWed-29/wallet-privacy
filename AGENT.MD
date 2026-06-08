# Wallet Project Agent Instructions

## Project Overview

Wallet is a local-first, privacy-first desktop personal finance application.

The application is open source and stores user data locally on the user's machine.

The project must work without a mandatory online account, cloud backend, or internet connection.

Current technology stack:

* Tauri 2
* React
* TypeScript
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

Included:

* SQLite initialization
* SQLx migrations
* Accounts module
* Create account
* List accounts
* Basic React UI for testing

Excluded:

* Categories
* Transactions
* Budgets
* Savings goals
* Recurring bills
* Reports
* Encryption
* Cloud synchronization
* Mobile support
* Authentication
* Bank integrations

Do not implement excluded features unless explicitly requested.

---

## Architecture

Use a modular monolith.

Communication flow:

React
→ Tauri Command
→ Service
→ Repository
→ SQLite

Rules:

* React never accesses SQLite directly.
* React never executes SQL.
* Rust contains business rules.
* Rust validates all requests.
* Repositories contain database queries.
* Commands should remain thin.

---

## Backend Folder Structure

Use the following structure:

src-tauri/src/

main.rs
lib.rs

database/
mod.rs
connection.rs

commands/
mod.rs
accounts.rs

domain/
mod.rs

accounts/
mod.rs
model.rs
dto.rs
service.rs

repositories/
mod.rs
account_repository.rs

state/
mod.rs
app_state.rs

errors/
mod.rs
app_error.rs

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

* Name is required.
* Initial balance cannot be negative.
* Currency defaults to MAD.
* Account type defaults to cash.
* Archived accounts are hidden from normal account listings.

---

## Money Handling Rules

Never store money using floating point numbers.

Incorrect:

10.99

Correct:

1099

Store all monetary values using integer minor units.

Examples:

* 10.99 MAD → 1099
* 150.00 MAD → 15000

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

Always:

* Use parameterized queries
* Use transactions where appropriate
* Enable foreign keys
* Validate data before insertion

Never:

* Build SQL using string concatenation
* Expose arbitrary SQL to the frontend

---

## Frontend Rules

Current frontend scope:

* Account creation form
* Account list
* Error display

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

After frontend modifications run:

npm run tauri dev

Expected behavior:

* Application starts successfully
* SQLite database is created automatically
* Migrations run automatically
* Accounts can be created
* Accounts can be listed
* Data persists after restart

---

## Definition of Success for Current Phase

A user can:

1. Launch the application
2. Create an account
3. View existing accounts
4. Restart the application
5. See previously created accounts

without requiring internet access.

Only after this is complete should development move to Categories and Transactions.
