import React, { useState } from 'react';
import { Users, Search, DollarSign, Ticket, Phone, Calendar, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { Pedido } from '../../types';
import { extrairValorReaisPedido } from '../../lib/money';

interface HistoricoViewProps {
  pedidos: Pedido[];
  authFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({ pedidos }) => {
  const [subAba, setSubAba] = useState<'clientes' | 'pedidos' | 'transacoes'>('clientes');
  const [busca, setBusca] = useState('');

  // 1) Clientes Map
  const clientesMap: Record<string, {
    nome: string;
    whatsapp: string;
    cpf?: string | null;
    email?: string | null;
    totalCotas: number;
    totalGasto: number;
    pedidosCount: number;
    ultimaCompra: string;
  }> = {};

  pedidos.filter(p => p.status === 'pago').forEach(p => {
    const key = p.comprador?.whatsapp || p.compradorId || p.comprador?.nome || 'anônimo';
    const valReais = extrairValorReaisPedido(p);
    if (!clientesMap[key]) {
      clientesMap[key] = {
        nome: p.comprador?.nome || 'Participante',
        whatsapp: p.comprador?.whatsapp || '',
        cpf: p.comprador?.cpf,
        email: p.comprador?.email,
        totalCotas: 0,
        totalGasto: 0,
        pedidosCount: 0,
        ultimaCompra: p.pagoEm || p.criadoEm
      };
    }
    clientesMap[key].totalCotas += p.quantidade;
    clientesMap[key].totalGasto += valReais;
    clientesMap[key].pedidosCount += 1;
    const dataAtual = new Date(p.pagoEm || p.criadoEm).getTime();
    const dataRegistrada = new Date(clientesMap[key].ultimaCompra).getTime();
    if (dataAtual > dataRegistrada) {
      clientesMap[key].ultimaCompra = p.pagoEm || p.criadoEm;
    }
  });

  const listaClientes = Object.values(clientesMap).sort((a, b) => b.totalGasto - a.totalGasto);
  const clientesFiltrados = listaClientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca) ||
    (c.email && c.email.toLowerCase().includes(busca.toLowerCase())) ||
    (c.cpf && c.cpf.includes(busca))
  );

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.startsWith('55') ? raw : `55${raw}`;
  };

  // 2) Pedidos Filtrados
  const pedidosFiltrados = pedidos.filter(p => 
    p.id.toLowerCase().includes(busca.toLowerCase()) ||
    (p.comprador?.nome && p.comprador.nome.toLowerCase().includes(busca.toLowerCase())) ||
    (p.comprador?.whatsapp && p.comprador.whatsapp.includes(busca)) ||
    (p.comprador?.cpf && p.comprador.cpf.includes(busca))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Histórico Geral
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Consulte o histórico unificado de clientes, pedidos realizados e transações financeiras da plataforma.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Pesquisar no histórico..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {/* Sub-abas de Histórico */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubAba('clientes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            subAba === 'clientes'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Clientes ({listaClientes.length})
        </button>
        <button
          onClick={() => setSubAba('pedidos')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            subAba === 'pedidos'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Pedidos ({pedidos.length})
        </button>
        <button
          onClick={() => setSubAba('transacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            subAba === 'transacoes'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Transações
        </button>
      </div>

      {/* CONTEÚDO DA SUB-ABA CLIENTES */}
      {subAba === 'clientes' && (
        <div className="space-y-4">
          {clientesFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientesFiltrados.map((cliente, idx) => {
                const linkWhats = `https://wa.me/${formatWhatsapp(cliente.whatsapp)}?text=${encodeURIComponent(`Olá ${cliente.nome.split(' ')[0]}! Tudo bem? Passando para agradecer sua participação em nossas rifas oficiais!`)}`;

                return (
                  <div
                    key={idx}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-black text-white leading-snug">
                            {cliente.nome}
                          </h4>
                          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {cliente.whatsapp || 'Sem telefone'}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md">
                          {cliente.pedidosCount} {cliente.pedidosCount === 1 ? 'compra' : 'compras'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total de Cotas</span>
                          <span className="font-extrabold text-white font-mono">{cliente.totalCotas} cotas</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total Investido</span>
                          <span className="font-extrabold text-emerald-400 font-mono">
                            R$ {cliente.totalGasto.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-1">
                        Última compra: {new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {cliente.whatsapp && (
                      <a
                        href={linkWhats}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Conversar no WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA PEDIDOS */}
      {subAba === 'pedidos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Pedido ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Cotas</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pedidosFiltrados.length > 0 ? (
                  pedidosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-300">#{p.id.slice(0, 8)}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{p.comprador?.nome || 'Anônimo'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.comprador?.whatsapp}</div>
                      </td>
                      <td className="p-4 font-mono font-bold">{p.quantidade} cotas</td>
                      <td className="p-4 font-mono font-black text-emerald-400">R$ {extrairValorReaisPedido(p).toFixed(2).replace('.', ',')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'pago' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          p.status === 'pendente' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-400 font-mono">
                        {new Date(p.criadoEm).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA TRANSAÇÕES */}
      {subAba === 'transacoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Transações Financeiras Integradas</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Todas as transações via Pix e Gateway de Pagamento são conciliadas automaticamente com os pedidos pagos exibidos na aba de Pedidos.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setSubAba('pedidos')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700"
            >
              Ver Pedidos Pagos
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
