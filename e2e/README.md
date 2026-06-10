# Desktop E2E Tests

These tests are written for the desktop Tauri app, not the browser-only Vite app.
They use WebDriver through `tauri-driver` and WebdriverIO.

## Prerequisites

Install the Tauri WebDriver binary:

```bash
cargo install tauri-driver
```

Then run:

```bash
npm run test:e2e
```

## Test Data Safety

The E2E runner sets:

- `WALLET_TEST_MODE=true`
- `WALLET_TEST_DATA_DIR=<repo>/.tmp/wallet-e2e-data`

When `WALLET_TEST_MODE=true`, the Rust backend stores `wallet.db` in the test
data directory instead of the real app data directory. The runner removes that
directory before each run.

## Current Limitations

The runner requires `tauri-driver` to be installed and available on `PATH`.
If it is missing, the command exits with setup instructions before launching the app.
