import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./AppButton";

type AppModalProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function AppModal({
  children,
  description,
  onClose,
  open,
  title,
}: AppModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(33,27,34,0.34)] p-6 backdrop-blur-sm max-sm:p-4"
      role="presentation"
    >
      <div
        aria-labelledby="app-modal-title"
        aria-modal="true"
        className="glass-surface-strong max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-app-lg p-6 shadow-app-float max-sm:p-4"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-card text-app-text" id="app-modal-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-sm leading-6 text-app-muted">{description}</p>
            ) : null}
          </div>
          <IconButton icon={X} label="Close modal" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}
