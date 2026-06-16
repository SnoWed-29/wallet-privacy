import { invoke } from "@tauri-apps/api/core";
import {
  Download,
  FileJson,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { type ChangeEvent, type ReactNode, useState } from "react";
import { AppBadge, AppButton, AppCard, AppInput, AppModal } from "../../../components/ui";
import { useToast } from "../../../components/ui/ToastProvider";

type WalletExportWritableFileStream = {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
};

type WalletExportFileHandle = {
  createWritable: () => Promise<WalletExportWritableFileStream>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
};

type ImportEntityCounts = {
  accounts: number;
  categories: number;
  transactions: number;
  budgets: number;
  recurringBills: number;
  savingsGoals: number;
};

type ImportSummary = ImportEntityCounts & {
  version: string;
  exportedAt: string;
};

type ImportPreview = {
  summary: ImportSummary;
  duplicates: ImportEntityCounts;
  conflicts: ImportEntityCounts;
  warnings: string[];
};

type BackupMetadata = {
  backupVersion: string;
  createdAt: string;
  appVersion?: string;
  dataCounts: ImportEntityCounts;
};

type BackupPreview = {
  metadata: BackupMetadata;
  summary: ImportSummary;
  duplicates: ImportEntityCounts;
  conflicts: ImportEntityCounts;
  warnings: string[];
};

type ImportMode = "merge" | "replace";

type ImportResult = {
  mode: ImportMode;
  summary: ImportSummary;
  imported: ImportEntityCounts;
  skipped: ImportEntityCounts;
  duplicates: ImportEntityCounts;
  conflicts: ImportEntityCounts;
  warnings: string[];
};

type RestoreResult = {
  restored: ImportResult;
  safetyBackupJson: string;
  safetyBackupCreatedAt: string;
};

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<WalletExportFileHandle>;
  }
}

function walletExportFileName() {
  return `wallet-export-${new Date().toISOString().slice(0, 10)}.json`;
}

function walletBackupFileName(prefix = "wallet-backup") {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

async function saveJsonFile(json: string, suggestedName: string) {
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "JSON file",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggestedName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Could not complete the data action.";
}

export function DataBackupSection() {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  async function handleExportWalletData() {
    setIsExporting(true);

    try {
      const json = await invoke<string>("export_wallet_data");
      JSON.parse(json);
      await saveJsonFile(json, walletExportFileName());
      toast.success("Wallet data was exported to a JSON file.", "Export complete");
    } catch (error) {
      toast.error(errorMessage(error), "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleCreateBackup() {
    setIsCreatingBackup(true);

    try {
      const json = await invoke<string>("create_wallet_backup");
      JSON.parse(json);
      await saveJsonFile(json, walletBackupFileName());
      toast.success("Wallet backup was saved as a JSON file.", "Backup complete");
    } catch (error) {
      toast.error(errorMessage(error), "Backup failed");
    } finally {
      setIsCreatingBackup(false);
    }
  }

  return (
    <AppCard
      actions={<AppBadge variant="success">Local JSON</AppBadge>}
      description="Move data when you need to, and keep recovery actions close but calm."
      id="data-backup"
      title="Data & Backup"
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <ActionCard
            badge="Portable"
            description="Move Wallet data between devices or Wallet installations."
            icon={<FileJson className="h-5 w-5" aria-hidden="true" />}
            title="Data Transfer"
          >
            <div className="flex flex-wrap gap-2">
              <AppButton
                className="gap-2"
                disabled={isExporting}
                onClick={handleExportWalletData}
                variant="primary"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {isExporting ? "Exporting..." : "Export Data"}
              </AppButton>
              <AppButton
                className="gap-2"
                onClick={() => setIsImportOpen(true)}
                variant="ghost"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Import Data
              </AppButton>
            </div>
          </ActionCard>

          <ActionCard
            badge="Recovery"
            description="Protect your data and recover from mistakes."
            icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
            title="Safety & Recovery"
          >
            <div className="flex flex-wrap gap-2">
              <AppButton
                className="gap-2"
                disabled={isCreatingBackup}
                onClick={handleCreateBackup}
                variant="primary"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {isCreatingBackup ? "Creating..." : "Create Backup"}
              </AppButton>
              <AppButton
                className="gap-2"
                onClick={() => setIsRestoreOpen(true)}
                variant="danger"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Restore Backup
              </AppButton>
            </div>
          </ActionCard>
        </div>

        <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-app-primary" aria-hidden="true" />
            <h3 className="text-card text-app-text">
              Information & Help
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm max-xl:grid-cols-2 max-sm:grid-cols-1">
            <InfoItem label="Export" text="Creates a portable file." />
            <InfoItem label="Import" text="Adds or replaces data." />
            <InfoItem label="Backup" text="Creates a safety copy." />
            <InfoItem label="Restore" text="Returns Wallet to a previous state." />
          </div>
        </div>
      </div>

      <ImportWorkflowModal open={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <RestoreWorkflowModal open={isRestoreOpen} onClose={() => setIsRestoreOpen(false)} />
    </AppCard>
  );
}

function ActionCard({
  badge,
  children,
  description,
  icon,
  title,
}: {
  badge: string;
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4 shadow-app-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-app-sm bg-app-primary/10 text-app-primary ring-1 ring-app-primary/10">
            {icon}
          </div>
          <div>
            <h3 className="text-card text-app-text">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-app-muted">{description}</p>
          </div>
        </div>
        <AppBadge variant="neutral">{badge}</AppBadge>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-3">
      <p className="font-semibold text-app-text">{label}</p>
      <p className="mt-1 text-app-muted">{text}</p>
    </div>
  );
}

export function ImportWorkflowModal({
  onClose,
  onImported,
  open,
}: {
  open: boolean;
  onClose: () => void;
  onImported?: (result: ImportResult) => void;
}) {
  const toast = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setIsValidating(false);
    setIsImporting(false);
    setJson("");
    setFileName("");
    setPreview(null);
    setMode("merge");
    setConfirmation("");
    setResult(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setJson("");
    setFileName("");
    setPreview(null);
    setResult(null);
    setConfirmation("");

    if (!file) {
      return;
    }

    setIsValidating(true);

    try {
      const fileJson = await file.text();
      const nextPreview = await invoke<ImportPreview>("validate_import_file", { json: fileJson });
      setJson(fileJson);
      setFileName(file.name);
      setPreview(nextPreview);
      toast.success("Import file is valid. Review the preview before continuing.", "Import ready");
    } catch (error) {
      toast.error(errorMessage(error), "Import validation failed");
      event.target.value = "";
    } finally {
      setIsValidating(false);
    }
  }

  async function handleImport() {
    if (!json) {
      toast.error("Select and validate a Wallet JSON export first.", "Import failed");
      return;
    }

    if (mode === "replace" && confirmation !== "REPLACE") {
      toast.error("Type REPLACE to confirm replacement.", "Confirmation required");
      return;
    }

    setIsImporting(true);

    try {
      const nextResult = await invoke<ImportResult>("import_wallet_data", { json, mode });
      const importedCount = totalCounts(nextResult.imported);
      const skippedCount = totalCounts(nextResult.skipped);
      toast.success(
        `${mode === "replace" ? "Replaced data with" : "Imported"} ${importedCount} records. Skipped ${skippedCount}.`,
        mode === "replace" ? "Replace complete" : "Import complete",
      );
      setResult(nextResult);
      onImported?.(nextResult);
    } catch (error) {
      toast.error(errorMessage(error), "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <AppModal
      description="Import is guided step by step so you can review the file before anything changes."
      onClose={close}
      open={open}
      title="Import Data"
    >
      <div className="grid gap-4">
        <StepHeader current={result ? 5 : preview ? 3 : 1} labels={["Select", "Preview", "Mode", "Confirm", "Result"]} />

        <section className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
          <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
            Step 1: Select File
          </h3>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">Wallet JSON file</span>
            <AppInput
              accept="application/json,.json"
              disabled={isValidating || isImporting}
              onChange={handleFileSelected}
              type="file"
            />
          </label>
          {isValidating ? (
            <p className="text-sm font-semibold text-app-muted">Validating import file...</p>
          ) : null}
        </section>

        {preview ? (
          <>
            <PreviewPanel
              fileName={fileName}
              subtitle={`Export version ${preview.summary.version}, created ${preview.summary.exportedAt}`}
              summary={preview.summary}
              warnings={preview.warnings}
            />

            <section className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/54 p-4">
              <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
                Step 3: Choose Mode
              </h3>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <ModeOption
                  checked={mode === "merge"}
                  description="Adds missing records and skips duplicates."
                  label="Merge"
                  onClick={() => {
                    setMode("merge");
                    setConfirmation("");
                  }}
                />
                <ModeOption
                  checked={mode === "replace"}
                  description="Clears current data, then imports the file."
                  label="Replace"
                  onClick={() => setMode("replace")}
                />
              </div>
            </section>

            <section className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/54 p-4">
              <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
                Step 4: Confirm
              </h3>
              {mode === "replace" ? (
                <div className="grid gap-3">
                  <p className="rounded-app-sm border border-app-danger/18 bg-app-danger/8 p-3 text-sm font-semibold text-app-danger">
                    Replacing data will clear current Wallet records before importing this file.
                  </p>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-app-danger">
                      Type REPLACE to confirm
                    </span>
                    <AppInput
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <p className="text-sm text-app-muted">
                  Current data stays in place. Duplicates and conflicts are handled during import.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <AppButton disabled={isImporting} onClick={close} variant="ghost">
                  Cancel
                </AppButton>
                <AppButton
                  disabled={isImporting || (mode === "replace" && confirmation !== "REPLACE")}
                  onClick={handleImport}
                  variant={mode === "replace" ? "danger" : "primary"}
                >
                  {isImporting ? "Working..." : mode === "replace" ? "Replace Data" : "Import Data"}
                </AppButton>
              </div>
            </section>
          </>
        ) : null}

        {result ? <ResultPanel result={result} /> : null}
      </div>
    </AppModal>
  );
}

function RestoreWorkflowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] = useState<RestoreResult | null>(null);

  function reset() {
    setIsValidating(false);
    setIsRestoring(false);
    setJson("");
    setFileName("");
    setPreview(null);
    setConfirmation("");
    setResult(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setJson("");
    setFileName("");
    setPreview(null);
    setConfirmation("");
    setResult(null);

    if (!file) {
      return;
    }

    setIsValidating(true);

    try {
      const fileJson = await file.text();
      const nextPreview = await invoke<BackupPreview>("validate_backup_file", { json: fileJson });
      setJson(fileJson);
      setFileName(file.name);
      setPreview(nextPreview);
      toast.success("Backup file is valid. Review the preview before restoring.", "Backup ready");
    } catch (error) {
      toast.error(errorMessage(error), "Backup validation failed");
      event.target.value = "";
    } finally {
      setIsValidating(false);
    }
  }

  async function handleRestore() {
    if (!json) {
      toast.error("Select and validate a Wallet backup first.", "Restore failed");
      return;
    }

    if (confirmation !== "RESTORE") {
      toast.error("Type RESTORE to confirm backup restore.", "Confirmation required");
      return;
    }

    setIsRestoring(true);

    try {
      const nextResult = await invoke<RestoreResult>("restore_wallet_backup", { json });
      toast.success(
        `Restored ${totalCounts(nextResult.restored.imported)} records. A safety backup was created first.`,
        "Restore complete",
      );
      setResult(nextResult);
    } catch (error) {
      toast.error(errorMessage(error), "Restore failed");
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleSaveSafetyBackup() {
    if (!result) {
      return;
    }

    try {
      await saveJsonFile(result.safetyBackupJson, walletBackupFileName("wallet-safety-backup"));
      toast.success("Safety backup was saved.", "Safety backup saved");
    } catch (error) {
      toast.error(errorMessage(error), "Safety backup save failed");
    }
  }

  return (
    <AppModal
      description="Restore uses a dedicated flow because it replaces current data."
      onClose={close}
      open={open}
      title="Restore Backup"
    >
      <div className="grid gap-4">
        <StepHeader current={result ? 5 : preview ? 3 : 1} labels={["Select", "Preview", "Warning", "Confirm", "Result"]} />

        <section className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-4">
          <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
            Step 1: Select Backup
          </h3>
          <label className="grid gap-2">
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">Wallet backup JSON file</span>
            <AppInput
              accept="application/json,.json"
              disabled={isValidating || isRestoring}
              onChange={handleFileSelected}
              type="file"
            />
          </label>
          {isValidating ? (
            <p className="text-sm font-semibold text-app-muted">Validating backup file...</p>
          ) : null}
        </section>

        {preview ? (
          <>
            <PreviewPanel
              fileName={fileName}
              subtitle={`Backup version ${preview.metadata.backupVersion}, created ${preview.metadata.createdAt}`}
              summary={preview.summary}
              warnings={preview.warnings}
            />

            <section className="grid gap-3 rounded-app-sm border border-app-danger/18 bg-app-danger/8 p-4">
              <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-danger">
                Step 3: Warning
              </h3>
              <p className="text-sm font-semibold text-app-danger">
                Restoring a backup will replace your current Wallet data.
              </p>
              <p className="text-sm leading-relaxed text-app-danger">
                Wallet creates a safety backup first, then replaces current records with the
                selected backup.
              </p>
            </section>

            <section className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/54 p-4">
              <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
                Step 4: Confirm Restore
              </h3>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-app-danger">
                  Type RESTORE to confirm
                </span>
                <AppInput
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
              <div className="flex justify-end gap-3">
                <AppButton disabled={isRestoring} onClick={close} variant="ghost">
                  Cancel
                </AppButton>
                <AppButton
                  disabled={isRestoring || confirmation !== "RESTORE"}
                  onClick={handleRestore}
                  variant="danger"
                >
                  {isRestoring ? "Restoring..." : "Restore Backup"}
                </AppButton>
              </div>
            </section>
          </>
        ) : null}

        {result ? (
          <section className="rounded-app-sm border border-app-success/18 bg-app-success/8 p-4 text-sm text-app-success">
            <h3 className="font-semibold">Step 5: Result</h3>
            <p className="mt-1">
              Restored {totalCounts(result.restored.imported)} records. A safety backup was created
              first at {result.safetyBackupCreatedAt}.
            </p>
            <AppButton className="mt-3" onClick={handleSaveSafetyBackup} variant="secondary">
              Save safety backup
            </AppButton>
          </section>
        ) : null}
      </div>
    </AppModal>
  );
}

function StepHeader({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="grid grid-cols-5 gap-2 text-caption font-semibold text-app-muted max-sm:grid-cols-1">
      {labels.map((label, index) => {
        const step = index + 1;
        return (
          <li
            className={`rounded-app-sm border px-3 py-2 ${
              step <= current
                ? "border-app-primary/18 bg-app-primary/10 text-app-primary"
                : "border-[rgba(60,38,52,0.08)] bg-white/48"
            }`}
            key={label}
          >
            {step}. {label}
          </li>
        );
      })}
    </ol>
  );
}

function PreviewPanel({
  fileName,
  subtitle,
  summary,
  warnings,
}: {
  fileName: string;
  subtitle: string;
  summary: ImportSummary;
  warnings: string[];
}) {
  return (
    <section className="grid gap-3 rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/54 p-4">
      <div>
        <h3 className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">
          Step 2: Validation & Preview
        </h3>
        <p className="mt-2 font-semibold text-app-text">{fileName}</p>
        <p className="text-sm text-app-muted">{subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm max-sm:grid-cols-2">
        <SummaryItem label="Accounts" value={summary.accounts} />
        <SummaryItem label="Categories" value={summary.categories} />
        <SummaryItem label="Transactions" value={summary.transactions} />
        <SummaryItem label="Budgets" value={summary.budgets} />
        <SummaryItem label="Recurring Bills" value={summary.recurringBills} />
        <SummaryItem label="Savings Goals" value={summary.savingsGoals} />
      </div>
      {warnings.length ? (
        <div className="rounded-app-sm border border-app-warning/18 bg-app-warning/10 p-3 text-sm text-app-warning">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ModeOption({
  checked,
  description,
  label,
  onClick,
}: {
  checked: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-app-sm border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-app-primary/20 ${
        checked ? "border-app-primary/28 bg-app-primary/10" : "border-[rgba(60,38,52,0.08)] bg-white/48 hover:bg-white/72"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block font-semibold text-app-text">{label}</span>
      <span className="mt-1 block text-sm text-app-muted">{description}</span>
    </button>
  );
}

function ResultPanel({ result }: { result: ImportResult }) {
  return (
    <section className="rounded-app-sm border border-app-success/18 bg-app-success/8 p-4 text-sm text-app-success">
      <h3 className="font-semibold">Step 5: Result</h3>
      <p className="mt-1">
        {result.mode === "replace" ? "Replaced data with" : "Imported"}{" "}
        {totalCounts(result.imported)} records. Skipped {totalCounts(result.skipped)} duplicates
        or handled conflicts.
      </p>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-app-sm border border-[rgba(60,38,52,0.08)] bg-white/48 p-3">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-app-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-app-text">{value}</p>
    </div>
  );
}

function totalCounts(counts: ImportEntityCounts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}
