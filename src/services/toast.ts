import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration: number; // in milliseconds
  createdAt: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach(listener => listener(copy));
  }

  public show(message: string, type: ToastType = 'info', title?: string, duration: number = 4000): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      id,
      title,
      message,
      type,
      duration,
      createdAt: Date.now()
    };

    // Keep maximum 4 toasts visible at a time to prevent screen clutter
    this.toasts = [newToast, ...this.toasts].slice(0, 4);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  public dismiss(id: string) {
    const prevLen = this.toasts.length;
    this.toasts = this.toasts.filter(t => t.id !== id);
    if (this.toasts.length !== prevLen) {
      this.notify();
    }
  }

  public clearAll() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

// Shorthand helper functions
export const toast = {
  success: (message: string, title?: string, duration?: number) => 
    toastManager.show(message, 'success', title || 'Success', duration),
  info: (message: string, title?: string, duration?: number) => 
    toastManager.show(message, 'info', title || 'Information', duration),
  warning: (message: string, title?: string, duration?: number) => 
    toastManager.show(message, 'warning', title || 'Warning', duration),
  error: (message: string, title?: string, duration?: number) => 
    toastManager.show(message, 'error', title || 'Alert', duration),
  dismiss: (id: string) => toastManager.dismiss(id)
};

// React Hook to access current active toasts
export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return () => unsubscribe();
  }, []);

  return {
    toasts,
    dismiss: (id: string) => toastManager.dismiss(id)
  };
};
