# Onboarding

Wallet shows a first-time setup flow before the normal app shell when the local
device has not completed onboarding.

## First-Time Detection

Onboarding completion is stored locally in browser storage with the key:

```text
wallet.onboardingCompleted
```

Expected values:

- Missing or `false`: show onboarding.
- `true`: open the normal Wallet app.

Wallet does not infer completion from accounts alone. A local completion value is
required before the normal app opens.

## Steps

Required:

- Welcome
- Create first account, unless the user imports existing data
- Completion

Optional:

- Categories
- Monthly budgets
- Recurring bills

Optional steps can be skipped and completed later from the normal Wallet pages.
Submitted records are saved through the existing account, category, budget, and
recurring bill commands instead of through onboarding-only business logic.

## Import During Setup

The Welcome step offers `Import Existing Data`. This opens the existing import
workflow from `Settings -> Data & Backup` so onboarding does not duplicate import
validation, preview, merge, or replace behavior.

If import succeeds, onboarding reloads Wallet data and moves to the completion
step.

## Completion And Restart

When the user clicks `Go to Dashboard`, Wallet stores:

```text
wallet.onboardingCompleted=true
```

Then it navigates to the Dashboard and the normal app shell is shown on later
launches.

Onboarding can be restarted from `Settings -> About` with `Restart onboarding`.
That action stores `wallet.onboardingCompleted=false` and the onboarding gate
will show setup again.

## Responsive Design

The main Tauri window opens at `1440 x 900` with a minimum of `1180 x 720`.
The onboarding layout uses a light header, horizontal milestones, and a centered
step card. On narrower windows the milestones can scroll horizontally so forms
stay readable.

The main app layout now centers content within a wider `1280px` work area, and
tables use horizontal scrolling instead of forcing pages to overflow.

## Motion

Onboarding uses a short step entrance animation through Tailwind's `motion-safe`
variant. Users who prefer reduced motion do not receive that animation.

## Current Limitations

- Onboarding completion is local to the device and is not synced.
- Restarting onboarding does not erase existing Wallet data.
- Optional step forms are intentionally lightweight and rely on the existing
  feature pages for advanced editing.
