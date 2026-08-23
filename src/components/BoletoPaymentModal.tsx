import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Clock, AlertCircle, Sparkles, CheckCircle2, ExternalLink, Ticket, ArrowRight } from 'lucide-react';
import { formatarMoeda } from '../lib/money';

interface Props {
  pedidoId: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  linhaDigitavel?: string;
  valorTotal: number;
  quantidade: number;
  expiraEm: string;
  compradorNome?: string;
  compradorWhatsapp?: string;
  tituloCampanha?: string;
  onSuccess?: (numeros: string[]) => void;
  onClose: () => void;
  onVerMeusNumeros?: () => void;
}

export const BoletoPaymentModal: React.FC<Props> = ({
  pedidoId,
  boletoUrl,
  boletoBarcode,
  linhaDigitavel,
  valorTotal,
  quantidade,
  expiraEm,
  compradorNome,
  compradorWhatsapp,
  tituloCampanha,
  onSuccess,
  onClose,
  onVerMeusNumeros
}) => {
  const [copiado, setCopiado] = useState(false);
  const [status, setStatus] = useState<'pendente' | 'pago' | 'expirado'>('pendente');
  const [checando, setChecando] = useState(false);
  const [numerosLiberados, setNumerosLiberados] = useState<string[]>([]);

  const codigoParaCopiar = linhaDigitavel || boletoBarcode || '';

  const handleCopiarLinha = () => {
    if (!codigoParaCopiar) return;
    navigator.clipboard.writeText(codigoParaCopiar);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Polling de verificação de status a cada 10 segundos
  useEffect(() => {
    if (status === 'pago' || status === 'expirado') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/${pedidoId}/status?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'pago') {
            setStatus('pago');
            if (data.numeros) {
              setNumerosLiberados(data.numeros);
              if (onSuccess) onSuccess(data.numeros);
            }
          } else if (data.status === 'expirado' || data.status === 'cancelado') {
            setStatus('expirado');
          }
        }
      } catch (err) {
        // Ignora erro de rede momentâneo
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pedidoId, status, onSuccess]);

  const handleVerificarManualmente = async () => {
    setChecando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/status?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'pago') {
          setStatus('pago');
          if (data.numeros) {
            setNumerosLiberados(data.numeros);
            if (onSuccess) onSuccess(data.numeros);
          }
        } else {
          alert('O pagamento via boleto ainda está em processamento bancário (compensação em até 1 a 3 dias úteis).');
        }
      }
    } catch (e) {
      alert('Erro ao verificar status. Tente novamente.');
    } finally {
      setChecando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 my-auto">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {status === 'pago' ? (
          /* TELA DE SUCESSO / PAGO */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-white">Boleto Compensado com Sucesso!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Seu pagamento foi confirmado e seus números da sorte já foram gerados.
              </p>
            </div>

            {numerosLiberados.length > 0 && (
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Seus Bilhetes ({numerosLiberados.length})
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center max-h-40 overflow-y-auto">
                  {numerosLiberados.map(num => (
                    <span
                      key={num}
                      className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs rounded-lg"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
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
                  <span>Ver Todos os Meus Números</span>
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
        ) : (
          /* TELA DE BOLETO GERADO */
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Boleto Bancário Gerado</span>
              </div>
              <h3 className="text-lg font-black text-white">
                {tituloCampanha || 'Pagamento da sua Rifa'}
              </h3>
              <p className="text-xs text-slate-400">
                Pague pelo aplicativo do seu banco, internet banking ou lotérica.
              </p>
            </div>

            {/* Resumo do Pedido */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Total a Pagar</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {formatarMoeda(valorTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Quantidade</span>
                <span className="text-xs font-bold text-white">
                  {quantidade} {quantidade === 1 ? 'cota' : 'cotas'}
                </span>
              </div>
            </div>

            {/* Botão para Abrir / Imprimir Boleto */}
            {boletoUrl && (
              <a
                href={boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visualizar / Imprimir Boleto (PDF)</span>
              </a>
            )}

            {/* Linha Digitável / Código de Barras */}
            {codigoParaCopiar && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Linha Digitável (Código de Barras):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={codigoParaCopiar}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopiarLinha}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      copiado
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Aviso de Compensação */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Compensação bancária:
              </p>
              <p>
                Os boletos levam até 1 a 3 dias úteis para compensar após o pagamento. Seus números serão reservados e liberados automaticamente no seu WhatsApp após a baixa bancária.
              </p>
            </div>

            {/* Ações Inferiores */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleVerificarManualmente}
                disabled={checando}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-xs transition"
              >
                {checando ? 'Verificando...' : 'Verificar Pagamento'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
