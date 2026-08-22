import React, { useState, useEffect } from 'react';
import { Campanha } from '../types';
import { Search, Ticket, ArrowLeft, CheckCircle2, User, Phone, Calendar, AlertCircle, Copy, Check, MessageCircle } from 'lucide-react';

interface Props {
  campanha: Campanha;
  onBack: () => void;
}

export const MeusNumerosModal: React.FC<Props> = ({ campanha, onBack }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [cotas, setCotas] = useState<string[] | null>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [comprador, setComprador] = useState<any | null>(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const executarBusca = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErro('Informe um número de WhatsApp válido com DDD (ex: 11999998888).');
      return;
    }

    setErro('');
    setCarregando(true);

    try {
      const res = await fetch(`/api/campanhas/${campanha.codigo}/meus-numeros?whatsapp=${cleanPhone}`);
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao buscar suas cotas.');
        setCotas(null);
      } else {
        setCotas(data.cotas || []);
        setPedidos(data.pedidos || []);
        setComprador(data.comprador || null);
        try {
          localStorage.setItem('rifapix_comprador_whatsapp', cleanPhone);
          if (data.comprador?.nome) {
            localStorage.setItem('rifapix_comprador_nome', data.comprador.nome);
          }
        } catch (e) {}
      }
    } catch (err) {
      setErro('Falha na comunicação com o servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('rifapix_comprador_whatsapp');
      if (savedPhone) {
        setWhatsapp(formatWhatsapp(savedPhone));
        executarBusca(savedPhone);
      }
    } catch (e) {}
  }, [campanha.codigo]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    executarBusca(whatsapp);
  };

  const handleCopiarTodos = () => {
    if (!cotas || cotas.length === 0) return;
    const texto = `🎟️ Meus Números (${campanha.titulo}):\n${cotas.join(', ')}\n\nParticipante: ${comprador?.nome || 'Confirmado'}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleCompartilharWhatsapp = () => {
    if (!cotas || cotas.length === 0) return;
    const texto = encodeURIComponent(`🎟️ Meus números da sorte na campanha "${campanha.titulo}":\n\n${cotas.join(', ')}\n\nBoa sorte para mim! 🍀`);
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h3 className="text-lg font-black text-white">
            Meus Bilhetes & Cotas
          </h3>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Form */}
        <form onSubmit={handleBuscar} className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Informe seu WhatsApp cadastrado na compra:
            </label>
            <div className="relative">
              <input
                id="input-busca-whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={e => setWhatsapp(formatWhatsapp(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                required
              />
              <button
                id="btn-pesquisar-numeros"
                type="submit"
                disabled={carregando}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Search className="w-3.5 h-3.5" />
                {carregando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
          {erro && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {erro}
            </p>
          )}
        </form>

        {/* Resultado */}
        {cotas !== null && (
          <div className="animate-in fade-in duration-200">
            {cotas.length > 0 ? (
              <div className="space-y-5">
                {/* Cartão do Participante */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {comprador?.nome || pedidos[0]?.comprador?.nome || 'Participante Confirmado'}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono">
                        {whatsapp}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total de Cotas</span>
                    <span className="text-lg font-black text-white">{cotas.length}</span>
                  </div>
                </div>

                {/* Grade com os números */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-emerald-400" />
                      Seus Números no Sorteio ({cotas.length}):
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopiarTodos}
                        className="text-[11px] font-bold text-slate-300 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1"
                      >
                        {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCompartilharWhatsapp}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30 transition flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                    {cotas.map(num => (
                      <span
                        key={num}
                        className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm rounded-lg shadow-sm"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pedidos Recentes */}
                {pedidos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Histórico de Pagamentos Confirmados:
                    </h4>
                    <div className="space-y-2">
                      {pedidos.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white block">
                              {p.quantidade} cotas compradas
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(p.pagoEm || p.criadoEm).toLocaleDateString('pt-BR')} às {new Date(p.pagoEm || p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400 block">
                              R$ {p.valorTotal.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3" /> PAGO
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-white font-bold text-sm mb-1">Nenhuma cota paga encontrada</p>
                <p className="text-slate-400 text-xs">
                  Não encontramos compras pagas com o WhatsApp informado nesta campanha.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

