import React, { useState, useMemo } from 'react';
import { 
  Eye, EyeOff, Trophy, Users, DollarSign, 
  CheckCircle2, Circle, ArrowUpRight, TrendingUp,
  Zap, Ticket, X, ChevronDown, Calendar as CalendarIcon,
  CreditCard, Barcode, ArrowLeftRight
} from 'lucide-react';
import { Campanha, Pedido } from '../../types';
import { formatarMoeda, extrairValorReaisPedido } from '../../lib/money';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campanhas: any[];
  pedidos: Pedido[];
  onNovaCampanha: () => void;
  onSelectCampanha: (codigo: string) => void;
  onNavigateTab?: (tab: any) => void;
  onIrParaConfig?: () => void;
  mpConectado?: boolean;
  mpConfigurado?: boolean;
}

export const DashboardView: React.FC<Props> = ({
  campanhas,
  pedidos,
  onNovaCampanha,
  onNavigateTab,
  onIrParaConfig,
  mpConectado,
  mpConfigurado
}) => {
  const isMpConectado = Boolean(mpConectado ?? mpConfigurado);

  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | '30dias' | 'tudo' | 'personalizado'>('tudo');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [periodoDropdownOpen, setPeriodoDropdownOpen] = useState(false);

  const [campanhaSelecionada, setCampanhaSelecionada] = useState<string>('todas');
  const [campanhaDropdownOpen, setCampanhaDropdownOpen] = useState(false);

  const [ocultarValores, setOcultarValores] = useState(false);

  // Filtrar Pedidos
  const now = new Date();
  
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      // Filtro por Campanha
      if (campanhaSelecionada !== 'todas' && p.campanhaId !== campanhaSelecionada) {
        return false;
      }

      // Filtro por Data (usa criadoEm para métricas de conversão e pagoEm para faturamento, mas simplificaremos usando a data mais relevante)
      const dataBase = p.pagoEm ? new Date(p.pagoEm) : new Date(p.criadoEm);
      const diffMs = now.getTime() - dataBase.getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);

      if (periodo === 'hoje') {
        return dataBase.toDateString() === now.toDateString();
      }
      if (periodo === '7dias') return diffDias <= 7;
      if (periodo === '30dias') return diffDias <= 30;
      if (periodo === 'personalizado' && dataInicio && dataFim) {
        return isAfter(dataBase, startOfDay(parseISO(dataInicio))) && isBefore(dataBase, endOfDay(parseISO(dataFim)));
      }
      
      return true;
    });
  }, [pedidos, periodo, dataInicio, dataFim, campanhaSelecionada]);

  const pedidosPagos = pedidosFiltrados.filter(p => p.status === 'pago');

  // KPIs Básicos
  const campanhasAtivasUser = campanhas.filter(c => c.status === 'publicada');
  const campanhasAtivas = campanhaSelecionada === 'todas' 
    ? campanhasAtivasUser.length 
    : (campanhasAtivasUser.find(c => c.id === campanhaSelecionada) ? 1 : 0);
  
  const totalCotasVendidas = pedidosPagos.reduce((acc, p) => acc + (p.quantidade || 0), 0);
  const faturamentoTotal = Number(pedidosPagos.reduce((acc, p) => acc + extrairValorReaisPedido(p), 0).toFixed(2));
  const totalCompradoresUnicos = new Set(pedidosPagos.map(p => p.comprador?.whatsapp || p.compradorId)).size;
  const ticketMedio = pedidosPagos.length > 0 ? faturamentoTotal / pedidosPagos.length : 0;

  // Novas Métricas de Pagamento
  const pedidosCartao = pedidosFiltrados.filter(p => p.metodoPagamento === 'cartao');
  const taxaAprovacaoCartao = pedidosCartao.length > 0 
    ? (pedidosCartao.filter(p => p.status === 'pago').length / pedidosCartao.length) * 100 
    : 0;

  const pedidosBoleto = pedidosFiltrados.filter(p => p.metodoPagamento === 'boleto');
  const boletosGerados = pedidosBoleto.length;
  const taxaAprovacaoBoleto = boletosGerados > 0 
    ? (pedidosBoleto.filter(p => p.status === 'pago').length / boletosGerados) * 100 
    : 0;

  const pedidosPix = pedidosFiltrados.filter(p => p.metodoPagamento === 'pix' || !p.metodoPagamento); // Assumimos PIX como default
  const taxaFinalizacaoPix = pedidosPix.length > 0 
    ? (pedidosPix.filter(p => p.status === 'pago').length / pedidosPix.length) * 100 
    : 0;

  // Gráfico de Vendas
  const chartData = useMemo(() => {
    const dataMap: Record<string, { date: string; vendas: number; valor: number }> = {};
    
    // Preparar últimos dias baseados no período se for tudo/hoje/etc
    let daysToGenerate = 7;
    if (periodo === '30dias') daysToGenerate = 30;
    if (periodo === 'hoje') daysToGenerate = 1;
    if (periodo === 'tudo') daysToGenerate = 30; // Limite visual
    
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      dataMap[key] = { date: format(d, 'dd/MM'), vendas: 0, valor: 0 };
    }

    if (periodo === 'personalizado' && dataInicio && dataFim) {
      // limpa e usa as datas certas
    }

    pedidosPagos.forEach(p => {
      const d = p.pagoEm ? new Date(p.pagoEm) : new Date(p.criadoEm);
      const key = format(d, 'yyyy-MM-dd');
      const valReais = extrairValorReaisPedido(p);
      if (dataMap[key]) {
        dataMap[key].vendas += p.quantidade || 0;
        dataMap[key].valor += valReais;
      } else {
        dataMap[key] = { date: format(d, 'dd/MM'), vendas: p.quantidade || 0, valor: valReais };
      }
    });

    return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date)); // simplified sort
  }, [pedidosPagos, periodo]);

  // Ranking de compradores no período
  const compradoresMap: Record<string, { nome: string; whatsapp: string; cotas: number; total: number }> = {};
  pedidosPagos.forEach(p => {
    const key = p.comprador?.whatsapp || p.compradorId || 'anônimo';
    const valReais = extrairValorReaisPedido(p);
    if (!compradoresMap[key]) {
      compradoresMap[key] = {
        nome: p.comprador?.nome || 'Comprador',
        whatsapp: p.comprador?.whatsapp || '',
        cotas: 0,
        total: 0
      };
    }
    compradoresMap[key].cotas += p.quantidade;
    compradoresMap[key].total += valReais;
  });

  const rankingCompradores = Object.values(compradoresMap)
    .sort((a, b) => b.cotas - a.cotas)
    .slice(0, 5);

  const formatPeriodoLabel = () => {
    switch(periodo) {
      case 'hoje': return 'Hoje';
      case '7dias': return 'Últimos 7 dias';
      case '30dias': return 'Últimos 30 dias';
      case 'tudo': return 'Tudo';
      case 'personalizado': return 'Personalizado';
    }
  };

  const campanhaSelecionadaLabel = campanhaSelecionada === 'todas' 
    ? 'Todas as Campanhas' 
    : campanhas.find(c => c.id === campanhaSelecionada)?.nome || 'Desconhecida';

  return (
    <div className="space-y-6">
      
      {/* Header - Dashboard e Botões alinhados na mesma linha */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h1 className="text-xl sm:text-2xl font-black text-white">Dashboard</h1>
        
        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
          
          {/* 1) Botão Tempo Todo (Período) */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={() => setPeriodoDropdownOpen(!periodoDropdownOpen)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white hover:bg-slate-700 transition"
            >
              <div className="flex items-center gap-1 min-w-0">
                <CalendarIcon className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">{periodo === 'tudo' ? 'Tempo todo' : formatPeriodoLabel()}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {periodoDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {(['hoje', '7dias', '30dias', 'tudo', 'personalizado'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { setPeriodo(p); if (p !== 'personalizado') setPeriodoDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-700 transition ${p !== 'hoje' ? 'border-t border-slate-700/50' : ''} ${periodo === p ? 'text-blue-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                  >
                    {p === 'hoje' ? 'Hoje' : p === '7dias' ? '7 Dias' : p === '30dias' ? '30 Dias' : p === 'tudo' ? 'Tempo todo' : 'Personalizado'}
                  </button>
                ))}
                
                {periodo === 'personalizado' && (
                  <div className="p-3 border-t border-slate-700/50 bg-slate-900 flex flex-col gap-2">
                    <input 
                      type="date" 
                      value={dataInicio}
                      onChange={e => setDataInicio(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <input 
                      type="date" 
                      value={dataFim}
                      onChange={e => setDataFim(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <button 
                      onClick={() => setPeriodoDropdownOpen(false)}
                      className="w-full bg-blue-500 text-white rounded py-1 text-xs font-bold mt-1"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2) Botão Todas as Campanhas */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={() => setCampanhaDropdownOpen(!campanhaDropdownOpen)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white hover:bg-slate-700 transition shadow font-bold"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Ticket className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{campanhaSelecionada === 'todas' ? 'Todas' : campanhaSelecionadaLabel}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
            
            {campanhaDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { setCampanhaSelecionada('todas'); setCampanhaDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-700 transition ${campanhaSelecionada === 'todas' ? 'text-emerald-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                >
                  Todas as campanhas
                </button>
                {campanhas.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCampanhaSelecionada(c.id); setCampanhaDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-700 transition border-t border-slate-700/50 truncate ${campanhaSelecionada === c.id ? 'text-emerald-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3) Botão Valores (Apenas ícone de olho em quadrado) */}
          <button
            onClick={() => setOcultarValores(!ocultarValores)}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center justify-center w-8 h-8 shrink-0"
            title={ocultarValores ? 'Mostrar Valores' : 'Ocultar Valores'}
          >
            {ocultarValores ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total (Faturamento) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valor total
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {ocultarValores ? '••••••' : formatarMoeda(faturamentoTotal)}
          </div>
        </div>

        {/* Cotas Vendidas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cotas Vendidas
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalCotasVendidas.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Campanhas Ativas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Campanhas Ativas
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {campanhasAtivas}
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {ocultarValores ? '••••••' : formatarMoeda(ticketMedio)}
          </div>
        </div>
      </div>

      {/* Gráfico de Desempenho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-black text-white flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Desempenho de Vendas
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                formatter={(value: any, name: string) => [
                  name === 'valor' ? formatarMoeda(value) : value, 
                  name === 'valor' ? 'Valor' : 'Cotas'
                ]}
              />
              <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Novas Métricas Secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Aprovação Cartão */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aprovação Cartão
            </span>
            <CreditCard className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-white">
            {taxaAprovacaoCartao.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {pedidosCartao.length} transações
          </div>
        </div>

        {/* Chargeback */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chargeback
            </span>
            <ArrowLeftRight className="w-4 h-4 text-red-500/50" />
          </div>
          <div className="text-xl font-black text-white">
            0.0%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Contestações
          </div>
        </div>

        {/* Aprovação Boleto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aprovação Boleto
            </span>
            <Barcode className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-white">
            {taxaAprovacaoBoleto.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {boletosGerados} boletos gerados
          </div>
        </div>

        {/* Finalização Pix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Finalização Pix
            </span>
            <div className="w-4 h-4 text-emerald-500 flex items-center justify-center font-black rounded-full border border-emerald-500/30">
              $
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {taxaFinalizacaoPix.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pagamentos concluídos
          </div>
        </div>

        {/* Taxa de Reembolso (Ocupando espaço se quiser) */}
        {/* Pode adicionar ou substituir */}
      </div>

      {/* Ranking Top 5 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Top 5 Maiores Compradores
            </h3>
            <p className="text-xs text-slate-400">
              Seus clientes mais fiéis no período selecionado.
            </p>
          </div>
        </div>
        {rankingCompradores.length > 0 ? (
          <div className="space-y-2.5">
            {rankingCompradores.map((comp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' :
                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                    idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}º
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">
                      {comp.nome}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {comp.whatsapp || 'WhatsApp não informado'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-sm block font-mono">
                    {comp.cotas} cotas
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {ocultarValores ? '••••••' : formatarMoeda(comp.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhuma venda registrada.
          </div>
        )}
      </div>

    </div>
  );
};
