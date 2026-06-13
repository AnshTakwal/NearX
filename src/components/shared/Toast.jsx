import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: 'bg-white border-l-4 border-[#22C55E] text-[#166534]',
  error: 'bg-white border-l-4 border-[#EF4444] text-[#991B1B]',
  info: 'bg-white border-l-4 border-[#00BCD4] text-[#0e7490]',
  warning: 'bg-white border-l-4 border-[#F59E0B] text-[#92400E]',
};

const ICON_COLORS = {
  success: 'text-[#22C55E]',
  error: 'text-[#EF4444]',
  info: 'text-[#00BCD4]',
  warning: 'text-[#F59E0B]',
};

let toastIdCounter = 0;
let globalSetToasts = null;

/** Call this from anywhere to show a toast. */
export function showToast(message, type = 'info', duration = 3000) {
  if (!globalSetToasts) return;
  const id = ++toastIdCounter;
  globalSetToasts((prev) => [...prev, { id, message, type, duration }]);
}

/** Convenience helpers */
export const toast = {
  success: (msg, dur) => showToast(msg, 'success', dur),
  error: (msg, dur) => showToast(msg, 'error', dur),
  info: (msg, dur) => showToast(msg, 'info', dur),
  warning: (msg, dur) => showToast(msg, 'warning', dur),
};

function ToastItem({ id, message, type, duration, onRemove }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [id, duration, onRemove]);

  const Icon = ICONS[type] || Info;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-lg max-w-sm w-full
        transition-all duration-300 ease-in-out
        ${STYLES[type]}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <Icon size={20} className={`mt-0.5 flex-shrink-0 ${ICON_COLORS[type]}`} />
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(id), 300);
        }}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/** Mount this once at the root of your app (inside App.jsx). */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    globalSetToasts = setToasts;
    return () => { globalSetToasts = null; };
  }, []);

  const remove = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
