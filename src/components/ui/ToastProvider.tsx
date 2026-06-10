import {
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "../../lib/classNames";

export type ToastVariant = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
};

type ToastInput = {
  message: string;
  title?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-white text-slate-900",
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
};

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, title, variant = "info" }: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [
        ...current.slice(-3),
        { id, message, title, variant },
      ]);

      window.setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (message, title) =>
        showToast({ message, title, variant: "success" }),
      error: (message, title) => showToast({ message, title, variant: "error" }),
      warning: (message, title) =>
        showToast({ message, title, variant: "warning" }),
      info: (message, title) => showToast({ message, title, variant: "info" }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.variant];

          return (
            <div
              className={cn(
                "flex items-start gap-3 rounded-app border p-4 shadow-app",
                toastStyles[toast.variant],
              )}
              key={toast.id}
              role="status"
            >
              <Icon className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <p className="font-extrabold">{toast.title}</p>
                ) : null}
                <p className="text-sm leading-relaxed">{toast.message}</p>
              </div>
              <button
                className="min-h-0 rounded-md border-0 bg-transparent p-1 text-current opacity-70 shadow-none hover:bg-black/5 hover:opacity-100 hover:shadow-none"
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
