import React, { useEffect } from 'react';
import { CheckCircle2, Ticket, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatarMoeda } from '../lib/money';

interface Props {
  pedidoId: string;
  valorTotal: number;
  quantidade: number;
  numeros: string[];
  cartaoInfo?: {
    ultimosDigitos?: string;
    bandeira?: string;
    parcelas?: number;
    status?: string;
  };
  compradorNome?: string;
  tituloCampanha?: string;
  onClose: () => void;
  onVerMeusNumeros?: () => void;
}

export const CartaoSuccessModal: React.FC<Props> = ({
  pedidoId,
  valorTotal,
  quantidade,
  numeros,
  cartaoInfo,
  compradorNome,
  tituloCampanha,
  onClose,
  onVerMeusNumeros
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        ticks: 200,
        disableForReducedMotion: true
      });
      setTimeout(() => {
        try { confetti.reset(); } catch (e) {}
      }, 2500);
    } catch (e) {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 my-auto space-y-4">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Header de Sucesso */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pagamento Aprovado no Cartão!</span>
          </div>

          <h3 className="text-xl font-black text-white">
            {tituloCampanha || 'Parabéns, Você está Participando!'}
          </h3>
          <p className="text-xs text-slate-300">
            {compradorNome ? `${compradorNome}, seus` : 'Seus'} números foram gerados e já estão concorrendo.
          </p>
        </div>

        {/* Detalhes da Compra */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Pago</span>
            <span className="font-extrabold text-sm text-emerald-400 font-mono">
              {formatarMoeda(valorTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quantidade de Cotas</span>
            <span className="font-bold text-white">
              {quantidade} {quantidade === 1 ? 'cota' : 'cotas'}
            </span>
          </div>

          {cartaoInfo && (
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Cartão {cartaoInfo.bandeira || ''} {cartaoInfo.ultimosDigitos ? `•••• ${cartaoInfo.ultimosDigitos}` : ''}
              </span>
              <span className="font-medium text-slate-300">
                {cartaoInfo.parcelas && cartaoInfo.parcelas > 1 ? `${cartaoInfo.parcelas}x` : 'À vista (1x)'}
              </span>
            </div>
          )}
        </div>

        {/* Lista de Números Gerados */}
        {numeros && numeros.length > 0 && (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block text-center">
              Seus Bilhetes da Sorte ({numeros.length})
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center max-h-48 overflow-y-auto p-1 custom-scrollbar">
              {numeros.map(num => (
                <span
                  key={num}
                  className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-lg shadow-sm"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="space-y-2 pt-2">
          {onVerMeusNumeros && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onVerMeusNumeros();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Ticket className="w-4 h-4" />
              <span>Acessar "Meus Números"</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
