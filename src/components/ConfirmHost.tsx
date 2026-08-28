import React, { useEffect, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import type { ConfirmOpts } from '../lib/confirm';

interface PendingConfirm extends ConfirmOpts {
  resolve: (v: boolean) => void;
}

export const ConfirmHost: React.FC = () => {
  const [atual, setAtual] = useState<PendingConfirm | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as PendingConfirm;
      if (detail?.mensagem) setAtual(detail);
    };
    window.addEventListener('rz-confirm', handler as EventListener);
    return () => window.removeEventListener('rz-confirm', handler as EventListener);
  }, []);

  if (!atual) return null;

  const fechar = (valor: boolean) => {
    atual.resolve(valor);
    setAtual(null);
  };

  const perigo = !!atual.perigo;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => fechar(false)}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${perigo ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'}`}>
            {perigo ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            {atual.titulo && <h3 className="text-sm font-black text-white mb-1">{atual.titulo}</h3>}
            <p className="text-xs text-slate-300 leading-relaxed">{atual.mensagem}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-5">
          <button
            onClick={() => fechar(false)}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            {atual.cancelarLabel || 'Cancelar'}
          </button>
          <button
            onClick={() => fechar(true)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition shadow-lg ${perigo ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'}`}
          >
            {atual.confirmarLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
