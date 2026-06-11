# Data Export

Wallet supports a first iteration of local JSON export for data portability and
manual backups.

## Purpose

The export feature lets a user save all supported wallet data into one JSON file
on their device. It is designed for local-first ownership of data and future
import/restore work.

This version does not include:

- Import
- Restore
- Encryption
- Cloud storage
- CSV export

## Export Flow

1. The user opens `Settings -> Data & Backup`.
2. The user clicks `Export Wallet Data`.
3. The frontend calls the Tauri command:

   ```text
   export_wallet_data
   ```

4. The Rust export service reads supported wallet data from SQLite.
5. The service builds a `WalletExport` DTO.
6. The DTO is serialized as pretty-printed JSON.
7. The frontend opens a save dialog when supported and writes the JSON file.
8. The app shows a success or error notification.

## Export Format

The exported file is JSON with this top-level structure:

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

Supported collections:

- `accounts`
- `categories`
- `transactions`
- `budgets`
- `recurringBills`
- `savingsGoals`

Collections are always included. If a table has no rows, the matching field is
an empty array. This keeps the file valid and predictable for future import
logic.

## Metadata

`version` identifies the export schema version. The first export format uses:

```text
1.0
```

`exportedAt` records when the export was created using an RFC 3339 timestamp.

## Versioning Strategy

The export version should change only when the JSON contract changes.

Use this strategy:

- Patch-level app changes that do not change the export JSON keep the same
  export version.
- Backward-compatible additions can use a minor version, such as `1.1`.
- Breaking schema changes should use a major version, such as `2.0`.

Future import code should inspect `version` before attempting to import a file.

