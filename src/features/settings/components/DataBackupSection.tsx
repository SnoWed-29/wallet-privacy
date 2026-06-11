import { invoke } from "@tauri-apps/api/core";
import { Download, Upload } from "lucide-react";
import { type ChangeEvent } from "react";
import { useState } from "react";
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

type ImportMode = "merge" | "replace";

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

  return "Could not export wallet data.";
}

export function DataBackupSection() {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isValidatingImport, setIsValidatingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedImportMode, setSelectedImportMode] = useState<ImportMode>("merge");
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [replaceConfirmation, setReplaceConfirmation] = useState("");
  const [isValidatingBackup, setIsValidatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupJson, setBackupJson] = useState("");
  const [backupFileName, setBackupFileName] = useState("");
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");

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

  async function handleImportFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImportJson("");
    setImportFileName("");
    setImportPreview(null);
    setImportResult(null);
    setReplaceConfirmation("");

    if (!file) {
      return;
    }

    setIsValidatingImport(true);

    try {
      const json = await file.text();
      const preview = await invoke<ImportPreview>("validate_import_file", { json });
      setImportJson(json);
      setImportFileName(file.name);
      setImportPreview(preview);
      toast.success("Import file is valid. Review the summary before importing.", "Import ready");
    } catch (error) {
      toast.error(errorMessage(error), "Import validation failed");
      event.target.value = "";
    } finally {
      setIsValidatingImport(false);
    }
  }

  async function handleBackupFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setBackupJson("");
    setBackupFileName("");
    setBackupPreview(null);
    setRestoreResult(null);
    setRestoreConfirmation("");

    if (!file) {
      return;
    }

    setIsValidatingBackup(true);

    try {
      const json = await file.text();
      const preview = await invoke<BackupPreview>("validate_backup_file", { json });
      setBackupJson(json);
      setBackupFileName(file.name);
      setBackupPreview(preview);
      toast.success("Backup file is valid. Review the restore preview before continuing.", "Backup ready");
    } catch (error) {
      toast.error(errorMessage(error), "Backup validation failed");
      event.target.value = "";
    } finally {
      setIsValidatingBackup(false);
    }
  }

  function openImportConfirmation(mode: ImportMode) {
    setSelectedImportMode(mode);
    setReplaceConfirmation("");
    setIsConfirmingImport(true);
  }

  async function handleImportWalletData() {
    if (!importJson) {
      toast.error("Select and validate a Wallet JSON export first.", "Import failed");
      return;
    }

    if (selectedImportMode === "replace" && replaceConfirmation !== "REPLACE") {
      toast.error("Type REPLACE to confirm restore.", "Confirmation required");
      return;
    }

    setIsImporting(true);

    try {
      const result = await invoke<ImportResult>("import_wallet_data", {
        json: importJson,
        mode: selectedImportMode,
      });
      const importedCount = totalCounts(result.imported);
      const skippedCount = Object.values(result.skipped).reduce((total, count) => total + count, 0);
      toast.success(
        `${selectedImportMode === "replace" ? "Restored" : "Imported"} ${importedCount} records. Skipped ${skippedCount}.`,
        selectedImportMode === "replace" ? "Restore complete" : "Import complete",
      );
      setImportResult(result);
      setIsConfirmingImport(false);
    } catch (error) {
      toast.error(errorMessage(error), "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleRestoreBackup() {
    if (!backupJson) {
      toast.error("Select and validate a Wallet backup first.", "Restore failed");
      return;
    }

    if (restoreConfirmation !== "RESTORE") {
      toast.error("Type RESTORE to confirm backup restore.", "Confirmation required");
      return;
    }

    setIsRestoringBackup(true);

    try {
      const result = await invoke<RestoreResult>("restore_wallet_backup", {
        json: backupJson,
      });
      const restoredCount = totalCounts(result.restored.imported);
      toast.success(
        `Restored ${restoredCount} records. A safety backup was created first.`,
        "Restore complete",
      );
      setRestoreResult(result);
      setIsConfirmingRestore(false);
    } catch (error) {
      toast.error(errorMessage(error), "Restore failed");
    } finally {
      setIsRestoringBackup(false);
    }
  }

  async function handleSaveSafetyBackup() {
    if (!restoreResult) {
      return;
    }

    try {
      await saveJsonFile(
        restoreResult.safetyBackupJson,
        walletBackupFileName("wallet-safety-backup"),
      );
      toast.success("Safety backup was saved.", "Safety backup saved");
    } catch (error) {
      toast.error(errorMessage(error), "Safety backup save failed");
    }
  }

  return (
    <AppCard
      description="Export data for portability, import data into this wallet, create safety backups, or restore from a backup when you need to replace current data."
      title="Data & Backup"
      actions={<AppBadge variant="success">Local JSON</AppBadge>}
    >
      <div className="grid gap-4">
        <div className="rounded-app-sm border border-app-border bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-4 max-sm:flex-col">
            <div>
              <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                Export Data
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-app-muted">
                Export accounts, categories, transactions, budgets, recurring
                bills, and savings goals into one JSON file with version
                metadata.
              </p>
            </div>
            <AppButton
              className="gap-2 whitespace-nowrap"
              disabled={isExporting}
              onClick={handleExportWalletData}
              variant="primary"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "Exporting..." : "Export Wallet Data"}
            </AppButton>
          </div>
        </div>

        <div className="rounded-app-sm border border-app-border bg-slate-50/70 p-4">
          <div className="grid gap-4">
            <div className="flex items-start justify-between gap-4 max-sm:flex-col">
              <div>
                <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                  Import Data
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-app-muted">
                  Select a Wallet JSON export, validate it, review the summary,
                  then merge missing records into this wallet.
                </p>
              </div>
              <AppBadge variant="warning">Merge import</AppBadge>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Wallet JSON file
              </span>
              <AppInput
                accept="application/json,.json"
                disabled={isValidatingImport || isImporting}
                onChange={handleImportFileSelected}
                type="file"
              />
            </label>

            {isValidatingImport ? (
              <p className="text-sm font-extrabold text-app-muted">Validating import file...</p>
            ) : null}

            {importPreview ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-app-text">{importFileName}</p>
                    <p className="text-sm text-app-muted">
                      Export version {importPreview.summary.version}, created{" "}
                      {importPreview.summary.exportedAt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AppButton
                      className="gap-2 whitespace-nowrap"
                      disabled={isImporting}
                      onClick={() => openImportConfirmation("merge")}
                      variant="secondary"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Merge with current data
                    </AppButton>
                    <AppButton
                      className="gap-2 whitespace-nowrap"
                      disabled={isImporting}
                      onClick={() => openImportConfirmation("replace")}
                      variant="danger"
                    >
                      Restore from file
                    </AppButton>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <SummaryItem label="Accounts" value={importPreview.summary.accounts} />
                  <SummaryItem label="Categories" value={importPreview.summary.categories} />
                  <SummaryItem label="Transactions" value={importPreview.summary.transactions} />
                  <SummaryItem label="Budgets" value={importPreview.summary.budgets} />
                  <SummaryItem
                    label="Recurring Bills"
                    value={importPreview.summary.recurringBills}
                  />
                  <SummaryItem label="Savings Goals" value={importPreview.summary.savingsGoals} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm max-lg:grid-cols-1">
                  <SummaryPanel title="Detected duplicates" counts={importPreview.duplicates} />
                  <SummaryPanel title="Detected conflicts" counts={importPreview.conflicts} />
                </div>

                {importPreview.warnings.length ? (
                  <div className="rounded-app-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-extrabold">Warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {importPreview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {importResult ? (
              <div className="rounded-app-sm border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-extrabold">
                  {importResult.mode === "replace" ? "Restore result" : "Import result"}
                </p>
                <p className="mt-1">
                  Imported {totalCounts(importResult.imported)} records. Skipped{" "}
                  {totalCounts(importResult.skipped)} duplicates or handled conflicts.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-app-sm border border-app-border bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-4 max-sm:flex-col">
            <div>
              <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-app-text">
                Create Backup
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-app-muted">
                Create a safety copy of all Wallet data with backup metadata,
                app version when available, and record counts.
              </p>
              <p className="mt-1 text-sm text-app-muted">
                Suggested filename: {walletBackupFileName()}
              </p>
            </div>
            <AppButton
              className="gap-2 whitespace-nowrap"
              disabled={isCreatingBackup}
              onClick={handleCreateBackup}
              variant="primary"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isCreatingBackup ? "Creating..." : "Create Backup"}
            </AppButton>
          </div>
        </div>

        <div className="rounded-app-sm border border-red-200 bg-red-50/60 p-4">
          <div className="grid gap-4">
            <div className="flex items-start justify-between gap-4 max-sm:flex-col">
              <div>
                <h3 className="m-0 text-base font-extrabold normal-case tracking-normal text-red-950">
                  Restore Backup
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-red-900">
                  Select a Wallet backup JSON file, validate it, review the
                  restore preview, then explicitly confirm replacement.
                </p>
              </div>
              <AppBadge variant="expense">Replace-only</AppBadge>
            </div>

            <p className="rounded-app-sm border border-red-300 bg-white p-3 text-sm font-extrabold text-red-800">
              Restoring a backup will replace your current Wallet data.
            </p>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-slate-700">
                Wallet backup JSON file
              </span>
              <AppInput
                accept="application/json,.json"
                disabled={isValidatingBackup || isRestoringBackup}
                onChange={handleBackupFileSelected}
                type="file"
              />
            </label>

            {isValidatingBackup ? (
              <p className="text-sm font-extrabold text-app-muted">Validating backup file...</p>
            ) : null}

            {backupPreview ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-app-text">{backupFileName}</p>
                    <p className="text-sm text-app-muted">
                      Backup version {backupPreview.metadata.backupVersion}, created{" "}
                      {backupPreview.metadata.createdAt}
                      {backupPreview.metadata.appVersion
                        ? `, app ${backupPreview.metadata.appVersion}`
                        : ""}
                    </p>
                  </div>
                  <AppButton
                    className="gap-2 whitespace-nowrap"
                    disabled={isRestoringBackup}
                    onClick={() => {
                      setRestoreConfirmation("");
                      setIsConfirmingRestore(true);
                    }}
                    variant="danger"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Restore Backup
                  </AppButton>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <SummaryItem label="Accounts" value={backupPreview.summary.accounts} />
                  <SummaryItem label="Categories" value={backupPreview.summary.categories} />
                  <SummaryItem label="Transactions" value={backupPreview.summary.transactions} />
                  <SummaryItem label="Budgets" value={backupPreview.summary.budgets} />
                  <SummaryItem
                    label="Recurring Bills"
                    value={backupPreview.summary.recurringBills}
                  />
                  <SummaryItem label="Savings Goals" value={backupPreview.summary.savingsGoals} />
                </div>

                {backupPreview.warnings.length ? (
                  <div className="rounded-app-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-extrabold">Warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {backupPreview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {restoreResult ? (
              <div className="rounded-app-sm border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-extrabold">Restore summary</p>
                <p className="mt-1">
                  Restored {totalCounts(restoreResult.restored.imported)} records from the backup.
                  A safety backup was created first at {restoreResult.safetyBackupCreatedAt}.
                </p>
                <AppButton
                  className="mt-3"
                  onClick={handleSaveSafetyBackup}
                  variant="secondary"
                >
                  Save safety backup
                </AppButton>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm max-lg:grid-cols-1">
          <div className="rounded-app-sm border border-app-border bg-white p-3">
            <p className="font-extrabold text-app-text">Included</p>
            <p className="mt-1 text-app-muted">
              All supported wallet entities, including empty collections.
            </p>
          </div>
          <div className="rounded-app-sm border border-app-border bg-white p-3">
            <p className="font-extrabold text-app-text">Format</p>
            <p className="mt-1 text-app-muted">
              Pretty-printed JSON with `version` and `exportedAt` metadata.
            </p>
          </div>
          <div className="rounded-app-sm border border-app-border bg-white p-3">
            <p className="font-extrabold text-app-text">Storage</p>
            <p className="mt-1 text-app-muted">
              Saved only where you choose on this device.
            </p>
          </div>
        </div>
      </div>

      <AppModal
        description={
          selectedImportMode === "replace"
            ? "This will replace your current Wallet data with the selected file. Your current data may be lost."
            : "Imported data will be added to your current Wallet data. Existing data will stay."
        }
        onClose={() => {
          setIsConfirmingImport(false);
          setReplaceConfirmation("");
        }}
        open={isConfirmingImport}
        title={selectedImportMode === "replace" ? "Confirm restore" : "Confirm merge import"}
      >
        <div className="grid gap-4">
          <p className="text-sm leading-relaxed text-app-muted">
            {selectedImportMode === "replace"
              ? "Restore is destructive. Wallet will clear current finance data, then import records from the selected file."
              : "Duplicates may be skipped and conflicts may be renamed or reported. Existing records are not deleted."}
          </p>
          {selectedImportMode === "replace" ? (
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-red-700">
                Type REPLACE to confirm restore
              </span>
              <AppInput
                value={replaceConfirmation}
                onChange={(event) => setReplaceConfirmation(event.target.value)}
              />
            </label>
          ) : null}
          <div className="flex justify-end gap-3">
            <AppButton
              disabled={isImporting}
              onClick={() => {
                setIsConfirmingImport(false);
                setReplaceConfirmation("");
              }}
              variant="ghost"
            >
              Cancel
            </AppButton>
            <AppButton
              disabled={
                isImporting ||
                (selectedImportMode === "replace" && replaceConfirmation !== "REPLACE")
              }
              onClick={handleImportWalletData}
              variant={selectedImportMode === "replace" ? "danger" : "primary"}
            >
              {isImporting
                ? "Working..."
                : selectedImportMode === "replace"
                  ? "Replace current data"
                  : "Merge import"}
            </AppButton>
          </div>
        </div>
      </AppModal>

      <AppModal
        description="This restore is replace-only. Wallet will not merge backup data with current data."
        onClose={() => {
          setIsConfirmingRestore(false);
          setRestoreConfirmation("");
        }}
        open={isConfirmingRestore}
        title="Confirm backup restore"
      >
        <div className="grid gap-4">
          <p className="rounded-app-sm border border-red-300 bg-red-50 p-3 text-sm font-extrabold text-red-800">
            Restoring a backup will replace your current Wallet data.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            Wallet will create a safety backup of the current data first, then
            replace current records with the validated backup contents.
          </p>
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-red-700">
              Type RESTORE to confirm backup restore
            </span>
            <AppInput
              value={restoreConfirmation}
              onChange={(event) => setRestoreConfirmation(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-3">
            <AppButton
              disabled={isRestoringBackup}
              onClick={() => {
                setIsConfirmingRestore(false);
                setRestoreConfirmation("");
              }}
              variant="ghost"
            >
              Cancel
            </AppButton>
            <AppButton
              disabled={isRestoringBackup || restoreConfirmation !== "RESTORE"}
              onClick={handleRestoreBackup}
              variant="danger"
            >
              {isRestoringBackup ? "Restoring..." : "Replace current data"}
            </AppButton>
          </div>
        </div>
      </AppModal>
    </AppCard>
  );
}

function totalCounts(counts: ImportEntityCounts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-app-sm border border-app-border bg-white p-3">
      <p className="text-xs font-extrabold uppercase tracking-wide text-app-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-app-text">{value}</p>
    </div>
  );
}

function SummaryPanel({ title, counts }: { title: string; counts: ImportEntityCounts }) {
  return (
    <div className="rounded-app-sm border border-app-border bg-white p-3">
      <p className="font-extrabold text-app-text">{title}</p>
      <p className="mt-1 text-sm text-app-muted">
        {totalCounts(counts)} total across accounts, categories, transactions,
        budgets, recurring bills, and savings goals.
      </p>
    </div>
  );
}
