# Data Portability

Wallet supports local JSON export, merge import, and replace/restore from a
previous Wallet export file.

## Purpose

Data portability keeps Wallet local-first and user-owned. A user can export all
supported finance data into a single JSON file, then later import or restore
from that file.

This version does not include:

- Encryption
- Cloud storage
- CSV export

## Export

The export feature creates a pretty-printed JSON file.

Flow:

1. The user opens `Settings -> Data & Backup`.
2. The user clicks `Export Wallet Data`.
3. The frontend calls:

   ```text
   export_wallet_data
   ```

4. The Rust export service reads supported wallet data from SQLite.
5. The service builds a `WalletExport` DTO.
6. The DTO is serialized as JSON.
7. The frontend saves the JSON file.
8. The app shows a success or error notification.

## Export Format

The exported file uses this top-level structure:

```json
{
  "version": "1.0",
  "exportedAt": "2026-06-11T00:00:00Z",
  "accounts": [],
  "categories": [],
  "transactions": [],
  "budgets": [],
  "recurringBills": [],
  "savingsGoals": []
}
```

Collections are always included. If a table has no rows, the matching field is
an empty array.

## Import Preview

Before importing, the frontend sends the selected file to:

```text
validate_import_file
```

The backend validates:

- JSON syntax
- Export version
- Required top-level properties
- Data types
- Required entity fields
- Duplicate IDs inside the file
- References between entities

The command returns a preview with:

- Entity counts
- Detected duplicates
- Detected conflicts
- Warnings

## Merge Import

Merge import adds data from the selected file to the current database.

It does:

- Preserve existing data.
- Add missing records.
- Skip exact duplicates.
- Safely handle name conflicts where possible.
- Return a result summary with imported and skipped counts.

Conflict handling:

- Accounts with the same name are imported with an `(Imported)` suffix.
- Categories with the same name and type are treated as duplicates and skipped.
- Categories with the same name but different type are treated as conflicts and
  skipped.
- Transactions are skipped when date, amount, type, account/category reference,
  and description match an existing transaction.
- Budgets are skipped when category, month, and year match an existing budget.
- Recurring bills are skipped when name, amount, due date, and frequency match.
- Savings goals with the same name are imported with an `(Imported)` suffix.

## Replace / Restore

Restore means replacing the current Wallet finance data with the selected export
file.

It does:

- Validate the file first.
- Show a destructive confirmation warning.
- Require explicit confirmation in the UI.
- Clear existing finance records.
- Import records from the selected file.
- Preserve the database schema.
- Run inside a database transaction so a failed restore does not partially apply.

It does not:

- Change the app version.
- Change the database schema.
- Import unsupported file formats.

## Versioning Strategy

`version` identifies the export/import schema version. The current version is:

```text
1.0
```

Use this strategy:

- Patch-level app changes that do not change the JSON contract keep the same
  export version.
- Backward-compatible additions can use a minor version, such as `1.1`.
- Breaking schema changes should use a major version, such as `2.0`.

The current import implementation accepts only export version `1.0`.

## Current Limitations

- Merge conflict handling is conservative and intentionally avoids overwriting
  existing records.
- Restore replaces finance data only; it does not replace the database file.
- Import supports only Wallet JSON exports.
- Export files are not encrypted by Wallet.

