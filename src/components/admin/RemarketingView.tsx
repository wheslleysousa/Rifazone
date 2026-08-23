import React, { useState } from 'react';
import { 
  MessageSquare, Clock, Copy, Check, Send, AlertCircle, 
  ExternalLink, Search, Flame, Sparkles, Filter, RefreshCw,
  Plus, Trash2, Tag, Percent, Settings2, Play, CheckCircle2,
  Mail, PhoneCall
} from 'lucide-react';
import { Pedido, Campanha, RegraRemarketingAguardando, RegraRemarketingExpirado, CupomDesconto } from '../../types';

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
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'expirado'>('pendente');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [templateAtivo, setTemplateAtivo] = useState<'pendente' | 'urgencia' | 'desconto'>('pendente');

  // Seleção de campanha para configuração de regras/cupons
  const [campanhaIdSel, setCampanhaIdSel] = useState<string>(campanhas[0]?.id || '');
  const campanhaSel = campanhas.find(c => c.id === campanhaIdSel) || campanhas[0];

  // Estado local para edição de regras e cupons
  const [remAtivo, setRemAtivo] = useState<boolean>(campanhaSel?.remarketing?.ativo ?? false);
  const [regrasAguardando, setRegrasAguardando] = useState<RegraRemarketingAguardando[]>(
    campanhaSel?.remarketing?.aguardando || [
      { id: '1', faltaMin: 5, mensagem: 'Olá {nome}! Sua reserva na {campanha} está expirando em {minutos} min. Pague o Pix para garantir: {link}' }
    ]
  );
  const [regrasExpirado, setRegrasExpirado] = useState<RegraRemarketingExpirado[]>(
    campanhaSel?.remarketing?.expirado || [
      { id: '2', aposMin: 30, cupom: 'VOLTA10', descontoPct: 10, mensagem: 'Oi {nome}! Seu pedido na {campanha} expirou. Use o cupom {cupom} e ganhe {descontoPct}% de desconto: {link}' }
    ]
  );
  const [cupons, setCupons] = useState<CupomDesconto[]>(campanhaSel?.cupons || []);

  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState('');
  const [executandoMotor, setExecutandoMotor] = useState(false);
  const [resultadoMotor, setResultadoMotor] = useState<any>(null);

  // Atualiza estado local quando troca a campanha selecionada
  React.useEffect(() => {
    if (campanhaSel) {
      setRemAtivo(campanhaSel.remarketing?.ativo ?? false);
      setRegrasAguardando(
        campanhaSel.remarketing?.aguardando || [
          { id: '1', faltaMin: 5, mensagem: 'Olá {nome}! Sua reserva na {campanha} está expirando em {minutos} min. Pague o Pix para garantir: {link}' }
        ]
      );
      setRegrasExpirado(
        campanhaSel.remarketing?.expirado || [
          { id: '2', aposMin: 30, cupom: 'VOLTA10', descontoPct: 10, mensagem: 'Oi {nome}! Seu pedido na {campanha} expirou. Use o cupom {cupom} e ganhe {descontoPct}% de desconto: {link}' }
        ]
      );
      setCupons(campanhaSel.cupons || []);
    }
  }, [campanhaIdSel, campanhas]);

  // Filtragem de pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    const combinaStatus = filtroStatus === 'todos' ? (p.status === 'pendente' || p.status === 'expirado') : p.status === filtroStatus;
    const combinaBusca = !termoBusca || 
      p.comprador?.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
      p.comprador?.whatsapp?.includes(termoBusca) ||
      p.id.toLowerCase().includes(termoBusca.toLowerCase());
    return combinaStatus && combinaBusca;
  });

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.startsWith('55') ? raw : `55${raw}`;
  };

  const copiarPix = (pix: string, id: string) => {
    navigator.clipboard.writeText(pix);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  // Salvar configurações de remarketing e cupons na campanha
  const handleSalvarRegras = async () => {
    if (!campanhaSel || !authFetch) return;
    setSalvandoConfig(true);
    setMsgFeedback('');

    try {
      const novaCampanha: Campanha = {
        ...campanhaSel,
        remarketing: {
          ativo: remAtivo,
          aguardando: regrasAguardando,
          expirado: regrasExpirado
        },
        cupons: cupons
      };

      const res = await authFetch(`/api/admin/campanhas/${campanhaSel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaCampanha)
      });

      if (res.ok) {
        setMsgFeedback('Configurações de remarketing salvas com sucesso!');
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

  // Disparar motor de remarketing manualmente
  const handleExecutarMotor = async () => {
    setExecutandoMotor(true);
    setResultadoMotor(null);
    try {
      const fetchFn = authFetch || fetch;
      const res = await fetchFn('/api/tarefas/remarketing?secret=rifazone_cron_secret_default', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoMotor(data);
        onRefresh();
      } else {
        alert(data.error || 'Erro ao executar motor.');
      }
    } catch (err) {
      alert('Falha de conexão ao executar motor.');
    } finally {
      setExecutandoMotor(false);
    }
  };

  // Gerar mensagem de WhatsApp rápida para o comprador
  const gerarMensagemWhatsApp = (p: Pedido) => {
    const nome = p.comprador?.nome?.split(' ')[0] || 'Amigo(a)';
    const valor = p.valorTotal.toFixed(2).replace('.', ',');
    const cotas = p.quantidade;
    const pix = p.pixCopiaCola || '';
    const link = `${window.location.origin}/c/${p.campanhaId}?pedido=${p.id}`;

    if (p.status === 'expirado') {
      return encodeURIComponent(
        `Oi ${nome}! 👋 Notamos que seu pedido de ${cotas} cotas na rifa expirou.\n\n` +
        `Você ainda pode reativar seu pedido e participar antes que as cotas esgotem:\n\n` +
        `${link}\n\n` +
        `Qualquer dúvida, estamos por aqui! 🍀`
      );
    }

    if (templateAtivo === 'urgencia') {
      return encodeURIComponent(
        `🚨 *ÚLTIMA CHAMADA, ${nome.toUpperCase()}!* 🚨\n\n` +
        `Sua reserva de ${cotas} cotas por R$ ${valor} expirará em poucos minutos.\n\n` +
        `Pague rápido com o Pix Copia e Cola:\n\n${pix}\n\n` +
        `Garanta seus números antes que sejam liberados para outro comprador! 🔥`
      );
    } else if (templateAtivo === 'desconto') {
      return encodeURIComponent(
        `Oi ${nome}! 🎉 Seus números no sorteio já estão separados!\nTotal: R$ ${valor} por ${cotas} cotas.\n\n` +
        `Chave Pix para pagamento instantâneo:\n${pix}\n\n` +
        `Obrigado pela preferência e boa sorte!`
      );
    } else {
      return encodeURIComponent(
        `Olá ${nome}! 👋 Notamos que sua reserva de *${cotas} cotas* (R$ ${valor}) no sorteio oficial está aguardando pagamento.\n\n` +
        `Para garantir seus números agora mesmo via Pix Copia e Cola:\n\n${pix}\n\n` +
        `Assim que pagar, sua participação é confirmada na hora! 🍀`
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
              Recuperação de Vendas & Remarketing
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Automatize lembretes de Pix pendente, envie cupons de desconto para pedidos expirados e cobre no WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExecutarMotor}
              disabled={executandoMotor}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              title="Executar robô de disparo automatizado agora"
            >
              {executandoMotor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Disparar Motor de Remarketing
            </button>

            <button
              onClick={onRefresh}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
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
            Fila no WhatsApp ({pedidos.filter(p => p.status === 'pendente' || p.status === 'expirado').length})
          </button>

          <button
            onClick={() => setSubAba('regras')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              subAba === 'regras' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Regras de Envio
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
      </div>

      {/* Exibição dos resultados do motor se disparado */}
      {resultadoMotor && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-black text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Execução do Motor Concluída! Disparados: {resultadoMotor.disparados}
            </span>
            <button onClick={() => setResultadoMotor(null)} className="text-slate-500 hover:text-white text-xs">Fechar</button>
          </div>
          {resultadoMotor.detalhes && resultadoMotor.detalhes.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] max-h-40 overflow-y-auto">
              {resultadoMotor.detalhes.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-800/40 last:border-0">
                  <span className="text-slate-200">{d.comprador} (Pedido {d.pedidoId})</span>
                  <span className="text-emerald-400 uppercase font-bold">{d.tipo} ({d.regra})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-ABA 1: FILA DE RECUPERAÇÃO / WHATSAPP MANUALE
         ---------------------------------------------------- */}
      {subAba === 'fila' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Seletor de Modelo e Filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 block">Modelo de Cobrança WhatsApp:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTemplateAtivo('pendente')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    templateAtivo === 'pendente'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  👋 Lembrete Amigável
                </button>
                <button
                  onClick={() => setTemplateAtivo('urgencia')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    templateAtivo === 'urgencia'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🚨 Senso de Urgência
                </button>
                <button
                  onClick={() => setTemplateAtivo('desconto')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    templateAtivo === 'desconto'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🎉 Confirmação Rápida
                </button>
              </div>
            </div>

            {/* Filtros de Lista */}
            <div className="flex items-center gap-2">
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="pendente">Status: Aguardando Pix</option>
                <option value="expirado">Status: Expirados</option>
                <option value="todos">Status: Todos os Não-Pagos</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome ou WhatsApp..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Lista de Pedidos */}
          {pedidosFiltrados.length > 0 ? (
            <div className="space-y-3">
              {pedidosFiltrados.map(p => {
                const msg = gerarMensagemWhatsApp(p);
                const linkWhats = `https://wa.me/${formatWhatsapp(p.comprador?.whatsapp || '')}?text=${msg}`;

                return (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {p.comprador?.nome || 'Comprador'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border flex items-center gap-1 ${
                          p.status === 'pendente' 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {p.status === 'pendente' ? 'Aguardando Pix' : 'Expirado'}
                        </span>

                        {p.remarketingEnviado && p.remarketingEnviado.length > 0 && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30">
                            Auto Disparado ({p.remarketingEnviado.length})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>WhatsApp: <strong className="text-slate-200">{p.comprador?.whatsapp}</strong></span>
                        <span>•</span>
                        <span>Cotas: <strong className="text-emerald-400">{p.quantidade}</strong></span>
                        <span>•</span>
                        <span>Valor: <strong className="text-white">R$ {p.valorTotal.toFixed(2).replace('.', ',')}</strong></span>
                        <span>•</span>
                        <span>Expira/Expirou: {new Date(p.expiraEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {p.pixCopiaCola && p.status === 'pendente' && (
                        <button
                          onClick={() => copiarPix(p.pixCopiaCola!, p.id)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                          title="Copiar Código Pix"
                        >
                          {copiadoId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiadoId === p.id ? 'Copiado!' : 'Pix'}
                        </button>
                      )}

                      <a
                        href={linkWhats}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Cobrar no WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
              <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
              Nenhum pedido no status selecionado no momento!
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-ABA 2: CONFIGURAÇÃO DE REGRAS AUTOMÁTICAS
         ---------------------------------------------------- */}
      {subAba === 'regras' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
          
          {/* Seletor de Campanha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Regras de Automação de Remarketing</h3>
              <p className="text-xs text-slate-400">
                Configure os disparos e mensagens automáticas enviados via e-mail e preparados para o motor.
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

          {/* Toggle Ativar Automação */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-white text-sm block">Ativar Motor de Remarketing para esta campanha</span>
              <span className="text-slate-400 text-xs block">O sistema verificará a cada execução se há pedidos no prazo de disparo.</span>
            </div>
            <button
              onClick={() => setRemAtivo(!remAtivo)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${remAtivo ? 'bg-emerald-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${remAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Variáveis disponíveis */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
            <span className="text-slate-400 font-bold block">Variáveis dinâmicas para o texto das mensagens:</span>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-emerald-400">
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{'{nome}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{'{campanha}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{'{link}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{'{cupom}'}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{'{minutos}'}</span>
            </div>
          </div>

          {/* 1. Regras para Aguardando Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Público Aguardando Pagamento (Lembrete Pré-Expiração)
              </h4>
              <button
                type="button"
                onClick={() => setRegrasAguardando([...regrasAguardando, { id: 'ag_' + Date.now(), faltaMin: 5, mensagem: 'Olá {nome}! Sua reserva na {campanha} vence em {minutos} min. Pague o Pix: {link}' }])}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Regra
              </button>
            </div>

            {regrasAguardando.map((r, idx) => (
              <div key={r.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Disparar quando faltar</span>
                    <input
                      type="number"
                      min="1"
                      value={r.faltaMin}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setRegrasAguardando(regrasAguardando.map((item, i) => i === idx ? { ...item, faltaMin: val } : item));
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                    />
                    <span className="text-xs font-bold text-slate-300">minutos para o Pix expirar</span>
                  </div>

                  <button
                    onClick={() => setRegrasAguardando(regrasAguardando.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-rose-400 transition p-1"
                    title="Remover regra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={r.mensagem}
                  onChange={e => {
                    const val = e.target.value;
                    setRegrasAguardando(regrasAguardando.map((item, i) => i === idx ? { ...item, mensagem: val } : item));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Texto da mensagem..."
                />
              </div>
            ))}
          </div>

          {/* 2. Regras para Pedidos Expirados */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Público com Pedido Expirado (Recuperação com Cupom)
              </h4>
              <button
                type="button"
                onClick={() => setRegrasExpirado([...regrasExpirado, { id: 'exp_' + Date.now(), aposMin: 30, cupom: 'VOLTA10', descontoPct: 10, mensagem: 'Oi {nome}! Seu pedido na {campanha} expirou. Ganhe {descontoPct}% usando o cupom {cupom}: {link}' }])}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Regra
              </button>
            </div>

            {regrasExpirado.map((r, idx) => (
              <div key={r.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-300">Disparar</span>
                    <input
                      type="number"
                      min="1"
                      value={r.aposMin}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setRegrasExpirado(regrasExpirado.map((item, i) => i === idx ? { ...item, aposMin: val } : item));
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                    />
                    <span className="text-xs font-bold text-slate-300">minutos APÓS expirar</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Cupom:</span>
                      <input
                        type="text"
                        value={r.cupom || ''}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          setRegrasExpirado(regrasExpirado.map((item, i) => i === idx ? { ...item, cupom: val } : item));
                        }}
                        placeholder="VOLTA10"
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono uppercase font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Desconto %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={r.descontoPct || 0}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setRegrasExpirado(regrasExpirado.map((item, i) => i === idx ? { ...item, descontoPct: val } : item));
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
                      />
                    </div>

                    <button
                      onClick={() => setRegrasExpirado(regrasExpirado.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Remover regra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={r.mensagem}
                  onChange={e => {
                    const val = e.target.value;
                    setRegrasExpirado(regrasExpirado.map((item, i) => i === idx ? { ...item, mensagem: val } : item));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Texto da mensagem..."
                />
              </div>
            ))}
          </div>

          {/* Botão Salvar */}
          <div className="pt-2 flex items-center justify-between">
            {msgFeedback && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {msgFeedback}
              </span>
            )}
            <button
              onClick={handleSalvarRegras}
              disabled={salvandoConfig}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition ml-auto flex items-center gap-1.5"
            >
              {salvandoConfig ? 'Salvando...' : 'Salvar Regras de Remarketing'}
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-ABA 3: GESTÃO DE CUPONS DE DESCONTO
         ---------------------------------------------------- */}
      {subAba === 'cupons' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Cupons de Desconto da Campanha</h3>
              <p className="text-xs text-slate-400">
                Crie códigos promocionais para os compradores aplicarem no fluxo de finalização da compra.
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
              onClick={handleSalvarRegras}
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
