import React from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: <Check className="h-5 w-5 text-green-600" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: <X className="h-5 w-5 text-red-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles.bg} ${styles.border} animate-in slide-in-from-bottom-5 duration-300`}
    >
      {styles.icon}
      <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-2 ${styles.text} hover:opacity-70`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Hook for toast management
export function useToast() {
  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const show = React.useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      setToast({ type, message });
      if (duration > 0) {
        setTimeout(() => setToast(null), duration);
      }
    },
    []
  );

  const hide = React.useCallback(() => setToast(null), []);

  return {
    toast,
    show,
    hide,
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    warning: (msg: string) => show('warning', msg),
    info: (msg: string) => show('info', msg),
  };
}
