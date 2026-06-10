import { ReactNode } from "react";
import { AppButton } from "./AppButton";

type AppModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
};

export function AppModal({
  open,
  title,
  description,
  children,
  onClose,
}: AppModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
    >
      <div className="w-full max-w-lg rounded-app border border-app-border bg-white p-6 shadow-app">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-lg font-extrabold leading-snug text-app-text"
              id="app-modal-title"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-app-muted">{description}</p>
            ) : null}
          </div>
          <AppButton aria-label="Close modal" onClick={onClose} variant="ghost">
            Close
          </AppButton>
        </div>
        {children}
      </div>
    </div>
  );
}
