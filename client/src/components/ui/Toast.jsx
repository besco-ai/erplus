import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext({ push: () => {} });

const ICON = { success: CheckCircle2, error: AlertCircle, info: AlertCircle };
const COLOR = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

/**
 * Lightweight toast provider — no dependencies. Wrap the app once and call
 * `useToast().push({ type, message })` from anywhere. Toasts auto-dismiss
 * after 4s and stack top-right.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((curr) => [...curr, { id, type: t.type || 'info', message: t.message || '' }]);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts((c) => c.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const Icon = ICON[toast.type] ?? AlertCircle;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 min-w-[260px] max-w-sm px-4 py-3 border rounded-lg shadow-md ${COLOR[toast.type]}`}
    >
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
