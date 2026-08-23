import React from 'react';

interface Props {
  titulo: string;
  isAberto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const AcordeaoSecao: React.FC<Props> = ({ titulo, isAberto, onToggle, children }) => {
  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-white hover:bg-slate-800/50 transition"
      >
        <span className="text-sm uppercase tracking-wider text-slate-200">{titulo}</span>
        <span className="text-xl text-emerald-500">{isAberto ? '−' : '+'}</span>
      </button>
      {isAberto && (
        <div className="p-6 md:p-8 border-t border-slate-800 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
};
