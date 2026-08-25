import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
  AlertCircle, DollarSign, ShieldCheck, RefreshCw, Send, 
  Calendar, Building2, User, HelpCircle, ChevronRight, Download,
  TrendingUp, MessageSquare, AlertTriangle, X
} from 'lucide-react';
import { CarteiraSaldo, SolicitacaoSaque, TransacaoCarteira } from '../../types';

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

  // Redução de taxas
  const [carteiraConfig, setCarteiraConfig] = useState<any>(null);
  const [modalReducaoAberto, setModalReducaoAberto] = useState(false);
  const [taxaVendaDesejada, setTaxaVendaDesejada] = useState('3.0');
  const [taxaSaqueDesejada, setTaxaSaqueDesejada] = useState('0.00');
  const [mensagemReducao, setMensagemReducao] = useState('');
  const [enviandoReducao, setEnviandoReducao] = useState(false);
  const [reducaoMsg, setReducaoMsg] = useState('');
  const [reducaoErro, setReducaoErro] = useState('');

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

  const taxaSaqueImediato = 4.50;

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const [resSaldo, resTrans, resSaques, resConfig] = await Promise.all([
        authFetch('/api/admin/carteira/saldo').catch(() => null),
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
            totalVendido: Number(dataSaldo.totalVendido || 0),
            totalTaxasPagas: Number(dataSaldo.totalTaxasPagas || 0),
            totalSacado: Number(dataSaldo.totalSacado || 0)
          });
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
  const taxaAplicada = modalidade === 'imediato' ? taxaSaqueImediato : 0;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            Carteira do Sistema & Saques
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Receba suas vendas automaticamente, acompanhe as taxas e transfira seu saldo via Pix ou Conta Bancária.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setReducaoMsg('');
              setReducaoErro('');
              setModalReducaoAberto(true);
            }}
            className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Solicitar Redução de Taxas
          </button>

          <button
            onClick={carregarDados}
            disabled={carregando}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            title="Atualizar saldo"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={() => {
              setSaqueMsg('');
              setSaqueErro('');
              setModalSaqueAberto(true);
            }}
            disabled={saldo.saldoDisponivel <= 0}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            Solicitar Saque
          </button>
        </div>
      </div>

      {saqueMsg && (
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{saqueMsg}</p>
        </div>
      )}

      {/* CARDS DE SALDO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Disponível */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Saldo Disponível</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              Liberado p/ Saque
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            R$ {(saldo?.saldoDisponivel ?? 0).toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Pronto para transferência imediata
          </p>
        </div>

        {/* Total Vendido (Bruto) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Arrecadado</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            R$ {(saldo?.totalVendido ?? 0).toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Volume bruto total em vendas de cotas</p>
        </div>

        {/* Total Sacado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Já Sacado</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            R$ {(saldo?.totalSacado ?? 0).toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Valor transferido para suas contas</p>
        </div>

        {/* Taxas do Sistema */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Taxas da Plataforma</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-300">
            R$ {(saldo?.totalTaxasPagas ?? 0).toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Taxa percentual retida nas transações</p>
        </div>
      </div>

      {/* MODALIDADES DE SAQUE (EXPLICATIVO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Como Funciona o Saque na Carteira do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-400" />
                Saque Imediato (Pix na Hora)
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold">
                Taxa: R$ 4,50
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              O valor líquido é enviado diretamente para sua Chave Pix cadastrada em até 15 minutos, 24 horas por dia, 7 dias por semana.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                Saque Programado (D+1)
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                Taxa ZERO (Grátis)
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Receba no próximo dia útil sem nenhuma taxa de transferência bancária ou de emissão. Ideal para maximizar o rendimento das suas rifas.
            </p>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE SAQUES E EXTRATO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Solicitações de Saque Recentes */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" />
              Solicitações de Saque
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">({saques.length})</span>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {(!Array.isArray(saques) || saques.length === 0) ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                Nenhum saque solicitado ainda.
              </div>
            ) : (
              saques.map(s => (
                <div key={s.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-xs">
                      R$ {(s?.valorSolicitado ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      s.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      s.status === 'rejeitado' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {s.status === 'pago' ? 'PAGO' : s.status === 'rejeitado' ? 'REJEITADO' : 'EM PROCESSAMENTO'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex flex-col gap-0.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Líquido a receber:</span>
                      <span className="text-emerald-400 font-bold">R$ {(s?.valorLiquido ?? 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    {(s?.taxaSaque ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Taxa retida:</span>
                        <span className="text-rose-400">R$ {(s?.taxaSaque ?? 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between truncate">
                      <span className="text-slate-500">Destino:</span>
                      <span className="text-slate-300 truncate">{s.chavePix}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 mt-1">
                      <span>{s.modalidade === 'imediato' ? 'Imediato (Pix)' : 'Programado (D+1)'}</span>
                      <span>{new Date(s.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Extrato Completo de Transações */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Extrato Detalhado de Vendas e Movimentações
            </h3>

            {/* Filtros */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filtroTipo === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroTipo('venda')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filtroTipo === 'venda' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
              >
                Vendas
              </button>
              <button
                onClick={() => setFiltroTipo('saque')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filtroTipo === 'saque' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}
              >
                Saques
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Tipo / Descrição</th>
                  <th className="p-3">Bruto</th>
                  <th className="p-3">Taxa (%)</th>
                  <th className="p-3">Líquido</th>
                  <th className="p-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      Nenhuma transação encontrada no período.
                    </td>
                  </tr>
                ) : (
                  transacoesFiltradas.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            t.tipo === 'venda' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {t.tipo === 'venda' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{t.descricao}</p>
                            {t.pedidoId && <p className="text-[10px] text-slate-500">Ref: {t.pedidoId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300 font-bold">
                        R$ {(t?.valorBruto ?? 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3 text-amber-400">
                        {(t?.taxaPercentual ?? 0) > 0 ? `${t.taxaPercentual}% (R$ ${(t?.taxaValor ?? 0).toFixed(2).replace('.', ',')})` : '0%'}
                      </td>
                      <td className={`p-3 font-black ${t.tipo === 'venda' ? 'text-emerald-400' : 'text-purple-400'}`}>
                        {t.tipo === 'venda' ? '+' : '-'} R$ {(t?.valorLiquido ?? 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] font-sans">
                        {new Date(t.criadoEm).toLocaleDateString('pt-BR')} {new Date(t.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE SOLICITAÇÃO DE SAQUE */}
      {modalSaqueAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            
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
                    R$ {saldo.saldoDisponivel.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setValorSaque(saldo.saldoDisponivel.toFixed(2))}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/20 transition"
                >
                  Sacar Tudo
                </button>
              </div>

              {/* Valor do Saque */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Valor a Sacar (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={saldo.saldoDisponivel}
                    required
                    value={valorSaque}
                    onChange={e => setValorSaque(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-base text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Escolha da Modalidade (Imediato vs D+1) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">
                  Velocidade da Transferência *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalidade('imediato')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      modalidade === 'imediato'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-white flex items-center gap-1">
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        Imediato (Pix)
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">R$ 4,50</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Cai em até 15 minutos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalidade('d_mais_um')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      modalidade === 'd_mais_um'
                        ? 'border-sky-500 bg-sky-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-white flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        D+1 (Próximo dia)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">GRÁTIS</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Sem taxa de transferência</span>
                  </button>
                </div>
              </div>

              {/* Tipo de Destino (Pix vs Banco) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">Dados do Recebedor</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoDestino('pix')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${tipoDestino === 'pix' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Chave Pix
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDestino('banco')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${tipoDestino === 'banco' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Conta Bancária
                    </button>
                  </div>
                </div>

                {tipoDestino === 'pix' ? (
                  <div className="space-y-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="flex gap-2 flex-wrap">
                      {(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipoChavePix(t)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                            tipoChavePix === t ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      required
                      value={chavePix}
                      onChange={e => setChavePix(e.target.value)}
                      placeholder={`Informe sua chave Pix (${tipoChavePix.toUpperCase()})`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={bancoNome}
                        onChange={e => setBancoNome(e.target.value)}
                        placeholder="Banco (Ex: Nubank, Inter, Itaú)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={bancoAgencia}
                        onChange={e => setBancoAgencia(e.target.value)}
                        placeholder="Agência (Ex: 0001)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={bancoConta}
                        onChange={e => setBancoConta(e.target.value)}
                        placeholder="Número da Conta"
                        className="col-span-2 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={bancoDigito}
                        onChange={e => setBancoDigito(e.target.value)}
                        placeholder="Dígito"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={bancoTitular}
                      onChange={e => setBancoTitular(e.target.value)}
                      placeholder="Nome do Titular da Conta"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Resumo do Cálculo */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Valor Solicitado:</span>
                  <span>R$ {valorNum.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxa de Transferência ({modalidade === 'imediato' ? 'Imediato' : 'D+1 Grátis'}):</span>
                  <span className={taxaAplicada > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    - R$ {taxaAplicada.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800 text-xs">
                  <span>Líquido a ser depositado:</span>
                  <span className="text-emerald-400 font-black">
                    R$ {valorLiquidoReceber.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSaqueAberto(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={solicitando || valorNum <= 0 || valorNum > saldo.saldoDisponivel}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  {solicitando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Saque
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITAÇÃO DE REDUÇÃO DE TAXA */}
      {modalReducaoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalReducaoAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Solicitar Redução de Taxas da Carteira</h3>
                <p className="text-xs text-slate-400">Negocie taxas diferenciadas diretamente com o administrador do sistema</p>
              </div>
            </div>

            {carteiraConfig?.solicitacaoReducaoTaxa && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                carteiraConfig.solicitacaoReducaoTaxa.status === 'aprovado'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : carteiraConfig.solicitacaoReducaoTaxa.status === 'rejeitado'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className="font-bold uppercase tracking-wider block text-[10px]">
                  Status do Último Pedido: {carteiraConfig.solicitacaoReducaoTaxa.status}
                </span>
                <p>
                  {carteiraConfig.solicitacaoReducaoTaxa.status === 'aprovado'
                    ? 'Sua solicitação anterior foi APROVADA! Suas taxas exclusivas já estão ativas no sistema.'
                    : carteiraConfig.solicitacaoReducaoTaxa.status === 'rejeitado'
                    ? 'Sua solicitação anterior de redução foi recusada. Você pode enviar uma nova proposta abaixo.'
                    : 'Você já possui um pedido de redução em análise pelo administrador.'}
                </p>
              </div>
            )}

            {reducaoMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {reducaoMsg}
              </div>
            )}

            {reducaoErro && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {reducaoErro}
              </div>
            )}

            <form onSubmit={handleSolicitarReducao} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Taxa Venda Desejada (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={taxaVendaDesejada}
                    onChange={e => setTaxaVendaDesejada(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">Atual: ~5.0%</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Tarifa Saque Desejada (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={taxaSaqueDesejada}
                    onChange={e => setTaxaSaqueDesejada(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">Atual: ~R$ 4,50</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Mensagem / Justificativa</label>
                <textarea
                  rows={3}
                  value={mensagemReducao}
                  onChange={e => setMensagemReducao(e.target.value)}
                  placeholder="Conte um pouco sobre suas campanhas, projeção de vendas mensais ou motivo da solicitação..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Seu Faturamento Atual:</span>
                  <span className="text-emerald-400 font-bold">R$ {saldo.totalVendido.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalReducaoAberto(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={enviandoReducao}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  {enviandoReducao ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Solicitação
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
