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

type ImportSummary = {
  version: string;
  exportedAt: string;
  accounts: number;
  categories: number;
  transactions: number;
  budgets: number;
  recurringBills: number;
  savingsGoals: number;
};

type ImportResult = {
  imported: ImportSummaryCounts;
  skipped: ImportSummaryCounts;
};

type ImportSummaryCounts = {
  accounts: number;
  categories: number;
  transactions: number;
  budgets: number;
  recurringBills: number;
  savingsGoals: number;
};

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<WalletExportFileHandle>;
  }
}

function walletExportFileName() {
  return `wallet-export-${new Date().toISOString().slice(0, 10)}.json`;
}

async function saveJsonFile(json: string) {
  const suggestedName = walletExportFileName();

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
  const [isValidatingImport, setIsValidatingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);

  async function handleExportWalletData() {
    setIsExporting(true);

    try {
      const json = await invoke<string>("export_wallet_data");
      JSON.parse(json);
      await saveJsonFile(json);
      toast.success("Wallet data was exported to a JSON file.", "Export complete");
    } catch (error) {
      toast.error(errorMessage(error), "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImportJson("");
    setImportFileName("");
    setImportSummary(null);

    if (!file) {
      return;
    }

    setIsValidatingImport(true);

    try {
      const json = await file.text();
      const summary = await invoke<ImportSummary>("validate_import_file", { json });
      setImportJson(json);
      setImportFileName(file.name);
      setImportSummary(summary);
      toast.success("Import file is valid. Review the summary before importing.", "Import ready");
    } catch (error) {
      toast.error(errorMessage(error), "Import validation failed");
      event.target.value = "";
    } finally {
      setIsValidatingImport(false);
    }
  }

  async function handleImportWalletData() {
    if (!importJson) {
      toast.error("Select and validate a Wallet JSON export first.", "Import failed");
      return;
    }

    setIsImporting(true);

    try {
      const result = await invoke<ImportResult>("import_wallet_data", { json: importJson });
      const importedCount = Object.values(result.imported).reduce(
        (total, count) => total + count,
        0,
      );
      const skippedCount = Object.values(result.skipped).reduce((total, count) => total + count, 0);
      toast.success(
        `Imported ${importedCount} records. Skipped ${skippedCount} records that already existed.`,
        "Import complete",
      );
      setIsConfirmingImport(false);
    } catch (error) {
      toast.error(errorMessage(error), "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <AppCard
      description="Create a local JSON backup of your wallet data. Import, restore, encryption, cloud storage, and CSV export are not part of this first version."
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

            {importSummary ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-app-text">{importFileName}</p>
                    <p className="text-sm text-app-muted">
                      Export version {importSummary.version}, created {importSummary.exportedAt}
                    </p>
                  </div>
                  <AppButton
                    className="gap-2 whitespace-nowrap"
                    disabled={isImporting}
                    onClick={() => setIsConfirmingImport(true)}
                    variant="secondary"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Import Data
                  </AppButton>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <SummaryItem label="Accounts" value={importSummary.accounts} />
                  <SummaryItem label="Categories" value={importSummary.categories} />
                  <SummaryItem label="Transactions" value={importSummary.transactions} />
                  <SummaryItem label="Budgets" value={importSummary.budgets} />
                  <SummaryItem label="Recurring Bills" value={importSummary.recurringBills} />
                  <SummaryItem label="Savings Goals" value={importSummary.savingsGoals} />
                </div>
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
        description="This action may modify your current data."
        onClose={() => setIsConfirmingImport(false)}
        open={isConfirmingImport}
        title="Confirm import"
      >
        <div className="grid gap-4">
          <p className="text-sm leading-relaxed text-app-muted">
            Wallet will merge records from the selected export file. Existing
            records with the same IDs are preserved and skipped.
          </p>
          <div className="flex justify-end gap-3">
            <AppButton
              disabled={isImporting}
              onClick={() => setIsConfirmingImport(false)}
              variant="ghost"
            >
              Cancel
            </AppButton>
            <AppButton disabled={isImporting} onClick={handleImportWalletData} variant="primary">
              {isImporting ? "Importing..." : "Import Data"}
            </AppButton>
          </div>
        </div>
      </AppModal>
    </AppCard>
  );
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
