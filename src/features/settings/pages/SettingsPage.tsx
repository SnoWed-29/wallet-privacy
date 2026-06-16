import { Palette, ShieldCheck, Type } from "lucide-react";
import type { ReactNode } from "react";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  EmptyState,
} from "../../../components/ui";
import { PageIntro } from "../../../components/layout/PageIntro";
import { DataBackupSection } from "../components/DataBackupSection";
import { setOnboardingCompleted } from "../../onboarding/utils/onboarding.utils";

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
            tone="strong"
          >
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
                  Default currency
                </span>
                <AppSelect disabled value="MAD">
                  <option value="MAD">MAD - Moroccan dirham</option>
                </AppSelect>
              </label>
              <label className="grid gap-2">
                <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
                  Date format
                </span>
                <AppSelect disabled value="yyyy-mm-dd">
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </AppSelect>
              </label>
              <label className="grid gap-2">
                <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
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
            tone="standard"
          >
            <div className="grid gap-3">
              <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-app-sm bg-app-primary/10 text-app-primary">
                      <Palette className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-card text-app-text">Theme</h3>
                  </div>
                  <AppBadge variant="neutral">Placeholder</AppBadge>
                </div>
                <AppSelect className="mt-4" disabled value="light">
                  <option value="light">Light</option>
                </AppSelect>
              </div>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <InfoBlock
                  icon={<Type className="h-4 w-4" aria-hidden="true" />}
                  label="Typography"
                  text="Funnel Display with local fallbacks."
                />
                <InfoBlock
                  icon={<Palette className="h-4 w-4" aria-hidden="true" />}
                  label="Style"
                  text="Warm glass surfaces, restrained shadows, and clear focus states."
                />
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
            tone="strong"
          >
            <div className="grid grid-cols-2 gap-3 text-sm max-sm:grid-cols-1">
              <InfoBlock
                icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                label="Privacy"
                text="Your data stays local to the desktop app."
              />
              <InfoBlock
                icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                label="Storage"
                text="Exports and backups are saved only where you choose."
              />
            </div>
            <div className="mt-4 flex justify-end">
              <AppButton
                onClick={() => setOnboardingCompleted(false)}
                variant="ghost"
              >
                Restart onboarding
              </AppButton>
            </div>
          </AppCard>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({
  icon,
  label,
  text,
}: {
  icon?: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-app-primary">{icon}</span> : null}
        <p className="font-semibold text-app-text">{label}</p>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-app-muted">{text}</p>
    </div>
  );
}
