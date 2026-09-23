"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import styles from "./Admin.module.css";

type Tone = "info" | "success" | "error" | "warning";

type Toast = {
  id: number;
  tone: Tone;
  text: string;
  scanning: boolean;
};

type ScanToastApi = {
  beginScan: () => number;
  finishScan: (id: number, tone: Exclude<Tone, "info">, text: string) => void;
  notify: (tone: Exclude<Tone, "info">, text: string) => void;
};

const toneClass = {
  info: styles.toastInfo,
  success: styles.toastSuccess,
  error: styles.toastError,
  warning: styles.toastWarning,
} as const;

const ScanToastContext = createContext<ScanToastApi | null>(null);

export function useScanToast() {
  const api = useContext(ScanToastContext);
  if (!api) throw new Error("Scan toast is only available in the admin console.");
  return api;
}

export default function ScanToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const beginScan = useCallback(() => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, tone: "info", text: "در حال اسکن", scanning: true }]);
    return id;
  }, []);

  const finishScan = useCallback((id: number, tone: Exclude<Tone, "info">, text: string) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, tone, text, scanning: false } : toast)),
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6500);
  }, []);

  const notify = useCallback((tone: Exclude<Tone, "info">, text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, tone, text, scanning: false }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6500);
  }, []);

  const api = useMemo(() => ({ beginScan, finishScan, notify }), [beginScan, finishScan, notify]);

  return (
    <ScanToastContext.Provider value={api}>
      {children}
      <div className={styles.toastStack}>
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className={`${styles.toast} ${toneClass[toast.tone]}`}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            {toast.scanning ? (
              <span className={styles.waveDots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            ) : null}
            {toast.text}
          </p>
        ))}
      </div>
    </ScanToastContext.Provider>
  );
}
