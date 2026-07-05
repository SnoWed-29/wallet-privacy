# Local Encryption at Rest

Wallet v1 protects local finance data before the app loads it into the React UI.

## Storage Model

Production startup no longer opens `wallet.db` directly. The app starts with `AppState::locked(app_data_dir)` and exposes only security commands until the user creates or enters the local password.

Encrypted production storage lives in the Tauri app data directory as `wallet.encrypted.json`. When unlocked, Wallet imports the decrypted export payload into an in-memory SQLite runtime database. Mutating commands persist a fresh encrypted snapshot after successful writes. Locking the app persists the latest snapshot and closes the in-memory pool.

This approach was chosen instead of SQLCipher for v1 because the current `sqlx` SQLite setup does not link SQLCipher cleanly without changing the database driver and build toolchain. The v1 behavior still encrypts data at rest on disk, but it is not page-level SQLCipher encryption. While unlocked, decrypted data exists in process memory and may be subject to normal OS memory behavior.

## Cryptography

- Password KDF: Argon2id.
- KDF parameters: 64 MiB memory, 3 iterations, 1 lane, 32-byte output.
- Salt: random 16 bytes per wallet, stored in the encrypted envelope.
- Cipher: ChaCha20-Poly1305 AEAD.
- Nonces: random 12-byte nonce for password verification and random 12-byte nonce for payload encryption.
- Password/key storage: the plain password is never stored. The derived key stays only in unlocked runtime state and is wrapped in `Zeroizing<[u8; 32]>`.
- Logs: passwords and derived keys must not be logged.

## File Envelope

`wallet.encrypted.json` contains metadata and ciphertext only:

- `version`
- `cipher`
- `kdf`
- `salt`
- `verificationNonce`
- `verification`
- `payloadNonce`
- `payload`
- `createdAt`
- `updatedAt`

The encrypted payload is the normal Wallet export JSON after encryption. Plain account names, transaction descriptions, category names, and the user's password must not appear in the file.

## User Flows

First run:

1. App starts locked and does not call finance data commands.
2. Onboarding asks the user to create a local password before account setup or import.
3. Password must be at least 8 characters and match confirmation.
4. Wallet creates encrypted storage and unlocks the runtime database.

Returning user:

1. App shows Unlock Wallet before data loads.
2. Wrong passwords are rejected with a safe message.
3. Correct password decrypts storage and loads wallet data.
4. Settings > Security & Privacy can lock the app immediately.

Legacy migration:

1. If `wallet.db` exists and no encrypted storage exists, setup shows a legacy-data notice.
2. After password creation, Wallet exports the legacy SQLite data and imports it into encrypted runtime storage.
3. The old file is renamed to `wallet.unencrypted-migrated-{timestamp}.db` after encrypted import verification.

## Backup and Export

- `create_wallet_backup` returns an encrypted wallet envelope by default.
- `validate_backup_file` decrypts the backup with the active wallet key and returns a preview.
- `restore_wallet_backup` decrypts with the active key, creates an encrypted safety backup, then replaces current data.
- Plain export remains available for portability, but the UI warns that the exported JSON is not encrypted.

## Release Test Obligations

Automated coverage should include:

- first-run password setup before any finance command loads data;
- validation for missing, short, and mismatched passwords;
- returning-user unlock, wrong-password failure, and no pre-unlock finance calls;
- encrypted file creation with no plaintext user data or password;
- legacy `wallet.db` migration and archival;
- encrypted backup preview/restore with the active key;
- plain export warning in Settings;
- Settings lock action returning to the unlock screen.
