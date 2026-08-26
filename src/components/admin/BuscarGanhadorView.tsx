import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Pedido } from '../../types';

interface Props {
  pedidos: Pedido[];
}

export const BuscarGanhadorView: React.FC<Props> = ({ pedidos }) => {
  const [buscaCota, setBuscaCota] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<any | null>(null);
  const [buscandoCota, setBuscandoCota] = useState(false);

  const handleBuscarCota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaCota.trim()) return;
    setBuscandoCota(true);
    setResultadoBusca(null);

    const termo = buscaCota.trim().toLowerCase();

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Buscar Ganhador / Cota</h2>
            <p className="text-sm text-slate-400 mt-1">Consulte qualquer número de cota, telefone ou nome para conferir o comprador.</p>
          </div>
        </div>

        <form onSubmit={handleBuscarCota} className="space-y-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Digite o número da cota (ex: 0421), telefone ou nome..."
              value={buscaCota}
              onChange={e => setBuscaCota(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-sm text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={buscandoCota}
              className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-2 transition"
            >
              {buscandoCota ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </form>

        {resultadoBusca && (
          <div className="animate-in fade-in duration-200">
            {resultadoBusca.encontrado ? (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <span className="font-bold text-white text-lg">
                    {resultadoBusca.comprador?.nome || 'Comprador Registrado'}
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-sm border border-emerald-500/20">
                    Pagamento Confirmado ✓
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider mb-1">WhatsApp</span>
                    <span className="text-slate-200 font-mono">{resultadoBusca.comprador?.whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider mb-1">Data da Compra</span>
                    <span className="text-slate-200">{new Date(resultadoBusca.pagoEm).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <span className="text-slate-400 block text-xs uppercase tracking-wider mb-2">
                    Cotas deste pedido ({resultadoBusca.numeros?.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {resultadoBusca.numeros?.map((n: string) => (
                      <span key={n} className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-sm rounded-lg shadow-sm">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p>Nenhum comprador pago encontrado com esse número de cota ou termo.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
