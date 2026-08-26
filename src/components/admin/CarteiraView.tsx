import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
  AlertCircle, DollarSign, RefreshCw, Send, 
  Calendar, Building2, User, HelpCircle, ChevronRight, Download,
  TrendingUp, MessageSquare, AlertTriangle, X, Zap
} from 'lucide-react';
import { CarteiraSaldo, SolicitacaoSaque, TransacaoCarteira } from '../../types';
import { extrairValorReaisPedido } from '../../lib/money';

interface CarteiraViewProps {
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

export const CarteiraView: React.FC<CarteiraViewProps> = ({ authFetch }) => {
  const [saldo, setSaldo] = useState<CarteiraSaldo>({
    saldoTotal: 0,
    saldoDisponivel: 0,
    saldoPendente: 0,
    totalVendido: 0,
    totalTaxasPagas: 0,
    totalSacado: 0
  });
  const [transacoes, setTransacoes] = useState<TransacaoCarteira[]>([]);
  const [saques, setSaques] = useState<SolicitacaoSaque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalSaqueAberto, setModalSaqueAberto] = useState(false);

  // Navegação Interna
  const [abaCarteira, setAbaCarteira] = useState<'visao_geral' | 'transacoes' | 'saques' | 'perfil' | 'ajuda'>('visao_geral');

  // Redução de taxas
  const [carteiraConfig, setCarteiraConfig] = useState<any>(null);
  const [taxaVendaDesejada, setTaxaVendaDesejada] = useState('3.0');
  const [taxaSaqueDesejada, setTaxaSaqueDesejada] = useState('0.00');
  const [mensagemReducao, setMensagemReducao] = useState('');
  const [enviandoReducao, setEnviandoReducao] = useState(false);
  const [reducaoMsg, setReducaoMsg] = useState('');
  const [reducaoErro, setReducaoErro] = useState('');

  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Formulário de Saque
  const [valorSaque, setValorSaque] = useState('');
  const [modalidade, setModalidade] = useState<'imediato' | 'd_mais_um'>('imediato');
  const [tipoDestino, setTipoDestino] = useState<'pix' | 'banco'>('pix');
  const [tipoChavePix, setTipoChavePix] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [chavePix, setChavePix] = useState('');
  const [bancoNome, setBancoNome] = useState('');
  const [bancoAgencia, setBancoAgencia] = useState('');
  const [bancoConta, setBancoConta] = useState('');
  const [bancoDigito, setBancoDigito] = useState('');
  const [bancoTitular, setBancoTitular] = useState('');
  const [bancoDocumento, setBancoDocumento] = useState('');
  
  const [solicitando, setSolicitando] = useState(false);
  const [saqueMsg, setSaqueMsg] = useState('');
  const [saqueErro, setSaqueErro] = useState('');
  
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'venda' | 'saque'>('todos');

  const taxaSaqueImediato = carteiraConfig?.taxaSaqueImediato !== undefined 
    ? Number(carteiraConfig.taxaSaqueImediato) 
    : 4.50;

  const [ultimaContagem, setUltimaContagem] = useState<string>('');

  const carregarDados = async (forcarRecalculo = false) => {
    setCarregando(true);
    try {
      const urlSaldo = forcarRecalculo ? '/api/admin/carteira/saldo?recalcular=true' : '/api/admin/carteira/saldo';
      const [resSaldo, resTrans, resSaques, resConfig] = await Promise.all([
        authFetch(urlSaldo).catch(() => null),
        authFetch('/api/admin/carteira/transacoes').catch(() => null),
        authFetch('/api/admin/carteira/saques').catch(() => null),
        authFetch('/api/admin/configuracoes').catch(() => null)
      ]);

      if (resSaldo && resSaldo.ok) {
        const dataSaldo = await resSaldo.json();
        if (dataSaldo && typeof dataSaldo === 'object' && !dataSaldo.error) {
          setSaldo({
            saldoTotal: Number(dataSaldo.saldoTotal || 0),
            saldoDisponivel: Number(dataSaldo.saldoDisponivel || 0),
            saldoPendente: Number(dataSaldo.saldoPendente || 0),
            totalVendido: Number(dataSaldo.totalVendido || dataSaldo.totalArrecadado || 0),
            totalTaxasPagas: Number(dataSaldo.totalTaxasPagas || dataSaldo.totalTaxas || 0),
            totalSacado: Number(dataSaldo.totalSacado || 0),
            atualizadoEm: dataSaldo.atualizadoEm || dataSaldo.ultimaContagemEm
          });
          if (dataSaldo.atualizadoEm || dataSaldo.ultimaContagemEm) {
            setUltimaContagem(dataSaldo.atualizadoEm || dataSaldo.ultimaContagemEm);
          }
        }
      }

      if (resTrans && resTrans.ok) {
        const dataTrans = await resTrans.json();
        if (Array.isArray(dataTrans)) {
          setTransacoes(dataTrans);
        }
      }

      if (resSaques && resSaques.ok) {
        const dataSaques = await resSaques.json();
        if (Array.isArray(dataSaques)) {
          setSaques(dataSaques);
        }
      }

      if (resConfig && resConfig.ok) {
        const dataConfig = await resConfig.json();
        if (dataConfig?.userEmail) {
          setUserEmail(dataConfig.userEmail);
        }
        if (dataConfig?.isAdmin !== undefined) {
          setIsAdmin(!!dataConfig.isAdmin);
        }
        if (dataConfig?.carteiraConfig) {
          setCarteiraConfig(dataConfig.carteiraConfig);
          if (dataConfig.carteiraConfig.chavePix) {
            setChavePix(dataConfig.carteiraConfig.chavePix);
            if (dataConfig.carteiraConfig.tipoChavePix) {
              setTipoChavePix(dataConfig.carteiraConfig.tipoChavePix);
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados da carteira:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleSolicitarReducao = async (e: React.FormEvent) => {
    e.preventDefault();
    setReducaoErro('');
    setReducaoMsg('');
    setEnviandoReducao(true);
    
    try {
      const res = await authFetch('/api/carteira/solicitar-reducao-taxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxaVendaDesejada: parseFloat(taxaVendaDesejada) || 0,
          taxaSaqueDesejada: parseFloat(taxaSaqueDesejada) || 0,
          mensagem: mensagemReducao.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReducaoMsg('Solicitação enviada com sucesso! O administrador analisará suas vendas e responderá em breve.');
        await carregarDados();
      } else {
        setReducaoErro(data.error || 'Erro ao enviar solicitação.');
      }
    } catch (err: any) {
      setReducaoErro('Erro de conexão ao enviar solicitação.');
    } finally {
      setEnviandoReducao(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const valorNum = parseFloat(valorSaque.replace(',', '.')) || 0;
  const taxaSaqueProgramado = carteiraConfig?.taxaSaqueProgramado !== undefined ? Number(carteiraConfig.taxaSaqueProgramado) : 0;
  const taxaAplicada = modalidade === 'imediato' ? taxaSaqueImediato : taxaSaqueProgramado;
  const valorLiquidoReceber = Math.max(0, valorNum - taxaAplicada);

  const handleSolicitarSaque = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaqueErro('');
    setSaqueMsg('');

    if (valorNum <= 0) {
      setSaqueErro('Informe um valor de saque válido.');
      return;
    }
    if (valorNum > saldo.saldoDisponivel) {
      setSaqueErro(`Saldo insuficiente. Seu saldo disponível é de R$ ${saldo.saldoDisponivel.toFixed(2).replace('.', ',')}.`);
      return;
    }
    
    if (modalidade === 'imediato' && valorNum <= taxaSaqueImediato) {
      setSaqueErro(`Para saque imediato, o valor mínimo deve ser maior que a taxa de transferência (R$ ${taxaSaqueImediato.toFixed(2)}).`);
      return;
    }

    if (tipoDestino === 'pix' && !chavePix.trim()) {
      setSaqueErro('Informe a sua Chave Pix.');
      return;
    }

    if (tipoDestino === 'banco' && (!bancoNome || !bancoAgencia || !bancoConta)) {
      setSaqueErro('Preencha os dados bancários completos.');
      return;
    }

    setSolicitando(true);
    try {
      const payload: any = {
        valorSolicitado: valorNum,
        modalidade,
        tipoChavePix: tipoDestino === 'pix' ? tipoChavePix : 'cpf',
        chavePix: tipoDestino === 'pix' ? chavePix.trim() : chavePix.trim() || 'Via Conta Bancária',
      };

      if (tipoDestino === 'banco') {
        payload.bancoInfo = {
          banco: bancoNome,
          agencia: bancoAgencia,
          conta: bancoConta,
          digito: bancoDigito,
          tipoConta: 'corrente',
          titular: bancoTitular,
          documento: bancoDocumento
        };
      }

      const res = await authFetch('/api/admin/carteira/solicitar-saque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar saque.');
      }
      
      setSaqueMsg(`Solicitação de saque de R$ ${valorNum.toFixed(2).replace('.', ',')} realizada com sucesso!`);
      setValorSaque('');
      setModalSaqueAberto(false);
      await carregarDados();
      
      setAbaCarteira('saques'); // Leva para aba de saques
    } catch (err: any) {
      setSaqueErro(err.message || 'Falha ao solicitar saque.');
    } finally {
      setSolicitando(false);
    }
  };

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtroTipo === 'todos') return true;
    return t.tipo === filtroTipo;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Wallet className="w-5 h-5" />
          </div>
          Carteira do Sistema
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Receba suas vendas, solicite saques e acompanhe seu extrato.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setAbaCarteira('visao_geral')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaCarteira === 'visao_geral' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setAbaCarteira('transacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaCarteira === 'transacoes' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          Transações
        </button>
        <button
          onClick={() => setAbaCarteira('saques')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaCarteira === 'saques' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          Meus Saques
        </button>
        <button
          onClick={() => setAbaCarteira('perfil')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${abaCarteira === 'perfil' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <User className="w-4 h-4" />
          Perfil
        </button>
        <button
          onClick={() => setAbaCarteira('ajuda')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${abaCarteira === 'ajuda' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <HelpCircle className="w-4 h-4" />
          Suporte
        </button>
        
        <div className="flex-1"></div>
        
        {ultimaContagem && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Última contagem: <strong className="text-slate-300">{new Date(ultimaContagem).toLocaleDateString('pt-BR')} às {new Date(ultimaContagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
        )}

        <button
          onClick={() => carregarDados(true)}
          disabled={carregando}
          className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
          title="Recalcular e sincronizar saldo em tempo real com a API"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">Recalcular Saldo</span>
        </button>
      </div>

      {saqueMsg && (
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{saqueMsg}</p>
        </div>
      )}

      {/* -------------------- ABA 1: VISÃO GERAL -------------------- */}
      {abaCarteira === 'visao_geral' && (() => {
        const totalVendidoVal = Number(saldo?.totalVendido ?? 0);
        const saldoDisponivelVal = Number(saldo?.saldoDisponivel ?? 0);
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              {/* Total Arrecadado (Topo) */}
              <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Arrecadado</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  R$ {totalVendidoVal.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-slate-400 mt-2">Volume bruto total em vendas</p>
              </div>

              {/* Saldo Disponível (Com botões Enviar Pix e Solicitar Saque) */}
              <div className="md:col-span-2 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-32 h-32 text-emerald-400" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Saldo Disponível</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Liberado p/ Saque
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    R$ {saldoDisponivelVal.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      setTipoDestino('pix');
                      setSaqueMsg('');
                      setSaqueErro('');
                      setModalSaqueAberto(true);
                    }}
                    disabled={saldoDisponivelVal <= 0}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Pix
                  </button>
                  <button
                    onClick={() => {
                      setSaqueMsg('');
                      setSaqueErro('');
                      setModalSaqueAberto(true);
                    }}
                    disabled={saldoDisponivelVal <= 0}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Solicitar Saque
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* -------------------- ABA 2: TRANSAÇÕES -------------------- */}
      {abaCarteira === 'transacoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Transações
            </h3>
            
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${filtroTipo === 'todos' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroTipo('venda')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${filtroTipo === 'venda' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-emerald-300'}`}
              >
                Vendas
              </button>
              <button
                onClick={() => setFiltroTipo('saque')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${filtroTipo === 'saque' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-purple-300'}`}
              >
                Saques
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="p-3 font-bold">Movimentação</th>
                  <th className="p-3 font-bold">Valor</th>
                  <th className="p-3 font-bold">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 text-xs font-medium border border-dashed border-slate-800 rounded-2xl">
                      Nenhuma transação encontrada neste filtro.
                    </td>
                  </tr>
                ) : (
                  transacoesFiltradas.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            t.tipo === 'venda' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {t.tipo === 'venda' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{t.tipo === 'venda' ? 'Venda de Cota' : 'Saque Solicitado'}</p>
                            <p className="text-[10px] text-slate-500">{t.descricao}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`p-3 font-black text-sm ${t.tipo === 'venda' ? 'text-emerald-400' : 'text-purple-400'}`}>
                        {t.tipo === 'venda' ? '+' : '-'} R$ {Number(t.tipo === 'venda' ? (t?.valorLiquido ?? t?.valorBruto ?? 0) : (t?.valorSolicitado ?? t?.valorLiquido ?? 0)).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] font-sans">
                        {new Date(t.criadoEm).toLocaleDateString('pt-BR')} às {new Date(t.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- ABA 3: MEUS SAQUES -------------------- */}
      {abaCarteira === 'saques' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                Histórico de Saques
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Acompanhe o status e histórico de transferências solicitadas
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">({saques.length} solicitações)</span>
          </div>

          <div className="space-y-3">
            {(!Array.isArray(saques) || saques.length === 0) ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                Nenhum saque solicitado ainda.
              </div>
            ) : (
              saques.map(s => (
                <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="font-black text-white text-sm">
                      Valor Solicitado: R$ {(s?.valorSolicitado ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      s.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' :
                      s.status === 'rejeitado' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {s.status === 'pago' ? 'Saque Concluído' : s.status === 'rejeitado' ? 'Cancelado' : 'Em Processamento'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Valor Líquido:</span>
                        <span className="text-emerald-400 font-bold">R$ {(s?.valorLiquido ?? 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between truncate">
                        <span className="text-slate-500">Destino:</span>
                        <span className="text-slate-300">{s.chavePix || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span className="text-slate-500">Modalidade:</span>
                        <span>{s.modalidade === 'imediato' ? 'Imediato (Pix)' : 'Programado (D+1)'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span className="text-slate-500">Solicitado em:</span>
                        <span>{new Date(s.criadoEm).toLocaleDateString('pt-BR')} às {new Date(s.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -------------------- ABA 4: PERFIL DA CARTEIRA -------------------- */}
      {abaCarteira === 'perfil' && carteiraConfig && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Dados Cadastrados na Carteira</h3>
              <p className="text-[11px] text-slate-400">Informações de recebimento e identificação fiscal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Nome do Titular</span>
              <p className="text-white font-black text-sm">{carteiraConfig.nome || '-'}</p>
            </div>
            
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Documento (CPF/CNPJ)</span>
              <p className="text-white font-black text-sm font-mono">{carteiraConfig.documento || '-'}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">E-mail Cadastrado</span>
              <p className="text-white font-black text-sm">{carteiraConfig.email || '-'}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Celular / WhatsApp</span>
              <p className="text-white font-black text-sm font-mono">{carteiraConfig.telefone || '-'}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Chave Pix de Recebimento</span>
              <p className="text-emerald-400 font-black text-sm font-mono">{carteiraConfig.chavePix || '-'} ({String(carteiraConfig.tipoChavePix || '').toUpperCase()})</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Data de Nascimento</span>
              <p className="text-white font-black text-sm font-mono">
                {carteiraConfig.dataNascimento 
                  ? new Date(carteiraConfig.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') 
                  : '-'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Para alterar os dados de repasse ou chave Pix, entre em contato com o suporte do sistema por questões de segurança.
            </p>
          </div>
        </div>
      )}

      {/* -------------------- ABA 5: SUPORTE -------------------- */}
      {abaCarteira === 'ajuda' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Central de Suporte & Atendimento</h3>
              <p className="text-xs text-slate-400">Selecione o assunto desejado para gerar a mensagem ou solicitar suporte</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">Opções Rápidas de Atendimento</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: 'taxas',
                  titulo: 'Redução de Taxas',
                  desc: 'Negociar taxas por volume de vendas',
                  msg: 'Olá! Gostaria de negociar a redução das minhas taxas de venda e saque com base no meu volume de arrecadação.'
                },
                {
                  id: 'saques',
                  titulo: 'Dúvidas sobre Saques',
                  desc: 'Prazos, chaves e transferências Pix',
                  msg: 'Olá! Preciso de ajuda em relação aos meus saques e transferências Pix no sistema.'
                },
                {
                  id: 'gateway',
                  titulo: 'Integração de Gateway',
                  desc: 'Auxílio na configuração de credenciais',
                  msg: 'Olá! Preciso de auxílio técnico para integrar ou configurar meu gateway de pagamento.'
                },
                {
                  id: 'campanhas',
                  titulo: 'Gerenciamento de Rifas',
                  desc: 'Dúvidas sobre sorteios e cotas',
                  msg: 'Olá! Tenho dúvidas referente ao gerenciamento das minhas campanhas e apuração do sorteio.'
                },
                {
                  id: 'suporte_geral',
                  titulo: 'Outro Assunto',
                  desc: 'Atendimento direto com suporte técnico',
                  msg: 'Olá! Gostaria de falar com o suporte referente a outro assunto do meu painel.'
                }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMensagemReducao(opt.msg)}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 transition text-left space-y-1 group"
                >
                  <div className="text-xs font-black text-white group-hover:text-emerald-300 flex items-center justify-between">
                    <span>{opt.titulo}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
            {reducaoMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{reducaoMsg}</span>
              </div>
            )}
            
            {reducaoErro && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reducaoErro}</span>
              </div>
            )}

            <form onSubmit={handleSolicitarReducao} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Nova Taxa de Venda Desejada (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={taxaVendaDesejada}
                    onChange={e => setTaxaVendaDesejada(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Nova Taxa de Saque Imediato (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={taxaSaqueDesejada}
                    onChange={e => setTaxaSaqueDesejada(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Mensagem do Atendimento</label>
                <textarea
                  required
                  rows={4}
                  value={mensagemReducao}
                  onChange={e => setMensagemReducao(e.target.value)}
                  placeholder="Selecione um tópico acima ou digite sua solicitação..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition resize-none custom-scrollbar"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={enviandoReducao}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  {enviandoReducao ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Enviando Mensagem...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Solicitação de Suporte
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const encoded = encodeURIComponent(mensagemReducao || 'Olá! Preciso de suporte no RifaZone.');
                    window.open(`https://wa.me/5591983058888?text=${encoded}`, '_blank');
                  }}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Abrir WhatsApp do Suporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITAÇÃO DE SAQUE */}
      {modalSaqueAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Solicitar Saque</h3>
                  <p className="text-xs text-slate-400">Transfira seus rendimentos para sua conta</p>
                </div>
              </div>
              <button
                onClick={() => setModalSaqueAberto(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {saqueErro && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saqueErro}</span>
              </div>
            )}

            <form onSubmit={handleSolicitarSaque} className="space-y-4 text-xs">
              
              {/* Saldo Atual Info */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block">Saldo Disponível no Momento:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    R$ {Number(saldo?.saldoDisponivel || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setValorSaque(Number(saldo?.saldoDisponivel || 0).toFixed(2))}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/20 transition"
                >
                  Sacar Tudo
                </button>
              </div>

              {/* Valor do Saque */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Valor a Sacar (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-black">R$</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={valorSaque}
                    onChange={e => {
                      let val = e.target.value.replace(/[^\d.,]/g, '');
                      val = val.replace(',', '.');
                      if (val.split('.').length > 2) val = val.replace(/\.+$/, '');
                      setValorSaque(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-white font-mono text-base focus:border-emerald-500 focus:outline-none transition"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Modalidade */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">Velocidade da Transferência</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-1.5 ${
                    modalidade === 'imediato' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="modalidade"
                      value="imediato"
                      checked={modalidade === 'imediato'}
                      onChange={() => setModalidade('imediato')}
                      className="sr-only"
                    />
                    <Zap className="w-5 h-5 mb-1" />
                    <span className="font-bold">Saque Imediato</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 rounded-md text-emerald-300">
                      Taxa: R$ {taxaSaqueImediato.toFixed(2)}
                    </span>
                  </label>
                  
                  <label className={`p-3 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-1.5 ${
                    modalidade === 'd_mais_um' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="modalidade"
                      value="d_mais_um"
                      checked={modalidade === 'd_mais_um'}
                      onChange={() => setModalidade('d_mais_um')}
                      className="sr-only"
                    />
                    <Calendar className="w-5 h-5 mb-1" />
                    <span className="font-bold">Saque Programado</span>
                    <span className="text-[10px] bg-sky-500/20 px-2 rounded-md text-sky-300">
                      {taxaSaqueProgramado === 0 ? "Taxa: R$ 0,00 (Grátis)" : `Taxa: R$ ${taxaSaqueProgramado.toFixed(2)}`}
                    </span>
                  </label>
                </div>
              </div>

              {/* Resumo Financeiro */}
              {valorNum > 0 && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Valor Solicitado:</span>
                    <span>R$ {valorNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Taxa Aplicada:</span>
                    <span>- R$ {taxaAplicada.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-black text-sm pt-2 border-t border-slate-800">
                    <span>Você Receberá:</span>
                    <span>R$ {valorLiquidoReceber.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Dados de Destino Puxados da Conta */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 mt-4">
                <p className="text-emerald-300 font-bold mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Conta de Destino
                </p>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Chave Pix:</span>
                  <span className="font-mono">{chavePix || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Titular:</span>
                  <span>{carteiraConfig?.nome || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">CPF/CNPJ:</span>
                  <span className="font-mono">{carteiraConfig?.documento || '-'}</span>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalSaqueAberto(false)}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex-1 text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={solicitando || valorNum <= 0 || valorNum > saldo.saldoDisponivel}
                  className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl transition flex-1 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {solicitando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirmar Saque
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
