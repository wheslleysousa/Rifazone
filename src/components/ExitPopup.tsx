import React, { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';

/**
 * Pop-up de retenção (Exit Intent). Dispara conforme o gatilho configurado em
 * campanha.checkout.exitPopup e aparece só uma vez por sessão. Não roda em preview.
 * Gatilhos: 'saida' (mouse sai pelo topo), 'voltar' (botão voltar), 'aba' (troca de aba), 'tempo'.
 */
export const ExitPopup: React.FC<any> = ({ config, onComprar }) => {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    let disparado = false;
    const gatilho = config?.gatilho || 'saida';

    const abrir = () => {
      if (disparado) return;
      disparado = true;
      setAberto(true);
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) abrir();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') abrir();
    };
    const onPop = () => abrir();

    let timeoutId: any;
    if (gatilho === 'saida') {
      document.addEventListener('mouseout', onMouseOut);
    } else if (gatilho === 'aba') {
      document.addEventListener('visibilitychange', onVisibility);
    } else if (gatilho === 'voltar') {
      window.history.pushState({ exit: true }, '');
      window.addEventListener('popstate', onPop);
    } else if (gatilho === 'tempo') {
      timeoutId = setTimeout(abrir, Math.max(3, Number(config?.tempoSegundos) || 20) * 1000);
    }

    return () => {
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('popstate', onPop);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [config]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={() => setAberto(false)}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-center mb-1.5">
          {config?.titulo || 'Espera! Não vá embora ainda 🎁'}
        </h3>
        <p className="text-sm text-slate-500 text-center mb-5">
          {config?.mensagem || 'Garanta suas cotas agora antes que acabem. Sua sorte pode estar a um clique de distância!'}
        </p>
        <button
          onClick={() => { setAberto(false); if (typeof onComprar === 'function') onComprar(); }}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition"
        >
          {config?.textoBotao || 'QUERO GARANTIR MINHAS COTAS'}
        </button>
        <button
          onClick={() => setAberto(false)}
          className="w-full mt-2 py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
        >
          Não, obrigado
        </button>
      </div>
    </div>
  );
};
