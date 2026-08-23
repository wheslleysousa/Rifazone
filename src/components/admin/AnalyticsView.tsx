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
  ArrowUpRight
} from 'lucide-react';

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
      impressions: number;
      comprasMeta: number;
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

  // Form de configuração do Meta Ads
  const [mostrarModalConfig, setMostrarModalConfig] = useState(false);
  const [metaAccessTokenInput, setMetaAccessTokenInput] = useState('');
  const [metaAdAccountIdInput, setMetaAdAccountIdInput] = useState('');
  const [metaPixelIdInput, setMetaPixelIdInput] = useState('');
  const [metaCapiTokenInput, setMetaCapiTokenInput] = useState('');
  const [salvandoMetaConfig, setSalvandoMetaConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configErrorMsg, setConfigErrorMsg] = useState('');

  // Carregar dados de configuracoes atuais para preencher os inputs mascarados
  const carregarMetaConfig = async () => {
    try {
      const res = await authFetch('/api/admin/configuracoes');
      if (res.ok) {
        const json = await res.json();
        setMetaAdAccountIdInput(json.metaAdAccountId || '');
        setMetaPixelIdInput(json.metaPixelId || '');
        if (json.metaTokenMascara) {
          setMetaAccessTokenInput(json.metaTokenMascara);
        }
        if (json.metaCapiTokenMascara) {
          setMetaCapiTokenInput(json.metaCapiTokenMascara);
        }
      }
    } catch (e) {}
  };

  const buscarInsights = async () => {
    setCarregandoInsights(true);
    setErroInsights(null);
    try {
      const url = campanhaIdSelecionada && campanhaIdSelecionada !== 'todas'
        ? `/api/admin/meta/insights?campanhaId=${campanhaIdSelecionada}`
        : '/api/admin/meta/insights';

      const res = await authFetch(url);
      const json = await res.json();

      if (!res.ok) {
        setErroInsights(json.error || 'Não foi possível carregar os dados de anúncios.');
        setInsightsData(null);
      } else {
        setInsightsData(json);
      }
    } catch (err: any) {
      setErroInsights('Erro de conexão ao buscar insights do Meta Ads.');
      setInsightsData(null);
    } finally {
      setCarregandoInsights(false);
    }
  };

  useEffect(() => {
    carregarMetaConfig();
    buscarInsights();
  }, [campanhaIdSelecionada]);

  const handleSalvarMetaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoMetaConfig(true);
    setConfigSuccessMsg('');
    setConfigErrorMsg('');

    try {
      const res = await authFetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaAccessToken: metaAccessTokenInput.includes('••••') ? undefined : metaAccessTokenInput,
          metaCapiToken: metaCapiTokenInput.includes('••••') ? undefined : metaCapiTokenInput,
          metaAdAccountId: metaAdAccountIdInput.trim(),
          metaPixelId: metaPixelIdInput.trim()
        })
      });

      const json = await res.json();
      if (res.ok) {
        setConfigSuccessMsg('Configurações do Meta Ads e Conversions API salvas com sucesso!');
        setTimeout(() => {
          setMostrarModalConfig(false);
          setConfigSuccessMsg('');
          buscarInsights();
        }, 1200);
      } else {
        setConfigErrorMsg(json.error || 'Erro ao salvar credenciais do Meta.');
      }
    } catch (err: any) {
      setConfigErrorMsg('Falha ao salvar configurações.');
    } finally {
      setSalvandoMetaConfig(false);
    }
  };

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
            Analytics & Meta Ads
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl">
            Cruze em tempo real o gasto em anúncios do Facebook/Instagram com o faturamento real do RifaZone e meça o ROAS verdadeiro das suas campanhas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => { setMostrarModalConfig(true); setConfigErrorMsg(''); setConfigSuccessMsg(''); }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            Configurar Meta Ads / Pixel
          </button>
          
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

      {/* AVISO DE CONFIGURAÇÃO SE NÃO TIVER CONECTADO */}
      {erroInsights && (
        <div className="p-6 rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900 text-slate-200 space-y-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Conecte sua Conta de Anúncios da Meta</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Para visualizar o gasto exato do Gerenciador de Anúncios e calcular o ROAS automaticamente, forneça seu <strong>Token da Marketing API</strong> e seu <strong>ID da Conta de Anúncios (act_...)</strong>.
              </p>
              <p className="text-[11px] text-amber-400/90 mt-2 font-mono">
                ⚠️ {erroInsights}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => { setMostrarModalConfig(true); setConfigErrorMsg(''); }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
            >
              <Zap className="w-4 h-4" />
              Conectar Meta Ads Agora
            </button>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              Tutorial do Meta Developers
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
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
              <span className="text-[10px] text-slate-500 font-bold block">Cliques no Anúncio</span>
              <span className="text-sm font-black text-slate-200">{insightsData.meta.clicks.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 font-bold block">CPC Médio</span>
              <span className="text-sm font-black text-slate-200">R$ {insightsData.meta.cpc.toFixed(2)}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-bold block">Compras Pixel/CAPI</span>
              <span className="text-sm font-black text-emerald-400">{insightsData.meta.comprasMeta}</span>
            </div>
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

      {/* MODAL DE CONFIGURAÇÃO DE META ADS & CONVERSIONS API */}
      {mostrarModalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 my-8 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Conexão Meta Ads & Conversions API</h3>
                  <p className="text-[11px] text-slate-400">Credenciais para rastreamento server-side e sincronização do Gerenciador de Anúncios.</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalConfig(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {configSuccessMsg}
              </div>
            )}

            {configErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                {configErrorMsg}
              </div>
            )}

            <form onSubmit={handleSalvarMetaConfig} className="space-y-4 text-xs">
              {/* 1. PIXEL ID */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">
                  1. ID do Meta Pixel (Injetado nas Páginas Públicas)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1234567890"
                  value={metaPixelIdInput}
                  onChange={e => setMetaPixelIdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  ID numérico que aparece em Meta Events Manager / Configurações do Pixel.
                </span>
              </div>

              {/* 2. CAPI TOKEN */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">
                  2. Token de Acesso CAPI (Conversions API - Server-Side)
                </label>
                <input
                  type="password"
                  placeholder="Ex: EAAG..."
                  value={metaCapiTokenInput}
                  onChange={e => setMetaCapiTokenInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  Gerado em Gerenciador de Eventos → Configurações → API de Conversões → "Gerar Token de Acesso".
                </span>
              </div>

              {/* 3. MARKETING API ACCESS TOKEN */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">
                  3. Token da Marketing API (Para Consultar Gastos em Anúncios)
                </label>
                <input
                  type="password"
                  placeholder="Ex: EAAG..."
                  value={metaAccessTokenInput}
                  onChange={e => setMetaAccessTokenInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  Token do usuário de sistema ou aplicativo Meta Developers com permissão <code className="text-sky-400">ads_read</code>.
                </span>
              </div>

              {/* 4. AD ACCOUNT ID */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">
                  4. ID da Conta de Anúncios Meta (Ad Account ID)
                </label>
                <input
                  type="text"
                  placeholder="Ex: act_1234567890 ou 1234567890"
                  value={metaAdAccountIdInput}
                  onChange={e => setMetaAdAccountIdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  Encontrado no URL do Gerenciador de Anúncios (ex: act_1020304050).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalConfig(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoMetaConfig}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {salvandoMetaConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {salvandoMetaConfig ? 'Salvando...' : 'Salvar Credenciais Criptografadas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
