import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { AppButton, AppInput } from "../../../components/ui";

type PasswordStepProps = {
  hasLegacyDatabase: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSubmit: (password: string) => Promise<void>;
};

export function PasswordStep({
  hasLegacyDatabase,
  isSaving,
  onBack,
  onSubmit,
}: PasswordStepProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await onSubmit(password);
      setPassword("");
      setConfirmation("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Password setup failed.");
    }
  }

  return (
    <form className="mx-auto grid max-w-2xl gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-app bg-app-primary/10 text-app-primary">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-page text-app-text">Protect your wallet</h1>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-app-muted">
            <p>Wallet stores your data locally and encrypts it on this device.</p>
            <p>This password unlocks your wallet.</p>
            <p>Wallet cannot recover your password if you forget it.</p>
          </div>
        </div>
      </div>

      {hasLegacyDatabase ? (
        <div className="rounded-app-sm border border-app-warning/18 bg-app-warning/10 p-3 text-sm font-semibold text-app-warning">
          Wallet found existing local data and will move it into encrypted storage after this step.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="grid gap-2">
          <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
            Password
          </span>
          <AppInput
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
            Confirm password
          </span>
          <AppInput
            autoComplete="new-password"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-app-sm border border-app-danger/18 bg-app-danger/8 p-3 text-sm font-semibold text-app-danger">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted">
          <ShieldCheck className="h-4 w-4 text-app-primary" aria-hidden="true" />
          No online account required
        </span>
        <div className="flex justify-end gap-2">
          <AppButton onClick={onBack} type="button" variant="ghost">
            Back
          </AppButton>
          <AppButton disabled={isSaving} type="submit" variant="primary">
            {isSaving ? "Protecting..." : "Continue"}
          </AppButton>
        </div>
      </div>
    </form>
  );
}