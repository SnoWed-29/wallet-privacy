import { AppBadge, AppCard, AppInput, AppSelect, EmptyState } from "../../../components/ui";
import { PageIntro } from "../../../components/layout/PageIntro";
import { DataBackupSection } from "../components/DataBackupSection";

export function SettingsPage() {
  return (
    <section className="grid gap-5">
      <PageIntro
        description="Manage local Wallet preferences, data tools, and app information."
        title="Settings"
      />

      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5 max-xl:grid-cols-1">
        <div className="grid gap-5">
          <AppCard
            description="Default formatting preferences for your workspace."
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
            description="Visual preferences for the app shell."
            title="Appearance"
          >
            <div className="grid gap-3">
              <div className="rounded-app-sm border border-app-border bg-slate-50/70 p-4">
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
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <InfoBlock label="Typography" text="Readable app fonts with system fallbacks." />
                <InfoBlock label="Style" text="Soft backgrounds, clear cards, and subtle shadows." />
              </div>
            </div>
          </AppCard>
        </div>

        <div className="grid gap-5">
          <DataBackupSection />

          <AppCard
            actions={<AppBadge variant="success">Local-first</AppBadge>}
            description="Wallet keeps finance data on this device. Cloud sync is not enabled."
            title="About"
          >
            <div className="grid grid-cols-2 gap-3 text-sm max-sm:grid-cols-1">
              <InfoBlock label="Privacy" text="Your data stays local to the desktop app." />
              <InfoBlock label="Storage" text="Exports and backups are saved only where you choose." />
            </div>
          </AppCard>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-app-sm border border-app-border bg-slate-50/70 p-4">
      <p className="font-extrabold text-app-text">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-app-muted">{text}</p>
    </div>
  );
}
