import { AppBadge, AppButton, AppCard, AppInput, AppSelect, EmptyState } from "../../../components/ui";
import { PageIntro } from "../../../components/layout/PageIntro";
import { DataBackupSection } from "../components/DataBackupSection";

export function SettingsPage() {
  return (
    <section className="grid gap-5">
      <PageIntro
        description="Configure local preferences for your wallet workspace."
        title="Settings"
      />

      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <AppCard
          description="Default formatting preferences for new wallet views. These controls are placeholders for a future settings pass."
          title="General"
        >
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Default currency
              </span>
              <AppSelect disabled value="MAD">
                <option value="MAD">MAD - Moroccan dirham</option>
              </AppSelect>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Date format
              </span>
              <AppSelect disabled value="yyyy-mm-dd">
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </AppSelect>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Number format
              </span>
              <AppInput disabled value="1,234.56" />
            </label>
            <EmptyState title="Preferences are not active yet.">
              Formatting controls are shown as placeholders until settings
              persistence is implemented.
            </EmptyState>
          </div>
        </AppCard>

        <AppCard
          description="Wallet is designed around local-first privacy. Cloud sync and import workflows are intentionally not wired yet."
          title="Data & Privacy"
        >
          <div className="grid gap-3">
            <div className="rounded-xl border border-app-border bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                    Local data notice
                  </h3>
                  <p className="mt-1 text-sm text-app-muted">
                    Your finance data is stored locally by the desktop app.
                    Cloud sync is not enabled.
                  </p>
                </div>
                <AppBadge variant="success">Local-first</AppBadge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <AppButton
                variant="ghost"
                onClick={() => document.getElementById("data-backup")?.scrollIntoView()}
              >
                Data & Backup
              </AppButton>
              <AppButton disabled variant="ghost">
                Import data
              </AppButton>
            </div>
            <EmptyState title="Import is a placeholder.">
              Export is available in Data & Backup. Import and restore remain
              disabled until those workflows are designed and implemented.
            </EmptyState>
          </div>
        </AppCard>
      </div>

      <div id="data-backup">
        <DataBackupSection />
      </div>

      <AppCard
        description="Visual preferences for the redesigned app shell. Theme persistence is not implemented yet."
        title="Appearance"
      >
        <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
          <div className="rounded-xl border border-app-border bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                Theme
              </h3>
              <AppBadge variant="neutral">Placeholder</AppBadge>
            </div>
            <AppSelect className="mt-4" disabled value="light">
              <option value="light">Light</option>
            </AppSelect>
          </div>
          <div className="rounded-xl border border-app-border bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                Typography
              </h3>
              <AppBadge variant="neutral">Design system</AppBadge>
            </div>
            <p className="mt-4 text-sm text-app-muted">
              Plus Jakarta Sans is preferred globally, with Inter and system
              fonts as fallback.
            </p>
          </div>
          <div className="rounded-xl border border-app-border bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                Style
              </h3>
              <AppBadge variant="success">Modern</AppBadge>
            </div>
            <p className="mt-4 text-sm text-app-muted">
              Soft backgrounds, white cards, rounded corners, and subtle
              shadows are used across the UI.
            </p>
          </div>
        </div>
      </AppCard>
    </section>
  );
}
