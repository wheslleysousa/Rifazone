import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Copy, Check, Clock, AlertCircle, Sparkles, CheckCircle2, ArrowRight, Share2, Ticket, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { formatarMoeda } from '../lib/money';

interface Props {
  pedidoId: string;
  pixCopiaCola: string;
  pixQrCodeBase64: string;
  valorTotal: number;
  quantidade: number;
  expiraEm: string;
  isMock?: boolean;
  compradorNome?: string;
  compradorWhatsapp?: string;
  tituloCampanha?: string;
  onSuccess: (numeros: string[]) => void;
  onClose: () => void;
  onVerMeusNumeros?: () => void;
  onGerarNovoPix?: () => void;
}

export const PixPaymentModal: React.FC<Props> = ({
  pedidoId,
  pixCopiaCola,
  pixQrCodeBase64,
  valorTotal,
  quantidade,
  expiraEm,
  isMock,
  compradorNome,
  compradorWhatsapp,
  tituloCampanha,
  onSuccess,
  onClose,
  onVerMeusNumeros,
  onGerarNovoPix
}) => {
  const valorExibicao = (valorTotal && valorTotal >= 100 && Number.isInteger(valorTotal)) ? valorTotal / 100 : (valorTotal || 0);
  const [copiado, setCopiado] = useState(false);
  const [numerosCopiados, setNumerosCopiados] = useState(false);
  const [status, setStatus] = useState<'pendente' | 'pago' | 'expirado'>('pendente');
  const [tempoRestante, setTempoRestante] = useState<number>(600); // 10 min default
  const [simulando, setSimulando] = useState(false);
  const [numerosLiberados, setNumerosLiberados] = useState<string[]>([]);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');

  const confettiDisparadoRef = useRef(false);
  const sucessoNotificadoRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const triggerConfettiOnce = useCallback(() => {
    if (confettiDisparadoRef.current) return;
    confettiDisparadoRef.current = true;
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        ticks: 200,
        disableForReducedMotion: true
      });
      // Limpa os confetes após 2.5s para não poluir a tela
      setTimeout(() => {
        try { confetti.reset(); } catch (e) {}
      }, 2500);
    } catch (e) {
      console.warn('Efeito confetti ignorado:', e);
    }
  }, []);

  // Limpa confetes ao desmontar
  useEffect(() => {
    return () => {
      try {
        confetti.reset();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (pixCopiaCola) {
      QRCode.toDataURL(pixCopiaCola, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setGeneratedQrDataUrl(url))
        .catch(err => console.error('Erro ao gerar QRCode no cliente:', err));
    }
  }, [pixCopiaCola]);

  // Countdown timer
  useEffect(() => {
    if (status === 'pago' || status === 'expirado') return;

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
  }, [expiraEm, status]);

  // Polling status a cada 2 segundos com proteção anti-loop
  useEffect(() => {
    if (status === 'pago' || status === 'expirado') return;

    let cancelado = false;

    const interval = setInterval(async () => {
      if (cancelado) return;
      try {
        const res = await fetch(`/api/pedidos/${pedidoId}/status?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'pago' && !cancelado) {
            cancelado = true;
            clearInterval(interval);
            setStatus('pago');
            const nums = data.numeros || [];
            setNumerosLiberados(nums);
            triggerConfettiOnce();
            if (!sucessoNotificadoRef.current) {
              sucessoNotificadoRef.current = true;
              onSuccessRef.current(nums);
            }
          } else if (data.status === 'expirado') {
            setStatus('expirado');
          }
        }
      } catch (e) {
        // silencioso
      }
    }, 2000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [pedidoId, status, triggerConfettiOnce]);

  const handleCopiar = () => {
    navigator.clipboard.writeText(pixCopiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleCopiarNumeros = () => {
    if (numerosLiberados.length === 0) return;
    const texto = `🎟️ Meus Números da Sorte (${tituloCampanha || 'Rifa'}):\n${numerosLiberados.join(', ')}\n\nParticipante: ${compradorNome || 'Confirmado'}`;
    navigator.clipboard.writeText(texto);
    setNumerosCopiados(true);
    setTimeout(() => setNumerosCopiados(false), 3000);
  };

  const handleCompartilharWhatsapp = () => {
    const texto = encodeURIComponent(`🎟️ Meus números da sorte na campanha "${tituloCampanha || 'Rifa'}":\n\n${numerosLiberados.join(', ')}\n\nBoa sorte para mim! 🍀`);
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
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
        const nums = data.numeros || [];
        setNumerosLiberados(nums);
        triggerConfettiOnce();
        if (!sucessoNotificadoRef.current) {
          sucessoNotificadoRef.current = true;
          onSuccessRef.current(nums);
        }
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
          <div className="text-center py-2 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-2">
              Conta de Comprador Criada & Vinculada
            </span>

            <h3 className="text-2xl font-black text-white mb-1">
              Pagamento Confirmado! 🎉
            </h3>
            <p className="text-slate-300 text-xs mb-4">
              Seu Pix foi processado com sucesso. Seus números já estão salvos e vinculados ao seu WhatsApp <strong>{compradorWhatsapp ? `(${compradorWhatsapp.slice(0, 2)}) *****-${compradorWhatsapp.slice(-4)}` : ''}</strong>!
            </p>

            {numerosLiberados.length > 0 ? (
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 mb-4 text-left shadow-inner">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4" />
                    Seus Números ({numerosLiberados.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopiarNumeros}
                    className="text-[11px] font-bold text-slate-300 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1"
                  >
                    {numerosCopiados ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {numerosCopiados ? 'Copiados!' : 'Copiar'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-900/90 rounded-lg border border-slate-800">
                  {numerosLiberados.map(n => (
                    <span
                      key={n}
                      className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs rounded-md shadow-sm"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-800/80 rounded-xl mb-4 text-xs text-slate-300">
                Seus números foram registrados no banco de dados e estão disponíveis no botão "Meus Números".
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCompartilharWhatsapp}
                className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Salvar / Compartilhar no WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onVerMeusNumeros) {
                    onVerMeusNumeros();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                Acessar Área "Meus Números"
              </button>
            </div>
          </div>
        ) : status === 'expirado' ? (
          /* Status: EXPIRADO */
          <div className="text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400 shadow-lg">
              <AlertCircle className="w-9 h-9" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30 inline-block mb-3">
              Status do Pedido: EXPIRADO
            </span>

            <h3 className="text-2xl font-black text-white mb-2">
              Tempo de Reserva Expirado
            </h3>
            <p className="text-slate-300 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
              O tempo limite para pagamento deste Pix se esgotou e as cotas reservadas foram liberadas novamente.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onGerarNovoPix) {
                    onGerarNovoPix();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Gerar Novo Pix
              </button>

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
                  {formatarMoeda(valorExibicao)}
                </span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mb-4 shadow-inner">
              {generatedQrDataUrl ? (
                <img
                  src={generatedQrDataUrl}
                  alt="QR Code Pix"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              ) : pixQrCodeBase64 ? (
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

            {/* Botão de simulação exibido apenas em transações mock/ambiente de desenvolvimento */}
            {isMock && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                <span className="text-[11px] text-amber-300 block mb-2 font-medium">
                  🧪 Modo de Simulação Ativo (Ambiente de Testes)
                </span>
                <button
                  type="button"
                  onClick={handleSimularPagamento}
                  disabled={simulando}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {simulando ? 'Aprovando...' : 'Simular Pagamento Aprovado'}
                </button>
              </div>
            )}

            {/* Aviso de Aguardando */}
            <div className="flex items-center gap-2 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300 text-xs mb-5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Aguardando confirmação do banco... Seus números serão liberados automaticamente nesta tela!</span>
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

