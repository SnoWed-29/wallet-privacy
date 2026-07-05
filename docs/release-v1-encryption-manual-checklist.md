# Release v1 Encryption Manual Checklist

Use this checklist before tagging v1. Run it on a clean dev profile and once with a copied legacy `wallet.db`.

## First Run

- Start with no `wallet.encrypted.json` and no `wallet.db`.
- Confirm the app shows onboarding and does not show dashboard data.
- Click Get started.
- Confirm the first setup step is Protect your wallet.
- Submit empty, short, and mismatched passwords; each should show a local validation message.
- Create a valid password.
- Confirm account setup appears and the app can create an account.
- Close and reopen the app; Unlock Wallet should appear before dashboard.

## Unlock and Lock

- Enter a wrong password; confirm the app stays locked and shows a safe error.
- Enter the correct password; confirm dashboard data loads.
- Go to Settings > Security & Privacy.
- Click Lock app; confirm the unlock screen appears.
- Unlock again and confirm data is still present.

## At-Rest File Check

- Inspect the app data directory.
- Confirm `wallet.encrypted.json` exists.
- Confirm account names, transaction descriptions, category names, and the local password are not visible in the file.
- Confirm no new production `wallet.db` is created after password setup.

## Legacy Migration

- Place an existing unencrypted `wallet.db` in the app data directory.
- Start the app and create a wallet password.
- Confirm the legacy-data notice appears during setup.
- Confirm existing accounts, categories, and transactions appear after setup.
- Confirm `wallet.db` was renamed to `wallet.unencrypted-migrated-{timestamp}.db`.
- Confirm `wallet.encrypted.json` is present and does not expose plaintext wallet data.

## Backup and Restore

- Create an encrypted backup from Settings.
- Confirm the saved JSON does not expose wallet data names or the password.
- Modify the wallet, then restore the encrypted backup.
- Confirm the restore preview appears only while unlocked.
- Confirm typing `RESTORE` is required.
- Confirm restored data replaces current data.
- Save the generated safety backup and confirm it is encrypted.

## Plain Export

- Click Export Wallet Data.
- Confirm the warning says the export is not encrypted.
- Cancel once and confirm no export happens.
- Continue once and confirm export still works for portability.
- Treat the exported JSON as sensitive data during release testing.

## Negative Checks

- App restart should never skip the unlock screen for an encrypted wallet.
- Tauri finance commands should return an unlock-required error while locked.
- Logs should not include the password, derived key, decrypted export JSON, or raw encrypted payload.
- Backup restore should fail if the active wallet key cannot decrypt the file.
