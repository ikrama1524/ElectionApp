import { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;
const toasts = [];
const listeners = [];

export const toast = {
  success: (message, title = 'Success') => {
    const id = toastId++;
    toasts.push({ id, type: 'success', title, message });
    listeners.forEach(listener => listener([...toasts]));
    return id;
  },
  error: (message, title = 'Error') => {
    const id = toastId++;
    toasts.push({ id, type: 'error', title, message });
    listeners.forEach(listener => listener([...toasts]));
    return id;
  },
  info: (message, title = 'Info') => {
    const id = toastId++;
    toasts.push({ id, type: 'info', title, message });
    listeners.forEach(listener => listener([...toasts]));
    return id;
  },
};

export const ToastContainer = () => {
  const [toastList, setToastList] = useState([]);

  useEffect(() => {
    const listener = (newToasts) => setToastList(newToasts);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const removeToast = (id) => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      listeners.forEach(listener => listener([...toasts]));
    }
  };

  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [toastList]);

  return (
    <div className="toast-container">
      {toastList.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✕'}
            {t.type === 'info' && 'ℹ'}
          </div>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            <div className="toast-message">{t.message}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => removeToast(t.id)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

