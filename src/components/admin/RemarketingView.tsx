import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Clock, Copy, Check, Send, AlertCircle, 
  Search, RefreshCw, Plus, Trash2, Tag, Settings2, Play,
  CheckCircle2, Mail, PhoneCall, Ban, Eye, X, ArrowRight, HelpCircle, QrCode
} from 'lucide-react';
import { Pedido, Campanha, CupomDesconto, MensagemFila } from '../../types';

interface Props {
  campanhas?: Campanha[];
  pedidos: Pedido[];
  onRefresh: () => void;
  authFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

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
  // QR Code para conectar o WhatsApp pela web
  const [workerQr, setWorkerQr] = useState<string | null>(null);
  const [mostrandoQr, setMostrandoQr] = useState(false);
  const [buscandoQr, setBuscandoQr] = useState(false);
  // Conexão por número (pairing code) — alternativa ao QR
  const [metodoConexao, setMetodoConexao] = useState<'qr' | 'code'>('qr');
  const [etapaNumero, setEtapaNumero] = useState(false);
  const [numeroInput, setNumeroInput] = useState('');
  const [pairCode, setPairCode] = useState<string | null>(null);

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
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
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

  // Busca o QR Code atual do worker (pra escanear pela web)
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

  // Inicia a conexão: metodo 'qr' (padrão) ou 'code' (por número)
  const iniciarConexaoWhatsapp = async (metodo: 'qr' | 'code' = 'qr') => {
    setMetodoConexao(metodo);
    setMostrandoQr(true);
    setWorkerQr(null);
    setPairCode(null);
    const numeroLimpo = numeroInput.replace(/\D/g, '');
    if (authFetch) {
      try {
        await authFetch('/api/admin/worker/conectar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metodo, numero: metodo === 'code' ? numeroLimpo : undefined })
        });
      } catch (e) {}
    }
    fetchWorkerStatus();
    if (metodo === 'code') fetchPairCode(); else fetchWorkerQr();
  };

  // Carrega o status do worker no mount e periodicamente a cada 15s
  useEffect(() => {
    fetchWorkerStatus();
    const interval = setInterval(fetchWorkerStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Enquanto não estiver conectado, verifica status + QR/código mais rápido (a cada 4s)
  useEffect(() => {
    if (workerStatus?.conectado) return;
    const interval = setInterval(() => {
      fetchWorkerStatus();
      if (mostrandoQr) {
        if (metodoConexao === 'code') fetchPairCode(); else fetchWorkerQr();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [workerStatus?.conectado, mostrandoQr, metodoConexao]);

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

  // Carrega fila ao entrar na sub-aba de fila
  useEffect(() => {
    if (subAba === 'fila') {
      fetchFila();
    }
  }, [subAba]);

  // Atualiza estados quando troca a campanha selecionada
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

  // Salva a configuração atualizada de remarketing e cupons na campanha
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
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar configurações.');
      }
    } catch (e) {
      alert('Falha de conexão ao salvar configurações.');
    } finally {
      setSalvandoConfig(false);
      setTimeout(() => setMsgFeedback(''), 4000);
    }
  };

  // Disparar motor de enfileiramento manualmente (Scan de pedidos para outbox)
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
        if (subAba === 'fila') fetchFila();
        onRefresh();
      } else {
        alert(data.error || 'Erro ao varrer pedidos pendentes.');
      }
    } catch (err) {
      alert('Falha de conexão ao executar enfileiramento.');
    } finally {
      setExecutandoMotor(false);
    }
  };

  // Processar fila (Envia as mensagens do outbox)
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
        alert(data.error || 'Erro ao processar fila de outbox.');
      }
    } catch (err) {
      alert('Falha de conexão ao processar fila.');
    } finally {
      setProcessandoFila(false);
    }
  };

  // Cancelar/Limpar todas as mensagens pendentes da fila
  const handleLimparFilaMensagens = async () => {
    if (!window.confirm('Deseja realmente cancelar todas as mensagens pendentes ou com erro na fila?')) {
      return;
    }
    try {
      if (!authFetch) return;
      const res = await authFetch('/api/admin/fila-mensagens/limpar', {
        method: 'POST'
      });
      if (res.ok) {
        alert('Todas as mensagens da fila foram canceladas com sucesso.');
        fetchFila();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao limpar fila de mensagens.');
      }
    } catch (err) {
      alert('Falha ao limpar fila de mensagens.');
    }
  };

  // Filtragem da fila de outbox
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

  // Funções utilitárias para regras
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

  // ---- PORTÃO: só libera a aba de Remarketing depois de conectar o WhatsApp ----
  if (!workerStatus?.conectado) {
    const workerOffline = workerStatus ? workerStatus.online === false : false;
    return (
      <div className="max-w-lg mx-auto mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#25D366] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/30">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-white mb-1.5">Conecte seu WhatsApp</h2>
          <p className="text-sm text-slate-400 mb-5">
            Para usar o Remarketing você precisa conectar um número de WhatsApp. Ele será usado para enviar as mensagens automáticas aos participantes.
          </p>

          {/* Escolha do método de conexão */}
          {!mostrandoQr && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => iniciarConexaoWhatsapp('qr')}
                className="w-full py-3.5 bg-[#25D366] hover:brightness-110 text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <QrCode className="w-4 h-4" />
                Ler QR Code
              </button>

              {!etapaNumero ? (
                <button
                  type="button"
                  onClick={() => setEtapaNumero(true)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-700"
                >
                  <PhoneCall className="w-4 h-4" />
                  Conectar com número de telefone
                </button>
              ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2.5 text-left">
                  <label className="text-[11px] font-bold text-slate-300">Número do WhatsApp (com DDD e código do país)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Ex: 5511999998888"
                    value={numeroInput}
                    onChange={e => setNumeroInput(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">Comece com <strong className="text-slate-300">55</strong> (Brasil) + DDD + número. Ex: 5511999998888</p>
                  <button
                    type="button"
                    onClick={() => iniciarConexaoWhatsapp('code')}
                    disabled={numeroInput.replace(/\D/g, '').length < 12}
                    className="w-full py-3 bg-[#25D366] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    Gerar código de conexão
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fluxo de conexão em andamento */}
          {mostrandoQr && (
            <div className="space-y-4">
              {metodoConexao === 'code' ? (
                pairCode ? (
                  <>
                    <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl py-5 px-4">
                      <p className="text-[11px] text-slate-400 mb-2">Seu código de conexão:</p>
                      <p className="text-3xl font-black tracking-[0.3em] text-emerald-400 font-mono">
                        {pairCode.length === 8 ? `${pairCode.slice(0, 4)}-${pairCode.slice(4)}` : pairCode}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed text-left">
                      No WhatsApp do número informado: <strong className="text-white">Configurações → Aparelhos conectados → Conectar um aparelho → Conectar com número de telefone</strong> e digite o código acima.
                    </p>
                  </>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <p className="text-xs">Gerando código de conexão... aguarde alguns segundos.</p>
                  </div>
                )
              ) : workerQr ? (
                <>
                  <div className="bg-white rounded-2xl p-4 inline-block mx-auto shadow-inner">
                    <img src={workerQr} alt="QR Code WhatsApp" className="w-56 h-56 object-contain" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Abra o <strong className="text-white">WhatsApp</strong> → <strong className="text-white">Aparelhos conectados</strong> → <strong className="text-white">Conectar um aparelho</strong> e escaneie o código acima.
                  </p>
                </>
              ) : workerOffline ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left">
                  <p className="text-xs font-bold text-amber-300 mb-1">⚠️ O robô do WhatsApp está desligado</p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Ligue o worker no seu celular (Termux). Assim que ele estiver ligado, o código aparece aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
                  <RefreshCw className={`w-6 h-6 ${buscandoQr ? 'animate-spin' : ''}`} />
                  <p className="text-xs">Gerando QR Code... aguarde alguns segundos.</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Aguardando a conexão...
              </div>
              <button
                type="button"
                onClick={() => { setMostrandoQr(false); setEtapaNumero(false); setWorkerQr(null); setPairCode(null); }}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline"
              >
                ← Voltar / trocar método
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
              Central de Automação & Outbox
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Configure regras de remarketing automatizadas para Pix pendentes e aprovados, gerencie cupons e acompanhe a fila de mensagens (Outbox).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExecutarEnfileirador}
              disabled={executandoMotor}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 font-bold border border-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition"
              title="Varrer pedidos e enfileirar mensagens de remarketing pendentes"
            >
              {executandoMotor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              Varrer Pedidos
            </button>

            <button
              onClick={handleProcessarFilaManual}
              disabled={processandoFila}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              title="Processar mensagens pendentes da fila (enviar ao Notificame/E-mail)"
            >
              {processandoFila ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Processar Outbox
            </button>

            <button
              onClick={() => {
                if (subAba === 'fila') fetchFila();
                onRefresh();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
              title="Sincronizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Abas de Navegação */}
        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-md">
          <button
            onClick={() => setSubAba('fila')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              subAba === 'fila' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Fila Outbox ({filaMensagens.filter(m => m.status === 'pendente').length})
          </button>

          <button
            onClick={() => setSubAba('regras')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              subAba === 'regras' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Regras de Automação
          </button>

          <button
            onClick={() => setSubAba('cupons')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              subAba === 'cupons' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Cupons ({cupons.length})
          </button>
        </div>

        {/* Status do Conector WhatsApp Web (Worker) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${workerStatus?.conectado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-200">Conector WhatsApp Web (Worker Externo)</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                  workerStatus?.conectado 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {workerStatus?.conectado ? 'CONECTADO' : 'DESCONECTADO'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {workerStatus?.conectado 
                  ? `Número conectado: +${workerStatus.numero}. Fila outbox processada por cron local a cada 15s.`
                  : 'Nenhum número pareado no momento. Conecte o worker externo e escaneie o código QR.'
                }
              </p>
            </div>
          </div>
          {workerStatus?.atualizadoEm && (
            <div className="text-[10px] text-slate-500 font-medium self-end md:self-center">
              Último sinal: {Math.max(0, Math.round((Date.now() - new Date(workerStatus.atualizadoEm).getTime()) / 1000))}s atrás
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Motor / Feedback de Ações */}
      {resultadoMotor && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-black text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {resultadoMotor.type === 'enfileirador' 
                ? `Venda varrida! Enfileiradas: ${resultadoMotor.enfileirados} novas mensagens` 
                : `Outbox processada! Sucesso: ${resultadoMotor.sucesso} | Falhas: ${resultadoMotor.erro}`}
            </span>
            <button onClick={() => setResultadoMotor(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {resultadoMotor.detalhes && resultadoMotor.detalhes.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] max-h-40 overflow-y-auto">
              {resultadoMotor.detalhes.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-800/40 last:border-0">
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

      {/* ----------------------------------------------------
          SUB-ABA 1: FILA DE MENSAGENS (OUTBOX)
         ---------------------------------------------------- */}
      {subAba === 'fila' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Barra de Filtros da Fila */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroStatusFila}
                onChange={e => setFiltroStatusFila(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Status: Todos</option>
                <option value="pendente">Status: Pendente</option>
                <option value="enviada">Status: Enviada</option>
                <option value="erro">Status: Erro (Falhou)</option>
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
                  className="px-2.5 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:text-white"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar destinatário ou texto..."
                  value={termoBuscaFila}
                  onChange={e => setTermoBuscaFila(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
              </div>

              <button
                onClick={handleLimparFilaMensagens}
                className="px-3.5 py-2 bg-slate-950 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Limpar mensagens com erro e pendentes da outbox"
              >
                <Ban className="w-3.5 h-3.5" />
                Limpar Fila
              </button>
            </div>
          </div>

          {/* Listagem da Fila de Mensagens */}
          {carregandoFila ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              Buscando mensagens da outbox...
            </div>
          ) : filaFiltrada.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">ID / Criação</th>
                    <th className="py-3 px-4">Destinatário</th>
                    <th className="py-3 px-4">Canal / Tipo</th>
                    <th className="py-3 px-4">Conteúdo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filaFiltrada.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-950/45 transition">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        <div className="text-slate-300 font-bold">{msg.id.slice(-8).toUpperCase()}</div>
                        <div>{new Date(msg.criadoEm).toLocaleDateString('pt-BR')} {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {msg.para}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {msg.canal === 'whatsapp' ? (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase rounded border border-emerald-500/20">Whats</span>
                          ) : msg.canal === 'email' ? (
                            <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 text-[9px] font-bold uppercase rounded border border-sky-500/20">E-mail</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase rounded border border-purple-500/20">Ambos</span>
                          )}
                          <span className="text-slate-400 text-[10px] font-medium capitalize">({msg.tipo})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {msg.texto}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border inline-block ${
                            msg.status === 'pendente'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                              : msg.status === 'enviada'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                              : msg.status === 'erro'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
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
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
              <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
              Nenhuma mensagem encontrada na outbox com os filtros atuais.
            </div>
          )}
        </div>
      )}

      {/* Modal para Visualização Detalhada da Mensagem */}
      {msgDetalhe && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setMsgDetalhe(null)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              Detalhes da Mensagem Outbox
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">ID do Registro</span>
                <span className="text-slate-300 font-mono text-[10px]">{msgDetalhe.id}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Destinatário</span>
                <span className="text-slate-200 font-bold text-sm">{msgDetalhe.para}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Status de Envio</span>
                <span className={`font-bold capitalize ${msgDetalhe.status === 'enviada' ? 'text-emerald-400' : msgDetalhe.status === 'erro' ? 'text-rose-400' : 'text-amber-400'}`}>{msgDetalhe.status}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block font-bold text-[10px] uppercase">Canal e Tipo</span>
                <span className="text-slate-300 font-medium capitalize">{msgDetalhe.canal} ({msgDetalhe.tipo})</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Texto Completo da Mensagem</span>
              <p className="text-xs text-slate-200 white-space:pre-wrap leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 font-mono">
                {msgDetalhe.texto}
              </p>
            </div>

            {msgDetalhe.erro && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs space-y-1">
                <span className="text-rose-400 font-bold text-[10px] uppercase block">Log do Erro Retornado</span>
                <p className="font-mono text-[11px] text-rose-300">{msgDetalhe.erro}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setMsgDetalhe(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-ABA 2: CONFIGURAÇÃO DE REGRAS DE AUTOMAÇÃO
         ---------------------------------------------------- */}
      {subAba === 'regras' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-6 animate-in fade-in">
          
          {/* Seletor de Campanha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Central de Regras de Remarketing</h3>
              <p className="text-xs text-slate-400">
                Determine as regras de contato automatizado por campanha. Os envios são gerados em background.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Campanha:</label>
              <select
                value={campanhaIdSel}
                onChange={e => setCampanhaIdSel(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {campanhas.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo} (/c/{c.codigo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Configurações Globais da Campanha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ativar Remarketing */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">Ativar Remarketing Automatizado</span>
                <span className="text-slate-400 text-[11px] block">O robô varrerá os pedidos para esta campanha conforme as regras.</span>
              </div>
              <button
                onClick={() => setRemAtivo(!remAtivo)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 flex items-center ${remAtivo ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${remAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Canal de Envio Preferencial */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">Canal Preferencial de Disparo</span>
                <span className="text-slate-400 text-[11px] block">Escolha se as notificações vão por WhatsApp, E-mail ou Ambos.</span>
              </div>
              <select
                value={canal}
                onChange={e => setCanal(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            {/* Somente se Campanha Ativa */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between md:col-span-2">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">Apenas se Campanha Estiver Publicada</span>
                <span className="text-slate-400 text-[11px] block">Evita que regras de longa duração (+24h, +7d) disparem se a campanha já foi finalizada ou pausada.</span>
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
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-2">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              Variáveis dinâmicas suportadas no texto das mensagens:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-emerald-400">
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Primeiro nome do comprador">{'{nome}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Título da Campanha">{'{campanha}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Link com cupom embutido se houver">{'{link}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Código do cupom ativo">{'{cupom}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Minutos (restantes ou decorridos)">{'{minutos}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Números reservados ou comprados">{'{numeros}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Quantidade de cotas reservadas">{'{qtd}'}</span>
            </div>
          </div>

          {/* 1. SEÇÃO DE REGRAS DE NÃO-PAGOU */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Mensagens de Pix Gerado & NÃO Pago (Aguardando / Expirado)
              </h4>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => adicionarRegraNaoPagou('faltando')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Pix Quase Expirando
                </button>
                <button
                  type="button"
                  onClick={() => adicionarRegraNaoPagou('apos')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1"
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
                    <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${
                            isFaltando 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
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

                      {/* Configuração de Cupom (Somente para Regras após expirar) */}
                      {!isFaltando && (
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Cupom de Desconto</label>
                            <input
                              type="text"
                              value={r.cupom || ''}
                              onChange={e => atualizarRegraNaoPagou(idx, { cupom: e.target.value.toUpperCase().trim() })}
                              placeholder="EX: RECUPERA"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono uppercase font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Desconto (%)</label>
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
                        <label className="text-[10px] text-slate-500 uppercase block font-bold">Conteúdo do Texto de Remarketing</label>
                        <textarea
                          rows={3}
                          value={r.mensagem}
                          onChange={e => atualizarRegraNaoPagou(idx, { mensagem: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          placeholder="Olá {nome}! Notamos que seu pedido na campanha {campanha} está..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
                Nenhuma regra cadastrada para pedidos não pagos ainda. Adicione regras acima!
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
                className={`px-3 py-1 text-[10px] font-black uppercase rounded border transition ${
                  regraPago.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {regraPago.ativo ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            {regraPago.ativo && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300">Enviar lista de cotas compradas no corpo da mensagem?</span>
                  </div>
                  <button
                    onClick={() => setRegraPago({ ...regraPago, enviarNumeros: !regraPago.enviarNumeros })}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 flex items-center ${regraPago.enviarNumeros ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${regraPago.enviarNumeros ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase block font-bold">Conteúdo da Mensagem de Confirmação</label>
                  <textarea
                    rows={3}
                    value={regraPago.mensagem || ''}
                    onChange={e => setRegraPago({ ...regraPago, mensagem: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Olá {nome}! Recebemos o seu Pix..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botão de Gravar Tudo */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            {msgFeedback && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {msgFeedback}
              </span>
            )}
            <button
              onClick={handleSalvarConfiguracoes}
              disabled={salvandoConfig}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition ml-auto flex items-center gap-1.5"
            >
              {salvandoConfig ? 'Salvando...' : 'Gravar Configurações & Regras'}
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-ABA 3: GESTÃO DE CUPONS DE DESCONTO
         ---------------------------------------------------- */}
      {subAba === 'cupons' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Cupons de Desconto da Campanha</h3>
              <p className="text-xs text-slate-400">
                Cadastre cupons fixos que os clientes podem aplicar manualmente na tela de checkout da campanha.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Campanha:</label>
              <select
                value={campanhaIdSel}
                onChange={e => setCampanhaIdSel(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {campanhas.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo} (/c/{c.codigo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Adicionar Novo Cupom */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Cadastrar Novo Cupom de Desconto:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Código do Cupom</label>
                <input
                  type="text"
                  placeholder="EX: PROMO10"
                  id="novoCupomCodigo"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Porcentagem de Desconto (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="10"
                  id="novoCupomPct"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
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
                      alert('Informe o código e uma porcentagem válida.');
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
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
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
                  <div key={c.id || idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs rounded border border-emerald-500/30">
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
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition ${
                          c.ativo !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {c.ativo !== false ? 'Ativo' : 'Inativo'}
                      </button>

                      <button
                        onClick={() => setCupons(cupons.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Excluir Cupom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
                Nenhum cupom específico cadastrado nesta campanha ainda.
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
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition ml-auto flex items-center gap-1.5"
            >
              {salvandoConfig ? 'Salvando...' : 'Salvar Alterações de Cupons'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
