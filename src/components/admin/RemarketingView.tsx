import { confirmar } from '../../lib/confirm';
import { toast } from '../../lib/toast';
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Clock, Copy, Check, Send, AlertCircle, 
  Search, RefreshCw, Plus, Trash2, Tag, Settings2, Play,
  CheckCircle2, Mail, PhoneCall, Ban, Eye, X, ArrowRight, HelpCircle, QrCode,
  LogOut, Radio, Zap, ShieldCheck, Activity, Smartphone, AlertTriangle, Layers, Filter
} from 'lucide-react';
import { Pedido, Campanha, CupomDesconto, MensagemFila } from '../../types';

interface Props {
  campanhas?: Campanha[];
  pedidos: Pedido[];
  onRefresh: () => void;
  authFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

// Auxiliar para formatação elegante de telefone do Brasil
const formatarTelefoneBrasil = (num?: string) => {
  if (!num) return 'Não informado';
  const limpo = num.replace(/\D/g, '');
  if (limpo.length === 13 && limpo.startsWith('55')) {
    const ddd = limpo.slice(2, 4);
    const parte1 = limpo.slice(4, 9);
    const parte2 = limpo.slice(9);
    return `+55 (${ddd}) ${parte1}-${parte2}`;
  }
  if (limpo.length === 11) {
    const ddd = limpo.slice(0, 2);
    const parte1 = limpo.slice(2, 7);
    const parte2 = limpo.slice(7);
    return `+55 (${ddd}) ${parte1}-${parte2}`;
  }
  if (limpo.length === 10) {
    const ddd = limpo.slice(0, 2);
    const parte1 = limpo.slice(2, 6);
    const parte2 = limpo.slice(6);
    return `+55 (${ddd}) ${parte1}-${parte2}`;
  }
  return '+' + limpo;
};

export const RemarketingView: React.FC<Props> = ({ 
  campanhas = [], 
  pedidos, 
  onRefresh,
  authFetch 
}) => {
  const [subAba, setSubAba] = useState<'fila' | 'regras' | 'cupons'>('fila');
  
  // Fila de Mensagens (Outbox)
  const [filaMensagens, setFilaMensagens] = useState<MensagemFila[]>([]);
  const [carregandoFila, setCarregandoFila] = useState(false);
  const [termoBuscaFila, setTermoBuscaFila] = useState('');
  const [filtroStatusFila, setFiltroStatusFila] = useState<'todos' | 'pendente' | 'enviada' | 'erro' | 'cancelada'>('todos');
  const [filtroCanalFila, setFiltroCanalFila] = useState<'todos' | 'whatsapp' | 'email'>('todos');
  
  // Estado de conexão do worker externo de WhatsApp Web
  const [workerStatus, setWorkerStatus] = useState<{ conectado: boolean; online?: boolean; numero?: string; atualizadoEm?: string } | null>(null);
  const [carregandoWorker, setCarregandoWorker] = useState(false);
  const [desconectando, setDesconectando] = useState(false);

  // QR Code e Conexão por Número
  const [workerQr, setWorkerQr] = useState<string | null>(null);
  const [mostrandoQr, setMostrandoQr] = useState(false);
  const [buscandoQr, setBuscandoQr] = useState(false);
  const [metodoConexao, setMetodoConexao] = useState<'qr' | 'code'>('code');
  const [etapaNumero, setEtapaNumero] = useState(false);
  const [numeroInput, setNumeroInput] = useState('');
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState<number>(60);
  const [copiouCodigo, setCopiouCodigo] = useState(false);
  const [copiouNumero, setCopiouNumero] = useState(false);

  // Detalhe de Mensagem para Visualização Completa
  const [msgDetalhe, setMsgDetalhe] = useState<MensagemFila | null>(null);

  // Seleção de campanha para configuração de regras/cupons
  const [campanhaIdSel, setCampanhaIdSel] = useState<string>(campanhas[0]?.id || '');
  const campanhaSel = campanhas.find(c => c.id === campanhaIdSel) || campanhas[0];

  // Estados das Regras de Remarketing (Automação Hub)
  const [remAtivo, setRemAtivo] = useState<boolean>(false);
  const [canal, setCanal] = useState<'whatsapp' | 'email' | 'ambos'>('whatsapp');
  const [somenteSeCampanhaAtiva, setSomenteSeCampanhaAtiva] = useState<boolean>(true);
  const [regrasNaoPagou, setRegrasNaoPagou] = useState<any[]>([]);
  const [regraPago, setRegraPago] = useState<any>({
    ativo: false,
    enviarNumeros: true,
    mensagem: 'Olá {nome}! Seu pagamento para a campanha {campanha} foi confirmado com sucesso. Seus números: {numeros}. Boa sorte! 🍀'
  });
  
  const [cupons, setCupons] = useState<CupomDesconto[]>([]);

  // Estados auxiliares
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState('');
  const [executandoMotor, setExecutandoMotor] = useState(false);
  const [resultadoMotor, setResultadoMotor] = useState<any>(null);
  const [processandoFila, setProcessandoFila] = useState(false);

  // Carrega o status do worker de WhatsApp
  const fetchWorkerStatus = async () => {
    if (!authFetch) return;
    setCarregandoWorker(true);
    try {
      const res = await authFetch('/api/admin/worker/status');
      if (res.ok) {
        const data = await res.json();
        setWorkerStatus(data);
      }
    } catch (err) {
      console.error('Erro ao buscar status do worker:', err);
    } finally {
      setCarregandoWorker(false);
    }
  };

  // Busca o QR Code atual do worker
  const fetchWorkerQr = async () => {
    if (!authFetch) return;
    setBuscandoQr(true);
    try {
      const res = await authFetch('/api/admin/worker/qr');
      if (res.ok) {
        const data = await res.json();
        setWorkerQr(data.dataUrl || null);
      }
    } catch (err) {
      console.error('Erro ao buscar QR do worker:', err);
    } finally {
      setBuscandoQr(false);
    }
  };

  // Busca o código de pareamento (conexão por número)
  const fetchPairCode = async () => {
    if (!authFetch) return;
    try {
      const res = await authFetch('/api/admin/worker/paircode');
      if (res.ok) {
        const data = await res.json();
        if (data.codigo) setPairCode(data.codigo);
      }
    } catch (err) {
      console.error('Erro ao buscar código do worker:', err);
    }
  };

  // Inicia a conexão: metodo 'qr' ou 'code' (por número)
  const iniciarConexaoWhatsapp = async (metodo: 'qr' | 'code' = 'qr') => {
    setMetodoConexao(metodo);
    setMostrandoQr(true);
    setWorkerQr(null);
    setPairCode(null);
    const numeroLimpo = metodo === 'code' ? '55' + numeroInput.replace(/\D/g, '') : undefined;
    if (authFetch) {
      try {
        await authFetch('/api/admin/worker/conectar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metodo, numero: numeroLimpo })
        });
      } catch (e) {}
    }
    fetchWorkerStatus();
    fetchWorkerQr();
    if (metodo === 'code') fetchPairCode();
  };

  // Desconecta o WhatsApp e reseta estado
  const handleDesconectar = async () => {
    if (!(await confirmar({
      mensagem: 'Deseja realmente desconectar este WhatsApp? As mensagens automáticas de remarketing ficarão pausadas até que você conecte novamente.',
      perigo: true,
      confirmarLabel: 'Sim, Desconectar WhatsApp'
    }))) {
      return;
    }
    setDesconectando(true);
    try {
      if (authFetch) {
        const res = await authFetch('/api/admin/worker/desconectar', { method: 'POST' });
        if (res.ok) {
          toast('WhatsApp desconectado com sucesso.');
          setWorkerStatus({ conectado: false });
          setMostrandoQr(false);
          setEtapaNumero(false);
          setPairCode(null);
          setWorkerQr(null);
        } else {
          toast('Erro ao solicitar desconexão do WhatsApp.');
        }
      }
    } catch (err) {
      toast('Falha ao desconectar o WhatsApp.');
    } finally {
      setDesconectando(false);
      fetchWorkerStatus();
    }
  };

  // Pollings de status
  useEffect(() => {
    fetchWorkerStatus();
    fetchFila();
    const interval = setInterval(fetchWorkerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (workerStatus?.conectado) return;
    const interval = setInterval(() => {
      fetchWorkerStatus();
      if (mostrandoQr) {
        fetchWorkerQr();
        fetchPairCode();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [workerStatus?.conectado, mostrandoQr]);

  useEffect(() => {
    if (!mostrandoQr || workerStatus?.conectado) return;
    const timer = setInterval(() => {
      setTempoRestante(prev => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, [mostrandoQr, workerStatus?.conectado]);

  useEffect(() => {
    if (workerQr || pairCode) {
      setTempoRestante(60);
    }
  }, [workerQr, pairCode]);

  // Carrega a fila de mensagens do outbox
  const fetchFila = async () => {
    if (!authFetch) return;
    setCarregandoFila(true);
    try {
      const res = await authFetch('/api/admin/fila-mensagens');
      if (res.ok) {
        const data = await res.json();
        setFilaMensagens(data);
      }
    } catch (err) {
      console.error('Erro ao buscar fila de mensagens:', err);
    } finally {
      setCarregandoFila(false);
    }
  };

  useEffect(() => {
    if (subAba === 'fila') {
      fetchFila();
    }
  }, [subAba]);

  // Sincroniza campanha selecionada
  useEffect(() => {
    if (campanhaSel) {
      setRemAtivo(campanhaSel.remarketing?.ativo ?? false);
      setCanal(campanhaSel.remarketing?.canal || 'whatsapp');
      setSomenteSeCampanhaAtiva(campanhaSel.remarketing?.somenteSeCampanhaAtiva ?? true);
      setRegrasNaoPagou(campanhaSel.remarketing?.regrasNaoPagou || []);
      setRegraPago(campanhaSel.remarketing?.regraPago || {
        ativo: false,
        enviarNumeros: true,
        mensagem: 'Olá {nome}! Seu pagamento para a campanha {campanha} foi confirmado com sucesso. Seus números: {numeros}. Boa sorte! 🍀'
      });
      setCupons(campanhaSel.cupons || []);
    }
  }, [campanhaIdSel, campanhas]);

  // Salva configurações
  const handleSalvarConfiguracoes = async () => {
    if (!campanhaSel || !authFetch) return;
    setSalvandoConfig(true);
    setMsgFeedback('');

    try {
      const novaCampanha: Campanha = {
        ...campanhaSel,
        remarketing: {
          ativo: remAtivo,
          canal: canal,
          somenteSeCampanhaAtiva: somenteSeCampanhaAtiva,
          regrasNaoPagou: regrasNaoPagou,
          regraPago: regraPago
        },
        cupons: cupons
      };

      const res = await authFetch(`/api/admin/campanhas/${campanhaSel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaCampanha)
      });

      if (res.ok) {
        setMsgFeedback('Configurações salvas e aplicadas com sucesso!');
        toast('Automações e regras atualizadas!');
        onRefresh();
      } else {
        const err = await res.json();
        toast(err.error || 'Erro ao salvar configurações.');
      }
    } catch (e) {
      toast('Falha de conexão ao salvar configurações.');
    } finally {
      setSalvandoConfig(false);
      setTimeout(() => setMsgFeedback(''), 4000);
    }
  };

  // Motor de enfileiramento (scanner)
  const handleExecutarEnfileirador = async () => {
    setExecutandoMotor(true);
    setResultadoMotor(null);
    try {
      const fetchFn = authFetch || fetch;
      const res = await fetchFn('/api/tarefas/remarketing?secret=rifazone_cron_secret_default', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoMotor({ type: 'enfileirador', ...data });
        fetchFila();
        onRefresh();
      } else {
        toast(data.error || 'Erro ao varrer pedidos pendentes.');
      }
    } catch (err) {
      toast('Falha de conexão ao executar enfileiramento.');
    } finally {
      setExecutandoMotor(false);
    }
  };

  // Processar fila (Outbox)
  const handleProcessarFilaManual = async () => {
    setProcessandoFila(true);
    setResultadoMotor(null);
    try {
      const fetchFn = authFetch || fetch;
      const res = await fetchFn('/api/tarefas/processar-fila?secret=rifazone_cron_secret_default', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoMotor({ type: 'processador', ...data });
        fetchFila();
        onRefresh();
      } else {
        toast(data.error || 'Erro ao processar fila de outbox.');
      }
    } catch (err) {
      toast('Falha de conexão ao processar fila.');
    } finally {
      setProcessandoFila(false);
    }
  };

  // Limpar mensagens pendentes / erros da fila
  const handleLimparFilaMensagens = async () => {
    if (!(await confirmar({ mensagem: 'Deseja realmente cancelar todas as mensagens pendentes ou com erro na fila?', perigo: true, confirmarLabel: 'Cancelar mensagens' }))) {
      return;
    }
    try {
      if (!authFetch) return;
      const res = await authFetch('/api/admin/fila-mensagens/limpar', {
        method: 'POST'
      });
      if (res.ok) {
        toast('Fila de mensagens limpa com sucesso.');
        fetchFila();
      } else {
        const err = await res.json();
        toast(err.error || 'Erro ao limpar fila de mensagens.');
      }
    } catch (err) {
      toast('Falha ao limpar fila de mensagens.');
    }
  };

  // Filtragem da fila
  const filaFiltrada = filaMensagens.filter(m => {
    const combinaStatus = filtroStatusFila === 'todos' ? true : m.status === filtroStatusFila;
    const combinaCanal = filtroCanalFila === 'todos' ? true : m.canal === filtroCanalFila;
    const combinaBusca = !termoBuscaFila || 
      m.id.toLowerCase().includes(termoBuscaFila.toLowerCase()) ||
      m.para.includes(termoBuscaFila) ||
      m.texto.toLowerCase().includes(termoBuscaFila.toLowerCase()) ||
      m.pedidoId.toLowerCase().includes(termoBuscaFila.toLowerCase());
    return combinaStatus && combinaCanal && combinaBusca;
  });

  // Métricas para a régua superior
  const totalEnviadas = filaMensagens.filter(m => m.status === 'enviada').length;
  const totalPendentes = filaMensagens.filter(m => m.status === 'pendente').length;
  const totalErros = filaMensagens.filter(m => m.status === 'erro').length;
  const totalRegrasAtivas = (regrasNaoPagou.length || 0) + (regraPago.ativo ? 1 : 0);

  // Regras helpers
  const adicionarRegraNaoPagou = (tipo: 'faltando' | 'apos') => {
    if (tipo === 'faltando') {
      setRegrasNaoPagou([
        ...regrasNaoPagou,
        {
          faltandoMin: 15,
          mensagem: 'Olá {nome}! Sua reserva na campanha {campanha} expira em {minutos} minutos. Garanta seus números acessando o link: {link}'
        }
      ]);
    } else {
      setRegrasNaoPagou([
        ...regrasNaoPagou,
        {
          aposExpirarMin: 60,
          cupom: 'VOLTA5',
          descontoPct: 5,
          mensagem: 'Oi {nome}! Seu pedido na campanha {campanha} expirou. Mas calma: use o cupom {cupom} e tenha {descontoPct}% de desconto refazendo sua reserva aqui: {link}'
        }
      ]);
    }
  };

  const removerRegraNaoPagou = (index: number) => {
    setRegrasNaoPagou(regrasNaoPagou.filter((_, i) => i !== index));
  };

  const atualizarRegraNaoPagou = (index: number, campos: any) => {
    setRegrasNaoPagou(regrasNaoPagou.map((item, i) => i === index ? { ...item, ...campos } : item));
  };

  const workerOffline = workerStatus && workerStatus.online === false && !workerStatus.atualizadoEm;
  const tempoDesdeSinalSec = workerStatus?.atualizadoEm ? Math.max(0, Math.round((Date.now() - new Date(workerStatus.atualizadoEm).getTime()) / 1000)) : null;

  return (
    <div className="space-y-6">

      {/* ====================================================
          1. PAINEL DE STATUS DO WHATSAPP & AÇÕES DE CONEXÃO
         ==================================================== */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Glow de fundo dinâmico */}
        <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${
          workerStatus?.conectado ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Lado Esquerdo: Identificação do Dispositivo / Status */}
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all ${
              workerStatus?.conectado 
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-emerald-950/50' 
                : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-amber-950/50'
            }`}>
              {workerStatus?.conectado ? (
                <Smartphone className="w-7 h-7 animate-pulse text-emerald-400" />
              ) : (
                <MessageSquare className="w-7 h-7 text-amber-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Disparo de WhatsApp
                </h2>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase border shadow-sm ${
                  workerStatus?.conectado 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${workerStatus?.conectado ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {workerStatus?.conectado ? 'Conectado & Ativo' : 'Desconectado'}
                </span>
              </div>

              {/* Informações detalhadas do Número Conectado */}
              {workerStatus?.conectado ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatarTelefoneBrasil(workerStatus.numero)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (workerStatus.numero) {
                          navigator.clipboard.writeText('+' + workerStatus.numero);
                          setCopiouNumero(true);
                          setTimeout(() => setCopiouNumero(false), 2000);
                        }
                      }}
                      className="ml-1 text-slate-400 hover:text-white transition"
                      title="Copiar número de telefone"
                    >
                      {copiouNumero ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <span className="text-slate-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    {tempoDesdeSinalSec !== null ? `Sinal ativo (${tempoDesdeSinalSec}s atrás)` : 'Sinal ativo'}
                  </span>

                  <span className="text-slate-500 hidden sm:inline">• Disparos automáticos a cada 15s</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Conecte seu WhatsApp para habilitar o envio automático de mensagens de cobrança, confirmações de Pix e cupons de recuperação.
                </p>
              )}
            </div>
          </div>

          {/* Lado Direito: Ações Principais (Conectar / Desconectar / Sincronizar) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {workerStatus?.conectado ? (
              <button
                type="button"
                onClick={handleDesconectar}
                disabled={desconectando}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold rounded-2xl text-xs transition flex items-center gap-2 border border-rose-500/30 shadow-md hover:border-rose-500/50"
                title="Desconectar este número de WhatsApp"
              >
                {desconectando ? <RefreshCw className="w-4 h-4 animate-spin text-rose-400" /> : <LogOut className="w-4 h-4 text-rose-400" />}
                Desconectar WhatsApp
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMostrandoQr(true)}
                className="px-5 py-3 bg-[#25D366] hover:brightness-110 text-white font-black rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <PhoneCall className="w-4 h-4" />
                Conectar WhatsApp
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                fetchWorkerStatus();
                fetchFila();
                onRefresh();
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition"
              title="Sincronizar conexões e dados"
            >
              <RefreshCw className={`w-4 h-4 ${carregandoWorker ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ====================================================
            MODAL / CARD DE PAREAMENTO QUANDO DESCONECTADO
           ==================================================== */}
        {!workerStatus?.conectado && mostrandoQr && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  Conectar Aparelho WhatsApp
                </h3>
                <p className="text-xs text-slate-400">
                  Insira o número do seu celular ou escaneie o QR Code abaixo com a câmera do seu WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMostrandoQr(false);
                  setEtapaNumero(false);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form de Inserção de Número */}
            {!etapaNumero ? (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-lg space-y-3">
                <label className="text-xs font-bold text-slate-200 block">Digite seu número de WhatsApp com DDD:</label>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-200 font-bold shrink-0">
                    🇧🇷 +55
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="11 99999-9999"
                    value={numeroInput}
                    onChange={e => setNumeroInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  O prefixo do país (<strong className="text-slate-200">+55</strong>) é adicionado automaticamente. Digite apenas DDD + número.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEtapaNumero(true);
                      iniciarConexaoWhatsapp('code');
                    }}
                    disabled={numeroInput.replace(/\D/g, '').length < 10}
                    className="flex-1 py-3 bg-[#25D366] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20"
                  >
                    <Check className="w-4 h-4" />
                    Gerar Código & QR
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEtapaNumero(true);
                      iniciarConexaoWhatsapp('qr');
                    }}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-800"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Apenas QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-xl">
                {/* Timer e Contador de Renovação */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      Tempo limite para validação: <span className="font-mono text-white font-black text-sm">{tempoRestante}s</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Renovação automática</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-1000 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, (tempoRestante / 60) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Exibição em Bloco Duplo: Código de 8 dígitos e QR Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bloco 1: Código de Pareamento de 8 dígitos */}
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-3 shadow-lg">
                    <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <PhoneCall className="w-4 h-4" /> Código de 8 Dígitos
                    </span>

                    {pairCode ? (
                      <div className="space-y-2">
                        <div className="py-2 px-3 bg-slate-900 rounded-xl border border-slate-800">
                          <p className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-emerald-400 font-mono">
                            {pairCode.length === 8 ? `${pairCode.slice(0, 4)}-${pairCode.slice(4)}` : pairCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pairCode);
                            setCopiouCodigo(true);
                            setTimeout(() => setCopiouCodigo(false), 2000);
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          {copiouCodigo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiouCodigo ? 'Copiado!' : 'Copiar Código'}
                        </button>
                        <p className="text-[10px] text-slate-400 leading-tight text-left">
                          No WhatsApp: <strong className="text-white">Aparelhos conectados → Conectar com número</strong> e digite o código.
                        </p>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <p className="text-xs">Gerando código...</p>
                      </div>
                    )}
                  </div>

                  {/* Bloco 2: QR Code Visual */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-3 shadow-lg">
                    <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" /> Ou escaneie o QR
                    </span>

                    {workerQr ? (
                      <div className="space-y-2">
                        <div className="bg-white rounded-xl p-2.5 inline-block shadow-md">
                          <img src={workerQr} alt="QR Code WhatsApp" className="w-36 h-36 object-contain mx-auto" />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Abra o WhatsApp e aponte a câmera para a imagem.
                        </p>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <p className="text-xs">Gerando QR Code...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Aguardando confirmação do celular...
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setEtapaNumero(false);
                      setPairCode(null);
                      setWorkerQr(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline font-medium transition"
                  >
                    ← Alterar número
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================
          2. MÉTRICAS EM TEMPO REAL & MONITOR DE VISIBILIDADE
         ==================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Mensagens Enviadas */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enviadas</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalEnviadas}</span>
            <span className="text-[10px] text-emerald-400 font-bold">sucesso</span>
          </div>
        </div>

        {/* Card 2: Fila Outbox Pendente */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fila Outbox</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{totalPendentes}</span>
            <span className="text-[10px] text-amber-400 font-bold">aguardando</span>
          </div>
        </div>

        {/* Card 3: Erros de Envio */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Falhas / Erros</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${totalErros > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{totalErros}</span>
            <span className="text-[10px] text-slate-400 font-bold">registro</span>
          </div>
        </div>

        {/* Card 4: Regras Ativas */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regras Ativas</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Settings2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalRegrasAtivas}</span>
            <span className="text-[10px] text-sky-400 font-bold">gatilhos</span>
          </div>
        </div>
      </div>

      {/* ====================================================
          3. NAVEGAÇÃO ENTRE SUB-ABAS E AÇÕES DE MOTOR
         ==================================================== */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navegação por Sub-Abas */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full">
            <button
              onClick={() => setSubAba('fila')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition flex items-center justify-center gap-2 ${
                subAba === 'fila' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Outbox Ao Vivo</span>
              {totalPendentes > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-950 text-emerald-400 rounded-full text-[10px] font-mono">
                  {totalPendentes}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubAba('regras')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition flex items-center justify-center gap-2 ${
                subAba === 'regras' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Regras de Automação</span>
            </button>

            <button
              onClick={() => setSubAba('cupons')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition flex items-center justify-center gap-2 ${
                subAba === 'cupons' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Cupons ({cupons.length})</span>
            </button>
          </div>

          {/* Botões de Ação Imediata da Automação */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExecutarEnfileirador}
              disabled={executandoMotor}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 font-bold border border-slate-700 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
              title="Varrer pedidos e enfileirar mensagens de remarketing pendentes"
            >
              {executandoMotor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              Varrer Pedidos
            </button>

            <button
              onClick={handleProcessarFilaManual}
              disabled={processandoFila}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              title="Processar mensagens da outbox agora"
            >
              {processandoFila ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Disparar Outbox Agora
            </button>
          </div>
        </div>

        {/* Feedback do Motor de Automação */}
        {resultadoMotor && (
          <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-slate-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-400 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {resultadoMotor.type === 'enfileirador' 
                  ? `Scanner Concluído: Enfileiradas ${resultadoMotor.enfileirados || 0} novas mensagens` 
                  : `Outbox Processado: Sucesso ${resultadoMotor.sucesso || 0} | Falhas ${resultadoMotor.erro || 0}`}
              </span>
              <button onClick={() => setResultadoMotor(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {resultadoMotor.detalhes && resultadoMotor.detalhes.length > 0 && (
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px] max-h-36 overflow-y-auto">
                {resultadoMotor.detalhes.map((d: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                    <span className="text-slate-300">Para: {d.para}</span>
                    <span className={`font-bold ${d.status === 'enviada' || d.status === 'simulado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {d.status || d.tipo} {d.erro ? `(${d.erro})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================
          SUB-ABA 1: FILA DE MENSAGENS (OUTBOX)
         ==================================================== */}
      {subAba === 'fila' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Barra de Busca e Filtro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroStatusFila}
                onChange={e => setFiltroStatusFila(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Status: Todos</option>
                <option value="pendente">Status: Pendente</option>
                <option value="enviada">Status: Enviada</option>
                <option value="erro">Status: Erro / Falha</option>
                <option value="cancelada">Status: Cancelada</option>
              </select>

              <select
                value={filtroCanalFila}
                onChange={e => setFiltroCanalFila(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Canal: Todos</option>
                <option value="whatsapp">Canal: WhatsApp</option>
                <option value="email">Canal: E-mail</option>
              </select>

              {(filtroStatusFila !== 'todos' || filtroCanalFila !== 'todos' || termoBuscaFila) && (
                <button
                  onClick={() => {
                    setFiltroStatusFila('todos');
                    setFiltroCanalFila('todos');
                    setTermoBuscaFila('');
                  }}
                  className="px-2.5 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl hover:text-white transition"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar número, pedido ou texto..."
                  value={termoBuscaFila}
                  onChange={e => setTermoBuscaFila(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <button
                onClick={handleLimparFilaMensagens}
                className="px-3 py-2 bg-slate-950 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                title="Limpar mensagens com erro e pendentes da outbox"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Erros</span>
              </button>
            </div>
          </div>

          {/* Tabela de Outbox */}
          {carregandoFila ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              Sincronizando outbox do robô...
            </div>
          ) : filaFiltrada.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Criação / ID</th>
                    <th className="py-3 px-4">Destinatário</th>
                    <th className="py-3 px-4">Canal / Tipo</th>
                    <th className="py-3 px-4">Preview do Conteúdo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filaFiltrada.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-950/45 transition">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        <div className="text-slate-200 font-bold">{msg.id.slice(-8).toUpperCase()}</div>
                        <div className="text-slate-500">
                          {new Date(msg.criadoEm).toLocaleDateString('pt-BR')} {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200 font-mono">
                        {msg.para}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {msg.canal === 'whatsapp' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded-md border border-emerald-500/20">Whats</span>
                          ) : msg.canal === 'email' ? (
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase rounded-md border border-sky-500/20">E-mail</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase rounded-md border border-purple-500/20">Ambos</span>
                          )}
                          <span className="text-slate-400 text-[10px] capitalize">({msg.tipo})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate font-sans">
                        {msg.texto}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border inline-block ${
                            msg.status === 'pendente'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : msg.status === 'enviada'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : msg.status === 'erro'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            {msg.status}
                          </span>
                          {msg.erro && (
                            <div className="text-[10px] text-rose-400 truncate max-w-[150px]" title={msg.erro}>
                              {msg.erro}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setMsgDetalhe(msg)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          title="Ver Mensagem Completa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50" />
              <p className="font-semibold text-slate-300">Outbox Limpo</p>
              <p className="text-[11px] text-slate-500">Nenhuma mensagem pendente ou registrada na fila para o filtro selecionado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhe de Mensagem */}
      {msgDetalhe && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setMsgDetalhe(null)} 
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              Detalhes da Mensagem
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">ID do Registro</span>
                <span className="text-slate-300 font-mono text-[10px]">{msgDetalhe.id}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Destinatário</span>
                <span className="text-slate-200 font-mono font-bold text-sm">{msgDetalhe.para}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Status de Envio</span>
                <span className={`font-bold capitalize ${msgDetalhe.status === 'enviada' ? 'text-emerald-400' : msgDetalhe.status === 'erro' ? 'text-rose-400' : 'text-amber-400'}`}>{msgDetalhe.status}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Canal e Tipo</span>
                <span className="text-slate-300 font-medium capitalize">{msgDetalhe.canal} ({msgDetalhe.tipo})</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Texto Completo</span>
              <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                {msgDetalhe.texto}
              </p>
            </div>

            {msgDetalhe.erro && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs space-y-1">
                <span className="text-rose-400 font-bold text-[10px] uppercase block">Log de Erro</span>
                <p className="font-mono text-[11px] text-rose-300">{msgDetalhe.erro}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setMsgDetalhe(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          SUB-ABA 2: CONFIGURAÇÃO DE REGRAS DE AUTOMAÇÃO
         ==================================================== */}
      {subAba === 'regras' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 animate-in fade-in">
          
          {/* Seletor de Campanha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Regras de Automação do Robô</h3>
              <p className="text-xs text-slate-400">
                Gatilhos automáticos configurados especificamente para a campanha selecionada.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Campanha:</label>
              <select
                value={campanhaIdSel}
                onChange={e => setCampanhaIdSel(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {campanhas.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo} (/c/{c.codigo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Opções Globais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ativar Remarketing */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">Ativar Automações Nesta Campanha</span>
                <span className="text-slate-400 text-[11px] block">O robô varrerá os pedidos para esta rifa conforme as regras.</span>
              </div>
              <button
                onClick={() => setRemAtivo(!remAtivo)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 flex items-center ${remAtivo ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${remAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Canal Preferencial */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">Canal Preferencial de Disparo</span>
                <span className="text-slate-400 text-[11px] block">Escolha se os envios ocorrem por WhatsApp, E-mail ou Ambos.</span>
              </div>
              <select
                value={canal}
                onChange={e => setCanal(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            {/* Somente se Campanha Ativa */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between md:col-span-2">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">Disparar Apenas se Campanha Estiver Ativa/Publicada</span>
                <span className="text-slate-400 text-[11px] block">Evita disparar lembretes se a campanha já foi encerrada ou pausada.</span>
              </div>
              <button
                onClick={() => setSomenteSeCampanhaAtiva(!somenteSeCampanhaAtiva)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 flex items-center ${somenteSeCampanhaAtiva ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${somenteSeCampanhaAtiva ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Variáveis dinâmicas para Ajuda */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-xs space-y-2">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Variáveis Dinâmicas Suportadas no Texto:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-emerald-400">
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{nome}'}</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{campanha}'}</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{link}'}</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{cupom}'}</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{minutos}'}</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{numeros}'}</span>
              <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{'{qtd}'}</span>
            </div>
          </div>

          {/* 1. SEÇÃO DE REGRAS DE NÃO-PAGOU */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Lembretes de Pix Gerado & NÃO Pago (Aguardando / Expirado)
              </h4>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => adicionarRegraNaoPagou('faltando')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Pix Expirando
                </button>
                <button
                  type="button"
                  onClick={() => adicionarRegraNaoPagou('apos')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Pedido Expirou
                </button>
              </div>
            </div>

            {regrasNaoPagou.length > 0 ? (
              <div className="space-y-4">
                {regrasNaoPagou.map((r, idx) => {
                  const isFaltando = r.faltandoMin !== undefined;

                  return (
                    <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                            isFaltando 
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}>
                            {isFaltando ? 'Pix Quase Expirando' : 'Pedido Expirado'}
                          </span>

                          <span className="text-xs text-slate-300">Disparar</span>
                          {isFaltando ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-400">faltando</span>
                              <input
                                type="number"
                                min="1"
                                value={r.faltandoMin}
                                onChange={e => atualizarRegraNaoPagou(idx, { faltandoMin: Number(e.target.value) })}
                                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold text-center"
                              />
                              <span className="text-xs font-bold text-slate-400">minutos para expirar</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-400">passados</span>
                              <input
                                type="number"
                                min="0"
                                value={r.aposExpirarMin}
                                onChange={e => atualizarRegraNaoPagou(idx, { aposExpirarMin: Number(e.target.value) })}
                                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold text-center"
                              />
                              <span className="text-xs font-bold text-slate-400">minutos da expiração</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removerRegraNaoPagou(idx)}
                          className="text-slate-500 hover:text-rose-400 transition p-1 ml-auto sm:ml-0"
                          title="Remover regra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Configuração de Cupom (para Regras de Expirados) */}
                      {!isFaltando && (
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">Cupom de Desconto</label>
                            <input
                              type="text"
                              value={r.cupom || ''}
                              onChange={e => atualizarRegraNaoPagou(idx, { cupom: e.target.value.toUpperCase().trim() })}
                              placeholder="EX: RECUPERA"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono uppercase font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">Desconto (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={r.descontoPct || 0}
                              onChange={e => atualizarRegraNaoPagou(idx, { descontoPct: Number(e.target.value) })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase block font-bold">Conteúdo da Mensagem</label>
                        <textarea
                          rows={3}
                          value={r.mensagem}
                          onChange={e => atualizarRegraNaoPagou(idx, { mensagem: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          placeholder="Olá {nome}! Notamos que seu pedido na campanha {campanha} está..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
                Nenhuma regra cadastrada para pedidos não pagos. Adicione regras acima!
              </div>
            )}
          </div>

          {/* 2. SEÇÃO DE REGRA DO PAGO */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Mensagem de Pagamento Aprovado (Confirmação Automática)
              </h4>
              
              <button
                type="button"
                onClick={() => setRegraPago({ ...regraPago, ativo: !regraPago.ativo })}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-md border transition ${
                  regraPago.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {regraPago.ativo ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            {regraPago.ativo && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Enviar lista de cotas compradas no corpo da mensagem?</span>
                  <button
                    onClick={() => setRegraPago({ ...regraPago, enviarNumeros: !regraPago.enviarNumeros })}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 flex items-center ${regraPago.enviarNumeros ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${regraPago.enviarNumeros ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold">Conteúdo da Mensagem de Confirmação</label>
                  <textarea
                    rows={3}
                    value={regraPago.mensagem || ''}
                    onChange={e => setRegraPago({ ...regraPago, mensagem: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Olá {nome}! Recebemos o seu Pix..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botão de Gravar Tudo */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            {msgFeedback && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {msgFeedback}
              </span>
            )}
            <button
              onClick={handleSalvarConfiguracoes}
              disabled={salvandoConfig}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition ml-auto flex items-center gap-2"
            >
              {salvandoConfig ? 'Salvando...' : 'Gravar Configurações & Regras'}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          SUB-ABA 3: GESTÃO DE CUPONS DE DESCONTO
         ==================================================== */}
      {subAba === 'cupons' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Cupons de Desconto da Campanha</h3>
              <p className="text-xs text-slate-400">
                Cadastre cupons promocionais que os compradores aplicam no checkout.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Campanha:</label>
              <select
                value={campanhaIdSel}
                onChange={e => setCampanhaIdSel(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {campanhas.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo} (/c/{c.codigo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Adicionar Novo Cupom */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-200 block">Cadastrar Novo Cupom de Desconto:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Código do Cupom</label>
                <input
                  type="text"
                  placeholder="EX: PROMO10"
                  id="novoCupomCodigo"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Desconto (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="10"
                  id="novoCupomPct"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    const elCod = document.getElementById('novoCupomCodigo') as HTMLInputElement;
                    const elPct = document.getElementById('novoCupomPct') as HTMLInputElement;
                    const codigo = elCod?.value?.trim().toUpperCase();
                    const pct = Number(elPct?.value || 0);

                    if (!codigo || pct <= 0) {
                      toast('Informe o código e uma porcentagem válida.');
                      return;
                    }

                    const novo: CupomDesconto = {
                      id: 'cup_' + Date.now(),
                      codigo,
                      descontoPct: pct,
                      ativo: true,
                      criadoEm: new Date().toISOString()
                    };

                    setCupons([...cupons, novo]);
                    if (elCod) elCod.value = '';
                    if (elPct) elPct.value = '';
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" /> Adicionar Cupom
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Cupons Existentes */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 block">Cupons Cadastrados ({cupons.length}):</span>
            {cupons.length > 0 ? (
              <div className="space-y-2">
                {cupons.map((c, idx) => (
                  <div key={c.id || idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs rounded-lg border border-emerald-500/30">
                        {c.codigo}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {c.descontoPct}% OFF
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setCupons(cupons.map((item, i) => i === idx ? { ...item, ativo: !item.ativo } : item));
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border transition ${
                          c.ativo !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {c.ativo !== false ? 'Ativo' : 'Inativo'}
                      </button>

                      <button
                        onClick={() => setCupons(cupons.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 transition p-1"
                        title="Excluir Cupom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
                Nenhum cupom cadastrado nesta campanha ainda.
              </div>
            )}
          </div>

          {/* Botão Salvar Cupons */}
          <div className="pt-2 flex items-center justify-between">
            {msgFeedback && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {msgFeedback}
              </span>
            )}
            <button
              onClick={handleSalvarConfiguracoes}
              disabled={salvandoConfig}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition ml-auto flex items-center gap-1.5"
            >
              {salvandoConfig ? 'Salvando...' : 'Salvar Alterações de Cupons'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
