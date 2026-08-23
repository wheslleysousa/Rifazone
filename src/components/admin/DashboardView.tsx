import React, { useState } from 'react';
import { 
  Plus, Eye, EyeOff, Trophy, Users, DollarSign, 
  Search, CheckCircle2, Circle, ArrowUpRight, TrendingUp,
  Calendar, Zap, Share2, Ticket, Sparkles, AlertCircle, X
} from 'lucide-react';
import { Campanha, Pedido } from '../../types';
import { formatarMoeda } from '../../lib/money';

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
  onSelectCampanha,
  onNavigateTab,
  onIrParaConfig,
  mpConectado,
  mpConfigurado
}) => {
  const isMpConectado = Boolean(mpConectado ?? mpConfigurado);
  const handleNav = (tab: any) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (tab === 'pagamento' || tab === 'configuracoes') {
      onIrParaConfig?.();
    }
  };
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | '30dias' | 'tudo'>('tudo');
  const [ocultarValores, setOcultarValores] = useState(false);
  
  // Buscar ganhador / consultar cota
  const [buscaCota, setBuscaCota] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<any | null>(null);
  const [buscandoCota, setBuscandoCota] = useState(false);

  // Filtragem de pedidos pelo período selecionado
  const now = new Date();
  const pedidosPagos = pedidos.filter(p => {
    if (p.status !== 'pago') return false;
    if (periodo === 'tudo') return true;

    const dataPedido = new Date(p.pagoEm || p.criadoEm);
    const diffMs = now.getTime() - dataPedido.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    if (periodo === 'hoje') {
      return dataPedido.toDateString() === now.toDateString();
    }
    if (periodo === '7dias') return diffDias <= 7;
    if (periodo === '30dias') return diffDias <= 30;
    return true;
  });

  // KPIs
  const campanhasAtivas = campanhas.filter(c => c.status === 'publicada').length;
  const totalCotasVendidas = pedidosPagos.reduce((acc, p) => acc + (p.quantidade || 0), 0);
  const faturamentoTotal = pedidosPagos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
  const totalCompradoresUnicos = new Set(pedidosPagos.map(p => p.comprador?.whatsapp || p.compradorId)).size;
  const ticketMedio = pedidosPagos.length > 0 ? faturamentoTotal / pedidosPagos.length : 0;

  // Ranking de compradores no período
  const compradoresMap: Record<string, { nome: string; whatsapp: string; cotas: number; total: number }> = {};
  pedidosPagos.forEach(p => {
    const key = p.comprador?.whatsapp || p.compradorId || 'anônimo';
    if (!compradoresMap[key]) {
      compradoresMap[key] = {
        nome: p.comprador?.nome || 'Comprador',
        whatsapp: p.comprador?.whatsapp || '',
        cotas: 0,
        total: 0
      };
    }
    compradoresMap[key].cotas += p.quantidade;
    compradoresMap[key].total += p.valorTotal;
  });

  const rankingCompradores = Object.values(compradoresMap)
    .sort((a, b) => b.cotas - a.cotas)
    .slice(0, 5);

  // Busca rápida de cota
  const handleBuscarCota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaCota.trim()) return;
    setBuscandoCota(true);
    setResultadoBusca(null);

    const termo = buscaCota.trim().toLowerCase();
    // Procura nos pedidos pagos
    const pedidoAchado = pedidos.find(p => 
      p.status === 'pago' && (
        p.numeros?.some(n => n.includes(termo)) ||
        p.comprador?.whatsapp?.includes(termo) ||
        p.comprador?.nome?.toLowerCase().includes(termo)
      )
    );

    setTimeout(() => {
      setBuscandoCota(false);
      if (pedidoAchado) {
        setResultadoBusca({
          encontrado: true,
          comprador: pedidoAchado.comprador,
          numeros: pedidoAchado.numeros,
          campanhaId: pedidoAchado.campanhaId,
          valorTotal: pedidoAchado.valorTotal,
          pagoEm: pedidoAchado.pagoEm || pedidoAchado.criadoEm
        });
      } else {
        setResultadoBusca({ encontrado: false });
      }
    }, 300);
  };

  // Checklist de Primeiros Passos
  const checklist = [
    {
      id: 1,
      titulo: 'Conectar Mercado Pago',
      desc: 'Receba os pagamentos Pix direto na sua conta bancária',
      concluido: isMpConectado,
      acao: () => handleNav('configuracoes'),
      botao: 'Configurar'
    },
    {
      id: 2,
      titulo: 'Criar sua primeira rifa',
      desc: 'Defina prêmios, quantidade de cotas e promoções com IA',
      concluido: campanhas.length > 0,
      acao: onNovaCampanha,
      botao: 'Criar Campanha'
    },
    {
      id: 3,
      titulo: 'Publicar e divulgar o link',
      desc: 'Compartilhe no WhatsApp, Instagram e grupos',
      concluido: campanhas.some(c => c.status === 'publicada'),
      acao: () => handleNav('campanhas'),
      botao: 'Ver Campanhas'
    },
    {
      id: 4,
      titulo: 'Primeira venda confirmada',
      desc: 'Receba seu primeiro Pix instantâneo',
      concluido: pedidos.some(p => p.status === 'pago'),
      acao: () => handleNav('pedidos'),
      botao: 'Ver Vendas'
    }
  ];

  const [guiaOcultoManual, setGuiaOcultoManual] = useState<boolean>(() => {
    return localStorage.getItem('rifazone_guia_primeiros_passos_oculto') === 'true';
  });

  const passosConcluidos = checklist.filter(c => c.concluido).length;
  const ocultarGuia = guiaOcultoManual || passosConcluidos === 4;

  const handleFecharGuia = () => {
    localStorage.setItem('rifazone_guia_primeiros_passos_oculto', 'true');
    setGuiaOcultoManual(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header com Filtro de Período e Botão Ocultar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Visão Geral do Negócio
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ao Vivo
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 hidden sm:inline-flex items-center gap-1">
              ☁️ Firebase Sincronizado
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Acompanhe suas vendas de cotas, faturamento Pix e progresso sincronizado em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Período */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
            {(['hoje', '7dias', '30dias', 'tudo'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodo === p
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'hoje' ? 'Hoje' : p === '7dias' ? '7 Dias' : p === '30dias' ? '30 Dias' : 'Tudo'}
              </button>
            ))}
          </div>

          {/* Ocultar/Mostrar Valores */}
          <button
            onClick={() => setOcultarValores(!ocultarValores)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title={ocultarValores ? 'Mostrar Valores' : 'Ocultar Valores'}
            aria-label="Alternar visibilidade de valores"
          >
            {ocultarValores ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Checklist "Primeiros Passos / Status do Sistema" */}
      {!ocultarGuia && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                passosConcluidos === 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {passosConcluidos === 4 ? '🏆' : '⚡'}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {passosConcluidos === 4 ? 'Status do Sistema: 100% Configurado e Operacional' : 'Guia de Primeiros Passos & Configurações'}
                </h3>
                <span className="text-xs text-slate-400">
                  {passosConcluidos === 4 
                    ? 'Todas as 4 etapas essenciais estão concluídas e salvas no banco de dados.'
                    : `Complete ${passosConcluidos} de 4 etapas para maximizar suas vendas (salvas no Firestore)`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                passosConcluidos === 4 
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' 
                  : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
              }`}>
                {Math.round((passosConcluidos / 4) * 100)}% concluído
              </span>
              <button
                type="button"
                onClick={handleFecharGuia}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition"
                title="Ocultar este guia da tela inicial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${(passosConcluidos / 4) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {checklist.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition ${
                  item.concluido
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-800/60 border-slate-700/70 text-white hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    {item.concluido ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    {item.titulo}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  {item.desc}
                </p>
                <button
                  onClick={item.acao}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    item.concluido
                      ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {item.concluido ? 'Visualizar' : item.botao}
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Faturamento Pix
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {ocultarValores ? '••••••' : formatarMoeda(faturamentoTotal)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{pedidosPagos.length} pedidos confirmados</span>
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
          <div className="text-xs text-slate-400 mt-2">
            No período selecionado
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
            {campanhasAtivas} / {campanhas.length}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {campanhas.length - campanhasAtivas} em rascunho ou encerradas
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
          <div className="text-xs text-slate-400 mt-2">
            {totalCompradoresUnicos} clientes distintos
          </div>
        </div>
      </div>

      {/* Grid: Buscar Ganhador Rápido & Top Compradores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Buscar Ganhador Instantâneo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Buscar Ganhador / Cota
              </h3>
              <p className="text-xs text-slate-400">
                Consulte qualquer número de cota, telefone ou nome para conferir o comprador.
              </p>
            </div>
          </div>

          <form onSubmit={handleBuscarCota} className="space-y-3 mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Digite o número da cota (ex: 0421) ou telefone..."
                value={buscaCota}
                onChange={e => setBuscaCota(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={buscandoCota}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                {buscandoCota ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          </form>

          {/* Resultado da busca */}
          {resultadoBusca && (
            <div className="animate-in fade-in duration-200">
              {resultadoBusca.encontrado ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {resultadoBusca.comprador?.nome || 'Comprador Registrado'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                      Cota Paga ✓
                    </span>
                  </div>
                  <div className="text-slate-300">
                    <strong>WhatsApp:</strong> {resultadoBusca.comprador?.whatsapp}
                  </div>
                  <div className="text-slate-300">
                    <strong>Data da Compra:</strong> {new Date(resultadoBusca.pagoEm).toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400 block mb-1">Cotas deste pedido ({resultadoBusca.numeros?.length}):</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {resultadoBusca.numeros?.map((n: string) => (
                        <span key={n} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-[11px] rounded">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                  <AlertCircle className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                  Nenhum comprador pago encontrado com esse número de cota ou termo.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ranking de Maiores Compradores */}
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
              Nenhuma venda registrada no período selecionado.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
