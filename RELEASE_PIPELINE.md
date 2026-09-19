# GitHub Workflows Pipeline

This document explains every GitHub Actions workflow in `.github/workflows`.

Current workflows:

- `.github/workflows/ci.yml`: CI checks for frontend, Rust, and Tauri build.
- `.github/workflows/codeql.yml`: CodeQL security and quality analysis.
- `.github/workflows/release.yml`: Tagged Windows desktop release pipeline.

## Workflow Overview

| Workflow | File | Main Purpose | Trigger |
| --- | --- | --- | --- |
| `CI` | `ci.yml` | Validate frontend, Rust backend, and Tauri build | Pushes and pull requests targeting `dev` or `main` |
| `CodeQL` | `codeql.yml` | Run static security and quality analysis | Pushes and pull requests targeting `dev` or `main`, plus weekly schedule |
| `Release` | `release.yml` | Build and draft a Windows release | Pushes of tags matching `v*` |

## CI Workflow

Workflow file:

```text
.github/workflows/ci.yml
```

Workflow name:

```text
CI
```

### When CI Runs

CI runs on pushes to these branches:

```text
dev
main
```

CI also runs on pull requests targeting these branches:

```text
dev
main
```

Regular pushes to other branches do not trigger this workflow unless those
branches open a pull request into `dev` or `main`.

### CI Permissions

The workflow grants:

```yaml
contents: read
```

This is enough for the workflow to check out and read repository code. It does
not grant write access to releases, repository contents, or security events.

### CI Concurrency

The workflow uses this concurrency group:

```yaml
ci-${{ github.workflow }}-${{ github.ref }}
```

Only one CI run is kept active per workflow and Git ref. If a newer run starts
for the same branch or pull request ref, the older run is cancelled.

This keeps CI focused on the latest commit instead of wasting runner time on
outdated commits.

### CI Jobs

The CI workflow has three jobs:

- `frontend`
- `rust`
- `build`

The `frontend` and `rust` jobs run independently. The `build` job waits for both
of them to pass.

### Job: Frontend

Job name:

```text
Frontend
```

Runner:

```text
ubuntu-latest
```

Purpose:

Validates the frontend dependency install, TypeScript type checks, tests, and
production build.

Steps:

1. `Checkout`

   Downloads the repository source code into the runner.

2. `Setup Node.js`

   Installs Node.js version `22` using `actions/setup-node@v4`.

   It also enables npm caching, which helps future runs install dependencies
   faster.

3. `Install dependencies`

   Runs:

   ```bash
   npm ci
   ```

   This installs dependencies exactly from `package-lock.json`.

4. `Typecheck`

   Runs:

   ```bash
   npm run typecheck
   ```

   This checks frontend TypeScript types.

5. `Test`

   Runs:

   ```bash
   npm run test
   ```

   This runs the frontend test suite.

6. `Build frontend`

   Runs:

   ```bash
   npm run build
   ```

   This builds the frontend app.

### Job: Rust

Job name:

```text
Rust
```

Runner:

```text
ubuntu-latest
```

Purpose:

Validates the Rust/Tauri backend with formatting, Clippy, and tests.

Steps:

1. `Checkout`

   Downloads the repository source code into the runner.

2. `Install Linux dependencies`

   Installs Linux system packages needed by a Tauri app on Ubuntu, including
   compiler tools, WebKit dependencies, OpenSSL development files, SVG support,
   AppIndicator support, and packaging helpers.

3. `Setup Rust`

   Installs the stable Rust toolchain using
   `actions-rust-lang/setup-rust-toolchain@v1`.

   It also installs:

   - `rustfmt`, used for formatting checks.
   - `clippy`, used for lint checks.

4. `Cache Cargo`

   Uses `Swatinem/rust-cache@v2` to cache Rust dependencies for:

   ```text
   src-tauri -> target
   ```

5. `Check formatting`

   Runs:

   ```bash
   cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
   ```

   This checks Rust formatting without changing files. The job fails if Rust
   files are not formatted.

6. `Clippy`

   Runs:

   ```bash
   cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
   ```

   This runs Rust linting across all targets. Because `-D warnings` is used,
   any Clippy warning fails the job.

7. `Test`

   Runs:

   ```bash
   cargo test --manifest-path src-tauri/Cargo.toml
   ```

   This runs the Rust backend test suite.

### Job: Tauri Build

Job name:

```text
Tauri Build
```

Runner:

```text
ubuntu-latest
```

Dependencies:

```yaml
needs:
  - frontend
  - rust
```

Purpose:

Builds the full Tauri app on Ubuntu after frontend and Rust validation pass.

Steps:

1. `Checkout`

   Downloads the repository source code into the runner.

2. `Install Linux dependencies`

   Installs the same Tauri-related Ubuntu system packages used by the Rust job.

3. `Setup Node.js`

   Installs Node.js version `22` and enables npm caching.

4. `Setup Rust`

   Installs the stable Rust toolchain.

5. `Cache Cargo`

   Caches Rust dependencies for:

   ```text
   src-tauri -> target
   ```

6. `Install dependencies`

   Runs:

   ```bash
   npm ci
   ```

7. `Build Tauri app`

   Runs:

   ```bash
   npm run tauri -- build
   ```

   This builds the Tauri desktop app on the Ubuntu runner.

## CodeQL Workflow

Workflow file:

```text
.github/workflows/codeql.yml
```

Workflow name:

```text
CodeQL
```

### When CodeQL Runs

CodeQL runs on pushes to:

```text
dev
main
```

It also runs on pull requests targeting:

```text
dev
main
```

It also runs on a weekly schedule:

```cron
0 3 * * 1
```

That means every Monday at `03:00` UTC.

### CodeQL Permissions

The workflow grants:

```yaml
security-events: write
packages: read
actions: read
contents: read
```

These permissions allow CodeQL to read the repository, read required action and
package metadata, and upload security analysis results to GitHub code scanning.

### CodeQL Job

Job id:

```text
analyze
```

Job name:

```text
Analyze (${{ matrix.language }})
```

Runner:

```text
ubuntu-latest
```

Purpose:

Runs CodeQL static analysis for both frontend and Rust code.

### CodeQL Concurrency

The `analyze` job uses this concurrency group:

```yaml
codeql-${{ github.workflow }}-${{ github.ref }}-${{ matrix.language }}
```

Only one CodeQL run is kept active per workflow, ref, and language. A newer run
for the same language and ref cancels the older one.

### CodeQL Matrix

The workflow uses a matrix with two languages:

```text
javascript-typescript
rust
```

`fail-fast` is set to `false`, so if one language analysis fails, GitHub Actions
still lets the other language analysis continue.

### CodeQL Steps

1. `Checkout`

   Downloads the repository source code into the runner.

2. `Install Linux dependencies`

   Runs only for the Rust matrix entry:

   ```yaml
   if: matrix.language == 'rust'
   ```

   Installs the Linux system packages needed for Rust/Tauri analysis.

3. `Setup Rust`

   Runs only for the Rust matrix entry.

   Installs the stable Rust toolchain.

4. `Initialize CodeQL`

   Uses:

   ```text
   github/codeql-action/init@v3
   ```

   It initializes CodeQL for the current matrix language.

   The workflow enables these query suites:

   ```text
   security-extended
   security-and-quality
   ```

   These query suites check for security issues plus broader code quality
   patterns.

5. `Build Rust`

   Runs only for the Rust matrix entry:

   ```bash
   cargo build --manifest-path src-tauri/Cargo.toml
   ```

   Rust needs an explicit build so CodeQL can analyze compiled Rust code paths.

6. `Perform CodeQL Analysis`

   Uses:

   ```text
   github/codeql-action/analyze@v3
   ```

   This performs the analysis and uploads results to GitHub code scanning.

## Release Workflow

Workflow file:

```text
.github/workflows/release.yml
```

Workflow name:

```text
Release
```

### When Release Runs

The release workflow runs only when a Git tag matching this pattern is pushed:

```text
v*
```

Examples that trigger the workflow:

```text
v1.0.0
v2.3.1
v1.0.0-beta.1
v2026.06.11
```

Regular branch pushes and pull requests do not trigger this workflow.

### Release Permissions

The workflow grants:

```yaml
contents: write
```

This allows GitHub Actions to create or update GitHub Releases and upload
release assets, such as the Windows build artifacts and checksum file.

### Release Concurrency

The workflow uses this concurrency group:

```yaml
release-${{ github.ref_name }}
```

Only one release workflow can run at a time for the same tag. If a new run
starts for the same tag while an older run is still active, the older run is
cancelled.

This is useful when a tag is deleted and re-pushed, or when a release workflow
is manually re-run for the same tag.

### Release Jobs

The release workflow has two jobs:

- `release-checks`
- `windows-release`

The `windows-release` job waits for `release-checks` to pass.

### Job: Release Checks

Job name:

```text
Release Checks
```

Runner:

```text
ubuntu-latest
```

Purpose:

Validates that the project is healthy before building the final Windows release.

Steps:

1. `Checkout`

   Downloads the repository source code into the runner.

2. `Install Linux dependencies`

   Installs system packages needed to build and check a Tauri app on Linux.

3. `Setup Node.js`

   Installs Node.js version `22`.

   It also enables npm caching using `package-lock.json`.

4. `Setup Rust`

   Installs the stable Rust toolchain.

   It also installs:

   - `rustfmt`, used for Rust formatting checks.
   - `clippy`, used for Rust lint checks.

5. `Cache Cargo`

   Caches Rust build dependencies for:

   ```text
   src-tauri -> target
   ```

6. `Install frontend dependencies`

   Runs:

   ```bash
   npm ci
   ```

7. `Lint frontend`

   Runs:

   ```bash
   npm run --if-present lint
   ```

   If a `lint` script exists in `package.json`, it runs it. If the script does
   not exist, the step succeeds without doing anything.

8. `Typecheck frontend`

   Runs:

   ```bash
   npm run --if-present typecheck
   ```

9. `Test frontend`

   Runs:

   ```bash
   npm run --if-present test
   ```

10. `Build frontend`

    Runs:

    ```bash
    npm run --if-present build
    ```

11. `Check Rust formatting`

    Runs:

    ```bash
    cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
    ```

12. `Clippy`

    Runs:

    ```bash
    cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
    ```

13. `Test Rust backend`

    Runs:

    ```bash
    cargo test --manifest-path src-tauri/Cargo.toml
    ```

### Job: Windows Release

Job name:

```text
Windows Release
```

Runner:

```text
windows-latest
```

Dependency:

```yaml
needs: release-checks
```

Purpose:

Builds the Windows desktop app, creates a draft GitHub Release, uploads the
generated Windows artifacts, and attaches a SHA256 checksum file.

Steps:

1. `Checkout`

   Downloads the repository source code into the Windows runner.

2. `Setup Node.js`

   Installs Node.js version `22` and enables npm caching using
   `package-lock.json`.

3. `Setup Rust`

   Installs the stable Rust toolchain.

4. `Cache Cargo`

   Caches Rust dependencies for:

   ```text
   src-tauri -> target
   ```

5. `Install frontend dependencies`

   Runs:

   ```bash
   npm ci
   ```

6. `Build Tauri app and draft release`

   Uses:

   ```text
   tauri-apps/tauri-action@v0
   ```

   This builds the Tauri desktop app for Windows and creates a draft GitHub
   Release.

   Release settings:

   - Tag name: the pushed tag, for example `v1.0.0`.
   - Release name: `Wallet <tag>`, for example `Wallet v1.0.0`.
   - Release body: notes that this is a draft Wallet desktop release and that
     the attached Windows artifacts should be reviewed before publishing.
   - Draft release: enabled.
   - Prerelease: enabled automatically if the tag contains `alpha`, `beta`, or
     `rc`.
   - Updater JSON upload: disabled.
   - Updater signatures upload: disabled.

7. `Generate SHA256 checksums`

   Runs a PowerShell script that:

   - Looks for generated files under `src-tauri/target/release/bundle`.
   - Fails the workflow if no release artifacts are found.
   - Calculates a SHA256 hash for every generated artifact.
   - Writes the hashes to `SHA256SUMS.txt`.
   - Prints the checksum file contents in the workflow log.

   The checksum lines use this format:

   ```text
   <sha256-hash>  <file-name>
   ```

8. `Upload Windows artifacts`

   Uploads a GitHub Actions artifact named:

   ```text
   wallet-windows-${{ github.ref_name }}
   ```

   The uploaded artifact contains:

   - Everything under `src-tauri/target/release/bundle`.
   - `SHA256SUMS.txt`.

   If no files are found, the workflow fails.

9. `Attach SHA256 checksums to draft release`

   Runs:

   ```bash
   gh release upload ${{ github.ref_name }} SHA256SUMS.txt --clobber
   ```

   This uploads `SHA256SUMS.txt` to the GitHub Release for the tag.

   The `--clobber` flag allows the checksum file to be replaced if it already
   exists on the release.

## Release Output

After a successful release run, the workflow should produce:

- A draft GitHub Release for the pushed tag.
- Windows Tauri build artifacts attached by the Tauri action.
- A `SHA256SUMS.txt` file attached to the release.
- A GitHub Actions artifact named `wallet-windows-<tag>` containing the Windows
  bundle output and checksums.

## Prerelease Behavior

The release is marked as a prerelease when the tag name contains any of these
strings:

```text
alpha
beta
rc
```

Examples:

```text
v1.0.0-alpha.1
v1.0.0-beta.2
v1.0.0-rc.1
```

Tags such as `v1.0.0` or `v2.4.3` are treated as normal releases.

## Useful Notes

- CI and CodeQL run on `dev` and `main` branch activity.
- The release workflow runs only for pushed version tags that start with `v`.
- The release is created as a draft, so it still needs to be reviewed and
  published manually in GitHub.
- The Windows release job is blocked by the release validation job. This
  prevents publishing a release when linting, tests, formatting, or builds fail.
- CI frontend commands are strict: `typecheck`, `test`, and `build` must exist
  and pass.
- Release frontend commands use `--if-present`, so missing npm scripts do not
  fail the release validation job.
- Rust formatting and Clippy are strict. Formatting issues or Clippy warnings
  fail CI and release checks.
- CodeQL analyzes both `javascript-typescript` and `rust`.
- CodeQL runs weekly even if there are no code changes, which helps catch new
  vulnerability patterns as GitHub updates CodeQL queries.
- The release workflow currently builds only Windows release artifacts.
- The release workflow does not upload Tauri updater JSON or updater signatures.
- The checksum file helps users verify that downloaded release artifacts were
  not modified or corrupted.

## Typical Development Flow

1. Push code to a feature branch.
2. Open a pull request into `dev` or `main`.
3. Wait for CI to validate frontend, Rust, and Tauri build jobs.
4. Wait for CodeQL to analyze JavaScript/TypeScript and Rust.
5. Merge only after required checks pass.

## Typical Release Flow

1. Make sure `main` or the release branch is passing CI and CodeQL.
2. Create a version tag:

   ```bash
   git tag v1.0.0
   ```

3. Push the tag:

   ```bash
   git push origin v1.0.0
   ```

4. Wait for the `Release` workflow to finish.
5. Open the draft GitHub Release.
6. Review the attached Windows artifacts and `SHA256SUMS.txt`.
7. Publish the release manually if everything looks correct.

## Workflow Schema

```text
Feature branch push
        |
        v
Open pull request to dev
        |
        v
CI runs on the PR
        |
        +--> Frontend job: npm ci, typecheck, test, build
        |
        +--> Rust job: Linux deps, rustfmt check, Clippy, cargo test
        |
        +--> Tauri Build job: runs after Frontend and Rust pass
        |
        v
CodeQL runs on the PR
        |
        +--> JavaScript/TypeScript analysis
        |
        +--> Rust analysis
        |
        v
Merge pull request to dev
        |
        v
CI and CodeQL run again on dev
        |
        v
Open pull request from dev to main
        |
        v
CI and CodeQL run on the main-targeted PR
        |
        v
Merge pull request to main
        |
        v
CI and CodeQL run again on main
        |
        v
Create and push version tag, for example v1.0.0
        |
        v
Release workflow triggers
        |
        +--> Release Checks job validates frontend and Rust
        |
        +--> Windows Release job builds Windows app after checks pass
        |
        v
Draft GitHub Release is created
        |
        v
Review Windows artifacts and SHA256SUMS.txt
        |
        v
Publish release manually
```

Short version:

```text
feature push
  -> PR to dev
  -> CI + CodeQL
  -> merge to dev
  -> CI + CodeQL
  -> PR to main
  -> CI + CodeQL
  -> merge to main
  -> CI + CodeQL
  -> push v* tag
  -> Release Checks
  -> Windows Release
  -> draft GitHub Release
  -> manual publish
```
