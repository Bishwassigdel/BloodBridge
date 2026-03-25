// src/components/Toast.jsx
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaInfoCircle } from 'react-icons/fa';

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
};

const STYLES = {
  success: 'bg-white border-l-4 border-green-500 text-gray-800',
  error:   'bg-white border-l-4 border-red-500 text-gray-800',
  info:    'bg-white border-l-4 border-blue-500 text-gray-800',
};

const ICON_COLORS = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-blue-500',
};

/**
 * Toast — small slide-in notification
 *
 * Props:
 *   toasts  : [{ id, type, title, message }]
 *   remove  : (id) => void
 */
export default function Toast({ toasts = [], remove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, remove }) {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[toast.type] || FaInfoCircle;

  useEffect(() => {
    // Slide in
    const enter = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after duration (default 4 s)
    const leave = setTimeout(() => {
      setVisible(false);
      setTimeout(() => remove(toast.id), 350);
    }, toast.duration || 4000);
    return () => { clearTimeout(enter); clearTimeout(leave); };
  }, [toast.id, toast.duration, remove]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl max-w-sm w-full
        ${STYLES[toast.type] || STYLES.info}
        transition-all duration-350
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <Icon className={`text-xl flex-shrink-0 mt-0.5 ${ICON_COLORS[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-bold">{toast.title}</p>}
        {toast.message && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => remove(toast.id), 350); }}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
      >
        <FaTimes className="text-xs" />
      </button>
    </div>
  );
}

// ── Hook to manage toast state ─────────────────────────────────────────────
let _id = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = ({ type = 'info', title, message, duration }) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const success = (title, message, duration) => add({ type: 'success', title, message, duration });
  const error   = (title, message, duration) => add({ type: 'error',   title, message, duration });
  const info    = (title, message, duration) => add({ type: 'info',    title, message, duration });

  return { toasts, remove, success, error, info };
}
