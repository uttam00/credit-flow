import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ToastVariant = 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextToastId = 0;

// api.ts runs outside the React tree (axios interceptors aren't components),
// so it can't call useToast() directly. This module-level bridge lets it
// trigger a toast anyway; the provider wires itself in on mount.
let externalShowToast: ((message: string, variant?: ToastVariant) => void) | null = null;

export function showGlobalToast(message: string, variant: ToastVariant = 'error'): void {
  externalShowToast?.(message, variant);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = nextToastId++;
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    externalShowToast = showToast;
    return () => {
      externalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1000,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.variant === 'error' ? '#fee2e2' : '#e0f2fe',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              padding: '8px 12px',
              minWidth: 220,
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
