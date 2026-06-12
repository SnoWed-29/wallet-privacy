# Data Portability

Wallet supports four local JSON data flows from `Settings -> Data & Backup`.

## Export vs Import vs Backup vs Restore

- Export is for portability. It creates a Wallet JSON export that can be moved
  between Wallet installs or reviewed by the user.
- Import is for adding data. Merge import validates a Wallet JSON export, then
  adds missing records while skipping duplicates and handling supported name
  conflicts.
- Backup is for safety. It creates a Wallet JSON backup file with backup
  metadata wrapped around the existing export data format.
- Restore is for recovery. It validates a Wallet backup, previews the records,
  then replaces current Wallet data only after explicit confirmation.

## Export

Export creates a pretty-printed JSON file named like:

```text
wallet-export-YYYY-MM-DD.json
```

The export contains all supported Wallet finance entities:

- Accounts
- Categories
- Transactions
- Budgets
- Recurring bills
- Savings goals

The export format includes `version` and `exportedAt` metadata. Empty
collections are written as empty arrays.

## Import

Import accepts Wallet JSON export files. Before importing, Wallet validates:

- JSON syntax
- Supported export version
- Required top-level fields
- Required entity fields
- Duplicate IDs inside the file
- References between imported entities

Merge import preserves current data. It does not silently overwrite existing
records. Exact duplicates are skipped, and supported name conflicts are handled
with the existing import strategy, such as appending `(Imported)` to account and
savings goal names.

Replace import is destructive and clears current finance data before importing
the selected export. It runs inside a database transaction so a failure does not
partially replace data.

## Backup

Backup creates a JSON file named like:

```text
wallet-backup-YYYY-MM-DD.json
```

The backup wraps the existing export/import data format with safety metadata:

```json
{
  "backupVersion": "1.0",
  "createdAt": "2026-06-12T00:00:00Z",
  "appVersion": "0.2.1",
  "dataCounts": {
    "accounts": 0,
    "categories": 0,
    "transactions": 0,
    "budgets": 0,
    "recurringBills": 0,
    "savingsGoals": 0
  },
  "data": {
    "version": "1.0",
    "exportedAt": "2026-06-12T00:00:00Z",
    "accounts": [],
    "categories": [],
    "transactions": [],
    "budgets": [],
    "recurringBills": [],
    "savingsGoals": []
  }
}
```

`backupVersion` identifies the backup wrapper format. The nested `data.version`
continues to identify the export/import data format.

## Restore

Restore accepts Wallet backup JSON files. Restore is destructive:

```text
Restoring a backup will replace your current Wallet data.
```

Wallet must validate the backup and show a preview before restoring. The user
must explicitly confirm the restore. Restore is replace-only; it must not merge
backup records into current records.

The restore implementation reuses the replace import path, so current finance
data is cleared and backup records are inserted inside a database transaction.
If validation or import fails, current data remains in place.

Before applying the restore, Wallet creates an automatic safety backup JSON from
the current data and returns it with the restore result. The frontend offers a
way to save that safety backup after a successful restore.

## Versioning

Current versions:

- Export/import data version: `1.0`
- Backup wrapper version: `1.0`

Patch-level app changes that do not change the JSON contract keep the same
format versions. Backward-compatible additions can use a minor version. Breaking
changes should use a major version.
