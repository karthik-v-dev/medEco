import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Bell, 
  X 
} from 'lucide-react';
import { useToasts, ToastItem, ToastType } from '../services/toast';

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToasts();

  if (toasts.length === 0) return null;

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          accentBg: 'bg-emerald-500',
          borderClass: 'border-emerald-200 dark:border-emerald-800/80',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
          accentBg: 'bg-rose-500',
          borderClass: 'border-rose-200 dark:border-rose-800/80',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
          accentBg: 'bg-amber-500',
          borderClass: 'border-amber-200 dark:border-amber-800/80',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        };
      case 'info':
      default:
        return {
          icon: <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
          accentBg: 'bg-blue-500',
          borderClass: 'border-blue-200 dark:border-blue-800/80',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
        };
    }
  };

  return (
    <div 
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border ${config.borderClass} p-3.5 flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-200 transition-all`}
            role="status"
          >
            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentBg}`} />

            {/* Icon */}
            <div className="pt-0.5">
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {toast.title}
                  </h4>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md ${config.badgeClass}`}>
                    {toast.type}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
