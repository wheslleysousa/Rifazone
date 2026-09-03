import React, { useEffect } from 'react';
import { CheckCircle2, Ticket, Sparkles, CreditCard, ArrowRight, Users, ExternalLink, Trophy, Star, PartyPopper, Heart, Flame, Image as ImageIcon } from 'lucide-react';
import { dispararExplosaoConfetes } from '../utils/confettiUtils';
import { formatarMoeda } from '../lib/money';
import { ConfirmacaoCompraConfig } from '../types';

interface Props {
  pedidoId: string;
  valorTotal: number;
  quantidade: number;
  numeros: string[];
  cartaoInfo?: {
    ultimosDigitos?: string;
    bandeira?: string;
    parcelas?: number;
    status?: string;
  };
  compradorNome?: string;
  tituloCampanha?: string;
  confirmacaoConfig?: ConfirmacaoCompraConfig;
  onClose: () => void;
  onVerMeusNumeros?: () => void;
}

export const CartaoSuccessModal: React.FC<Props> = ({
  pedidoId,
  valorTotal,
  quantidade,
  numeros,
  cartaoInfo,
  compradorNome,
  tituloCampanha,
  confirmacaoConfig,
  onClose,
  onVerMeusNumeros
}) => {
  useEffect(() => {
    if (confirmacaoConfig?.animacaoSucesso === 'nenhuma' || confirmacaoConfig?.exibirConfetes === false) return;
    try {
      dispararExplosaoConfetes();
    } catch (e) {}
  }, [confirmacaoConfig?.animacaoSucesso, confirmacaoConfig?.exibirConfetes]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 my-auto space-y-4">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Header de Sucesso */}
        <div className="text-center animate-in zoom-in-95 duration-200">
          {confirmacaoConfig?.bannerSucessoUrl && (
            <div className="-mt-6 -mx-6 mb-6 overflow-hidden rounded-t-3xl border-b border-emerald-500/20">
              <img
                src={confirmacaoConfig.bannerSucessoUrl}
                alt="Sucesso"
                className="w-full h-44 object-cover shadow-md"
                onError={e => (e.currentTarget.parentElement!.style.display = 'none')}
              />
            </div>
          )}

          <div className="space-y-3 px-2">
            {confirmacaoConfig?.exibirIconeSucesso !== false && (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce"
                style={{ 
                  backgroundColor: `${confirmacaoConfig?.iconeSucessoFundo || 'rgba(16, 185, 129, 0.2)'}`,
                  border: `2px solid ${confirmacaoConfig?.iconeSucessoFundo || '#10b981'}`,
                  color: confirmacaoConfig?.iconeSucessoCor || '#10b981'
                }}
              >
                {(() => {
                  const tipo = confirmacaoConfig?.iconeSucessoTipo || 'check';
                  const size = 32;
                  if (tipo === 'check') return <CheckCircle2 size={size} />;
                  if (tipo === 'trofeu') return <Trophy size={size} />;
                  if (tipo === 'estrela') return <Star size={size} />;
                  if (tipo === 'festa') return <PartyPopper size={size} />;
                  if (tipo === 'coracao') return <Heart size={size} />;
                  if (tipo === 'fogo') return <Flame size={size} />;
                  if (tipo === 'emoji') return <span className="text-2xl">{confirmacaoConfig?.iconeSucessoEmoji || '🎉'}</span>;
                  if (tipo === 'imagem' && confirmacaoConfig?.iconeSucessoImagem) {
                    return <img src={confirmacaoConfig.iconeSucessoImagem} alt="Ícone" className="w-full h-full object-cover rounded-full" />;
                  }
                  return <CheckCircle2 size={size} />;
                })()}
              </div>
            )}
          </div>

          <div className="space-y-3 px-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{valorTotal === 0 ? 'Inscrição Grátis Confirmada! 🎉' : 'Pagamento Aprovado no Cartão!'}</span>
            </div>

            <h3 className="text-xl font-black text-white">
              {confirmacaoConfig?.titulo || tituloCampanha || 'Parabéns, Você está Participando!'}
            </h3>
            <p className="text-xs text-slate-300">
              {confirmacaoConfig?.subtitulo || (compradorNome ? `${compradorNome}, seus números foram gerados e já estão concorrendo.` : 'Seus números foram gerados e já estão concorrendo.')}
            </p>
            {confirmacaoConfig?.mensagemAgradecimento && (
              <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                {confirmacaoConfig.mensagemAgradecimento}
              </p>
            )}
          </div>
        </div>

        {/* Detalhes da Compra */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Pago</span>
            <span className="font-extrabold text-sm text-emerald-400 font-mono">
              {formatarMoeda(valorTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quantidade de Cotas</span>
            <span className="font-bold text-white">
              {quantidade} {quantidade === 1 ? 'cota' : 'cotas'}
            </span>
          </div>

          {cartaoInfo && (
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Cartão {cartaoInfo.bandeira || ''} {cartaoInfo.ultimosDigitos ? `•••• ${cartaoInfo.ultimosDigitos}` : ''}
              </span>
              <span className="font-medium text-slate-300">
                {cartaoInfo.parcelas && cartaoInfo.parcelas > 1 ? `${cartaoInfo.parcelas}x` : 'À vista (1x)'}
              </span>
            </div>
          )}
        </div>

        {/* Lista de Números Gerados */}
        {confirmacaoConfig?.exibirNumeros !== false && numeros && numeros.length > 0 && (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block text-center">
              Seus Bilhetes da Sorte ({numeros.length})
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center max-h-44 overflow-y-auto p-1 custom-scrollbar">
              {numeros.map(num => (
                <span
                  key={num}
                  className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-lg shadow-sm"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instruções pós-compra personalizadas */}
        {confirmacaoConfig?.instrucoesPosCompra && (
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left text-xs text-slate-300">
            <span className="text-[11px] font-bold text-amber-400 block mb-0.5">ℹ️ Informações Importantes:</span>
            {confirmacaoConfig.instrucoesPosCompra}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="space-y-2 pt-1">
          {/* Botão Grupo VIP */}
          {confirmacaoConfig?.botaoGrupoVipAtivo && confirmacaoConfig?.botaoGrupoVipLink && (
            <a
              href={confirmacaoConfig.botaoGrupoVipLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <Users className="w-4 h-4" />
              <span>{confirmacaoConfig.botaoGrupoVipTexto || 'Entrar no Grupo VIP do WhatsApp'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          )}

          {confirmacaoConfig?.exibirBotaoMeusNumeros !== false && onVerMeusNumeros && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onVerMeusNumeros();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Ticket className="w-4 h-4" />
              <span>Acessar "Meus Números"</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
