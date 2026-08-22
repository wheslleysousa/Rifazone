import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Clock, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  pedidoId: string;
  pixCopiaCola: string;
  pixQrCodeBase64: string;
  valorTotal: number;
  quantidade: number;
  expiraEm: string;
  isMock?: boolean;
  onSuccess: (numeros: string[]) => void;
  onClose: () => void;
}

export const PixPaymentModal: React.FC<Props> = ({
  pedidoId,
  pixCopiaCola,
  pixQrCodeBase64,
  valorTotal,
  quantidade,
  expiraEm,
  isMock,
  onSuccess,
  onClose
}) => {
  const [copiado, setCopiado] = useState(false);
  const [status, setStatus] = useState<'pendente' | 'pago' | 'expirado'>('pendente');
  const [tempoRestante, setTempoRestante] = useState<number>(600); // 10 min default
  const [simulando, setSimulando] = useState(false);
  const [numerosLiberados, setNumerosLiberados] = useState<string[]>([]);

  // Countdown timer
  useEffect(() => {
    const target = new Date(expiraEm).getTime();
    
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setTempoRestante(diff);
      if (diff === 0) {
        setStatus('expirado');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiraEm]);

  // Polling status a cada 3.5 segundos
  useEffect(() => {
    if (status === 'pago' || status === 'expirado') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/${pedidoId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'pago') {
            setStatus('pago');
            setNumerosLiberados(data.numeros || []);
            triggerConfetti();
            onSuccess(data.numeros || []);
          } else if (data.status === 'expirado') {
            setStatus('expirado');
          }
        }
      } catch (e) {
        // silencioso
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [pedidoId, status, onSuccess]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(pixCopiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleSimularPagamento = async () => {
    setSimulando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/simular-pagamento`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setStatus('pago');
        setNumerosLiberados(data.numeros || []);
        triggerConfetti();
        onSuccess(data.numeros || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulando(false);
    }
  };

  const formatMinSec = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-8">
        
        {/* Status: PAGO COM SUCESSO */}
        {status === 'pago' ? (
          <div className="text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-white mb-2">
              Pagamento Confirmado! 🎉
            </h3>
            <p className="text-slate-300 text-sm mb-6">
              Seu Pix foi processado com sucesso. Suas cotas estão registradas e garantidas no sorteio!
            </p>

            {numerosLiberados.length > 0 && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-6 text-left">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Seus números da sorte ({numerosLiberados.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {numerosLiberados.map(n => (
                    <span
                      key={n}
                      className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-md"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Concluir e Ver Meus Números
            </button>
          </div>
        ) : status === 'expirado' ? (
          /* Status: EXPIRADO */
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tempo de Reserva Expirado</h3>
            <p className="text-slate-300 text-sm mb-6">
              O tempo de 10 minutos para pagar este Pix se esgotou e as cotas foram liberadas novamente.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          /* Status: PENDENTE - QR CODE E COPIA E COLA */
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Pagamento Instantâneo
                </span>
                <h3 className="text-xl font-black text-white">
                  Pague com Pix
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>{formatMinSec(tempoRestante)}</span>
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 mb-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Quantidade de cotas</span>
                <span className="text-sm font-bold text-white">{quantidade} cotas selecionadas</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total a pagar</span>
                <span className="text-lg font-black text-emerald-400">
                  R$ {valorTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mb-4 shadow-inner">
              {pixQrCodeBase64 ? (
                <img
                  src={
                    pixQrCodeBase64.startsWith('data:') 
                      ? pixQrCodeBase64 
                      : `data:image/png;base64,${pixQrCodeBase64}`
                  }
                  alt="QR Code Pix"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                  <QrCode className="w-20 h-20 animate-pulse" />
                </div>
              )}
              <span className="text-slate-800 font-bold text-xs mt-2 flex items-center gap-1">
                Abra o app do seu banco e escaneie o código
              </span>
            </div>

            {/* Pix Copia e Cola */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold text-slate-300 block">
                Ou copie a chave Pix (Copia e Cola):
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={pixCopiaCola}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-3 pr-28 text-xs font-mono text-slate-300 select-all focus:outline-none"
                />
                <button
                  id="btn-copiar-pix"
                  onClick={handleCopiar}
                  className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    copiado
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {copiado ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Pix
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aviso de Aguardando */}
            <div className="flex items-center gap-2 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300 text-xs mb-5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Aguardando confirmação do banco... Seus números serão liberados automaticamente nesta tela!</span>
            </div>

            {/* Botão de teste rápido em modo dev / preview */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                id="btn-simular-aprovacao"
                onClick={handleSimularPagamento}
                disabled={simulando}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {simulando ? 'Processando simulação...' : '⚡ Simular Aprovação Imediata (Ambiente de Testes)'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-slate-400 hover:text-white text-xs font-medium text-center transition"
            >
              Cancelar e fechar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
