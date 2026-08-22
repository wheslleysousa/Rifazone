import React from 'react';
import { OfertaRelampago } from '../types';
import { Zap, ShieldCheck, Check, Sparkles, X } from 'lucide-react';

interface Props {
  oferta: OfertaRelampago;
  valorCotaBase: number;
  onAccept: () => void;
  onDecline: () => void;
}

export const UpsellModal: React.FC<Props> = ({
  oferta,
  valorCotaBase,
  onAccept,
  onDecline
}) => {
  const precoOriginal = oferta.cotasExtras * valorCotaBase;
  const economia = Math.max(0, precoOriginal - oferta.preco);
  const percentualDesconto = precoOriginal > 0 ? Math.round((economia / precoOriginal) * 100) : 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 text-white overflow-hidden">
        {/* Glow background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onDecline}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 fill-amber-400" />
          {oferta.selo || 'Oportunidade Única'}
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          {oferta.titulo}
        </h3>
        <p className="text-slate-300 text-sm mb-5">
          {oferta.subtitulo}
        </p>

        {/* Box da oferta */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm font-medium">Cotas adicionais:</span>
            <span className="text-emerald-400 font-extrabold text-lg">+{oferta.cotasExtras} cotas</span>
          </div>

          <div className="flex items-baseline justify-between border-t border-slate-700/60 pt-2">
            <div>
              <span className="text-xs text-slate-400 line-through mr-2">
                R$ {precoOriginal.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                -{percentualDesconto}% OFF
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Por apenas</span>
              <span className="text-2xl font-black text-white">
                R$ {oferta.preco.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            id="btn-aceitar-oferta"
            onClick={onAccept}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 fill-slate-950" />
            QUERO APROVEITAR A OFERTA
          </button>

          <button
            id="btn-recusar-oferta"
            onClick={onDecline}
            className="w-full py-2.5 px-4 text-slate-400 hover:text-slate-200 text-xs font-medium text-center transition"
          >
            Não, quero continuar sem as cotas extras
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Garantia de participação e números imediatos no Pix</span>
        </div>
      </div>
    </div>
  );
};
