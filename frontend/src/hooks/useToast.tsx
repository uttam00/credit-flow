import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

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
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
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
      <Stack
        spacing={1}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: (t) => t.zIndex.snackbar }}
      >
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open
            autoHideDuration={5000}
            onClose={() => dismissToast(toast.id)}
            sx={{ position: 'static' }}
          >
            <Alert severity={toast.variant} variant="filled" onClose={() => dismissToast(toast.id)}>
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
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
