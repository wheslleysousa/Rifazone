import React, { useState, useEffect } from 'react';
import { Campanha, Pedido } from '../../types';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Target,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  PieChart,
  Eye,
  MousePointer,
  HelpCircle,
  ExternalLink,
  Sliders,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  MoreHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList
} from 'recharts';

interface AnalyticsViewProps {
  campanhas: Campanha[];
  pedidos: Pedido[];
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  campanhas,
  pedidos,
  authFetch
}) => {
  const [campanhaIdSelecionada, setCampanhaIdSelecionada] = useState<string>('todas');
  const [carregandoInsights, setCarregandoInsights] = useState(false);
  const [erroInsights, setErroInsights] = useState<string | null>(null);
  
  // Estado dos dados vindos da API
  const [insightsData, setInsightsData] = useState<{
    conectado: boolean;
    adAccountId?: string;
    meta?: {
      spend: number;
      reach: number;
      clicks: number;
      cpc: number;
      cpm: number;
      ctr: number;
      impressions: number;
      comprasMeta: number;
      viewContent: number;
      initiateCheckout: number;
      campaigns?: any[];
    };
    rifazone?: {
      faturamento: number;
      pedidosPagos: number;
      cotasVendidas: number;
      totalPedidos: number;
    };
    indicadores?: {
      roas: number;
      cpa: number;
      lucroLiquido: number;
      margemPct: number;
    };
  } | null>(null);

  const [conectandoFacebook, setConectandoFacebook] = useState(false);

  // Novos estados para seleção de contas
  const [bms, setBms] = useState<any[]>([]);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [bmSelecionadaId, setBmSelecionadaId] = useState<string>('todas');
  const [contaSelecionadaId, setContaSelecionadaId] = useState<string>('todas');
  const [carregandoContas, setCarregandoContas] = useState(false);

  // Configuração de colunas da tabela
  const [colunasAtivas, setColunasAtivas] = useState<string[]>([
    'nome', 'status', 'spend', 'vincular', 'receita', 'lucro', 'roas'
  ]);
  const [mostrarConfigColunas, setMostrarConfigColunas] = useState(false);

  const COLUNAS_DISPONIVEIS = [
    { id: 'nome', label: 'Campanha' },
    { id: 'status', label: 'Status' },
    { id: 'spend', label: 'Gasto Meta' },
    { id: 'reach', label: 'Alcance' },
    { id: 'impressions', label: 'Impressões' },
    { id: 'clicks', label: 'Cliques' },
    { id: 'cpc', label: 'CPC' },
    { id: 'cpm', label: 'CPM' },
    { id: 'ctr', label: 'CTR %' },
    { id: 'viewContent', label: 'Visualizações PV' },
    { id: 'initiateCheckout', label: 'Checkouts' },
    { id: 'comprasMeta', label: 'Compras Pixel' },
    { id: 'vincular', label: 'Vincular Rifa' },
    { id: 'receita', label: 'Receita Rifa' },
    { id: 'lucro', label: 'Lucro Líquido' },
    { id: 'roas', label: 'ROAS Real' },
    { id: 'cpa', label: 'CPA Real' },
  ];

  const carregarBms = async () => {
    try {
      const res = await authFetch('/api/admin/meta/bms');
      if (res.ok) {
        const data = await res.json();
        setBms(data);
      }
    } catch (e) {
      console.error('Erro ao carregar BMs:', e);
    }
  };

  const carregarContas = async (businessId?: string) => {
    setCarregandoContas(true);
    try {
      const url = businessId && businessId !== 'todas' ? `/api/admin/meta/adaccounts?businessId=${businessId}` : '/api/admin/meta/adaccounts';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setAdAccounts(data);
      }
    } catch (e) {
      console.error('Erro ao carregar contas:', e);
    } finally {
      setCarregandoContas(false);
    }
  };

  const handleSelecionarConta = async (adAccountId: string) => {
    setContaSelecionadaId(adAccountId);
    // Não precisa mais do POST selecionar-conta se vamos usar query param no buscarInsights
    // Mas vamos manter para persistir a escolha se o usuário quiser
    try {
      await authFetch('/api/admin/meta/selecionar-conta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId })
      });
      buscarInsights(adAccountId, bmSelecionadaId);
    } catch (e) {
      console.error('Erro ao selecionar conta:', e);
    }
  };

  const handleConectarFacebook = async () => {
    setConectandoFacebook(true);
    try {
      const res = await authFetch('/api/auth/facebook/url');
      const json = await res.json();
      if (res.ok && json.url) {
        // Usa window.open para evitar bloqueios de iframe no AI Studio
        const width = 600;
        const height = 700;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        window.open(json.url, 'fb_oauth', `width=${width},height=${height},top=${top},left=${left}`);
        
        // Pede pro usuário recarregar a página após logar no popup
        alert('Uma nova janela foi aberta para conectar sua conta do Facebook.\n\nSe a janela não abriu, permita os popups no seu navegador.\n\nApós autorizar no Facebook, recarregue esta página para ver seus dados.');
      } else {
        alert(json.error || 'Erro ao gerar URL de conexão do Facebook. (Configure as variáveis no Render)');
      }
    } catch (err: any) {
      alert('Falha ao conectar com o Facebook.');
    } finally {
      setConectandoFacebook(false);
    }
  };

  const handleDesconectarFacebook = async () => {
    if (!confirm('Deseja desconectar sua conta do Facebook?')) return;
    try {
      const res = await authFetch('/api/admin/configuracoes/desconectar-facebook', { method: 'POST' });
      if (res.ok) {
        buscarInsights();
      } else {
        alert('Erro ao desconectar conta.');
      }
    } catch (err) {
      alert('Erro ao desconectar.');
    }
  };

  const handleVincularCampanha = async (rifaId: string, metaCampaignId: string) => {
    try {
      const res = await authFetch(`/api/admin/campanhas/${rifaId}/meta-link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaCampaignId })
      });
      if (res.ok) {
        // Remove a vinculação dessa Meta Campaign de qualquer outra rifa primeiro
        campanhas.forEach(c => {
          if (c.metaCampaignId === metaCampaignId && c.id !== rifaId) {
            c.metaCampaignId = null;
          }
        });
        
        // Atualiza a Rifa selecionada na interface
        if (rifaId) {
          const idx = campanhas.findIndex(c => c.id === rifaId);
          if (idx !== -1) {
            campanhas[idx].metaCampaignId = metaCampaignId || null;
          }
        }
        
        // Força renderização chamando um clone ou apenas atualizando state. 
        // O buscarInsights atualiza o state, disparando render.
        buscarInsights(); 
      } else {
        alert('Erro ao salvar vinculação.');
      }
    } catch (err) {
      alert('Erro ao vincular.');
    }
  };

  const buscarInsights = async (forceAdAccountId?: string, forceBmId?: string) => {
    setCarregandoInsights(true);
    setErroInsights(null);
    try {
      const targetAcc = forceAdAccountId || contaSelecionadaId;
      const targetBm = forceBmId || bmSelecionadaId;

      let url = `/api/admin/meta/insights?adAccountId=${targetAcc}&bmId=${targetBm}`;
      if (campanhaIdSelecionada && campanhaIdSelecionada !== 'todas') {
        url += `&campanhaId=${campanhaIdSelecionada}`;
      }

      const res = await authFetch(url);
      const json = await res.json();

      if (!res.ok) {
        setErroInsights(json.error || 'Não foi possível carregar os dados de anúncios.');
        setInsightsData(null);
      } else {
        setInsightsData(json);
        if (json.conectado) {
          if (bms.length === 0) carregarBms();
          if (adAccounts.length === 0) carregarContas();
          
          if (json.adAccountId && contaSelecionadaId === 'todas' && !forceAdAccountId) {
            // Sincroniza se a config do servidor tiver uma conta mas aqui estiver 'todas'
            // setContaSelecionadaId(json.adAccountId);
          }
        }
      }
    } catch (err: any) {
      setErroInsights('Erro de conexão ao buscar insights do Meta Ads.');
      setInsightsData(null);
    } finally {
      setCarregandoInsights(false);
    }
  };

  useEffect(() => {
    buscarInsights();
  }, [campanhaIdSelecionada]);

  // Cálculo alternativo local caso Meta não esteja conectado
  const pedidosPagosLocais = pedidos.filter(p => {
    if (p.status !== 'pago') return false;
    if (campanhaIdSelecionada !== 'todas' && p.campanhaId !== campanhaIdSelecionada) return false;
    return true;
  });

  const faturamentoLocal = pedidosPagosLocais.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
  const cotasVendidasLocais = pedidosPagosLocais.reduce((acc, p) => acc + (p.quantidade || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-500/20 flex items-center gap-1">
              <Zap className="w-3 h-3 text-sky-400" />
              Marketing API + Conversions API
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Meta Ads
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl">
            Acompanhe o desempenho das suas campanhas de tráfego, veja o gasto real da sua conta de anúncios e descubra o seu verdadeiro Lucro e ROAS (Retorno Sobre Investimento).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {insightsData?.conectado ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Conectado ({insightsData.adAccountId})
              </span>
              <button
                type="button"
                onClick={handleDesconectarFacebook}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30 transition"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConectarFacebook}
              disabled={conectandoFacebook}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-xl shadow-lg shadow-sky-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {conectandoFacebook ? 'Conectando...' : 'Conectar Conta do Facebook'}
            </button>
          )}
          
          <button
            type="button"
            onClick={buscarInsights}
            disabled={carregandoInsights}
            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 transition disabled:opacity-50"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${carregandoInsights ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SELETOR DE CONTA E BM (EXIBIDO SE CONECTADO) */}
      {insightsData?.conectado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          {/* Seletor de BM */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              1. Business Manager (Empresa)
            </label>
            <select
              value={bmSelecionadaId}
              onChange={e => {
                const id = e.target.value;
                setBmSelecionadaId(id);
                carregarContas(id);
                // Ao mudar BM, reseta conta para 'todas' dessa BM
                setContaSelecionadaId('todas');
                buscarInsights('todas', id);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none transition"
            >
              <option value="todas">🏢 Todas as Business Managers</option>
              <option value="">👤 Contas Pessoais / Sem BM</option>
              {bms.map(bm => (
                <option key={bm.id} value={bm.id}>🏢 {bm.name}</option>
              ))}
            </select>
          </div>

          {/* Seletor de Conta de Anúncios */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              2. Conta de Anúncios
            </label>
            <div className="relative">
              <select
                value={contaSelecionadaId}
                onChange={e => handleSelecionarConta(e.target.value)}
                disabled={carregandoContas}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none transition disabled:opacity-50"
              >
                <option value="todas">✨ Todas as Contas (Consolidado)</option>
                {adAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    🎯 {acc.name} ({acc.id.replace('act_', '')})
                  </option>
                ))}
              </select>
              {carregandoContas && (
                <div className="absolute right-3 top-2.5">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SELETOR DE CAMPANHA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Filtrar por Campanha:</span>
        </div>
        <select
          value={campanhaIdSelecionada}
          onChange={e => setCampanhaIdSelecionada(e.target.value)}
          className="w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none"
        >
          <option value="todas">🌐 Todas as Campanhas ({campanhas.length})</option>
          {campanhas.map(c => (
            <option key={c.id} value={c.id}>
              🎯 {c.titulo}
            </option>
          ))}
        </select>
      </div>

      {/* AVISO DE CONFIGURAÇÃO SE NÃO TIVER CONECTADO OU SEM CONTA */}
      {(erroInsights || (insightsData?.conectado && !insightsData?.adAccountId)) && (
        <div className={`p-6 rounded-3xl border space-y-4 shadow-xl ${
          insightsData?.conectado ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900'
        } text-slate-200`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
              insightsData?.conectado ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-sky-500/20 border-sky-500/30 text-sky-400'
            }`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {insightsData?.conectado ? 'Configuração Quase Completa!' : 'Conecte sua Conta do Facebook para Ver o ROAS e Gastos'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {insightsData?.conectado 
                  ? 'Você já conectou seu Facebook. Agora, utilize os seletores acima para escolher qual Business Manager e qual Conta de Anúncios você deseja monitorar.'
                  : 'Clique no botão abaixo para fazer login com sua conta do Facebook e autorizar o RifaZone a consultar os dados de anúncios automaticamente. Cada cliente gerencia sua própria conta com 1 clique!'}
              </p>
              {(erroInsights || insightsData?.error) && (
                <p className="text-[11px] text-amber-400/90 mt-2 font-mono">
                  ⚠️ {erroInsights || insightsData?.error}
                </p>
              )}
            </div>
          </div>

          {!insightsData?.conectado && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleConectarFacebook}
                disabled={conectandoFacebook}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {conectandoFacebook ? 'Redirecionando...' : 'Conectar com o Facebook'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD PRINCIPAL DE INDICADORES (ROAS, CPA, LUCRO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: ROAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">ROAS Verdadeiro</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              (insightsData?.indicadores?.roas || 0) >= 1 ? 'text-emerald-400' : 'text-slate-200'
            }`}>
              {insightsData?.indicadores ? `${insightsData.indicadores.roas.toFixed(2)}x` : '—'}
            </span>
            {insightsData?.indicadores && (
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                insightsData.indicadores.roas >= 2
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : insightsData.indicadores.roas >= 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {insightsData.indicadores.roas >= 2 ? 'Lucrativo 🔥' : insightsData.indicadores.roas >= 1 ? 'Equilibrado' : 'Atenção'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Faturamento ÷ Gasto em Anúncios
          </p>
        </div>

        {/* CARD 2: FATURAMENTO REAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Faturamento RifaZone</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            R$ {(insightsData?.rifazone?.faturamento ?? faturamentoLocal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500">
            {(insightsData?.rifazone?.pedidosPagos ?? pedidosPagosLocais.length)} pedidos pagos ({insightsData?.rifazone?.cotasVendidas ?? cotasVendidasLocais} cotas)
          </p>
        </div>

        {/* CARD 3: GASTO META ADS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Gasto Meta Ads</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-200">
            {insightsData?.meta ? `R$ ${insightsData.meta.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            Total investido na Meta
          </p>
        </div>

        {/* CARD 4: CPA REAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">CPA Real (Custo/Venda)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-200">
            {insightsData?.indicadores?.cpa ? `R$ ${insightsData.indicadores.cpa.toFixed(2)}` : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            Custo por pedido pago no RifaZone
          </p>
        </div>
      </div>

      {/* METRICAS DE TRÁFEGO META ADS */}
      {insightsData?.meta && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-400" />
              Engajamento e Métricas do Meta Ads (Marketing API)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Ad Account: {insightsData.adAccountId}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 font-bold block">Alcance Total</span>
              <span className="text-sm font-black text-slate-200">{insightsData.meta.reach.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 font-bold block">Impressões</span>
              <span className="text-sm font-black text-slate-200">{insightsData.meta.impressions.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold block">Cliques</span>
                <span className="text-[10px] text-sky-400 font-black">{insightsData.meta.ctr?.toFixed(2)}% CTR</span>
              </div>
              <span className="text-sm font-black text-slate-200">{insightsData.meta.clicks.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold block">CPC</span>
                <span className="text-[10px] text-amber-400 font-black">CPM R$ {insightsData.meta.cpm?.toFixed(2)}</span>
              </div>
              <span className="text-sm font-black text-slate-200">R$ {insightsData.meta.cpc.toFixed(2)}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-bold block">Compras Pixel</span>
              <span className="text-sm font-black text-emerald-400">{insightsData.meta.comprasMeta}</span>
            </div>
          </div>
        </div>
      )}

      {/* FUNIL DE CONVERSÃO */}
      {insightsData?.meta && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                Funel de Conversão (Análise de Perda)
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Meta Ads ➔ RifaZone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Gráfico de Funil */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { name: 'Cliques', value: insightsData.meta.clicks, color: '#38bdf8' },
                    { name: 'Visualizações PV', value: insightsData.meta.viewContent, color: '#2dd4bf' },
                    { name: 'Checkouts', value: insightsData.meta.initiateCheckout, color: '#818cf8' },
                    { name: 'Vendas Meta', value: insightsData.meta.comprasMeta, color: '#34d399' },
                    { name: 'Vendas Reais (PIX)', value: insightsData.rifazone?.pedidosPagos || 0, color: '#10b981' }
                  ]}
                  margin={{ top: 20, right: 80, left: 20, bottom: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                    {
                      [1,2,3,4,5].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#38bdf8', '#2dd4bf', '#818cf8', '#34d399', '#10b981'][index]} />
                      ))
                    }
                    <LabelList dataKey="value" position="right" fill="#cbd5e1" fontSize={11} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Taxas de Conversão */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { 
                  label: 'Retenção na PV', 
                  val: insightsData.meta.clicks > 0 ? (insightsData.meta.viewContent / insightsData.meta.clicks) * 100 : 0,
                  desc: 'Cliques que viraram Visitas' 
                },
                { 
                  label: 'Taxa de Checkout', 
                  val: insightsData.meta.viewContent > 0 ? (insightsData.meta.initiateCheckout / insightsData.meta.viewContent) * 100 : 0,
                  desc: 'Visitas que iniciaram compra' 
                },
                { 
                  label: 'Conversão Meta', 
                  val: insightsData.meta.clicks > 0 ? (insightsData.meta.comprasMeta / insightsData.meta.clicks) * 100 : 0,
                  desc: 'Cliques que viraram Vendas' 
                },
                { 
                  label: 'Aproveitamento PIX', 
                  val: insightsData.meta.comprasMeta > 0 ? ((insightsData.rifazone?.pedidosPagos || 0) / insightsData.meta.comprasMeta) * 100 : 0,
                  desc: 'Pixel vs Vendas Reais' 
                }
              ].map((taxa, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{taxa.label}</span>
                  <div className="text-xl font-black text-white">{taxa.val.toFixed(2)}%</div>
                  <p className="text-[10px] text-slate-500">{taxa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRACKING E VINCULAÇÃO DE CAMPANHAS META ADS */}
      {insightsData?.conectado && insightsData.meta?.campaigns && insightsData.meta.campaigns.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              Sincronização de Campanhas (Meta Ads ➔ RifaZone)
            </h3>

            <div className="relative">
              <button
                onClick={() => setMostrarConfigColunas(!mostrarConfigColunas)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-xl flex items-center gap-2 transition border border-slate-700/60"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Personalizar Métricas
              </button>

              {mostrarConfigColunas && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Colunas da Tabela</h4>
                  <div className="grid grid-cols-1 gap-1 max-h-[350px] overflow-y-auto pr-1">
                    {colunasAtivas.map((colId, index) => {
                      const col = COLUNAS_DISPONIVEIS.find(c => c.id === colId);
                      if (!col) return null;
                      return (
                        <div key={colId} className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (colunasAtivas.length > 1) {
                                setColunasAtivas(prev => prev.filter(id => id !== colId));
                              }
                            }}
                            className="flex-1 flex items-center justify-between p-2 rounded-xl text-left text-[11px] transition bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            <span className="font-bold">{col.label}</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={index === 0}
                              onClick={() => {
                                const newCols = [...colunasAtivas];
                                [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
                                setColunasAtivas(newCols);
                              }}
                              className="p-1 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowUpWideNarrow className="w-3 h-3 text-slate-400" />
                            </button>
                            <button
                              disabled={index === colunasAtivas.length - 1}
                              onClick={() => {
                                const newCols = [...colunasAtivas];
                                [newCols[index + 1], newCols[index]] = [newCols[index], newCols[index + 1]];
                                setColunasAtivas(newCols);
                              }}
                              className="p-1 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowDownWideNarrow className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="my-3 border-t border-slate-800 pt-3">
                      <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Adicionar Métricas</h5>
                      <div className="grid grid-cols-1 gap-1">
                        {COLUNAS_DISPONIVEIS.filter(c => !colunasAtivas.includes(c.id)).map(col => (
                          <button
                            key={col.id}
                            onClick={() => setColunasAtivas(prev => [...prev, col.id])}
                            className="flex items-center justify-between p-2 rounded-xl text-left text-[11px] transition bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300"
                          >
                            <span className="font-bold">{col.label}</span>
                            <MoreHorizontal className="w-3.5 h-3.5 opacity-30" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrarConfigColunas(false)}
                    className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-xl transition"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Vincule cada campanha de anúncio do Facebook à sua respectiva Rifa. Assim, podemos cruzar o que foi <strong>gasto no Meta</strong> com o <strong>faturamento real de PIX</strong> para revelar o lucro verdadeiro.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  {colunasAtivas.includes('nome') && <th className="p-3">Campanha (Anúncio)</th>}
                  {colunasAtivas.includes('status') && <th className="p-3">Status</th>}
                  {colunasAtivas.includes('spend') && <th className="p-3">Gasto Meta</th>}
                  {colunasAtivas.includes('reach') && <th className="p-3">Alcance</th>}
                  {colunasAtivas.includes('impressions') && <th className="p-3">Impressões</th>}
                  {colunasAtivas.includes('clicks') && <th className="p-3">Cliques</th>}
                  {colunasAtivas.includes('cpc') && <th className="p-3">CPC</th>}
                  {colunasAtivas.includes('ctr') && <th className="p-3">CTR</th>}
                  {colunasAtivas.includes('comprasMeta') && <th className="p-3">Compras Pixel</th>}
                  {colunasAtivas.includes('vincular') && <th className="p-3 bg-slate-900/50">Associar à Rifa</th>}
                  {colunasAtivas.includes('receita') && <th className="p-3 text-emerald-400">Receita Rifa</th>}
                  {colunasAtivas.includes('lucro') && <th className="p-3 text-right">Lucro Líquido</th>}
                  {colunasAtivas.includes('roas') && <th className="p-3 text-right">ROAS Real</th>}
                  {colunasAtivas.includes('cpa') && <th className="p-3 text-right">CPA Real</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {insightsData.meta.campaigns.map((fbCamp: any) => {
                  // Procura se tem rifa vinculada
                  const rifaVinculada = campanhas.find(c => c.metaCampaignId === fbCamp.id);
                  
                  let faturamentoRifa = 0;
                  let pedidosPagosCount = 0;
                  if (rifaVinculada) {
                    const pedidosRifa = pedidos.filter(p => p.campanhaId === rifaVinculada.id && p.status === 'pago');
                    faturamentoRifa = pedidosRifa.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
                    pedidosPagosCount = pedidosRifa.length;
                  }

                  const lucro = faturamentoRifa - (fbCamp.spend || 0);
                  const roas = fbCamp.spend > 0 ? (faturamentoRifa / fbCamp.spend) : 0;
                  const cpa = pedidosPagosCount > 0 ? (fbCamp.spend / pedidosPagosCount) : 0;
                  const ctr = fbCamp.impressions > 0 ? ((fbCamp.clicks / fbCamp.impressions) * 100) : 0;
                  const isPositive = lucro >= 0;

                  return (
                    <tr key={fbCamp.id} className="hover:bg-slate-800/50 transition">
                      {colunasAtivas.includes('nome') && (
                        <td className="p-3 font-bold text-white max-w-[200px] truncate" title={fbCamp.name}>
                          {fbCamp.name}
                        </td>
                      )}
                      {colunasAtivas.includes('status') && (
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            fbCamp.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {fbCamp.status}
                          </span>
                        </td>
                      )}
                      {colunasAtivas.includes('spend') && (
                        <td className="p-3 font-mono text-rose-400">
                          R$ {Number(fbCamp.spend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {colunasAtivas.includes('reach') && <td className="p-3 font-mono text-slate-400">{fbCamp.reach?.toLocaleString()}</td>}
                      {colunasAtivas.includes('impressions') && <td className="p-3 font-mono text-slate-400">{fbCamp.impressions?.toLocaleString()}</td>}
                      {colunasAtivas.includes('clicks') && <td className="p-3 font-mono text-slate-400">{fbCamp.clicks?.toLocaleString()}</td>}
                      {colunasAtivas.includes('cpc') && <td className="p-3 font-mono text-slate-400">R$ {fbCamp.cpc?.toFixed(2)}</td>}
                      {colunasAtivas.includes('cpm') && <td className="p-3 font-mono text-slate-400">R$ {fbCamp.cpm?.toFixed(2)}</td>}
                      {colunasAtivas.includes('ctr') && <td className="p-3 font-mono text-slate-400">{fbCamp.ctr?.toFixed(2)}%</td>}
                      {colunasAtivas.includes('viewContent') && <td className="p-3 font-mono text-slate-400">{fbCamp.viewContent?.toLocaleString()}</td>}
                      {colunasAtivas.includes('initiateCheckout') && <td className="p-3 font-mono text-slate-400">{fbCamp.initiateCheckout?.toLocaleString()}</td>}
                      {colunasAtivas.includes('comprasMeta') && (
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-sky-400" />
                            <span className="font-bold text-sky-400">{fbCamp.comprasMeta || 0}</span>
                          </div>
                        </td>
                      )}
                      {colunasAtivas.includes('vincular') && (
                        <td className="p-3 bg-slate-900/50">
                          <select
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                            value={rifaVinculada?.id || ''}
                            onChange={(e) => {
                              const selectedRifaId = e.target.value;
                              if (selectedRifaId) {
                                handleVincularCampanha(selectedRifaId, fbCamp.id);
                              } else if (rifaVinculada) {
                                handleVincularCampanha(rifaVinculada.id, '');
                              }
                            }}
                          >
                            <option value="">-- Não Associada --</option>
                            {campanhas.map(c => (
                              <option key={c.id} value={c.id}>{c.titulo}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      {colunasAtivas.includes('receita') && (
                        <td className="p-3 font-mono text-emerald-400 font-bold">
                          R$ {faturamentoRifa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {colunasAtivas.includes('lucro') && (
                        <td className={`p-3 font-mono text-right font-black ${isPositive && faturamentoRifa > 0 ? 'text-emerald-400' : (faturamentoRifa > 0 ? 'text-rose-400' : 'text-slate-500')}`}>
                          R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {colunasAtivas.includes('roas') && (
                        <td className="p-3 text-right">
                          {roas > 0 ? (
                            <span className={`px-2 py-1 rounded-lg text-xs font-black ${roas >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {roas.toFixed(2)}x
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      )}
                      {colunasAtivas.includes('cpa') && (
                        <td className="p-3 text-right font-bold text-indigo-400 font-mono">
                          {cpa > 0 ? `R$ ${cpa.toFixed(2)}` : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPARATIVO POR CAMPANHA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Resumo de Faturamento das Rias ({campanhas.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Campanha</th>
                <th className="p-3">Valor Cota</th>
                <th className="p-3">Cotas Vendidas</th>
                <th className="p-3">Pedidos Pagos</th>
                <th className="p-3">Faturamento Real</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {campanhas.map(c => {
                const pedidosC = pedidos.filter(p => p.campanhaId === c.id && p.status === 'pago');
                const fatC = pedidosC.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
                const qtdCotasC = pedidosC.reduce((acc, p) => acc + (p.quantidade || 0), 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                        {c.bannerUrl ? (
                          <img src={c.bannerUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">R</div>
                        )}
                      </div>
                      <span className="truncate max-w-xs">{c.titulo}</span>
                    </td>
                    <td className="p-3 font-mono">R$ {Number(c.valorCota || 0).toFixed(2)}</td>
                    <td className="p-3 font-mono">{qtdCotasC} / {c.totalCotas}</td>
                    <td className="p-3 font-mono">{pedidosC.length}</td>
                    <td className="p-3 font-black text-emerald-400 font-mono">
                      R$ {fatC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'publicada'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
