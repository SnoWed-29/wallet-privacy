# src-tauri Testing

Backend tests live under `src-tauri/tests` and are grouped by scope:

- `unit`: focused validation and domain behavior tests
- `functional`: user-level finance workflows and invalid-data scenarios
- `integration`: isolated SQLite database and command-surface coverage

Tests create a temporary SQLite database in the system temp directory, run the
project migrations against it, and close it after each test. They do not use the
desktop app data directory or `wallet.db`.

Run the backend tests and checks from the repository root:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```
