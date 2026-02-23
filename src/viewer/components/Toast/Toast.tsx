/**
 * Toast notification component.
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import styles from "./Toast.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
  visible: boolean;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((options: ToastOptions) => {
    const id = Date.now();
    setToast({
      ...options,
      id,
      type: options.type ?? "info",
      duration: options.duration ?? 3000,
      visible: true,
    });
  }, []);

  useEffect(() => {
    if (!toast?.visible) return;

    const timer = setTimeout(() => {
      setToast((t) => (t ? { ...t, visible: false } : null));
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast?.id, toast?.visible, toast?.duration]);

  // Remove from DOM after fade-out
  useEffect(() => {
    if (toast && !toast.visible) {
      const timer = setTimeout(() => setToast(null), 300);
      return () => clearTimeout(timer);
    }
  }, [toast?.visible]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className={`${styles.toast} ${styles[toast.type ?? "info"]} ${
            toast.visible ? styles.visible : ""
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className={styles.icon}>{getIcon(toast.type ?? "info")}</span>
          <span className={styles.message}>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

// Helper to get icon for toast type
function getIcon(type: ToastType): string {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "⚠";
    case "info":
    default:
      return "ℹ";
  }
}

// ─── Standalone Component (for use in App.tsx) ───────────────────────────────

// If using outside provider, this is a simple placeholder
export function Toast() {
  return null; // Toast is rendered by ToastProvider
}
