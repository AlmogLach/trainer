"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info", duration: number = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:max-w-md">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: "bg-emerald-500/90 dark:bg-emerald-600/90 text-white border-emerald-600 dark:border-emerald-500",
    error: "bg-red-500/90 dark:bg-red-600/90 text-white border-red-600 dark:border-red-500",
    info: "bg-blue-500/90 dark:bg-blue-600/90 text-white border-blue-600 dark:border-blue-500",
    warning: "bg-amber-500/90 dark:bg-amber-600/90 text-white border-amber-600 dark:border-amber-500",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl shadow-2xl border-2 backdrop-blur-sm",
        "animate-in slide-in-from-top-4 fade-in duration-300",
        "pointer-events-auto",
        styles[toast.type]
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-bold">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

