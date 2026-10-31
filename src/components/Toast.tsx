import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 no-print">
      <span className="w-2 h-2 rounded-full bg-amber-400" />
      <span>{message}</span>
    </div>
  );
};
