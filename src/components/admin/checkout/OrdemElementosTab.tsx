import React from 'react';
import { Layers, ArrowUp, ArrowDown, Move, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { CheckoutConfigExtended } from './types_private';

export const ELEMENTOS_CHECKOUT_PADRAO = [
  'banner',
  'temporizador',
  'mensagemUrgencia',
  'resumoPedido',
  'metodosPagamento',
  'dadosComprador',
  'cupomDesconto',
  'selosSeguranca',
];

export const ELEMENTOS_INFO: Record<string, { label: string; desc: string; icon: string; fixo?: boolean }> = {
  banner: { label: 'Banner Promocional de Topo', desc: 'Imagem ou arte promocional no topo do checkout', icon: '🖼️' },
  temporizador: { label: 'Contador Regressivo (Timer)', desc: 'Relógio de escassez e urgência de tempo', icon: '⏱️' },
  mensagemUrgencia: { label: 'Alerta de Escassez / Vagas Restantes', desc: 'Texto destacado de urgência (ex: Restam Poucas Cotas)', icon: '⚠️' },
  resumoPedido: { label: 'Resumo do Pedido & Total', desc: 'Quantidade de cotas selecionadas e valor total final', icon: '📊' },
  metodosPagamento: { label: 'Seleção de Método de Pagamento', desc: 'Abas de Pix, Cartão de Crédito e Boleto Bancário', icon: '💳' },
  dadosComprador: { label: 'Formulário do Comprador', desc: 'Campos de Nome, Telefone/WhatsApp, CPF e E-mail', icon: '👤' },
  cupomDesconto: { label: 'Campo de Cupom de Desconto', desc: 'Caixa de texto para inserção e validação de cupom promocional', icon: '🎟️' },
  selosSeguranca: { label: 'Selos de Segurança & Garantia', desc: 'Badges de SSL, Compra Segura e Entrega Garantida', icon: '🛡️' },
};

interface OrdemElementosTabProps {
  checkoutConfig: CheckoutConfigExtended;
  upd: (patch: Partial<CheckoutConfigExtended>) => void;
}

export const OrdemElementosTab: React.FC<OrdemElementosTabProps> = ({
  checkoutConfig,
  upd,
}) => {
  const ordemAtual = Array.isArray(checkoutConfig.ordemElementos) && checkoutConfig.ordemElementos.length > 0
    ? checkoutConfig.ordemElementos
    : ELEMENTOS_CHECKOUT_PADRAO;

  // Garantir que todos os elementos conhecidos estejam na lista
  const elementosCompletos = Array.from(new Set([...ordemAtual, ...ELEMENTOS_CHECKOUT_PADRAO]));

  const moverElemento = (index: number, direcao: 'up' | 'down') => {
    const novaOrdem = [...elementosCompletos];
    const targetIndex = direcao === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= novaOrdem.length) return;

    const temp = novaOrdem[index];
    novaOrdem[index] = novaOrdem[targetIndex];
    novaOrdem[targetIndex] = temp;

    upd({ ordemElementos: novaOrdem });
  };

  const restaurarPadrao = () => {
    upd({ ordemElementos: [...ELEMENTOS_CHECKOUT_PADRAO] });
  };

  const getElementoStatus = (key: string) => {
    switch (key) {
      case 'banner':
        return !!checkoutConfig.bannerUrl;
      case 'temporizador':
        return !!checkoutConfig.temporizadorAtivo;
      case 'mensagemUrgencia':
        return !!checkoutConfig.mensagemEscassez;
      case 'resumoPedido':
      case 'metodosPagamento':
      case 'dadosComprador':
        return true; // Essenciais
      case 'cupomDesconto':
        return checkoutConfig.exibirCupom ?? checkoutConfig.cupomAtivo ?? true;
      case 'selosSeguranca':
        return !!checkoutConfig.selosSeguranca;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> 6. Organizar Ordem dos Elementos
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Escolha a sequência exata em que cada elemento será exibido no modal do Checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={restaurarPadrao}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
            title="Restaurar Ordem Padrão"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Restaurar Padrão
          </button>
        </div>

        <div className="space-y-2 pt-2">
          {elementosCompletos.map((key, idx) => {
            const info = ELEMENTOS_INFO[key] || { label: key, desc: '', icon: '📌' };
            const estaAtivo = getElementoStatus(key);

            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                  estaAtivo
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-xs font-black text-emerald-400 font-mono">
                    #{idx + 1}
                  </div>
                  <span className="text-base select-none">{info.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white truncate">{info.label}</span>
                      {estaAtivo ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> Ativo
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> Oculto na Config
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{info.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moverElemento(idx, 'up')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
                    title="Mover para Cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === elementosCompletos.length - 1}
                    onClick={() => moverElemento(idx, 'down')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
                    title="Mover para Baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
