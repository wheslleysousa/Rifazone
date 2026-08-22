import React, { useState } from 'react';
import { Users, Search, DollarSign, Ticket, MessageCircle, Calendar, ShieldCheck, Phone } from 'lucide-react';
import { Pedido } from '../../types';

interface Props {
  pedidos: Pedido[];
}

export const ClientesView: React.FC<Props> = ({ pedidos }) => {
  const [busca, setBusca] = useState('');

  // Agrupa pedidos pagos por cliente (chave: telefone ou email ou nome)
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
    clientesMap[key].totalGasto += p.valorTotal;
    clientesMap[key].pedidosCount += 1;

    const dataAtual = new Date(p.pagoEm || p.criadoEm).getTime();
    const dataRegistrada = new Date(clientesMap[key].ultimaCompra).getTime();
    if (dataAtual > dataRegistrada) {
      clientesMap[key].ultimaCompra = p.pagoEm || p.criadoEm;
    }
  });

  const listaClientes = Object.values(clientesMap).sort((a, b) => b.totalGasto - a.totalGasto);

  const filtrados = listaClientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca) ||
    (c.email && c.email.toLowerCase().includes(busca.toLowerCase())) ||
    (c.cpf && c.cpf.includes(busca))
  );

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.startsWith('55') ? raw : `55${raw}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Histórico de Clientes
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Gerencie sua base de participantes, visualize valores investidos e converse diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp ou CPF..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total de Compradores Cadastrados ({filtrados.length})
          </span>
        </div>

        {filtrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((cliente, idx) => {
              const linkWhats = `https://wa.me/${formatWhatsapp(cliente.whatsapp)}?text=${encodeURIComponent(`Olá ${cliente.nome.split(' ')[0]}! Tudo bem? Passando para agradecer sua participação em nossas rifas oficiais!`)}`;

              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
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
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md">
                        {cliente.pedidosCount} {cliente.pedidosCount === 1 ? 'compra' : 'compras'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
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
                      className="w-full py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Conversar no WhatsApp
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhum cliente encontrado com os filtros atuais.
          </div>
        )}
      </div>

    </div>
  );
};
