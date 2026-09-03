import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Copy, Check, Clock, AlertCircle, Sparkles, CheckCircle2, ArrowRight, Share2, Ticket, MessageCircle, Users, ExternalLink, Trophy, Star, PartyPopper, Heart, Flame, Image as ImageIcon } from 'lucide-react';
import { dispararExplosaoConfetes, limparConfetes } from '../utils/confettiUtils';
import QRCode from 'qrcode';
import { formatarMoeda } from '../lib/money';
import { ConfirmacaoCompraConfig, PixConfig } from '../types';

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
  confirmacaoConfig?: ConfirmacaoCompraConfig;
  pixConfig?: PixConfig;
  onSuccess: (numeros: string[]) => void;
  onClose: () => void;
  inline?: boolean;
  onVerMeusNumeros?: () => void;
  onGerarNovoPix?: () => void;
  onEditarDados?: () => void;
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
  confirmacaoConfig,
  pixConfig,
  onSuccess,
  onClose,
  inline = false,
  onVerMeusNumeros,
  onGerarNovoPix,
  onEditarDados
}) => {
  const valorExibicao = valorTotal || 0;
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
    if (confirmacaoConfig?.animacaoSucesso === 'nenhuma' || confirmacaoConfig?.exibirConfetes === false) return;
    if (confettiDisparadoRef.current) return;
    confettiDisparadoRef.current = true;
    try {
      dispararExplosaoConfetes();
    } catch (e) {
      console.warn('Efeito confetti ignorado:', e);
    }
  }, [confirmacaoConfig?.animacaoSucesso, confirmacaoConfig?.exibirConfetes]);

  // Limpa confetes ao desmontar
  useEffect(() => {
    return () => {
      limparConfetes();
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

    let target = new Date(expiraEm).getTime();
    if (isNaN(target) || target <= 0) {
      target = Date.now() + 10 * 60 * 1000;
    }
    
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

   
    const content = (
      <div className={`relative w-full ${inline ? 'bg-slate-950/40 border border-slate-800 rounded-2xl p-5' : 'max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl my-4'} text-white`}>

        {/* Status: PAGO COM SUCESSO */}
        {status === 'pago' ? (
          <div className="text-center animate-in zoom-in-95 duration-200 pb-2">
            {/* Banner comemorativo se configurado */}
            {confirmacaoConfig?.bannerSucessoUrl && (
              <div className="-mt-5 -mx-5 mb-5 overflow-hidden rounded-t-2xl border-b border-emerald-500/20">
                <img
                  src={confirmacaoConfig.bannerSucessoUrl}
                  alt="Sucesso"
                  className="w-full h-40 object-cover shadow-md"
                  onError={e => (e.currentTarget.parentElement!.style.display = 'none')}
                />
              </div>
            )}

            <div className="space-y-4 px-2">
              {confirmacaoConfig?.iconeSucessoExibir !== false && (
                <div 
                  className={`mx-auto shadow-xl animate-bounce flex items-center justify-center overflow-hidden transition-all duration-500 ${
                    confirmacaoConfig?.iconeSucessoTipo === 'imagem' 
                      ? 'w-full max-w-[320px] aspect-video rounded-2xl border-2' 
                      : 'w-16 h-16 rounded-full border-2'
                  }`}
                  style={{ 
                    backgroundColor: `${confirmacaoConfig?.iconeSucessoCorFundo || 'rgba(16, 185, 129, 0.2)'}`,
                    borderColor: `${confirmacaoConfig?.iconeSucessoCorFundo || '#10b981'}`,
                    color: confirmacaoConfig?.iconeSucessoCorIcone || '#10b981'
                  }}
                >
                  {(() => {
                    const tipo = confirmacaoConfig?.iconeSucessoTipo || 'check';
                    const size = 32;
                    if (tipo === 'check') return <CheckCircle2 size={size} />;
                    if (tipo === 'trofeu') return <Trophy size={size} />;
                    if (tipo === 'estrela') return <Star size={size} />;
                    if (tipo === 'festa') return <PartyPopper size={size} />;
                    if (tipo === 'coracao') return <Heart size={size} />;
                    if (tipo === 'fogo') return <Flame size={size} />;
                    if (tipo === 'emoji') return <span className="text-2xl">{confirmacaoConfig?.iconeSucessoEmoji || '🎉'}</span>;
                    if (tipo === 'imagem' && confirmacaoConfig?.iconeSucessoImagem) {
                      return <img src={confirmacaoConfig.iconeSucessoImagem} alt="Ícone" className="w-full h-full object-cover" />;
                    }
                    return <CheckCircle2 size={size} />;
                  })()}
                </div>
              )}

              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
                Conta de Comprador Criada & Vinculada
              </span>

              <h3 className="text-2xl font-black text-white">
                {confirmacaoConfig?.titulo || 'Pagamento Confirmado! 🎉'}
              </h3>

              <p className="text-slate-300 text-xs">
                {confirmacaoConfig?.subtitulo || (
                  <>
                    Seu Pix foi processado com sucesso. Seus números já estão salvos e vinculados ao seu WhatsApp{' '}
                    <strong>{compradorWhatsapp ? `(${compradorWhatsapp.slice(0, 2)}) *****-${compradorWhatsapp.slice(-4)}` : ''}</strong>!
                  </>
                )}
              </p>

              {confirmacaoConfig?.mensagemAgradecimento && (
                <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                  {confirmacaoConfig.mensagemAgradecimento}
                </p>
              )}
            </div>

            {/* Números da Sorte */}
            {confirmacaoConfig?.exibirNumeros !== false && (
              numerosLiberados.length > 0 ? (
                <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 text-left shadow-inner">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4" />
                      Seus Números ({numerosLiberados.length}):
                    </span>
                    {confirmacaoConfig?.exibirBotaoCopiar !== false && (
                      <button
                        type="button"
                        onClick={handleCopiarNumeros}
                        className="text-[11px] font-bold text-slate-300 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1"
                      >
                        {numerosCopiados ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {numerosCopiados ? 'Copiados!' : 'Copiar'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1 bg-slate-900/90 rounded-lg border border-slate-800">
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
                <div className="p-3 bg-slate-800/80 rounded-xl text-xs text-slate-300">
                  Seus números foram registrados no banco de dados e estão disponíveis no botão "Meus Números".
                </div>
              )
            )}

            {/* Instruções pós-compra personalizadas */}
            {confirmacaoConfig?.instrucoesPosCompra && (
              <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left text-xs text-slate-300">
                <span className="text-[11px] font-bold text-amber-400 block mb-0.5">ℹ️ Informações Importantes:</span>
                {confirmacaoConfig.instrucoesPosCompra}
              </div>
            )}

            <div className="space-y-2 pt-1">
              {/* Botão Grupo VIP / Comunidade se ativo */}
              {confirmacaoConfig?.botaoGrupoVipAtivo && confirmacaoConfig?.botaoGrupoVipLink && (
                <a
                  href={confirmacaoConfig.botaoGrupoVipLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/30"
                >
                  <Users className="w-4 h-4" />
                  <span>{confirmacaoConfig.botaoGrupoVipTexto || 'Entrar no Grupo VIP do WhatsApp'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              {/* Botão Compartilhar no WhatsApp */}
              {confirmacaoConfig?.exibirBotaoWhatsapp !== false && (
                <button
                  type="button"
                  onClick={handleCompartilharWhatsapp}
                  className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Salvar / Compartilhar no WhatsApp
                </button>
              )}

              {/* Botão Acessar Meus Números */}
              {confirmacaoConfig?.exibirBotaoMeusNumeros !== false && (
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
              )}
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
            {/* Header Customizável */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  {pixConfig?.badgeTexto || 'Pagamento Instantâneo'}
                </span>
                <h3 className="text-xl font-black text-white">
                  {pixConfig?.titulo || 'Pague com Pix'}
                </h3>
                {pixConfig?.subtitulo && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pixConfig.subtitulo}
                  </p>
                )}
              </div>
              {pixConfig?.exibirTimer !== false && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{formatMinSec(tempoRestante)}</span>
                </div>
              )}
            </div>

            {/* Resumo do Pedido Customizável */}
            {pixConfig?.exibirResumo !== false && (
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
            )}

            {/* QR Code Container Customizável */}
            {pixConfig?.exibirQrCode !== false && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mb-4 shadow-inner">
                {(() => {
                  const qrDimClass = pixConfig?.tamanhoQrCode === 'sm' ? 'w-36 h-36' : pixConfig?.tamanhoQrCode === 'lg' ? 'w-60 h-60' : 'w-48 h-48';
                  return generatedQrDataUrl ? (
                    <img
                      src={generatedQrDataUrl}
                      alt="QR Code Pix"
                      className={`${qrDimClass} object-contain rounded-lg`}
                    />
                  ) : pixQrCodeBase64 ? (
                    <img
                      src={
                        pixQrCodeBase64.startsWith('data:') 
                          ? pixQrCodeBase64 
                          : `data:image/png;base64,${pixQrCodeBase64}`
                      }
                      alt="QR Code Pix"
                      className={`${qrDimClass} object-contain rounded-lg`}
                    />
                  ) : (
                    <div className={`${qrDimClass} flex items-center justify-center bg-slate-100 rounded-lg text-slate-400`}>
                      <QrCode className="w-20 h-20 animate-pulse" />
                    </div>
                  );
                })()}
                <span className="text-slate-800 font-bold text-xs mt-2 flex items-center gap-1">
                  Abra o app do seu banco e escaneie o código
                </span>
              </div>
            )}

            {/* Pix Copia e Cola Customizável */}
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
                      {pixConfig?.textoBotaoCopiado || 'Copiado!'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {pixConfig?.textoBotaoCopiar || 'Copiar Pix'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aviso de Expiração / Urgência */}
            {pixConfig?.avisoExpiracao && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{pixConfig.avisoExpiracao}</span>
              </div>
            )}

            {/* Instruções Passo a Passo */}
            {Array.isArray(pixConfig?.instrucoes) && pixConfig.instrucoes.length > 0 && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl mb-4 text-left space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Como pagar:
                </span>
                {pixConfig.instrucoes.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{inst}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Botão de Suporte via WhatsApp */}
            {pixConfig?.suporteWhatsappAtivo && pixConfig.suporteWhatsappNumero && (
              <a
                href={`https://wa.me/55${pixConfig.suporteWhatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(
                  pixConfig.suporteWhatsappTexto || 'Olá, preciso de suporte com meu pagamento Pix da campanha.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mb-4 py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Dúvidas sobre o Pix? Fale Conosco no WhatsApp</span>
              </a>
            )}

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
            <div className="flex items-center gap-2 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300 text-xs mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Aguardando confirmação do banco... Seus números serão liberados automaticamente nesta tela!</span>
            </div>

            <div className="flex items-center gap-2">
              {!inline && onEditarDados && (
                <button
                  type="button"
                  onClick={onEditarDados}
                  className="flex-1 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold text-center border border-slate-800 rounded-xl hover:bg-slate-800/50 transition"
                >
                  Editar dados da compra
                </button>
              )}
              {!inline && (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-3 text-slate-500 hover:text-slate-300 text-xs font-medium text-center transition"
                >
                  {inline ? 'Ocultar Pix' : 'Cancelar e fechar'}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
  );

  if (inline) return content;

   
    return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain">
      <div className="flex min-h-full items-center justify-center p-4">
        {content}
      </div>
    </div>
  );
};

