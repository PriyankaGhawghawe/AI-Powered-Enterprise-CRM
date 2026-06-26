import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { FaCircleCheck, FaCircleExclamation, FaCircleInfo, FaXmark } from 'react-icons/fa6';

const Toast = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <FaCircleCheck className="text-emerald-500 text-xl flex-shrink-0" />,
    error: <FaCircleExclamation className="text-rose-500 text-xl flex-shrink-0" />,
    info: <FaCircleInfo className="text-blue-500 text-xl flex-shrink-0" />
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl p-4 pr-12 flex items-start gap-3 relative animate-slide-up w-full max-w-sm pointer-events-auto">
      {icons[toast.type] || icons.info}
      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug mt-0.5">{toast.message}</p>
      <button 
        onClick={() => onRemove(toast.id)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <FaXmark />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useContext(AppContext);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full px-4 items-center">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
