import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastTipo } from '../lib/toast';

interface ToastItem {
  id: number;
  mensagem: string;
  tipo: ToastTipo;
}

const ESTILOS: Record<ToastTipo, { icon: React.ReactNode; ring: string; bar: string }> = {
  sucesso: { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, ring: 'border-emerald-500/40', bar: 'bg-emerald-400' },
  erro:    { icon: <AlertCircle className="w-4 h-4 text-rose-400" />,     ring: 'border-rose-500/40',    bar: 'bg-rose-400' },
  info:    { icon: <Info className="w-4 h-4 text-sky-400" />,            ring: 'border-sky-500/40',     bar: 'bg-sky-400' },
};

export const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remover = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem;
      if (!detail?.mensagem) return;
      setToasts(prev => [...prev.slice(-3), detail]);
      window.setTimeout(() => remover(detail.id), 4200);
    };
    window.addEventListener('rz-toast', handler as EventListener);
    return () => window.removeEventListener('rz-toast', handler as EventListener);
  }, [remover]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map(t => {
        const s = ESTILOS[t.tipo] || ESTILOS.info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden bg-slate-900 border ${s.ring} rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            <div className="shrink-0 mt-0.5">{s.icon}</div>
            <p className="flex-1 text-xs text-slate-100 font-medium leading-snug">{t.mensagem}</p>
            <button
              onClick={() => remover(t.id)}
              className="shrink-0 text-slate-500 hover:text-white transition p-0.5 rounded-lg hover:bg-slate-800"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <span className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-70`} style={{ width: '100%', animation: 'rzToastBar 4.2s linear forwards' }} />
          </div>
        );
      })}
      <style>{`@keyframes rzToastBar { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};
