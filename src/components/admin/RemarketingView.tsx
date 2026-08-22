import React, { useState } from 'react';
import { 
  MessageSquare, Clock, Copy, Check, Send, AlertCircle, 
  ExternalLink, Search, Flame, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { Pedido } from '../../types';

interface Props {
  pedidos: Pedido[];
  onRefresh: () => void;
}

export const RemarketingView: React.FC<Props> = ({ pedidos, onRefresh }) => {
  const [termoBusca, setTermoBusca] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [templateAtivo, setTemplateAtivo] = useState<'pendente' | 'urgencia' | 'desconto'>('pendente');

  // Pedidos pendentes (carrinho abandonado / Pix aguardando pagamento)
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente');
  const pedidosFiltrados = pedidosPendentes.filter(p => 
    p.comprador?.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    p.comprador?.whatsapp?.includes(termoBusca)
  );

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.startsWith('55') ? raw : `55${raw}`;
  };

  const copiarPix = (pix: string, id: string) => {
    navigator.clipboard.writeText(pix);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  // Gerar mensagem de WhatsApp para o comprador
  const gerarMensagemWhatsApp = (p: Pedido) => {
    const nome = p.comprador?.nome?.split(' ')[0] || 'Amigo(a)';
    const valor = p.valorTotal.toFixed(2).replace('.', ',');
    const cotas = p.quantidade;
    const pix = p.pixCopiaCola || '';

    if (templateAtivo === 'pendente') {
      return encodeURIComponent(
        `Olá ${nome}! 👋 Notamos que sua reserva de *${cotas} cotas* (R$ ${valor}) no sorteio oficial está quase expirando.\n\n` +
        `Para garantir seus números da sorte agora mesmo via Pix Copia e Cola:\n\n` +
        `${pix}\n\n` +
        `Assim que pagar, sua participação é confirmada imediatamente! Boa sorte! 🍀`
      );
    } else if (templateAtivo === 'urgencia') {
      return encodeURIComponent(
        `🚨 *ÚLTIMA CHAMADA, ${nome.toUpperCase()}!* 🚨\n\n` +
        `Sua reserva de ${cotas} cotas por R$ ${valor} será liberada para outro participante em poucos minutos.\n\n` +
        `Pague rápido com o Pix Copia e Cola:\n\n` +
        `${pix}\n\n` +
        `Garanta seus números antes que acabem! 🔥`
      );
    } else {
      return encodeURIComponent(
        `Oi ${nome}! 🎉 Seus números no sorteio já foram reservados! Total: R$ ${valor} por ${cotas} cotas.\n\n` +
        `Chave Pix para pagamento:\n${pix}\n\n` +
        `Qualquer dúvida estamos à disposição!`
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Remarketing & Recuperação de Vendas
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Recupere pedidos que geraram o Pix mas ainda não finalizaram o pagamento no WhatsApp.
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-700 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar Status
          </button>
        </div>

        {/* Templates Rápidos */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 block mb-2">
            Modelo de Mensagem para Cobrança no WhatsApp:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTemplateAtivo('pendente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                templateAtivo === 'pendente'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👋 Lembrete Amigável
            </button>
            <button
              onClick={() => setTemplateAtivo('urgencia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                templateAtivo === 'urgencia'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🚨 Senso de Urgência
            </button>
            <button
              onClick={() => setTemplateAtivo('desconto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                templateAtivo === 'desconto'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🎉 Confirmação Rápida
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Carrinhos Abandonados / Pix Pendentes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">
              Pedidos com Pix Aguardando Pagamento ({pedidosPendentes.length})
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por nome ou WhatsApp..."
              value={termoBusca}
              onChange={e => setTermoBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
          </div>
        </div>

        {pedidosFiltrados.length > 0 ? (
          <div className="space-y-3">
            {pedidosFiltrados.map(p => {
              const msg = gerarMensagemWhatsApp(p);
              const linkWhats = `https://wa.me/${formatWhatsapp(p.comprador?.whatsapp || '')}?text=${msg}`;

              return (
                <div
                  key={p.id}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {p.comprador?.nome || 'Comprador'}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase rounded border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pix Pendente
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>WhatsApp: <strong className="text-slate-200">{p.comprador?.whatsapp}</strong></span>
                      <span>•</span>
                      <span>Cotas: <strong className="text-emerald-400">{p.quantidade}</strong></span>
                      <span>•</span>
                      <span>Valor: <strong className="text-white">R$ {p.valorTotal.toFixed(2).replace('.', ',')}</strong></span>
                      <span>•</span>
                      <span>Criado às: {new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {p.pixCopiaCola && (
                      <button
                        onClick={() => copiarPix(p.pixCopiaCola!, p.id)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                        title="Copiar Código Pix"
                      >
                        {copiadoId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiadoId === p.id ? 'Copiado!' : 'Pix'}
                      </button>
                    )}

                    <a
                      href={linkWhats}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Cobrar no WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
            Nenhum carrinho pendente no momento! Todos os pedidos recentes foram pagos ou não há pendências ativas.
          </div>
        )}
      </div>

    </div>
  );
};
