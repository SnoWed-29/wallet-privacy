# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## macOS Local Setup

Install the required tools first:

- Xcode Command Line Tools: `xcode-select --install`
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Node.js 20.19 or newer

After cloning the repository, install dependencies from the project root:

```bash
npm install
```

Run the desktop app in development mode:

```bash
npm run tauri dev
```

Create a production frontend build:

```bash
npm run build
```

Build the Tauri app:

```bash
npm run tauri build
```

Useful verification commands:

```bash
npm run typecheck
npm run test
cd src-tauri
cargo check
cargo clippy
cargo test
```

Troubleshooting:

- If `npm run tauri dev` fails with `failed to run 'cargo metadata'` or
  `No such file or directory`, install Rust and restart your terminal so
  `cargo` is on `PATH`.
- If macOS reports missing compiler or linker tools, run
  `xcode-select --install` and then retry the command.
- If Vite reports that port `1420` is already in use, stop the other process
  using that port before running `npm run tauri dev`.
- npm may warn about install scripts that need approval for optional tooling.
  Review them with `npm approve-scripts` if you need those packages' install
  scripts to run.

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

## CodeQL Security Scanning

GitHub CodeQL runs static analysis against the JavaScript/TypeScript frontend
and Rust backend to look for security vulnerabilities and code quality issues.
It runs on pushes to `dev`/`main`, pull requests targeting `dev`/`main`, and a
weekly scheduled scan.

CodeQL results appear in GitHub under the repository's Security tab in code
scanning alerts, and any relevant pull request annotations are shown in the PR.
CodeQL is a static analysis tool; it complements tests and manual review, but
does not replace either one.

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

Release builds are created when a version tag matching `v*` is pushed. The
release workflow first runs checks/tests, then builds the Windows and macOS
desktop apps and creates a draft GitHub Release only if those checks pass. The
workflow does not change versions or create tags automatically.

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
6. If checks pass, the `windows-release` job builds the Windows Tauri app and
   the `macos-release` job builds Apple Silicon and Intel macOS apps.
7. A draft GitHub Release is created for the tag.
8. Inspect the attached installer/artifacts.
9. Publish the release manually when ready.

### Installing From a Release

Windows users should download the Windows installer from the GitHub Release.

macOS users should download the macOS `.dmg` that matches their Mac:

- Apple Silicon Macs with M1, M2, M3, or newer chips should use the
  `aarch64-apple-darwin` artifact.
- Intel Macs should use the `x86_64-apple-darwin` artifact.

Open the downloaded `.dmg` and drag Wallet into Applications. The current macOS
builds are unsigned and not notarized, so macOS Gatekeeper may show a security
warning the first time the app is opened. Signing and notarization can be added
later with an Apple Developer account.
