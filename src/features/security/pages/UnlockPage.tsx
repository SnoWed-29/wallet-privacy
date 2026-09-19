import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { AppButton, AppCard, AppInput } from "../../../components/ui";

type UnlockPageProps = {
  hasLegacyDatabase?: boolean;
  onUnlock: (password: string) => Promise<void>;
};

export function UnlockPage({ hasLegacyDatabase = false, onUnlock }: UnlockPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("Enter your wallet password.");
      return;
    }

    setIsUnlocking(true);
    try {
      await onUnlock(password);
      setPassword("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Wallet could not unlock.");
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <main className="wallet-app-bg grid min-h-screen place-items-center p-5 text-app-text">
      <AppCard className="w-full max-w-xl" tone="strong">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-app bg-app-primary/10 text-app-primary">
              <LockKeyhole className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-page text-app-text">Unlock Wallet</h1>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                Enter your local wallet password to decrypt data on this device.
              </p>
            </div>
          </div>

          {hasLegacyDatabase ? (
            <div className="rounded-app-sm border border-app-warning/18 bg-app-warning/10 p-3 text-sm font-semibold text-app-warning">
              Wallet found older local data. Unlock or finish password setup to keep using it safely.
            </div>
          ) : null}

          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
              Password
            </span>
            <AppInput
              autoComplete="current-password"
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <p className="rounded-app-sm border border-app-danger/18 bg-app-danger/8 p-3 text-sm font-semibold text-app-danger">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted">
              <ShieldCheck className="h-4 w-4 text-app-primary" aria-hidden="true" />
              Local data only
            </span>
            <AppButton disabled={isUnlocking} type="submit" variant="primary">
              {isUnlocking ? "Unlocking..." : "Unlock Wallet"}
            </AppButton>
          </div>
        </form>
      </AppCard>
    </main>
  );
}