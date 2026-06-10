# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Testing

Frontend component and feature tests use Vitest, React Testing Library, and jsdom.
Tauri API calls are mocked in `src/test/mocks/tauri.ts`, so unit tests never call
the real Rust backend.

```bash
npm run test
npm run test:coverage
npm run typecheck
npm run build
```

Desktop E2E scaffolding lives in `e2e/` and is intended for the real Tauri app
through WebDriver/`tauri-driver`, not the browser-only Vite app.

```bash
cargo install tauri-driver
npm run test:e2e
```

E2E runs set `WALLET_TEST_MODE=true` and write data to
`.tmp/wallet-e2e-data`, so they do not use the real app data directory.
See `e2e/README.md` for current setup notes and limitations.

## Continuous Integration

GitHub Actions runs CI on pushes to `dev`/`main` and pull requests targeting
`dev`/`main`.

CI checks:

- Frontend: `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`
- Rust backend: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`,
  `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`,
  and `cargo test --manifest-path src-tauri/Cargo.toml`
- Tauri: Linux build validation with the required Tauri system dependencies

Run the same core checks locally with:

```bash
npm ci
npm run typecheck
npm run test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```
## Manual Releases

Release builds are created only when a version tag matching `v*` is pushed.
The release workflow first runs checks/tests, then builds the Windows desktop
app and creates a draft GitHub Release only if those checks pass. The workflow
does not change versions or create tags automatically.

Recommended process:

1. Update versions manually in `package.json`, `src-tauri/Cargo.toml`, and
   `src-tauri/tauri.conf.json` if needed.
2. Commit the version change:
   `git commit -m "chore(release): prepare vX.Y.Z"`
3. Create an annotated tag:
   `git tag -a vX.Y.Z -m "Wallet vX.Y.Z"`
4. Push the branch and tag:
   `git push origin dev`
   `git push origin vX.Y.Z`
5. GitHub Actions runs the `release-checks` job.
6. If checks pass, the `windows-release` job builds the Windows Tauri app.
7. A draft GitHub Release is created for the tag.
8. Inspect the attached installer/artifacts.
9. Publish the release manually when ready.
