import { invoke } from "@tauri-apps/api/core";
import { Download } from "lucide-react";
import { useState } from "react";
import { AppBadge, AppButton, AppCard } from "../../../components/ui";
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
    </AppCard>
  );
}
